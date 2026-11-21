"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import useSWR from "swr";
import { liveFetch, liveDate } from "@/features/live/client";
import { Pagination } from "@/features/live/Pagination";
import live from "@/features/live/Live.module.css";
import styles from "@/features/live/InstructorPanel.module.css";
import type { ownCourseContent, ownCourseLearners, ownCourseReviews } from "./course.service";

type Content = Awaited<ReturnType<typeof ownCourseContent>>;
type Learners = Awaited<ReturnType<typeof ownCourseLearners>>;
type Reviews = Awaited<ReturnType<typeof ownCourseReviews>>;
type Learner = Learners["learners"][number];
type View = "courses" | "statistics" | "reviews" | "messages";

const labels: Record<View, string> = {
  courses: "Mis cursos", statistics: "Estadísticas", reviews: "Reseñas", messages: "Mensajes",
};

function CourseEditForm({ endpoint, kind, id, lessonId, title, description, summary, onSaved }: {
  endpoint: string;
  kind: "course" | "module" | "lesson" | "material" | "activity";
  id?: string;
  lessonId?: string;
  title: string;
  description: string | null;
  summary?: string | null;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await liveFetch(endpoint, {
        kind, id, lessonId, title: values.get("title"), description: values.get("description"),
        ...(kind === "lesson" ? { summary: values.get("summary") } : {}),
      }, "PATCH");
      setSaved(true);
      onSaved();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "No se pudo guardar el contenido.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={live.form} onSubmit={submit}>
      <label>Título<input name="title" defaultValue={title} className={live.input} maxLength={200} required /></label>
      <label>Descripción<textarea name="description" defaultValue={description ?? ""} className={live.input} maxLength={8000} rows={3} /></label>
      {kind === "lesson" && (
        <label>Resumen<textarea name="summary" defaultValue={summary ?? ""} className={live.input} maxLength={100000} rows={6} /></label>
      )}
      <div className={live.actions}><button className={live.button} disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</button></div>
      {saved && <p role="status" className={live.notice}>Cambios guardados.</p>}
      {error && <p role="alert" className={live.error}>{error}</p>}
    </form>
  );
}

function learnerName(learner: Learner) {
  return learner.users?.display_name || [learner.users?.first_name, learner.users?.last_name].filter(Boolean).join(" ") || "Alumno";
}

function CourseMessageForm({ endpoint, learners }: { endpoint: string; learners: Learner[] }) {
  const request = useRef<{ key: string; id: string }>();
  const [kind, setKind] = useState("notification");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const body = { kind, title: values.get("title"), message: values.get("message"), learnerId: values.get("learner") || undefined };
    const key = JSON.stringify(body);
    if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await liveFetch<{ recipients: number }>(`${endpoint}/messages`, { requestId: request.current.id, ...body });
      setNotice(result.recipients === 1 ? "Enviado a 1 alumno." : `Enviado a ${result.recipients} alumnos.`);
      request.current = undefined;
      form.reset();
      setKind("notification");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "No se pudo enviar el mensaje.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={`${live.panel} ${live.form}`} onSubmit={submit}>
      <label>Tipo de envío
        <select value={kind} onChange={(event) => setKind(event.target.value)} className={live.input}>
          <option value="notification">Notificación</option>
          <option value="message">Mensaje</option>
          <option value="feedback">Retroalimentación individual</option>
        </select>
      </label>
      <label>Destinatario
        <select name="learner" className={live.input} required={kind === "feedback"}>
          <option value="">{kind === "feedback" ? "Selecciona un alumno" : "Todos los alumnos activos"}</option>
          {learners.map((learner) => <option key={learner.id} value={learner.user_id}>{learnerName(learner)}</option>)}
        </select>
      </label>
      <label>Asunto<input name="title" className={live.input} maxLength={160} required /></label>
      <label>Mensaje<textarea name="message" className={live.input} maxLength={4000} rows={5} required /></label>
      <div className={live.actions}><button className={live.button} disabled={busy}>{busy ? "Enviando…" : "Enviar en SofLIA"}</button></div>
      {notice && <p role="status" className={live.notice}>{notice}</p>}
      {error && <p role="alert" className={live.error}>{error}</p>}
    </form>
  );
}

export function InstructorCourseDetails({ orgSlug, courseId, view }: { orgSlug: string; courseId: string; view: View }) {
  const [page, setPage] = useState(0);
  const endpoint = `/api/${orgSlug}/instructor/courses/${courseId}`;
  const query = view === "courses" ? "content" : view === "messages" ? "recipients" : view;
  const { data, error, mutate } = useSWR<Content | Learners | Reviews>(`${endpoint}?view=${query}&page=${page}`, liveFetch, {
    keepPreviousData: true,
  });
  const refresh = () => { void mutate(); };

  return (
    <>
      <header className={styles.hero}>
        <div className={styles.heroCopy}><h1>{data?.course.title ?? labels[view]}</h1><p>{labels[view]}</p></div>
        <Link className={live.secondary} href={`/${orgSlug}/instructor/${view}`}>Volver a {labels[view].toLowerCase()}</Link>
      </header>
      {error && <p role="alert" className={live.error}>{error.message}</p>}
      {!data && !error && <p role="status" className={live.panel}>Cargando curso…</p>}
      {data && "modules" in data && (
        <>
          <section className={live.panel}>
            <h2 className={live.sectionTitle}>Información del curso</h2>
            <CourseEditForm endpoint={endpoint} kind="course" title={data.course.title} description={data.course.description} onSaved={refresh} />
          </section>
          <section className={styles.sections} aria-labelledby="instructor-modules">
            <h2 id="instructor-modules" className={styles.heading}>Módulos y lecciones</h2>
            {!data.modules.length && <p className={live.panel}>Este curso aún no tiene módulos.</p>}
            {data.modules.map((module) => (
              <details key={module.module_id} className={`${live.panel} ${styles.editorDetails}`}>
                <summary>{module.module_title}</summary>
                <CourseEditForm endpoint={endpoint} kind="module" id={module.module_id} title={module.module_title} description={module.module_description} onSaved={refresh} />
                {module.course_lessons.map((lesson) => (
                  <details key={lesson.lesson_id} className={`${live.panel} ${styles.editorDetails}`}>
                    <summary>{lesson.lesson_title}</summary>
                    <CourseEditForm endpoint={endpoint} kind="lesson" id={lesson.lesson_id} title={lesson.lesson_title} description={lesson.lesson_description} summary={lesson.summary_content} onSaved={refresh} />
                    {lesson.lesson_materials.map((material) => (
                      <details key={material.material_id} className={styles.editorDetails}>
                        <summary>Material · {material.material_title}</summary>
                        <CourseEditForm
                          endpoint={endpoint} kind="material" id={material.material_id} lessonId={lesson.lesson_id}
                          title={material.material_title} description={material.material_description} onSaved={refresh}
                        />
                      </details>
                    ))}
                    {lesson.lesson_activities.map((activity) => (
                      <details key={activity.activity_id} className={styles.editorDetails}>
                        <summary>Actividad · {activity.activity_title}</summary>
                        <CourseEditForm
                          endpoint={endpoint} kind="activity" id={activity.activity_id} lessonId={lesson.lesson_id}
                          title={activity.activity_title} description={activity.activity_description} onSaved={refresh}
                        />
                      </details>
                    ))}
                  </details>
                ))}
              </details>
            ))}
          </section>
        </>
      )}
      {data && "learners" in data && (
        <>
          {view === "messages" ? <CourseMessageForm endpoint={endpoint} learners={data.learners} /> : (
            <section className={live.panel} aria-labelledby="instructor-learners">
              <h2 id="instructor-learners" className={live.sectionTitle}>Progreso de los alumnos</h2>
              {data.learners.length ? (
                <ul className={styles.courseList}>
                  {data.learners.map((learner) => (
                    <li key={learner.id} className={live.row}>
                      <div>
                        <strong>{learnerName(learner)}</strong>
                        {learner.completed_at && <p className={live.muted}>Completado el {liveDate(learner.completed_at)}</p>}
                        {learner.metrics && (
                          <>
                            <p className={live.muted}>
                              {learner.metrics.lessons_completed} lecciones · {learner.metrics.activities_completed} actividades ·{" "}
                              {learner.metrics.minutes_spent} min · {learner.metrics.sessions_attended} sesiones
                            </p>
                            {learner.metrics.last_accessed_at && <p className={live.muted}>Último acceso el {liveDate(learner.metrics.last_accessed_at)}</p>}
                          </>
                        )}
                      </div>
                      <span className={live.badge}>{learner.completion_percentage ?? 0}%</span>
                    </li>
                  ))}
                </ul>
              ) : <p className={live.empty}>Aún no hay alumnos asignados.</p>}
            </section>
          )}
          <Pagination page={page} total={data.total} pageSize={25} onChange={setPage} label="Páginas de alumnos" />
        </>
      )}
      {data && "reviews" in data && (
        <section className={styles.sections} aria-label="Reseñas publicadas">
          {!data.reviews.length && <p className={live.panel}>Este curso aún no tiene reseñas publicadas.</p>}
          {data.reviews.map((review) => (
            <article key={review.review_id} className={`${live.panel} ${live.card}`}>
              <span className={live.badge}>{review.rating} / 5</span>
              {review.review_title && <h2 className={styles.heading}>{review.review_title}</h2>}
              <p>{review.review_content}</p>
              {review.created_at && <time className={live.muted} dateTime={review.created_at}>{liveDate(review.created_at)}</time>}
            </article>
          ))}
          <Pagination page={page} total={data.total} pageSize={25} onChange={setPage} label="Páginas de reseñas" />
        </section>
      )}
    </>
  );
}
