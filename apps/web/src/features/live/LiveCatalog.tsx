"use client";
import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Radio,
  CalendarDays,
  ArrowUpRight,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";
import { liveFetch, liveDate, statusLabel } from "./client";
import type { LiveCatalog as Catalog, LiveSession } from "./types";
import { LiveTheme } from "./LiveTheme";
import styles from "./Live.module.css";
import { Pagination } from "./Pagination";
import { buildHubSessionLink } from "./hub-link";

export function SessionCard({
  session,
  orgSlug,
  detailsHref,
}: {
  session: LiveSession;
  orgSlug: string;
  detailsHref?: string;
}) {
  return (
    <article className={`${styles.panel} ${styles.card}`}>
      <span
        className={`${styles.badge} ${session.status === "live" ? styles.live : ""}`}
      >
        <Radio size={12} />
        {statusLabel[session.status]}
      </span>
      <h3>{session.title}</h3>
      <p className={styles.muted}>{session.description}</p>
      <div className={styles.muted}>
        <CalendarDays size={14} style={{ display: "inline", marginRight: 8 }} />
        {liveDate(session.starts_at)} · {session.duration_minutes} min
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.muted}>{session.session_type === "webinar" ? "Webinar" : "Reunión"} · Soflia Hub</span>
        {["scheduled", "live"].includes(session.status) && (
          <a
            className={styles.secondary}
            href={buildHubSessionLink(orgSlug, session.id)}
          >
            Abrir Soflia Hub
            <ArrowUpRight size={14} />
          </a>
        )}
      </div>
      <Link className={styles.muted} href={detailsHref ?? `/${orgSlug}/live/${session.id}`}>Ver detalles</Link>
    </article>
  );
}
export function LiveSessionsWidget({ orgSlug }: { orgSlug: string }) {
  const { data, error } = useSWR<Catalog>(
    `/api/${orgSlug}/live?period=upcoming`,
    liveFetch,
    {
      refreshInterval: 60000,
    },
  );
  const sessions =
    data?.sessions
      .filter((s) => ["scheduled", "live"].includes(s.status))
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      .slice(0, 3) || [];
  return (
    <section className={styles.widget} aria-label="Sesiones en vivo">
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <Radio size={15} /> In Live
          </div>
          <h2 className={styles.title}>Tus sesiones en Soflia Hub</h2>
        </div>
        <div className={styles.actions}>
          {data?.canTeach && (
            <Link className={styles.secondary} href={`/${orgSlug}/instructor`}>
              Panel de instructor
            </Link>
          )}
          <Link className={styles.secondary} href={`/${orgSlug}/live`}>
            Mi agenda e historial <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
      {error ? (
        <p className={styles.muted}>In Live aún no está disponible.</p>
      ) : !data ? (
        <p className={styles.muted}>Cargando sesiones…</p>
      ) : sessions.length ? (
        <div className={styles.grid}>
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} orgSlug={orgSlug} />
          ))}
        </div>
      ) : (
        <p className={styles.muted}>
          Tus próximas sesiones aparecerán aquí cuando sean programadas.
        </p>
      )}
    </section>
  );
}
export function LiveCatalogPage({ orgSlug }: { orgSlug: string }) {
  const [tab, setTab] = useState("upcoming");
  const [page, setPage] = useState(0);
  const { data, error, mutate } = useSWR<Catalog>(
    `/api/${orgSlug}/live?period=${tab}&page=${page}`,
    liveFetch,
    { refreshInterval: 30000 },
  );
  const sessions = (data?.sessions || [])
    .filter((s) =>
      tab === "upcoming"
        ? ["live", "scheduled"].includes(s.status)
        : ["ended", "cancelled"].includes(s.status),
    )
    .sort((a, b) =>
      tab === "upcoming"
        ? a.starts_at.localeCompare(b.starts_at)
        : b.starts_at.localeCompare(a.starts_at),
    );
  return (
    <LiveTheme>
      <div className={styles.shell}>
        <Link
          className={styles.secondary}
          href={`/${orgSlug}/business-user/dashboard`}
        >
          <ArrowLeft size={15} /> Mi aprendizaje
        </Link>
        <header className={styles.header} style={{ marginTop: 26 }}>
          <div>
            <div className={styles.eyebrow}>
              <Radio size={16} /> Soflia In Live
            </div>
            <h1 className={styles.title}>
              Tus sesiones síncronas
            </h1>
            <p className={styles.muted}>
              Consulta tus reuniones y webinars y ábrelos en Soflia Hub de escritorio.
            </p>
          </div>
          {data?.canTeach && (
            <Link href={`/${orgSlug}/instructor`} className={styles.button}>
              <GraduationCap size={17} /> Panel de instructor
            </Link>
          )}
        </header>
        <nav className={styles.tabs} aria-label="Filtrar sesiones">
          {[
            ["upcoming", "Próximas sesiones"],
            ["past", "Historial"],
          ].map(([key, label]) => (
            <button
              aria-pressed={tab === key}
              className={`${styles.secondary} ${tab === key ? styles.activeTab : ""}`}
              onClick={() => {
                setTab(key);
                setPage(0);
              }}
              key={key}
            >
              {label}
            </button>
          ))}
        </nav>
        {error && (
          <div className={styles.error} role="alert">
            {error.message} <button onClick={() => mutate()}>Reintentar</button>
          </div>
        )}
        {!data && !error ? (
          <p>Cargando agenda…</p>
        ) : (
          <div className={styles.grid}>
            {sessions.map((s) => (
              <SessionCard key={s.id} orgSlug={orgSlug} session={s} />
            ))}
          </div>
        )}
        {data && (
          <Pagination
            page={page}
            total={data.total}
            pageSize={20}
            onChange={setPage}
            label="Páginas de sesiones"
          />
        )}
        {data && !sessions.length && (
          <div className={`${styles.panel} ${styles.empty}`}>
            <CalendarDays size={32} style={{ margin: "0 auto 15px" }} />
            {tab === "past"
              ? "Aún no hay sesiones anteriores."
              : "No tienes sesiones próximas."}
          </div>
        )}
        <p className={styles.muted} style={{ marginTop: 20 }}>
          Horarios en tu zona local:{" "}
          {Intl.DateTimeFormat().resolvedOptions().timeZone}.
        </p>
      </div>
    </LiveTheme>
  );
}
