"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  ShieldCheck,
  X,
  Maximize,
  Minimize,
  RotateCw,
  Lock,
  Loader2,
} from "lucide-react";

type Lang = "it" | "pt";

interface ProtectedPageViewerProps {
  pageUrl: string;
  title: string;
  subtitle?: string | null;
  userIdentifier?: string;
  lang?: Lang;
  onClose: () => void;
}

export function encodeSecureToken(url: string): string {
  const normalized = url.trim();
  const encodedUri = encodeURIComponent(normalized);
  let hex = "";
  for (let i = 0; i < encodedUri.length; i++) {
    hex += encodedUri.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return hex.split("").reverse().join("");
}

export default function ProtectedPageViewer({
  pageUrl,
  title,
  subtitle,
  userIdentifier,
  lang = "it",
  onClose,
}: ProtectedPageViewerProps) {
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const normalizedUrl = useMemo(() => pageUrl.trim(), [pageUrl]);

  const shieldedSrcDoc = useMemo(() => {
    const safeUrl = normalizedUrl.replace(/"/g, "&quot;");
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    html, body {
      margin: 0; padding: 0; width: 100%; height: 100%;
      overflow: hidden; background: #09090B;
      -webkit-user-select: none; user-select: none;
    }
    iframe {
      width: 100%; height: 100%; border: 0; display: block; background: #ffffff;
    }
  </style>
  <script>
    document.addEventListener("contextmenu", function(e) { e.preventDefault(); });
  </script>
</head>
<body>
  <iframe src="${safeUrl}" allow="clipboard-write; microphone; camera; fullscreen" referrerpolicy="no-referrer"></iframe>
</body>
</html>`;
  }, [normalizedUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c", "k"].includes(key)) ||
        (e.ctrlKey && ["u", "s", "p"].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        setSecurityWarning(
          lang === "it"
            ? "Azione bloccata: contenuto protetto."
            : "Ação bloqueada: conteúdo protegido."
        );
        setTimeout(() => setSecurityWarning(null), 3000);
        return false;
      }
      if (e.key === "Escape" && !document.fullscreenElement) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose, lang]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 bg-[#09090B] flex flex-col select-none"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#121316] border-b border-[#CBD5E1]/30 shrink-0">
        <div className="flex items-center gap-3 truncate pr-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#09090B] border border-[#CBD5E1]/40 text-[#CBD5E1] text-[11px] font-semibold shrink-0">
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {lang === "it" ? "Ambiente Protetto" : "Ambiente Blindado"}
            </span>
          </div>
          <div className="truncate">
            <h3 className="text-xs sm:text-sm font-serif font-bold text-white truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] text-[#CBD5E1] truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setReloadKey((k) => k + 1);
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-[#CBD5E1] hover:text-white text-xs cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-[#CBD5E1] hover:text-white text-xs cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-semibold text-xs px-3.5 py-2 rounded-xl cursor-pointer"
          >
            <X className="w-4 h-4" />{" "}
            {lang === "it" ? "Chiudi Pagina" : "Fechar Página"}
          </button>
        </div>
      </div>

      {securityWarning && (
        <div className="bg-red-950/90 border-b border-red-500/40 px-4 py-2 text-center text-xs text-red-200 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
          <span>{securityWarning}</span>
        </div>
      )}

      <div className="relative flex-1 w-full bg-[#09090B] overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-20 bg-[#09090B] flex flex-col items-center justify-center gap-3 text-[#CBD5E1]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        <iframe
          key={reloadKey}
          srcDoc={shieldedSrcDoc}
          onLoad={() => setLoading(false)}
          className="w-full h-full border-0 bg-white"
          title={title}
        />

        {userIdentifier && (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-[0.035] flex flex-wrap items-center justify-around gap-16 p-8">
            {Array.from({ length: 12 }).map((_, idx) => (
              <span
                key={idx}
                className="text-sm font-bold text-black -rotate-12 whitespace-nowrap"
              >
                {userIdentifier}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}