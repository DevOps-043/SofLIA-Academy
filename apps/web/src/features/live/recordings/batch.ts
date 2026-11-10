/** Una ejecución efímera no espera nuevos trabajos ni reintenta en bucle. */
export async function drainRecordingQueue(
  reconcile: () => Promise<void>,
  processJob: () => Promise<boolean>,
  signal: AbortSignal,
  limit = 10,
) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
    throw new Error("Límite de importación inválido.");
  signal.throwIfAborted();
  await reconcile();
  let processed = 0;
  while (processed < limit) {
    signal.throwIfAborted();
    if (!(await processJob())) break;
    processed++;
  }
  signal.throwIfAborted();
  return processed;
}
