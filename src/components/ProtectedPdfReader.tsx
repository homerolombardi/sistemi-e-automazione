"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
function encodeSecureToken(url: string): string {
  const normalized = url.trim();
  const encodedUri = encodeURIComponent(normalized);
  let hex = "";
  for (let i = 0; i < encodedUri.length; i++) {
    hex += encodedUri.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return hex.split("").reverse().join("");
}
import {
  Lock,
  Bookmark,
  ZoomIn,
  ZoomOut,
  PanelRightClose,
  PanelRightOpen,
  X,
  FileText,
  Plus,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

type Lang = "it" | "pt";

interface ExcerptNote {
  id: string;
  page: number;
  quote: string;
  comment: string;
  createdAt: string;
}

interface PdfDocStudyData {
  lastPage?: number;
  generalNotes?: string;
  excerptNotes?: ExcerptNote[];
}

const PDF_DICT = {
  it: {
    protectedBadge: "Lettura Continua Protetta",
    pageShort: "Pag.",
    stoppedAt: "Segnalibro Pag.",
    hideNotes: "Nascondi Note",
    showNotes: "Mostra Note",
    closeReader: "Chiudi Lettore",
    tabGeneral: "Note Generali",
    tabExcerpts: "Note di Passaggi",
    generalTitle: "Quaderno di Note Generali",
    saveBtn: "Salva",
    savedBtn: "Salvato!",
    generalPlaceholder: "Scrivi qui i tuoi appunti generali sul documento...",
    newExcerptBtn: "+ Aggiungi Nota a Pag.",
    quotePlaceholder: "Passaggio o riferimento...",
    commentPlaceholder: "La tua annotazione su questo punto...",
    addBtn: "Salva Nota",
    cancelBtn: "Annulla",
    emptyExcerpts: "Nessuna nota di passaggio registrata.",
    loadingPdf: "Caricamento del documento protetto...",
    errorPdf:
      "Impossibile renderizzare in modalità canvas. Apertura visualizzatore protetto...",
  },
  pt: {
    protectedBadge: "Leitura Contínua Protegida",
    pageShort: "Pág.",
    stoppedAt: "Parou na Pág.",
    hideNotes: "Ocultar Notas",
    showNotes: "Mostrar Notas",
    closeReader: "Fechar Leitor",
    tabGeneral: "Anotações Gerais",
    tabExcerpts: "Notas de Trechos",
    generalTitle: "Caderno de Anotações Gerais",
    saveBtn: "Salvar",
    savedBtn: "Salvo!",
    generalPlaceholder: "Digite aqui suas anotações gerais sobre o material...",
    newExcerptBtn: "+ Nova Nota na Pág.",
    quotePlaceholder: "Trecho ou referência...",
    commentPlaceholder: "Sua observação sobre este trecho...",
    addBtn: "Salvar Nota",
    cancelBtn: "Cancelar",
    emptyExcerpts: "Nenhuma nota de trecho cadastrada ainda.",
    loadingPdf: "Carregando documento protegido...",
    errorPdf: "Modo de compatibilidade ativado para visualização segura...",
  },
};

interface ProtectedPdfReaderProps {
  pdfUrl: string;
  title: string;
  profileId?: string;
  studyData?: Record<string, PdfDocStudyData>;
  lang?: Lang;
  onClose: () => void;
}

export default function ProtectedPdfReader({
  pdfUrl,
  title,
  profileId,
  studyData,
  lang = "it",
  onClose,
}: ProtectedPdfReaderProps) {
  const t = PDF_DICT[lang];
  const docKey = encodeURIComponent(pdfUrl.trim());

  const initialDocData: PdfDocStudyData = studyData?.[docKey] || {};

  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(
    initialDocData.lastPage || 1
  );
  const [savedPage, setSavedPage] = useState<number>(
    initialDocData.lastPage || 1
  );
  const [zoom, setZoom] = useState<number>(1.25);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"general" | "excerpts">("general");

  const [generalNotes, setGeneralNotes] = useState<string>(
    initialDocData.generalNotes || ""
  );
  const [excerptNotes, setExcerptNotes] = useState<ExcerptNote[]>(
    initialDocData.excerptNotes || []
  );

  const [isAddingExcerpt, setIsAddingExcerpt] = useState(false);
  const [excerptQuote, setExcerptQuote] = useState("");
  const [excerptComment, setExcerptComment] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const [loading, setLoading] = useState(true);
  const [fallbackIframe, setFallbackIframe] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const pageWrapperRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Carrega dados salvos localmente caso seja visitante ou complementar
  useEffect(() => {
    try {
      const localRaw = localStorage.getItem(`pdf_study_${docKey}`);
      if (localRaw && !studyData?.[docKey]) {
        const parsed = JSON.parse(localRaw) as PdfDocStudyData;
        if (parsed.lastPage) {
          setCurrentPage(parsed.lastPage);
          setSavedPage(parsed.lastPage);
        }
        if (parsed.generalNotes) setGeneralNotes(parsed.generalNotes);
        if (parsed.excerptNotes) setExcerptNotes(parsed.excerptNotes);
      }
    } catch {}
  }, [docKey]);

  const persistStudyData = async (
    nextLastPage: number,
    nextGeneral: string,
    nextExcerpts: ExcerptNote[]
  ) => {
    setSavingStatus(true);
    const payload: PdfDocStudyData = {
      lastPage: nextLastPage,
      generalNotes: nextGeneral,
      excerptNotes: nextExcerpts,
    };

    try {
      localStorage.setItem(`pdf_study_${docKey}`, JSON.stringify(payload));
    } catch {}

    if (profileId) {
      const merged = {
        ...(studyData || {}),
        [docKey]: payload,
      };
      await supabase
        .from("profiles")
        .update({ pdf_study_data: merged })
        .eq("id", profileId);
    }

    setTimeout(() => setSavingStatus(false), 1200);
  };

  // Carrega PDF.js via CDN e renderiza todas as páginas corridas sem quebra
  useEffect(() => {
    let isMounted = true;

    const loadPdfJsAndDocument = async () => {
      setLoading(true);
      setFallbackIframe(false);

      try {
        if (!window.pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Falha ao carregar PDF.js"));
            document.body.appendChild(script);
          });
        }

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const isLocalhost =
          typeof window !== "undefined" &&
          window.location.hostname === "localhost";
        const isSupabaseUrl = pdfUrl.includes("supabase.co");

        const token = encodeSecureToken(pdfUrl);
        const fetchUrl =
          isLocalhost || isSupabaseUrl
            ? pdfUrl
            : `/api/secure-proxy.php?m=pdf&k=${token}`;

        const loadingTask = window.pdfjsLib.getDocument(fetchUrl);
        const pdf = await loadingTask.promise;

        if (!isMounted) return;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);

        // Rola automaticamente para a página onde o usuário parou
        if (savedPage > 1) {
          setTimeout(() => {
            scrollToPage(savedPage);
          }, 400);
        }
      } catch {
        if (!isMounted) return;
        setFallbackIframe(true);
        setLoading(false);
      }
    };

    loadPdfJsAndDocument();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  // Renderiza as páginas no canvas sempre que numPages ou zoom mudar
  useEffect(() => {
    if (!pdfDocRef.current || numPages === 0 || fallbackIframe) return;

    let cancelled = false;

    const renderAllPages = async () => {
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (cancelled) return;
        const page = await pdfDocRef.current.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoom });
        const canvas = canvasRefs.current[pageNum - 1];
        if (!canvas) continue;

        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page
          .render({
            canvasContext: context,
            viewport,
          })
          .promise.catch(() => {});
      }
    };

    renderAllPages();

    return () => {
      cancelled = true;
    };
  }, [numPages, zoom, fallbackIframe]);

  // Detecta qual página está visível durante a rolagem contínua
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || numPages === 0) return;

    const containerTop = container.getBoundingClientRect().top;
    let bestPage = 1;
    let minDistance = Infinity;

    pageWrapperRefs.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.top - containerTop - 60);
      if (dist < minDistance) {
        minDistance = dist;
        bestPage = idx + 1;
      }
    });

    if (bestPage !== currentPage) {
      setCurrentPage(bestPage);
    }
  };

  const scrollToPage = (pageNumber: number) => {
    const targetEl = pageWrapperRefs.current[pageNumber - 1];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(pageNumber);
    }
  };

  const handleBookmarkCurrentPage = () => {
    setSavedPage(currentPage);
    persistStudyData(currentPage, generalNotes, excerptNotes);
  };

  const handleAddExcerptNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excerptComment.trim()) return;

    const newNote: ExcerptNote = {
      id: `${Date.now()}`,
      page: currentPage,
      quote: excerptQuote.trim(),
      comment: excerptComment.trim(),
      createdAt: new Date().toLocaleDateString(lang === "it" ? "it-IT" : "pt-BR"),
    };

    const updated = [newNote, ...excerptNotes];
    setExcerptNotes(updated);
    setExcerptQuote("");
    setExcerptComment("");
    setIsAddingExcerpt(false);
    persistStudyData(savedPage, generalNotes, updated);
  };

  const handleDeleteExcerptNote = (id: string) => {
    const updated = excerptNotes.filter((n) => n.id !== id);
    setExcerptNotes(updated);
    persistStudyData(savedPage, generalNotes, updated);
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 bg-[#09090B] text-[#F8FAFC] flex flex-col select-none"
    >
      {/* BARRA SUPERIOR DO LEITOR DE PDF */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#121316] border-b border-[#CBD5E1]/25 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#09090B] text-[#CBD5E1] border border-[#CBD5E1]/35 shrink-0">
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.protectedBadge}</span>
          </span>

          <h3 className="text-xs sm:text-sm font-serif font-bold text-white truncate">
            {title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!fallbackIframe && numPages > 0 && (
            <>
              <div className="px-3 py-1.5 rounded-full bg-[#09090B] border border-white/15 text-xs text-white font-medium">
                {t.pageShort} {currentPage} / {numPages}
              </div>

              <button
                type="button"
                onClick={handleBookmarkCurrentPage}
                onDoubleClick={() => scrollToPage(savedPage)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-semibold text-xs cursor-pointer transition-colors"
                title="Clique para salvar a página atual"
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                <span>
                  {t.stoppedAt} {savedPage}
                </span>
              </button>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#09090B] border border-white/15 text-xs">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
                  className="p-0.5 text-[#CBD5E1] hover:text-white cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 font-mono text-[11px] text-white">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.25, z + 0.25))}
                  className="p-0.5 text-[#CBD5E1] hover:text-white cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowSidebar(!showSidebar)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#09090B] hover:bg-white/10 text-[#CBD5E1] border border-white/15 text-xs cursor-pointer"
          >
            {showSidebar ? (
              <>
                <PanelRightClose className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t.hideNotes}</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t.showNotes}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              persistStudyData(currentPage, generalNotes, excerptNotes);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-[#CBD5E1] text-white hover:text-[#09090B] font-semibold text-xs transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> {t.closeReader}
          </button>
        </div>
      </div>

      {/* CORPO PRINCIPAL: LEITURA CONTÍNUA + CADERNO DE NOTAS */}
      <div className="flex-1 flex overflow-hidden">
        {/* ÁREA DE PÁGINAS CORRIDAS SEM QUEBRA */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-[#09090B] flex flex-col items-center"
        >
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-[#CBD5E1]">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs uppercase tracking-widest">
                {t.loadingPdf}
              </span>
            </div>
          )}

          {!loading && !fallbackIframe && (
            <div className="w-full flex flex-col items-center divide-y-0">
              {Array.from({ length: numPages }).map((_, index) => (
                <div
                  key={index}
                  ref={(el) => {
                    pageWrapperRefs.current[index] = el;
                  }}
                  className="flex justify-center w-full m-0 p-0 leading-none"
                >
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[index] = el;
                    }}
                    className="block max-w-full h-auto m-0 p-0 shadow-2xl"
                  />
                </div>
              ))}
            </div>
          )}

          {!loading && fallbackIframe && (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full border-0 bg-white"
              title={title}
            />
          )}
        </div>

        {/* BARRA LATERAL DE ANOTAÇÕES */}
        {showSidebar && (
          <aside className="w-full sm:w-80 md:w-96 bg-[#121316] border-l border-[#CBD5E1]/20 flex flex-col shrink-0">
            {/* ABAS: ANOTAÇÕES GERAIS | NOTAS DE TRECHOS */}
            <div className="grid grid-cols-2 border-b border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`py-3 px-2 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === "general"
                    ? "border-[#CBD5E1] text-[#CBD5E1] bg-white/5"
                    : "border-transparent text-[#94A3B8] hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t.tabGeneral}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("excerpts")}
                className={`py-3 px-2 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === "excerpts"
                    ? "border-[#CBD5E1] text-[#CBD5E1] bg-white/5"
                    : "border-transparent text-[#94A3B8] hover:text-white"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>
                  {t.tabExcerpts} ({excerptNotes.length})
                </span>
              </button>
            </div>

            {activeTab === "general" ? (
              <div className="flex-1 flex flex-col p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#CBD5E1]">
                    {t.generalTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      persistStudyData(savedPage, generalNotes, excerptNotes)
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-semibold text-xs cursor-pointer"
                  >
                    {savingStatus ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> {t.savedBtn}
                      </>
                    ) : (
                      t.saveBtn
                    )}
                  </button>
                </div>

                <textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder={t.generalPlaceholder}
                  className="flex-1 w-full bg-[#09090B] border border-white/15 focus:border-[#CBD5E1] rounded-xl p-3 text-xs text-white resize-none focus:outline-none select-text"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto">
                {!isAddingExcerpt ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingExcerpt(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {t.newExcerptBtn} {currentPage}
                    </span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleAddExcerptNote}
                    className="p-3 rounded-xl bg-[#09090B] border border-[#CBD5E1]/35 space-y-2.5 text-xs"
                  >
                    <input
                      type="text"
                      placeholder={t.quotePlaceholder}
                      value={excerptQuote}
                      onChange={(e) => setExcerptQuote(e.target.value)}
                      className="w-full bg-[#121316] border border-white/15 rounded-lg p-2 text-white select-text"
                    />
                    <textarea
                      rows={3}
                      required
                      placeholder={t.commentPlaceholder}
                      value={excerptComment}
                      onChange={(e) => setExcerptComment(e.target.value)}
                      className="w-full bg-[#121316] border border-white/15 rounded-lg p-2 text-white select-text"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingExcerpt(false)}
                        className="px-3 py-1.5 rounded-lg text-[#94A3B8] hover:text-white cursor-pointer"
                      >
                        {t.cancelBtn}
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-[#CBD5E1] text-[#09090B] font-semibold cursor-pointer"
                      >
                        {t.addBtn}
                      </button>
                    </div>
                  </form>
                )}

                {excerptNotes.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] text-center py-8">
                    {t.emptyExcerpts}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {excerptNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-[#09090B] border border-white/10 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => scrollToPage(note.page)}
                            className="px-2 py-0.5 rounded bg-[#CBD5E1]/20 text-[#CBD5E1] font-semibold text-[10px] hover:bg-[#CBD5E1] hover:text-[#09090B] cursor-pointer"
                          >
                            {t.pageShort} {note.page}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExcerptNote(note.id)}
                            className="text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {note.quote && (
                          <p className="text-[11px] italic text-[#94A3B8] border-l-2 border-[#CBD5E1]/40 pl-2">
                            "{note.quote}"
                          </p>
                        )}
                        <p className="text-white leading-relaxed">
                          {note.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}