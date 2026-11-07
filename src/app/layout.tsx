import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const LOGO_URL =
  "https://clinicaliviadias.com.br/wp-content/uploads/2026/11/logo2.png?v=2";

export const metadata: Metadata = {
  title: "Area Membri • Sistemi e Automazione",
  description: "Area Membri • Il Nostro Quartier Generale",
  icons: {
    icon: [{ url: LOGO_URL, type: "image/png" }],
    shortcut: [LOGO_URL],
    apple: [{ url: LOGO_URL }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href={LOGO_URL} type="image/png" />
        <link rel="shortcut icon" href={LOGO_URL} type="image/png" />
        <link rel="apple-touch-icon" href={LOGO_URL} />
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#09090B] text-[#F8FAFC]"
      >
        {children}
      </body>
    </html>
  );
}
