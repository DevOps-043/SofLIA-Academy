import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";
import { LiveSessionsWidget } from "../LiveCatalog";
import { InstructorWorkspace } from "../InstructorWorkspace";
import { InstructorPanelLayout } from "../InstructorPanelLayout";

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("../client", () => ({ liveFetch: mocks.fetch, liveDate: (value: string) => value, statusLabel: {} }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/demo/instructor/courses",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/core/components/OrgNavbar/OrgNavbar", () => ({
  OrgNavbar: ({ leadingAction }: { leadingAction?: React.ReactNode }) => leadingAction ?? null,
}));

const courseId = "11111111-1111-4111-8111-111111111111";
const catalog = {
  sessions: [],
  courses: [{ id: courseId, title: "Fundamentos de IA", instructor_id: "teacher" }],
  canTeach: true,
  isAdmin: true,
  userId: "teacher",
  total: 0,
  courseTotal: 1,
  stats: { sessions: 0, learners: 5, completed: 2, averageProgress: 40 },
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.fetch.mockImplementation(async (url: string) => url.endsWith("/calendar") ? { connected: [] } : catalog);
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("Sesiones e instructores disponibles permanentemente", () => {
  it("usa páginas independientes y mantiene el acceso a Mi aprendizaje", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <InstructorPanelLayout orgSlug="demo">
          <InstructorWorkspace orgSlug="demo" view="courses" />
        </InstructorPanelLayout>
      </SWRConfig>,
    );
    const courses = await screen.findByRole("region", { name: "Cursos vinculados" });
    expect(within(courses).getByRole("link", { name: "Fundamentos de IA" })).toHaveAttribute("href", `/demo/instructor/courses/${courseId}`);
    const menu = screen.getByRole("navigation", { name: "Panel del instructor" });
    expect(within(menu).getByRole("link", { name: "Mis cursos" })).toHaveAttribute("aria-current", "page");
    expect(within(menu).getByRole("link", { name: "Estadísticas" })).toHaveAttribute("href", "/demo/instructor/statistics");
    expect(within(menu).getByRole("link", { name: "Mi aprendizaje" })).toHaveAttribute("href", "/demo/business-user/dashboard");
    expect(within(menu).queryByRole("link", { name: "Acceso de instructor" })).toBeNull();
  });

  it("abre las nuevas secciones desde el menú móvil y lo cierra con Escape", async () => {
    render(<InstructorPanelLayout orgSlug="demo"><h1>Panel de prueba</h1></InstructorPanelLayout>);

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú del instructor" }));
    const mobileMenu = await screen.findByRole("dialog", { name: "Panel del instructor" });
    expect(within(mobileMenu).getByRole("link", { name: "In Live" })).toHaveAttribute("href", "/demo/instructor/in-live");
    expect(within(mobileMenu).getByRole("link", { name: "Rutas de aprendizaje" })).toHaveAttribute("href", "/demo/instructor/learning-paths");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(mobileMenu).not.toBeInTheDocument());
  });

  it.each([undefined, "false"])("carga el dashboard y el formulario con la antigua variable en %s", async (value) => {
    vi.stubEnv("NEXT_PUBLIC_LIVE_LEARNING_ENABLED", value);
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <LiveSessionsWidget orgSlug="demo" />
        <InstructorWorkspace orgSlug="demo" view="in-live" />
      </SWRConfig>,
    );
    expect(screen.getByRole("heading", { name: "Tus sesiones en Soflia Hub" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Programar sesión en SofLIA Hub" })).toBeEnabled();
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith("/api/demo/live?period=upcoming"));
    expect(mocks.fetch).toHaveBeenCalledWith("/api/demo/live?view=instructor&scope=mine&page=0&coursePage=0&period=upcoming");
  });

  it("rechaza una fecha pasada aunque las demás fechas sean válidas", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <InstructorWorkspace orgSlug="demo" view="in-live" />
      </SWRConfig>,
    );
    const form = await screen.findByRole("form", { name: "Nueva sesión" });
    fireEvent.change(within(form).getByLabelText("Curso"), { target: { value: courseId } });
    fireEvent.change(within(form).getByLabelText("Título"), { target: { value: "Clase de prueba" } });
    fireEvent.change(within(form).getByLabelText("Fecha y hora local", { exact: true }), { target: { value: "2035-01-02T10:00" } });
    fireEvent.click(within(form).getByRole("button", { name: "Añadir fecha" }));
    fireEvent.change(within(form).getByLabelText("Fecha y hora local 2"), { target: { value: "2020-01-01T10:00" } });
    fireEvent.submit(form);
    expect(await within(form).findByRole("alert")).toHaveTextContent("Elige una fecha y hora futura");
    expect(mocks.fetch.mock.calls.every((args) => args.length === 1)).toBe(true);
  });

  it("no vuelve a programar fechas confirmadas después de un fallo parcial", async () => {
    let fail = true;
    mocks.fetch.mockImplementation(async (url: string, body?: { starts_at: string }) => {
      if (url.endsWith("/calendar")) return { connected: [] };
      if (!body) return catalog;
      if (body.starts_at.includes("01-03") && fail) {
        fail = false;
        throw new Error("Error temporal");
      }
      return { session: {} };
    });
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <InstructorWorkspace orgSlug="demo" view="in-live" />
      </SWRConfig>,
    );
    const form = await screen.findByRole("form", { name: "Nueva sesión" });
    fireEvent.change(within(form).getByLabelText("Curso"), { target: { value: courseId } });
    fireEvent.change(within(form).getByLabelText("Título"), { target: { value: "Clase de prueba" } });
    fireEvent.change(within(form).getByLabelText("Fecha y hora local", { exact: true }), { target: { value: "2035-01-02T12:00" } });
    fireEvent.click(within(form).getByRole("button", { name: "Añadir fecha" }));
    fireEvent.change(within(form).getByLabelText("Fecha y hora local 2"), { target: { value: "2035-01-03T12:00" } });
    fireEvent.submit(form);
    expect(await within(form).findByRole("alert")).toHaveTextContent("Una fecha ya quedó programada");
    fireEvent.submit(form);
    expect(await within(form).findByRole("status")).toHaveTextContent("2 sesiones programadas");
    const submissions = mocks.fetch.mock.calls.filter(([url]) => url.endsWith("/instructor/sessions"));
    expect(submissions).toHaveLength(3);
    expect(submissions[1][1].request_id).toBe(submissions[2][1].request_id);
  });
});
