"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardListIcon,
  DashboardIcon,
  FileTextIcon,
  GraduationCapIcon,
  ImageIcon,
  InboxIcon,
  MailIcon,
  NewspaperIcon,
  PenLineIcon,
  UsersIcon,
} from "./icons";

const sections = [
  { href: "/admin", label: "Dashboard", Icon: DashboardIcon },
  { href: "/admin/portada", label: "Portada", Icon: ImageIcon },
  { href: "/admin/noticias", label: "Noticias", Icon: NewspaperIcon },
  { href: "/admin/circulares", label: "Circulares", Icon: FileTextIcon },
  { href: "/admin/textos", label: "Textos", Icon: PenLineIcon },
  { href: "/admin/autoridades", label: "Autoridades", Icon: UsersIcon },
  { href: "/admin/niveles", label: "Niveles", Icon: GraduationCapIcon },
  { href: "/admin/admisiones", label: "Admisiones", Icon: ClipboardListIcon },
  { href: "/admin/galeria", label: "Galería", Icon: ImageIcon },
  { href: "/admin/contacto", label: "Contacto", Icon: MailIcon },
  { href: "/admin/leads", label: "Leads", Icon: InboxIcon },
] as const;

// Navegación principal del panel. Es un <nav> con <a> nativos: navegable con
// teclado (Tab/Enter) y con estado aria-current="page" en la sección activa.
export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <nav
      aria-label="Secciones del panel"
      className="border-b border-zinc-200 bg-white lg:sticky lg:top-16 lg:h-[calc(100svh-4rem)] lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r"
    >
      <ul className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-3 lg:py-4">
        {sections.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="lg:w-full">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:w-full ${
                  active
                    ? "bg-blue-50 text-blue-800"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
