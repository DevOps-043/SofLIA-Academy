// @vitest-environment node
import { describe, expect, it, vi, afterEach } from "vitest";
import { drainRecordingQueue } from "../recordings/batch";
vi.mock("node:fs/promises", async (original) => ({
  ...await original<typeof import("node:fs/promises")>(),
  statfs: vi.fn(),
}));
import { statfs } from "node:fs/promises";
import { assertRecordingDiskSpace } from "../recordings/disk.server";
const signal = () => new AbortController().signal;
afterEach(() => vi.clearAllMocks());
describe("importación efímera", () => {
  it("reconcilia una vez y termina cuando no queda trabajo", async () => {
    const reconcile = vi.fn(async () => {});
    const process = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    expect(await drainRecordingQueue(reconcile, process, signal())).toBe(1);
    expect(reconcile).toHaveBeenCalledOnce();
    expect(process).toHaveBeenCalledTimes(2);
    expect(reconcile.mock.invocationCallOrder[0]).toBeLessThan(process.mock.invocationCallOrder[0]);
  });
  it("acota el lote aunque entren nuevos trabajos continuamente", async () => {
    const process = vi.fn(async () => true);
    expect(await drainRecordingQueue(async () => {}, process, signal(), 2)).toBe(2);
    expect(process).toHaveBeenCalledTimes(2);
  });
  it("propaga fallos sin ejecutar otro trabajo ni ocultarlos como éxito", async () => {
    const process = vi.fn().mockRejectedValue(new Error("Transferencia fallida"));
    await expect(drainRecordingQueue(async () => {}, process, signal())).rejects.toThrow("Transferencia fallida");
    expect(process).toHaveBeenCalledOnce();
    const untouched = vi.fn();
    await expect(drainRecordingQueue(async () => { throw new Error("Reconciliación fallida"); }, untouched, signal())).rejects.toThrow("Reconciliación fallida");
    expect(untouched).not.toHaveBeenCalled();
  });
  it("no reclama más trabajo después de la cancelación", async () => {
    const controller = new AbortController();
    const process = vi.fn(async () => { controller.abort(); return true; });
    await expect(drainRecordingQueue(async () => {}, process, controller.signal)).rejects.toThrow();
    expect(process).toHaveBeenCalledOnce();
  });
  it("rechaza límites inválidos antes de contactar servicios", async () => {
    const reconcile = vi.fn();
    await expect(drainRecordingQueue(reconcile, vi.fn(), signal(), 0)).rejects.toThrow("Límite");
    expect(reconcile).not.toHaveBeenCalled();
  });
});
describe("capacidad del disco", () => {
  const GiB = 1024 ** 3;
  const disk = (bytes: number) => vi.mocked(statfs).mockResolvedValue({ bavail: BigInt(bytes), bsize: 1n } as Awaited<ReturnType<typeof statfs>>);
  it("rechaza archivos que agotarían el runner, sin iniciar una descarga", async () => {
    disk(2 * GiB);
    await expect(assertRecordingDiskSpace("/spool", 2 * GiB, 0)).rejects.toThrow("Disco insuficiente");
  });
  it("cuenta el espacio ya ocupado por el checkpoint y conserva la reserva", async () => {
    disk(2 * GiB);
    await expect(assertRecordingDiskSpace("/spool", 3 * GiB, 2 * GiB)).resolves.toBeUndefined();
    disk(2 * GiB - 1);
    await expect(assertRecordingDiskSpace("/spool", 3 * GiB, 2 * GiB)).rejects.toThrow("Disco insuficiente");
  });
});
