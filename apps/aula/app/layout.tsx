import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aula Virtual",
  description: "Plataforma para padres y estudiantes: notas, cursos y comunicados.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-zinc-50">{children}</body>
    </html>
  );
}