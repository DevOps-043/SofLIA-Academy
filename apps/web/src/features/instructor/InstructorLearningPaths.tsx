"use client";

import { useRef, useState, type FormEvent } from "react";
import useSWR from "swr";
import { Pagination } from "@/features/live/Pagination";
import { useInstructorWorkspace } from "@/features/live/useInstructorWorkspace";
import { liveFetch } from "@/features/live/client";
import type { LiveCourse } from "@/features/live/types";
import live from "@/features/live/Live.module.css";
import styles from "@/features/live/InstructorPanel.module.css";

interface LearningPath {
  id: string;
  title: string;
  description: string | null;
  learning_path_items: { position: number; courses: { title: string } | null }[];
}

export function InstructorLearningPaths({ orgSlug }: { orgSlug: string }) {
  const endpoint = `/api/${orgSlug}/instructor/learning-paths`;
  const [page, setPage] = useState(0);
  const { data, error, mutate } = useSWR<{ paths: LearningPath[]; total: number }>(
    `${endpoint}?page=${page}`, liveFetch, { keepPreviousData: true },
  );
  const catalog = useInstructorWorkspace(orgSlug, false);
  const [courseId, setCourseId] = useState("");
  const [selected, setSelected] = useState<LiveCourse[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const request = useRef<{ key: string; id: string }>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const body = {
      title: values.get("title"), description: values.get("description"), courses: selected.map((course) => course.id),
    };
    const key = JSON.stringify(body);
    if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };
    setBusy(true);
    setFormError("");
    setNotice("");
    try {
      await liveFetch(endpoint, { id: request.current.id, ...body });
      request.current = undefined;
      form.reset();
      setSelected([]);
      setPage(0);
      setNotice("Ruta de aprendizaje creada.");
      void mutate();
    } catch (failure) {
      setFormError(failure instanceof Error ? failure.message : "No se pudo crear la ruta.");
    } finally {
      setBusy(false);
    }
  }

  const available = catalog.data?.courses.filter((course) => !selected.some((item) => item.id === course.id)) ?? [];
  return (
    <>
      <header className={styles.hero}>
        <div className={styles.heroCopy}><h1>Rutas de aprendizaje</h1><p>Organiza tus cursos en el orden en que se deben tomar.</p></div>
      </header>
      <div className={styles.workspace}>
        <section className={styles.sections} aria-label="Mis rutas">
          {error && <p role="alert" className={live.error}>{error.message}</p>}
          {!data && !error && <p role="status" className={live.panel}>Cargando rutas…</p>}
          {data?.paths.length === 0 && <p className={live.panel}>Todavía no has creado una ruta.</p>}
          {data?.paths.map((path) => (
            <article key={path.id} className={live.panel}>
              <h2 className={live.sectionTitle}>{path.title}</h2>
              {path.description && <p className={live.muted}>{path.description}</p>}
              <ol className={styles.orderedCourses}>
                {[...path.learning_path_items].sort((a, b) => a.position - b.position).map((item) => (
                  <li key={item.position}>{item.courses?.title ?? "Curso sin disponibilidad"}</li>
                ))}
              </ol>
            </article>
          ))}
          {data && <Pagination page={page} total={data.total} pageSize={20} onChange={setPage} label="Páginas de rutas" />}
        </section>
        <form className={`${live.panel} ${live.form}`} onSubmit={submit}>
          <h2 className={live.sectionTitle}>Nueva ruta</h2>
          {catalog.loadError && <p role="alert" className={live.error}>{catalog.loadError.message}</p>}
          <label>Título<input name="title" className={live.input} maxLength={160} required /></label>
          <label>Descripción<textarea name="description" className={live.input} rows={3} maxLength={4000} /></label>
          <label>Curso para añadir
            <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className={live.input}>
              <option value="">Selecciona un curso</option>
              {available.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </label>
          <button type="button" className={live.secondary} disabled={!courseId || busy || selected.length >= 50} onClick={() => {
            const course = available.find((item) => item.id === courseId);
            if (course) setSelected((current) => [...current, course]);
            setCourseId("");
          }}>Añadir curso</button>
          {catalog.data && (
            <Pagination
              page={catalog.coursePage} total={catalog.data.courseTotal} pageSize={50}
              onChange={(next) => { setCourseId(""); catalog.setCoursePage(next); }} label="Páginas de cursos"
            />
          )}
          {selected.length > 0 && (
            <ol className={styles.orderedCourses}>
              {selected.map((course) => (
                <li key={course.id}>
                  <span>{course.title}</span>{" "}
                  <button type="button" className={live.secondary} disabled={busy} aria-label={`Quitar ${course.title}`}
                    onClick={() => setSelected((current) => current.filter((item) => item.id !== course.id))}
                  >Quitar</button>
                </li>
              ))}
            </ol>
          )}
          <button className={live.button} disabled={busy || !selected.length}>{busy ? "Guardando…" : "Crear ruta"}</button>
          {notice && <p role="status" className={live.notice}>{notice}</p>}
          {formError && <p role="alert" className={live.error}>{formError}</p>}
        </form>
      </div>
    </>
  );
}
