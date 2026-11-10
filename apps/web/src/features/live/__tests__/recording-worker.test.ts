// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LiveDatabase } from "../database.types";
vi.mock("../zoom.server", () => ({ zoomRequest: vi.fn(), recordingDownloadToken: vi.fn() }));
vi.mock("@/lib/utils/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
import { processRecordingJob } from "../recordings/worker.server";
describe("resultado operativo del worker", () => {
  it("termina sin reclamar un trabajo inexistente", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [] });
    const db = { rpc } as unknown as SupabaseClient<LiveDatabase>;
    expect(await processRecordingJob(db, new AbortController().signal)).toBe(false);
    expect(rpc).toHaveBeenCalledOnce();
  });
  it("conserva la recuperación en base de datos y devuelve un fallo al scheduler", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: [{ run_id: "run", lease_id: "lease", attempts: 1 }] }).mockResolvedValue({ data: true });
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    const db = { rpc, from: vi.fn(() => query) } as unknown as SupabaseClient<LiveDatabase>;
    await expect(processRecordingJob(db, new AbortController().signal)).rejects.toThrow("pendiente de recuperación");
    expect(rpc).toHaveBeenLastCalledWith("live_recording_fail", expect.objectContaining({ p_run: "run", p_lease: "lease", p_retry: true, p_shutdown: false }));
  });
});
