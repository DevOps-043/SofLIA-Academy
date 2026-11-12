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

interface SessionDetails { session: LiveSession; canManage: boolean; hub_url: string }

/** Ficha administrativa y acceso al escritorio. El aula se ejecuta en Hub. */
export function LiveSessionDetails({ orgSlug, sessionId }: { orgSlug: string; sessionId: string }) {
  const endpoint = `/api/${orgSlug}/live/${sessionId}`;
  const { data, error, mutate } = useSWR<SessionDetails>(endpoint, liveFetch, { refreshInterval: 30000,onSuccess:()=>{void revalidate(key=>Array.isArray(key)&&key[0]===endpoint+"/recordings");} });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  async function changeStatus(status: "ended" | "cancelled") {
    setBusy(true); setActionError("");
    try { await liveFetch(endpoint, { status }, "PATCH"); await mutate(); }
    catch (failure) { setActionError(failure instanceof Error ? failure.message : "No se pudo actualizar la sesión"); }
    finally { setBusy(false); }
  }
  const session = data?.session;
  const closed = session && ["ended", "cancelled"].includes(session.status);
  return <LiveTheme><main className={styles.shell}>
    <Link href={`/${orgSlug}/live`} className={styles.secondary}><ArrowLeft size={16} /> Mi agenda</Link>
    <header className={styles.header} style={{ marginTop: 26 }}><div>
      <span className={styles.eyebrow}>Sesión síncrona · Soflia Hub</span>
      <h1 className={styles.title}>{session?.title || "Sesión síncrona"}</h1>
    </div></header>
    {(error || actionError) && <p role="alert" className={styles.error}>{actionError || error.message}</p>}
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
    </section>}
    {session&&<RecordingPanel orgSlug={orgSlug} sessionId={sessionId}/>}
  </main></LiveTheme>;
}
