import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panel Admin",
  description: "Panel de administración del colegio (contenido institucional).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-zinc-50">{children}</body>
    </html>
  );
}