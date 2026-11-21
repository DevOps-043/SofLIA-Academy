"use client";
import Link from "next/link";
import { useState } from "react";
import useSWR,{mutate as revalidate} from "swr";
import { ArrowLeft, ArrowUpRight, CalendarDays } from "lucide-react";
import { liveDate, liveFetch, statusLabel } from "./client";
import { LiveTheme } from "./LiveTheme";
import type { LiveSession } from "./types";
import styles from "./Live.module.css";
import { RecordingPanel } from './recordings/RecordingPanel';

interface SessionDetails { session: LiveSession; canManage: boolean; isInstructor: boolean; hub_url: string }

/** Ficha administrativa y acceso al escritorio. El aula se ejecuta en Hub. */
export function LiveSessionDetails({ orgSlug, sessionId, instructor = false }: { orgSlug: string; sessionId: string; instructor?: boolean }) {
  const endpoint = `/api/${orgSlug}/live/${sessionId}`;
  const { data, error, mutate } = useSWR<SessionDetails>(instructor ? `${endpoint}?scope=mine` : endpoint, liveFetch, { refreshInterval: 30000,onSuccess:()=>{void revalidate(key=>Array.isArray(key)&&key[0]===endpoint+"/recordings");} });
  const { data: calendars } = useSWR<{ connected: string[] }>(
    instructor && data?.isInstructor ? `/api/${orgSlug}/instructor/calendar` : null, liveFetch,
  );
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [calendar, setCalendar] = useState("");
  async function changeStatus(status: "ended" | "cancelled") {
    setBusy(true); setActionError(""); setNotice("");
    try {
      const result = await liveFetch<{ deliveryError?: string }>(endpoint, { status }, "PATCH");
      if (result.deliveryError) setActionError(result.deliveryError);
      await mutate();
    }
    catch (failure) { setActionError(failure instanceof Error ? failure.message : "No se pudo actualizar la sesión"); }
    finally { setBusy(false); }
  }

  async function deliver(type: "notify" | "invite" | "cancel-invitation") {
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      await liveFetch(`/api/${orgSlug}/instructor/sessions/${sessionId}/delivery`,
        type === "invite" ? { type, provider: calendar } : { type });
      setNotice(type === "notify" ? "Notificaciones entregadas en SofLIA."
        : type === "invite" ? "La sesión tiene invitaciones de calendario."
        : "Invitación de calendario cancelada.");
    } catch (failure) {
      setActionError(failure instanceof Error ? failure.message : "No se pudo completar el envío.");
    } finally {
      setBusy(false);
    }
  }

  const session = data?.session;
  const closed = session && ["ended", "cancelled"].includes(session.status);
  const content = <>
    <Link href={`/${orgSlug}/${instructor ? "instructor/in-live" : "live"}`} className={styles.secondary}>
      <ArrowLeft size={16} /> {instructor ? "Volver a In Live" : "Mi agenda"}
    </Link>
    <header className={styles.header} style={{ marginTop: 26 }}><div>
      <span className={styles.eyebrow}>Sesión síncrona · Soflia Hub</span>
      <h1 className={styles.title}>{session?.title || "Sesión síncrona"}</h1>
    </div></header>
    {(error || actionError) && <p role="alert" className={styles.error}>{actionError || error.message}</p>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {!data && !error && <p>Cargando sesión…</p>}
    {session && <section className={styles.panel}>
      <span className={styles.badge}>{session.session_type === "webinar" ? "Webinar" : "Reunión"} · {statusLabel[session.status]}</span>
      <p style={{ marginTop: 18 }}>{session.description}</p>
      <p className={styles.muted}><CalendarDays size={14} /> {liveDate(session.starts_at)} · {session.duration_minutes} min</p>
      {!closed ? <>
        <p>La reunión, el audio, el video y el chat se abren en Soflia Hub de escritorio.</p>
        <a href={data.hub_url} className={styles.button}>Abrir Soflia Hub <ArrowUpRight size={16} /></a>
        <p className={styles.muted} style={{ marginTop: 14 }}>Permite al navegador abrir la aplicación. Si Hub solicita inicio de sesión, usa tu cuenta de SofLIA Academy. Puedes volver a pulsar el botón si la aplicación aún no estaba instalada.</p>
      </> : <p>Esta sesión está {session.status === "ended" ? "finalizada" : "cancelada"}.</p>}
      {data.canManage && !closed && <div className={styles.actions} style={{ marginTop: 22 }}>
        {session.status === "scheduled" && <button disabled={busy} className={styles.secondary} onClick={() => changeStatus("cancelled")}>Cancelar sesión</button>}
        {session.status === "live" && <button disabled={busy} className={styles.secondary} onClick={() => changeStatus("ended")}>Finalizar sesión</button>}
      </div>}
      {instructor && data.isInstructor && session.status === "scheduled" && Date.parse(session.starts_at) > Date.now() && (
        <div className={styles.toolbar}>
          <button type="button" disabled={busy} className={styles.secondary} onClick={() => void deliver("notify")}>Notificar a los alumnos</button>
          {!!calendars?.connected.length && (
            <>
              <select className={styles.input} value={calendar} aria-label="Calendario" onChange={(event) => setCalendar(event.target.value)}>
                <option value="">Selecciona un calendario</option>
                {calendars.connected.map((provider) => (
                  <option key={provider} value={provider}>{provider === "google" ? "Google Calendar" : "Microsoft Outlook"}</option>
                ))}
              </select>
              <button type="button" disabled={busy || !calendar} className={styles.secondary} onClick={() => void deliver("invite")}>Añadir al calendario e invitar</button>
            </>
          )}
        </div>
      )}
      {instructor && data.isInstructor && session.status === "cancelled" && (
        <div className={styles.toolbar}>
          <button type="button" disabled={busy} className={styles.secondary} onClick={() => void deliver("cancel-invitation")}>Cancelar invitación de calendario</button>
        </div>
      )}
    </section>}
    {session&&<RecordingPanel orgSlug={orgSlug} sessionId={sessionId}/>}
  </>;
  return instructor ? <div>{content}</div> : <LiveTheme><main className={styles.shell}>{content}</main></LiveTheme>;
}
