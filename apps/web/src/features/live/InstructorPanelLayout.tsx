"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Menu,
  MessageSquare,
  Route,
  Radio,
  Star,
  X,
} from "lucide-react";
import { OrgNavbar } from "@/core/components/OrgNavbar/OrgNavbar";
import { LiveTheme } from "./LiveTheme";
import styles from "./InstructorPanel.module.css";

export const instructorSections = [
  { id: "dashboard", label: "Panel", icon: LayoutGrid },
  { id: "courses", label: "Mis cursos", icon: BookOpen },
  { id: "statistics", label: "Estadísticas", icon: BarChart3 },
  { id: "in-live", label: "In Live", icon: Radio },
  { id: "messages", label: "Mensajes", icon: MessageSquare },
  { id: "reviews", label: "Reseñas", icon: Star },
  { id: "learning-paths", label: "Rutas de aprendizaje", icon: Route },
];

function InstructorNavigation({
  orgSlug,
  activeSection,
  onNavigate,
  collapsed = false,
}: {
  orgSlug: string;
  activeSection: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <nav className={styles.navigation} aria-label="Panel del instructor">
      {instructorSections.map(({ id, label, icon: Icon }) => (
        <Link
          key={id}
          className={styles.navLink}
          href={`/${orgSlug}/instructor/${id}`}
          aria-current={activeSection === id ? "page" : undefined}
          aria-label={label}
          title={collapsed ? label : undefined}
          onClick={onNavigate}
        >
          <Icon size={17} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
      <div className={styles.navDivider} />
      <Link
        className={styles.navLink}
        href={`/${orgSlug}/live`}
        aria-label="Mi agenda"
        title={collapsed ? "Mi agenda" : undefined}
        onClick={onNavigate}
      >
        <CalendarDays size={17} aria-hidden="true" />
        <span>Mi agenda</span>
      </Link>
      <Link
        className={styles.navLink}
        href={`/${orgSlug}/business-user/dashboard`}
        aria-label="Mi aprendizaje"
        title={collapsed ? "Mi aprendizaje" : undefined}
        onClick={onNavigate}
      >
        <ArrowLeft size={17} aria-hidden="true" />
        <span>Mi aprendizaje</span>
      </Link>
    </nav>
  );
}

export function InstructorPanelLayout({
  children,
  orgSlug,
}: {
  children: ReactNode;
  orgSlug: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeSection = usePathname()?.split("/")[3] ?? "dashboard";

  useEffect(() => {
    if (!menuOpen) return;
    const desktop = window.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    closeOnDesktop();
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [menuOpen]);

  const navigation = { orgSlug, activeSection };
  const CollapseIcon = collapsed ? ChevronRight : ChevronLeft;

  return (
    <LiveTheme className={styles.page}>
      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <OrgNavbar
          leadingAction={
            <Dialog.Trigger asChild>
              <button type="button" className={`${styles.iconButton} ${styles.mobileToggle}`} aria-label="Abrir menú del instructor">
                <Menu size={20} aria-hidden="true" />
              </button>
            </Dialog.Trigger>
          }
        />
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={`${styles.sidebar} ${styles.mobileSidebar}`} aria-describedby={undefined}>
          <div className={styles.drawerHeader}>
            <Dialog.Title>Panel del instructor</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className={styles.iconButton} aria-label="Cerrar menú del instructor">
                <X size={19} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <InstructorNavigation {...navigation} onNavigate={() => setMenuOpen(false)} />
        </Dialog.Content>
      </Dialog.Root>

      <div className={`${styles.layout} ${collapsed ? styles.collapsed : ""}`}>
        <aside className={`${styles.sidebar} ${styles.desktopSidebar}`}>
          <InstructorNavigation {...navigation} collapsed={collapsed} />
          <button
            type="button"
            className={styles.collapseButton}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
            onClick={() => setCollapsed(!collapsed)}
          >
            <CollapseIcon size={16} aria-hidden="true" />
          </button>
        </aside>
        <main className={styles.content}>{children}</main>
      </div>
    </LiveTheme>
  );
}
