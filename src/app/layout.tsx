import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Copa Manager 2026",
  description: "Manager web multiplayer de Copa 2026 com salas, taticas, simulacao e campo ao vivo."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
