"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetchRecording } from "./client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { recordingResponseSchema, type RecordingResponse } from "./contract";
import styles from "../Live.module.css";
import { RecordingPlayer } from "./RecordingPlayer";
const labels: Record<string, string> = {
  recording: "Grabando",
  interrupted: "Grabación interrumpida",
  processing: "Procesando",
  importing: "Guardando en Soflia",
  ready: "Lista",
  failed: "Requiere reintento",
  missing: "Sin vídeo disponible",
  purging: "Retirando archivo",
  purged: "Archivo retirado",
};
export function RecordingPanel({
  orgSlug,
  sessionId,
}: {
  orgSlug: string;
  sessionId: string;
}) {
  const endpoint = `/api/${orgSlug}/live/${sessionId}/recordings`;
  const {user}=useAuth();
  const { data, error, mutate } = useSWR<RecordingResponse>(
    user?.id?[endpoint,user.id]:null,
    async ([url,id]:[string,string]) => recordingResponseSchema.parse(await fetchRecording(url,id)),
    { revalidateOnFocus: true },
  );
  const [busy, setBusy] = useState(false),
    [failure, setFailure] = useState(""),
    [playing, setPlaying] = useState<string | null>(null);
  const snapshot = !error&&data?.recording_snapshot?.user_id===user?.id?data?.recording_snapshot:undefined;
  async function act(operation: import("./contract").RecordingOperation) {
    if(!user)return;
    setBusy(true);
    setFailure("");
    try {
      await fetchRecording(endpoint,user.id, operation);
      await mutate();
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la grabación.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className={styles.panel}
      style={{ marginTop: 24 }}
      aria-label="Grabaciones del webinar"
    >
      <h2 className={styles.sectionTitle}>Grabaciones</h2>
      <p className={styles.muted}>
        Los webinars se graban automáticamente y se guardan privados en Soflia.
      </p>
      {(error || failure) && (
        <p role="alert" className={styles.error}>
          {failure || error.message}
        </p>
      )}
      {!data && !error && <p role="status">Consultando grabaciones…</p>}
      {snapshot?.can_manage && (
        <label className={styles.option}>
          <input
            type="checkbox"
            disabled={busy}
            checked={snapshot.requested}
            onChange={(event) =>
              void act({
                type: "intent",
                revision: snapshot.revision,
                requested: event.target.checked,
              })
            }
          />
          Permitir ver después en SofLIA Academy
        </label>
      )}
      {snapshot?.can_manage && (
        <p className={styles.muted}>
          La edición completa se publicará cuando esté validada. Si hay
          interrupciones o cobertura incierta, revisa el vídeo antes de
          publicarlo.
        </p>
      )}
      {snapshot && !snapshot.runs.length && (
        <p>
          {snapshot.can_manage
            ? snapshot.availability === "missing"
              ? "Zoom aún no ha confirmado el vídeo de esta sesión finalizada. La reconciliación lo buscará; solicita revisión si continúa sin aparecer."
              : "El vídeo aparecerá aquí cuando Zoom confirme la grabación."
            : "El instructor aún no ha habilitado una repetición."}
        </p>
      )}
      {snapshot?.runs.map((run, index) => (
        <article
          key={run.id}
          style={{
            borderTop: "1px solid var(--color-border-val)",
            padding: "16px 0",
          }}
        >
          <strong>
            Edición {snapshot.runs.length - index} · {labels[run.status]}
          </strong>
          <p className={styles.muted}>
            {Math.round(run.duration_seconds / 60)} min · {run.segments}{" "}
            segmentos · {run.published ? "Disponible para tu curso" : "Privada"}
            {run.coverage !== "complete" ? " · Cobertura por revisar" : ""}
          </p>
          <div className={styles.actions}>
            {run.status === "ready" && (
              <button
                className={styles.secondary}
                onClick={() => setPlaying(run.id)}
              >
                Ver grabación
              </button>
            )}
            {snapshot.can_manage && run.status === "ready" && (
              <button
                disabled={busy}
                className={styles.button}
                onClick={() =>
                  void act({
                    type: "publish",
                    run_id: run.id,
                    revision: run.publication_revision,
                    publish: !run.published,
                    reviewed: true,
                  })
                }
              >
                {run.published
                  ? "Retirar repetición"
                  : run.coverage === "complete"
                    ? "Publicar en SofLIA Academy"
                    : "Publicar esta edición revisada"}
              </button>
            )}
            {snapshot.can_manage &&
              ["failed", "missing"].includes(run.status) && (
                <button
                  disabled={busy}
                  className={styles.secondary}
                  onClick={() => void act({ type: "retry", run_id: run.id })}
                >
                  Reintentar archivo
                </button>
              )}
          </div>
          {playing === run.id && (
            <RecordingPlayer key={snapshot.user_id+":"+run.id} endpoint={endpoint} runId={run.id} userId={snapshot.user_id} />
          )}
        </article>
      ))}
    </section>
  );
}
