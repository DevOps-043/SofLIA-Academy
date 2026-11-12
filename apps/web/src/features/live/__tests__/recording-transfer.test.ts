// @vitest-environment node
import { afterEach, describe, it, expect, vi } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
vi.mock("../zoom.server", () => ({
  recordingDownloadToken: vi.fn(async () => "token-de-prueba"),
  zoomRequest: vi.fn(),
}));
import {
  downloadRecording,
  recordingDownloadUrl,
} from "../recordings/download.server";
import {
  recordingCoverage,
  recordingUuidPath,
} from "../recordings/worker.server";
import {
  readZoomWebhookBody,
  selectRecordingFiles,
} from "../recordings/events.server";
const file = "00000000-0000-4000-8000-000000000041";
let directory: string | undefined;
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  if (directory) await rm(directory, { recursive: true, force: true });
  directory = undefined;
});
const stream = (
  body: string,
  status = 200,
  headers: Record<string, string> = {},
) =>
  new Response(body, {
    status,
    headers: { "content-type": "video/mp4", ...headers },
  });
describe("Transferencia de grabaciones", () => {
  it("renueva la credencial Video sin sustituirla por OAuth Meeting", async () => {
    directory = await mkdtemp(path.join(tmpdir(), "soflia-recording-test-"));
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 })).mockResolvedValueOnce(stream("1234"));
    const token = vi.fn(async (refresh: boolean) => refresh ? "video-renovado" : "video-inicial");
    vi.stubGlobal("fetch", fetcher);
    await downloadRecording("https://zoom.us/recording", file, 4, directory, new AbortController().signal, async () => {}, token);
    expect(token.mock.calls).toEqual([[false], [true]]);
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe("Bearer video-inicial");
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBe("Bearer video-renovado");
  });
  it.each([
    "http://zoom.us/file",
    "https://zoom.us.evil.test/file",
    "https://localhost/file",
    "https://127.0.0.1/file",
    "https://user:pass@zoom.us/file",
    "https://zoom.us:8080/file",
  ])("rechaza SSRF %s", (url) =>
    expect(() => recordingDownloadUrl(url)).toThrow(),
  );
  it("no reenvía OAuth a un CDN ni permite redirección a otra red", async () => {
    directory = await mkdtemp(path.join(tmpdir(), "soflia-recording-test-"));
    vi.stubEnv("RECORDING_DOWNLOAD_HOSTS", "cdn.example.test");
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: "https://cdn.example.test/video" },
        }),
      )
      .mockResolvedValueOnce(stream("1234"));
    vi.stubGlobal("fetch", fetcher);
    expect(
      await readFile(
        await downloadRecording(
          "https://zoom.us/recording",
          file,
          4,
          directory,
          new AbortController().signal,
          async () => {},
        ),
        "utf8",
      ),
    ).toBe("1234");
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer token-de-prueba",
    );
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBeUndefined();
    fetcher.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: "https://localhost/private" },
      }),
    );
    await expect(
      downloadRecording(
        "https://zoom.us/recording",
        file,
        4,
        directory,
        new AbortController().signal,
        async () => {},
      ),
    ).rejects.toThrow("no permitido");
  });
  it("revalida Range, tamaño total y ETag al reanudar", async () => {
    directory = await mkdtemp(path.join(tmpdir(), "soflia-recording-test-"));
    await writeFile(path.join(directory, file + ".mp4"), "12");
    await writeFile(path.join(directory, file + ".mp4.etag"), '"estable"');
    const fetcher = vi.fn().mockResolvedValue(
      stream("34", 206, {
        "content-range": "bytes 2-3/4",
        etag: '"estable"',
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    const target = await downloadRecording(
      "https://zoom.us/recording",
      file,
      4,
      directory,
      new AbortController().signal,
      async () => {},
    );
    expect(await readFile(target, "utf8")).toBe("1234");
    expect(fetcher.mock.calls[0][1].headers).toMatchObject({
      Range: "bytes=2-",
      "If-Range": '"estable"',
    });
  });
  it("rechaza checkpoint de otra versión y tamaño excesivo", async () => {
    directory = await mkdtemp(path.join(tmpdir(), "soflia-recording-test-"));
    await writeFile(path.join(directory, file + ".mp4"), "12");
    await writeFile(path.join(directory, file + ".mp4.etag"), '"estable"');
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          stream("34", 206, {
            "content-range": "bytes 2-3/4",
            etag: '"distinto"',
          }),
        )
        .mockResolvedValueOnce(stream("12345")),
    );
    await expect(
      downloadRecording(
        "https://zoom.us/file",
        file,
        4,
        directory,
        new AbortController().signal,
        async () => {},
      ),
    ).rejects.toThrow("checkpoint");
    await writeFile(path.join(directory, file + ".mp4.etag"), "");
    await expect(
      downloadRecording(
        "https://zoom.us/file",
        file,
        4,
        directory,
        new AbortController().signal,
        async () => {},
      ),
    ).rejects.toThrow("tamaño");
  });
  it("acota el webhook por bytes y conserva el cuerpo firmado", async () => {
    const text = '{"título":"Grabación"}';
    expect(
      await readZoomWebhookBody(
        new Request("https://local.test", { method: "POST", body: text }),
      ),
    ).toBe(text);
    await expect(
      readZoomWebhookBody(
        new Request("https://local.test", {
          method: "POST",
          body: "x".repeat(1024 * 1024 + 1),
        }),
      ),
    ).rejects.toMatchObject({ status: 413 });
  });
  it("codifica dos veces UUID especiales y detecta huecos y duración insuficiente", () => {
    expect(recordingUuidPath("/ab//c=")).toBe("%252Fab%252F%252Fc%253D");
    expect(recordingUuidPath("abc=")).toBe("abc%3D");
    const segment = {
      starts_at: "2026-10-13T18:00:00Z",
      ends_at: "2026-10-13T19:00:00Z",
      duration_seconds: 3600,
    };
    expect(
      recordingCoverage(
        [segment],
        segment.starts_at,
        segment.ends_at,
        "unknown",
      ),
    ).toBe("complete");
    expect(
      recordingCoverage(
        [{ ...segment, duration_seconds: 60 }],
        segment.starts_at,
        segment.ends_at,
        "unknown",
      ),
    ).toBe("gaps");
    expect(recordingCoverage([segment], null, segment.ends_at, "unknown")).toBe(
      "unknown",
    );
    expect(
      recordingCoverage([segment], segment.starts_at, segment.ends_at, "gaps"),
    ).toBe("gaps");
  });
  it("elige todos los segmentos del layout principal en orden", () => {
    const base = {
      file_type: "MP4",
      status: "completed",
      file_size: 4,
      recording_type: "shared_screen_with_speaker_view",
      recording_start: "2026-10-13T18:00:00Z",
      recording_end: "2026-10-13T18:01:00Z",
    };
    expect(
      selectRecordingFiles([
        { ...base, id: "segundo", recording_start: "2026-10-13T18:02:00Z" },
        { ...base, id: "primero" },
        { ...base, id: "galeria", recording_type: "gallery_view" },
        { ...base, id: "pendiente", status: "processing" },
      ]).map((x) => x.id),
    ).toEqual(["primero", "segundo"]);
  });
});
