"use client";
import type { FormEvent } from "react";
import { Plus } from "lucide-react";
import type { LiveCatalog } from "./types";
import styles from "./Live.module.css";
export function InstructorForms({
  data,
  busy,
  scheduleError,
  instructorError,
  schedule,
  saveInstructor,
}: {
  data: LiveCatalog;
  busy: boolean;
  scheduleError: string;
  instructorError: string;
  schedule: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  saveInstructor: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <aside>
      <form className={`${styles.panel} ${styles.form}`} onSubmit={schedule}>
        <h2 className={styles.sectionTitle}>Nueva sesión</h2>
        {scheduleError && (
          <p role="alert" className={styles.error}>
            {scheduleError}
          </p>
        )}
        <label>
          Tipo de sesión
          <select
            name="session_type"
            className={styles.input}
            defaultValue="meeting"
          >
            <option value="meeting">Reunión</option>
            <option value="webinar">Webinar</option>
          </select>
        </label>
        <p className={styles.muted}>
          Para una clase participativa, elige Reunión. La disponibilidad del
          formato Webinar depende de la configuración audiovisual de Soflia.
        </p>
        <label>
          Curso
          <select
            name="course"
            className={styles.input}
            required
            defaultValue=""
          >
            <option value="" disabled>
              Selecciona tu curso
            </option>
            {data.courses
              .filter((c) => c.instructor_id === data.userId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
          </select>
        </label>
        <label>
          Título
          <input
            name="title"
            className={styles.input}
            maxLength={160}
            required
            placeholder="¿Qué vamos a aprender?"
          />
        </label>
        <label>
          Descripción
          <textarea
            name="description"
            className={styles.input}
            maxLength={4000}
            rows={3}
          />
        </label>
        <label>
          Fecha y hora local
          <input
            name="starts"
            type="datetime-local"
            className={styles.input}
            required
          />
        </label>
        <label>
          Duración en minutos
          <input
            name="duration"
            type="number"
            min={15}
            max={480}
            defaultValue={60}
            className={styles.input}
            required
          />
        </label>
        <button className={styles.button} disabled={busy}>
          <Plus size={16} />
          {busy ? "Guardando…" : "Programar sesión en Soflia Hub"}
        </button>
      </form>
      {data.isAdmin && (
        <form
          className={`${styles.panel} ${styles.form}`}
          style={{ marginTop: 18 }}
          onSubmit={saveInstructor}
        >
          <h2 className={styles.sectionTitle}>Acceso de instructor</h2>
          {instructorError && (
            <p role="alert" className={styles.error}>
              {instructorError}
            </p>
          )}
          <p className={styles.muted}>
            Asigna esta capacidad a un miembro de la organización. Soflia gestiona los anfitriones y las grabaciones; el instructor no necesita una cuenta ni una licencia individual de Zoom.
          </p>
          <label>
            Email en Soflia
            <input
              name="email"
              type="email"
              className={styles.input}
              required
            />
          </label>
          <label className={styles.option}>
            <input name="revoke" type="checkbox" /> Retirar acceso de instructor
          </label>
          <button className={styles.secondary} disabled={busy}>
            Guardar acceso
          </button>
        </form>
      )}
    </aside>
  );
}
