"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import useSWR from "swr";
import { liveFetch } from "./client";
import type { LiveCourse } from "./types";
import styles from "./Live.module.css";
import panel from "./InstructorPanel.module.css";

export function InstructorScheduleForm({ orgSlug, courses, busy, error, notice, schedule }: {
  orgSlug: string;
  courses: LiveCourse[];
  busy: boolean;
  error: string;
  notice: string;
  schedule: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const [dates, setDates] = useState([0]);
  const nextDate = useRef(1);
  const calendarUrl = `/api/${orgSlug}/instructor/calendar`;
  const { data, mutate } = useSWR<{ connected: string[] }>(calendarUrl, liveFetch);
  const connected = data?.connected ?? [];
  const calendarStatus = useSearchParams()?.get("calendar");
  const formRef = useRef<HTMLFormElement>(null);
  const [calendarError, setCalendarError] = useState("");
  const [calendar, setCalendar] = useState<string | undefined>();
  const defaultCalendar = connected[0] ?? "";

  useEffect(() => {
    if (window.location.hash === "#programar") formRef.current?.scrollIntoView();
  }, []);

  async function disconnect(provider: string) {
    setCalendarError("");
    try {
      await liveFetch(`${calendarUrl}/${provider}`, {}, "DELETE");
      setCalendar(undefined);
      await mutate();
    } catch (failure) {
      setCalendarError(failure instanceof Error ? failure.message : "No se pudo desconectar el calendario.");
    }
  }

  return (
    <form
      id="programar"
      ref={formRef}
      tabIndex={-1}
      aria-labelledby="instructor-schedule"
      className={`${styles.panel} ${styles.form} ${panel.anchor}`}
      onSubmit={schedule}
      onReset={() => { setDates([0]); setCalendar(undefined); }}
    >
      <h2 id="instructor-schedule" className={styles.sectionTitle}>Nueva sesión</h2>
      {calendarStatus === "connected" && <p role="status" className={styles.notice}>Calendario conectado.</p>}
      {calendarStatus === "error" && <p role="alert" className={styles.error}>No se pudo conectar el calendario.</p>}
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {!courses.length && <p className={styles.muted}>Todavía no tienes cursos disponibles para programar una sesión.</p>}
      <label>
        Curso
        <select name="course" className={styles.input} required defaultValue="">
          <option value="" disabled>Selecciona tu curso</option>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select>
      </label>
      <label>
        Tipo de sesión
        <select name="session_type" className={styles.input} defaultValue="meeting">
          <option value="meeting">Reunión</option>
          <option value="webinar">Webinar</option>
        </select>
      </label>
      <label>
        Título
        <input name="title" className={styles.input} maxLength={160} required />
      </label>
      <label>
        Descripción
        <textarea name="description" className={styles.input} maxLength={4000} rows={3} />
      </label>
      {dates.map((date, index) => (
        <div key={date} className={panel.dateRow}>
          <label>
            {index === 0 ? "Fecha y hora local" : `Fecha y hora local ${index + 1}`}
            <input name="starts" type="datetime-local" className={styles.input} required />
          </label>
          {index > 0 && (
            <button
              type="button" className={styles.secondary} aria-label={`Quitar fecha ${index + 1}`}
              disabled={busy} onClick={() => setDates((current) => current.filter((item) => item !== date))}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button" className={styles.secondary} disabled={busy || dates.length >= 12}
        onClick={() => {
          const id = nextDate.current++;
          setDates((current) => [...current, id]);
        }}
      >
        <Plus size={16} aria-hidden="true" /> Añadir fecha
      </button>
      <label>
        Duración en minutos
        <input name="duration" type="number" min={15} max={480} defaultValue={60} className={styles.input} required />
      </label>
      <label>
        Calendario para enviar invitaciones
        <select name="calendar" className={styles.input} value={calendar ?? defaultCalendar}
          onChange={(event) => setCalendar(event.target.value)}>
          <option value="">Solo notificación en SofLIA</option>
          {connected.includes("google") && <option value="google">Google Calendar</option>}
          {connected.includes("microsoft") && <option value="microsoft">Microsoft Outlook</option>}
        </select>
      </label>
      <div className={styles.actions}>
        {(["google", "microsoft"] as const).map((provider) => {
          const name = provider === "google" ? "Google" : "Outlook";
          return connected.includes(provider)
            ? <button type="button" key={provider} disabled={busy} className={styles.secondary} onClick={() => void disconnect(provider)}>Desconectar {name}</button>
            : <a key={provider} className={styles.secondary} href={`${calendarUrl}/${provider}`}>Conectar {name}</a>;
        })}
      </div>
      {calendarError && <p role="alert" className={styles.error}>{calendarError}</p>}
      <button className={styles.button} disabled={busy || !courses.length}>
        <Plus size={16} aria-hidden="true" /> {busy ? "Programando…" : "Programar sesión en SofLIA Hub"}
      </button>
    </form>
  );
}
