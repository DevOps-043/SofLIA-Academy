import "server-only";
import { statfs } from "node:fs/promises";

/** Reserva para el sistema y FFprobe; el archivo previo se reutiliza o trunca. */
const RESERVE_BYTES = 1024n ** 3n;
export async function assertRecordingDiskSpace(
  directory: string,
  expectedBytes: number,
  existingBytes: number,
) {
  const disk = await statfs(directory, { bigint: true });
  const required = BigInt(Math.max(0, expectedBytes - existingBytes)) + RESERVE_BYTES;
  if (disk.bavail * disk.bsize < required)
    throw new Error("Disco insuficiente para importar la grabación con seguridad.");
}
