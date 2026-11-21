"use client";

import { useRef, useState, type FormEvent } from "react";
import useSWR from "swr";
import { liveFetch } from "./client";
import { scheduleSchema } from "./schemas";
import { liveValidationMessage } from "./validation-message";
import type { LiveCatalog, LiveSession } from "./types";

const scheduleInputSchema = scheduleSchema.omit({ request_id: true });

export function useInstructorWorkspace(orgSlug: string, sessionView: boolean) {
  const requests = useRef(new Map<string, string>());
  const scheduled = useRef(new Set<string>());
  const [page, setPage] = useState(0);
  const [coursePage, setCoursePage] = useState(0);
  const [period, setPeriod] = useState<"upcoming" | "past">("upcoming");
  const [scheduleError, setScheduleError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const { data, error: loadError, mutate } = useSWR<LiveCatalog>(
    `/api/${orgSlug}/live?view=instructor&scope=mine&page=${page}&coursePage=${coursePage}&period=${sessionView ? period : "all"}`,
    liveFetch,
    { keepPreviousData: true },
  );

  async function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setScheduleError("");
    setNotice("");
    let completed = 0;
    try {
      const dates = [...new Set(values.getAll("starts").map((value) => String(value)))];
      const sessions = dates.map((date) => {
        const starts = new Date(date);
        if (!Number.isFinite(starts.getTime())) throw new Error("Elige una fecha y hora futura para la sesión.");
        const input = scheduleInputSchema.safeParse({
          course_id: values.get("course"),
          title: values.get("title"),
          description: values.get("description"),
          starts_at: starts.toISOString(),
          duration_minutes: Number(values.get("duration")),
          session_type: values.get("session_type") || "meeting",
        });
        if (!input.success) throw new Error(liveValidationMessage(input.error));
        return input.data;
      });
      if (!sessions.length) throw new Error("Elige una fecha y hora futura para la sesión.");

      const failedDeliveries: string[] = [];
      for (const session of sessions) {
        const key = JSON.stringify(session);
        if (!scheduled.current.has(key)) {
          const requestId = requests.current.get(key) ?? crypto.randomUUID();
          requests.current.set(key, requestId);
          const result = await liveFetch<{ session: LiveSession; deliveryError?: string }>(
            `/api/${orgSlug}/instructor/sessions`,
            { request_id: requestId, ...session, calendar: values.get("calendar") || undefined },
          );
          if (result.deliveryError) failedDeliveries.push(result.deliveryError);
          scheduled.current.add(key);
        }
        completed++;
      }
      requests.current.clear();
      scheduled.current.clear();
      form.reset();
      setPeriod("upcoming");
      setPage(0);
      setNotice(completed === 1 ? "Sesión programada." : `${completed} sesiones programadas.`);
      if (failedDeliveries.length) setScheduleError([...new Set(failedDeliveries)].join(" "));
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo programar la sesión.";
      const partial = completed === 1 ? "Una fecha ya quedó programada." : `${completed} fechas ya quedaron programadas.`;
      setScheduleError(completed ? `${partial} ${message}` : message);
    } finally {
      if (completed) void mutate();
      setBusy(false);
    }
  }

  return {
    data, loadError, scheduleError, busy, notice, page, setPage, coursePage, setCoursePage,
    period, setPeriod, reload: mutate, schedule,
  };
}
