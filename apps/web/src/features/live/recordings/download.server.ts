import "server-only";
import { open, lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { recordingDownloadToken } from "../zoom.server";
import { RECORDING_MAX_BYTES, RECORDING_HEARTBEAT_MS } from "./config";
import { assertRecordingDiskSpace } from "./disk.server";

export function recordingDownloadUrl(value: string): URL {
  const url = new URL(value);
  const extra = (process.env.RECORDING_DOWNLOAD_HOSTS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const zoom = ["zoom.us", "zoom.com"].some(
    (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`),
  );
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    (!zoom && !extra.includes(url.hostname))
  )
    throw new Error("Destino de descarga no permitido.");
  return url;
}
async function responseFor(
  value: string,
  offset: number,
  signal: AbortSignal,
  refresh = false,
  validator = "",
  tokenFor: (refresh: boolean) => Promise<string> = recordingDownloadToken,
) {
  let url = recordingDownloadUrl(value);
  const initial = url.origin;
  const authorized = ["zoom.us", "zoom.com"].some(
    (domain) => url.hostname === domain || url.hostname.endsWith("." + domain),
  );
  const token = await tokenFor(refresh);
  for (let redirect = 0; redirect < 5; redirect++) {
    const response = await fetch(url, {
      redirect: "manual",
      signal,
      headers: {
        ...(authorized && url.origin === initial
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...(offset ? { Range: `bytes=${offset}-` } : {}),
        ...(offset && validator ? { "If-Range": validator } : {}),
        "Accept-Encoding": "identity",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const target = response.headers.get("location");
      await response.body?.cancel();
      if (!target) throw new Error("Redirección de descarga inválida.");
      url = recordingDownloadUrl(new URL(target, url).href);
      continue;
    }
    if (response.status === 401 && !refresh) {
      await response.body?.cancel();
      return responseFor(value, offset, signal, true, validator, tokenFor);
    }
    return response;
  }
  throw new Error("Demasiadas redirecciones de descarga.");
}
/** Checkpoint en disco privado; nunca concentra un vídeo completo en memoria. */
export async function downloadRecording(
  value: string,
  fileId: string,
  expectedBytes: number,
  directory: string,
  signal: AbortSignal,
  heartbeat: () => Promise<void>,
  tokenFor: (refresh: boolean) => Promise<string> = recordingDownloadToken,
) {
  if (
    !/^[a-f0-9-]{36}$/i.test(fileId) ||
    !Number.isSafeInteger(expectedBytes) ||
    expectedBytes < 1 ||
    expectedBytes > RECORDING_MAX_BYTES
  )
    throw new Error("Archivo de grabación inválido.");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const target = path.join(directory, `${fileId}.mp4`);
  const prior = await lstat(target).catch(() => null);
  if (prior && (!prior.isFile() || prior.isSymbolicLink()))
    throw new Error("Checkpoint de grabación inválido.");
  const checkpoint = target + ".etag";
  const checkpointStat = await lstat(checkpoint).catch(() => null);
  if (
    checkpointStat &&
    (!checkpointStat.isFile() || checkpointStat.isSymbolicLink())
  )
    throw new Error("Checkpoint de grabación inválido.");
  const validator =
    checkpointStat && checkpointStat.size <= 512
      ? await readFile(checkpoint, "utf8")
      : "";
  const strong = /^"[^"]{1,500}"$/.test(validator);
  let offset = strong ? prior?.size || 0 : 0;
  if (offset > expectedBytes) offset = 0;
  if (offset === expectedBytes) return target;
  await assertRecordingDiskSpace(directory, expectedBytes, prior?.size || 0);
  const response = await responseFor(value, offset, signal, false, validator, tokenFor);
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error("No se pudo descargar el vídeo de Zoom.");
  }
  if (offset && response.status !== 206) offset = 0;
  if (
    offset &&
    (!new RegExp(`^bytes ${offset}-[0-9]+/${expectedBytes}$`).test(
      response.headers.get("content-range") || "",
    ) ||
      response.headers.get("etag") !== validator)
  ) {
    await response.body.cancel();
    throw new Error("El proveedor no confirmó el checkpoint.");
  }
  const type = (response.headers.get("content-type") || "").split(";")[0];
  if (!["video/mp4", "application/octet-stream"].includes(type)) {
    await response.body.cancel();
    throw new Error("La descarga no contiene un vídeo admitido.");
  }
  const flags =
    (offset ? constants.O_APPEND : constants.O_TRUNC) |
    constants.O_CREAT |
    constants.O_WRONLY |
    (process.platform === "win32" ? 0 : constants.O_NOFOLLOW);
  const file = await open(target, flags, 0o600).catch(async (error) => {
    await response.body?.cancel();
    throw error;
  });
  const etag = response.headers.get("etag") || "";
  const reader = response.body.getReader();
  let lastHeartbeat = Date.now();
  try {
    await writeFile(checkpoint, /^"[^"]{1,500}"$/.test(etag) ? etag : "", {
      mode: 0o600,
      flag: "w",
    });
    for (
      let chunk = await reader.read();
      !chunk.done;
      chunk = await reader.read()
    ) {
      signal.throwIfAborted();
      if (offset + chunk.value.byteLength > expectedBytes)
        throw new Error("La descarga supera el tamaño declarado.");
      let written = 0;
      while (written < chunk.value.byteLength) {
        const result = await file.write(
          chunk.value,
          written,
          chunk.value.byteLength - written,
        );
        if (!result.bytesWritten)
          throw new Error("El disco no confirmó la escritura.");
        written += result.bytesWritten;
      }
      offset += chunk.value.byteLength;
      if (Date.now() - lastHeartbeat > RECORDING_HEARTBEAT_MS) {
        await heartbeat();
        lastHeartbeat = Date.now();
      }
    }
    await file.sync();
    if (offset !== expectedBytes)
      throw new Error("La descarga está incompleta.");
  } finally {
    await reader.cancel().catch(() => {});
    await file.close();
  }
  return target;
}
