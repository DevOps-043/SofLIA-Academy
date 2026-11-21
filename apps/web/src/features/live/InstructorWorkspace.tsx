"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CalendarPlus, ClipboardCheck, MessageSquare, Radio, TrendingUp, Users } from "lucide-react";
import { SessionCard } from "./LiveCatalog";
import { useInstructorWorkspace } from "./useInstructorWorkspace";
import { InstructorScheduleForm } from "./InstructorForms";
import { Pagination } from "./Pagination";
import type { LiveCatalog } from "./types";
import live from "./Live.module.css";
import styles from "./InstructorPanel.module.css";

const copy = {
  dashboard: ["Panel del instructor", "Consulta tu actividad y entra a las herramientas de tus cursos."],
  courses: ["Mis cursos", "Edita el contenido de los cursos vinculados a tu autoría."],
  statistics: ["Estadísticas", "Consulta las métricas de tus cursos y el progreso de tus alumnos."],
  "in-live": ["In Live", "Programa y administra tus sesiones en SofLIA Hub."],
  messages: ["Mensajes", "Envía avisos, mensajes y retroalimentación a los alumnos de tus cursos."],
  reviews: ["Reseñas", "Consulta las valoraciones publicadas en tus cursos."],
} as const;

export type InstructorView = keyof typeof copy;

export function InstructorMetrics({ stats, courseTotal }: { stats: LiveCatalog["stats"]; courseTotal: number }) {
  const metrics = [
    { icon: BookOpen, label: "Cursos vinculados", value: courseTotal },
    { icon: Users, label: "Alumnos de los cursos", value: stats.learners },
    { icon: ClipboardCheck, label: "Cursos completados", value: stats.completed },
    { icon: TrendingUp, label: "Avance promedio", value: `${stats.averageProgress}%` },
    { icon: Radio, label: "Sesiones", value: stats.sessions },
    { icon: Users, label: "Asistentes únicos", value: stats.attendees },
    { icon: MessageSquare, label: "Respuestas en sesión", value: stats.responses },
  ];

  return (
    <section aria-labelledby="instructor-activity">
      <h2 id="instructor-activity" className={styles.heading}>Actividad de enseñanza</h2>
      <dl className={styles.metrics}>
        {metrics.map(({ icon: Icon, label, value }) => (
          <div key={label} className={styles.metric}>
            <span className={styles.metricIcon}><Icon size={19} aria-hidden="true" /></span>
            <div><dt>{label}</dt><dd>{value ?? 0}</dd></div>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function InstructorWorkspace({ orgSlug, view = "dashboard" }: { orgSlug: string; view?: InstructorView }) {
  const base = `/${orgSlug}/instructor`;
  const [title, description] = copy[view];
  const sessionView = view === "in-live";
  const state = useInstructorWorkspace(orgSlug, sessionView);
  const { data, loadError, coursePage, setCoursePage } = state;
  const coursePagination = data && (
    <Pagination
      page={coursePage} total={data.courseTotal} pageSize={50}
      onChange={setCoursePage} label="Páginas de cursos"
    />
  );

  return (
    <>
      <header className={styles.hero}>
        <div className={styles.heroCopy}><h1>{title}</h1><p>{description}</p></div>
        {view === "dashboard" && (
          <Link href={`${base}/in-live#programar`} className={live.button}>
            <CalendarPlus size={17} aria-hidden="true" /> Programar sesión
          </Link>
        )}
      </header>

      {loadError && (
        <div className={`${live.error} ${styles.feedback}`}>
          <p role="alert">{loadError.message}</p>
          <button type="button" className={live.secondary} onClick={() => void state.reload()}>Reintentar</button>
        </div>
      )}
      {!data && !loadError && <p className={live.panel} role="status">Cargando tu espacio…</p>}
      {data && (
        <>
          {(view === "dashboard" || view === "statistics") && <InstructorMetrics stats={data.stats} courseTotal={data.courseTotal} />}
          {view === "dashboard" && (
            <nav className={live.actions} aria-label="Accesos del instructor">
              <Link className={live.secondary} href={`${base}/courses`}>Mis cursos <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link className={live.secondary} href={`${base}/statistics`}>Estadísticas <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link className={live.secondary} href={`${base}/reviews`}>Reseñas <ArrowRight size={16} aria-hidden="true" /></Link>
            </nav>
          )}
          {sessionView && (
            <div className={styles.workspace}>
              <section className={styles.sections} aria-labelledby="instructor-sessions">
                <div className={styles.sectionHeader}>
                  <h2 id="instructor-sessions" className={styles.heading}>Sesiones en vivo</h2>
                  <div className={live.actions} aria-label="Filtrar sesiones" role="group">
                    {(["upcoming", "past"] as const).map((period) => (
                      <button
                        type="button" key={period} aria-pressed={state.period === period}
                        className={`${live.secondary} ${state.period === period ? live.activeTab : ""}`}
                        onClick={() => { state.setPage(0); state.setPeriod(period); }}
                      >
                        {period === "upcoming" ? "Próximas" : "Historial"}
                      </button>
                    ))}
                  </div>
                </div>
                {data.sessions.length ? (
                  <div className={live.grid}>
                    {data.sessions.map((session) => (
                      <SessionCard key={session.id} session={session} orgSlug={orgSlug} detailsHref={`${base}/in-live/${session.id}`} />
                    ))}
                  </div>
                ) : (
                  <p className={`${live.panel} ${live.empty}`}>Todavía no hay sesiones en esta vista.</p>
                )}
                <Pagination page={state.page} total={data.total} pageSize={20} onChange={state.setPage} label="Páginas de sesiones" />
              </section>
              <div>
                <InstructorScheduleForm
                  orgSlug={orgSlug} courses={data.courses} busy={state.busy}
                  error={state.scheduleError} notice={state.notice} schedule={state.schedule}
                />
                {coursePagination}
              </div>
            </div>
          )}
          {!sessionView && view !== "dashboard" && (
            <section className={live.panel} aria-labelledby="instructor-courses">
              <h2 id="instructor-courses" className={live.sectionTitle}>Cursos vinculados</h2>
              {data.courses.length ? (
                <ul className={styles.courseList}>
                  {data.courses.map((course) => (
                    <li key={course.id} className={live.row}>
                      <Link className={styles.courseTitle} href={`${base}/${view}/${course.id}`}>
                        <BookOpen size={17} aria-hidden="true" /> {course.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={live.empty}>Todavía no tienes cursos vinculados.</p>
              )}
              {coursePagination}
            </section>
          )}
        </>
      )}
    </>
  );
}
