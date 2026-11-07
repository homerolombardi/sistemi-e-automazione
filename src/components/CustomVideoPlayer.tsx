"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  SkipBack,
  SkipForward,
  Repeat,
  ListMusic,
  Sparkles,
} from "lucide-react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const regExp =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export function parseYouTubeUrl(rawUrl: string | null | undefined): {
  videoId: string | null;
  playlistId: string | null;
  customVideoIds: string[];
} {
  if (!rawUrl) {
    return { videoId: null, playlistId: null, customVideoIds: [] };
  }

  const lines = rawUrl
    .split(/[\n,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const ids = lines
    .map((line) => extractYouTubeId(line))
    .filter((id): id is string => Boolean(id));

  const listMatch = rawUrl.match(/[?&]list=([^&#\s]+)/i);
  const playlistId = listMatch ? listMatch[1] : null;

  return {
    videoId: ids[0] || null,
    playlistId,
    customVideoIds: ids,
  };
}

type LoopMode = "off" | "one" | "all";
type Lang = "it" | "pt";

const PLAYER_TEXT = {
  it: {
    exclusivePlayback: "RIPRODUZIONE ESCLUSIVA • IL NOSTRO QUARTIER GENERALE",
    closeLesson: "Chiudi",
    exclusivePlaylist: "Playlist Esclusiva",
    exclusiveVideo: "Contenuto Esclusivo",
    track: "Traccia",
    prev: "Precedente",
    next: "Successiva",
    startNow: "Inizia Ora",
    resumeNow: "Continua Riproduzione",
    loopOff: "Loop: Off",
    loopOne: "Loop: 1",
    loopAll: "Loop: Tutto",
  },
  pt: {
    exclusivePlayback: "REPRODUÇÃO EXCLUSIVA • NOSSO QUARTEL GENERAL",
    closeLesson: "Fechar Aula",
    exclusivePlaylist: "Playlist Exclusiva",
    exclusiveVideo: "Conteúdo Exclusivo",
    track: "Faixa",
    prev: "Anterior",
    next: "Próxima",
    startNow: "Iniciar Agora",
    resumeNow: "Continuar Agora",
    loopOff: "Loop: Off",
    loopOne: "Loop: Faixa",
    loopAll: "Loop: Tudo",
  },
};

interface CustomVideoPlayerProps {
  videoUrl: string;
  title: string;
  subtitle?: string | null;
  coverUrl?: string;
  lang?: Lang;
  onClose: () => void;
}

export default function CustomVideoPlayer({
  videoUrl,
  title,
  subtitle,
  coverUrl,
  lang = "it",
  onClose,
}: CustomVideoPlayerProps) {
  const t = PLAYER_TEXT[lang];
  const { videoId, playlistId, customVideoIds } = parseYouTubeUrl(videoUrl);
  const isYouTube = Boolean(
    videoId || playlistId || customVideoIds.length > 0
  );
  const isPlaylist = Boolean(playlistId || customVideoIds.length > 1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const html5VideoRef = useRef<HTMLVideoElement>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loopMode, setLoopMode] = useState<LoopMode>("off");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [totalTracks, setTotalTracks] = useState(
    customVideoIds.length > 1 ? customVideoIds.length : 1
  );
  const [showTrackMenu, setShowTrackMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const loopModeRef = useRef<LoopMode>(loopMode);
  const currentTrackRef = useRef<number>(currentTrackIndex);
  useEffect(() => {
    loopModeRef.current = loopMode;
  }, [loopMode]);
  useEffect(() => {
    currentTrackRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

  // Inicializa a API IFrame do YouTube sem exibir controles nativos
  useEffect(() => {
    if (!isYouTube) {
      setIsReady(true);
      return;
    }

    let intervalId: any = null;
    let isMounted = true;

    const initPlayer = () => {
      if (!isMounted || !playerContainerRef.current || !window.YT?.Player)
        return;

      const playerVars: any = {
        autoplay: 0,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
        playsinline: 1,
        origin: window.location.origin,
      };

      if (playlistId) {
        playerVars.listType = "playlist";
        playerVars.list = playlistId;
      } else if (customVideoIds.length > 1) {
        playerVars.playlist = customVideoIds.slice(1).join(",");
      }

      ytPlayerRef.current = new window.YT.Player(playerContainerRef.current, {
        width: "100%",
        height: "100%",
        videoId: videoId || customVideoIds[0] || undefined,
        playerVars,
        events: {
          onReady: (event: any) => {
            if (!isMounted) return;
            setIsReady(true);
            const dur = event.target.getDuration?.() || 0;
            if (dur > 0) setDuration(dur);
            const list = event.target.getPlaylist?.();
            if (Array.isArray(list) && list.length > 0) {
              setTotalTracks(list.length);
            }
          },
          onStateChange: (event: any) => {
            if (!isMounted) return;
            const YTState = window.YT.PlayerState;
            if (event.data === YTState.PLAYING) {
              setIsPlaying(true);
              setHasStarted(true);
              const dur = event.target.getDuration?.() || 0;
              if (dur > 0) setDuration(dur);
              const idx = event.target.getPlaylistIndex?.();
              if (typeof idx === "number" && idx >= 0) {
                setCurrentTrackIndex(idx);
              }
              const list = event.target.getPlaylist?.();
              if (Array.isArray(list) && list.length > 0) {
                setTotalTracks(list.length);
              }
            } else if (event.data === YTState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === YTState.ENDED) {
              if (loopModeRef.current === "one") {
                event.target.seekTo(0);
                event.target.playVideo();
              } else if (
                customVideoIds.length > 1 &&
                !playlistId &&
                currentTrackRef.current < customVideoIds.length - 1
              ) {
                const nextIdx = currentTrackRef.current + 1;
                setCurrentTrackIndex(nextIdx);
                event.target.loadVideoById(customVideoIds[nextIdx]);
              } else if (loopModeRef.current === "all") {
                if (playlistId) {
                  event.target.playVideoAt(0);
                } else if (customVideoIds.length > 1) {
                  setCurrentTrackIndex(0);
                  event.target.loadVideoById(customVideoIds[0]);
                } else {
                  event.target.seekTo(0);
                  event.target.playVideo();
                }
              } else {
                setIsPlaying(false);
              }
            }
          },
        },
      });

      intervalId = setInterval(() => {
        const p = ytPlayerRef.current;
        if (p && typeof p.getCurrentTime === "function") {
          const c = p.getCurrentTime() || 0;
          const d = p.getDuration?.() || 0;
          setCurrentTime(c);
          if (d > 0) setDuration(d);
        }
      }, 500);
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const existingScript = document.getElementById("yt-iframe-api");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (ytPlayerRef.current?.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }
    };
  }, [videoUrl]);

  // Bloqueia atalhos de inspeção e botão direito
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          ["I", "i", "J", "j", "C", "c"].includes(e.key)) ||
        (e.ctrlKey && ["u", "U", "s", "S"].includes(e.key))
      ) {
        e.preventDefault();
        return false;
      }
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "Escape" && !document.fullscreenElement) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const togglePlay = () => {
    if (isYouTube && ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo?.();
      } else {
        ytPlayerRef.current.playVideo?.();
      }
    } else if (html5VideoRef.current) {
      if (isPlaying) {
        html5VideoRef.current.pause();
      } else {
        html5VideoRef.current.play();
      }
    }
  };

  const seekBy = (delta: number) => {
    const target = Math.max(
      0,
      Math.min(duration || 99999, currentTime + delta)
    );
    seekTo(target);
  };

  const seekTo = (newTime: number) => {
    setCurrentTime(newTime);
    if (isYouTube && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(newTime, true);
    } else if (html5VideoRef.current) {
      html5VideoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    setIsMuted(val === 0);
    if (isYouTube && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume?.(val);
      if (val === 0) ytPlayerRef.current.mute?.();
      else ytPlayerRef.current.unMute?.();
    } else if (html5VideoRef.current) {
      html5VideoRef.current.volume = val / 100;
      html5VideoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(volume > 0 ? volume : 80);
    } else {
      handleVolumeChange(0);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    if (isYouTube && ytPlayerRef.current?.setPlaybackRate) {
      ytPlayerRef.current.setPlaybackRate(next);
    } else if (html5VideoRef.current) {
      html5VideoRef.current.playbackRate = next;
    }
  };

  const cycleLoopMode = () => {
    const order: LoopMode[] = ["off", "one", "all"];
    const next = order[(order.indexOf(loopMode) + 1) % order.length];
    setLoopMode(next);
    if (isYouTube && ytPlayerRef.current?.setLoop) {
      ytPlayerRef.current.setLoop(next === "all");
    } else if (html5VideoRef.current) {
      html5VideoRef.current.loop = next === "one" || next === "all";
    }
  };

  const playTrackAt = (index: number) => {
    if (index < 0 || index >= totalTracks) return;
    setCurrentTrackIndex(index);
    setShowTrackMenu(false);
    if (isYouTube && ytPlayerRef.current) {
      if (playlistId && ytPlayerRef.current.playVideoAt) {
        ytPlayerRef.current.playVideoAt(index);
      } else if (customVideoIds[index]) {
        ytPlayerRef.current.loadVideoById(customVideoIds[index]);
      }
    }
  };

  const handlePrevTrack = () => {
    if (currentTrackIndex > 0) {
      playTrackAt(currentTrackIndex - 1);
    } else if (isYouTube && ytPlayerRef.current?.previousVideo && playlistId) {
      ytPlayerRef.current.previousVideo();
    } else {
      seekTo(0);
    }
  };

  const handleNextTrack = () => {
    if (currentTrackIndex < totalTracks - 1) {
      playTrackAt(currentTrackIndex + 1);
    } else if (isYouTube && ytPlayerRef.current?.nextVideo && playlistId) {
      ytPlayerRef.current.nextVideo();
    }
  };

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      await wrapperRef.current.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 select-none"
    >
      <div
        ref={wrapperRef}
        className="relative w-full max-w-6xl bg-[#09090B] border border-[#CBD5E1]/35 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between aspect-video max-h-[92vh]"
      >
        {/* CAMADA DE VÍDEO 100% INTEGRAL (EXIBE TODA A ÁREA DO VÍDEO E LEGENDAS) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          {isYouTube ? (
            <div className="w-full h-full">
              <div ref={playerContainerRef} className="w-full h-full" />
            </div>
          ) : (
            <video
              ref={html5VideoRef}
              src={videoUrl}
              playsInline
              onPlay={() => {
                setIsPlaying(true);
                setHasStarted(true);
              }}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) =>
                setCurrentTime(e.currentTarget.currentTime || 0)
              }
              onLoadedMetadata={(e) =>
                setDuration(e.currentTarget.duration || 0)
              }
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* ESCUDO TRANSPARENTE SOBRE O VÍDEO (PERMITE CLICAR PARA PAUSAR MAS OCULTA YOUTUBE) */}
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-10 cursor-pointer"
        />

        {/* BARRA SUPERIOR FIXA */}
        <div className="relative z-30 flex items-center justify-between px-5 sm:px-7 py-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1] shrink-0 shadow-[0_0_8px_#CBD5E1]" />
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-serif font-bold text-white truncate">
                  {title}
                </h3>
                {isPlaylist && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#121316] text-[#CBD5E1] border border-[#CBD5E1]/35">
                    {t.track} {currentTrackIndex + 1}
                  </span>
                )}
              </div>
              <p className="text-[10px] tracking-[0.18em] text-[#CBD5E1] uppercase mt-0.5">
                {t.exclusivePlayback}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#121316]/90 hover:bg-[#CBD5E1] text-white hover:text-[#09090B] border border-white/15 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" /> {t.closeLesson}
          </button>
        </div>

        {/* CORTINA PROTETORA QUANDO PAUSADO OU ANTES DE INICIAR (OCULTA SUGESTÕES DO YOUTUBE) */}
        {!isPlaying && (
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 py-4 bg-[#09090B]/95 backdrop-blur-md text-center animate-in fade-in duration-200">
            {coverUrl && (
              <img
                src={coverUrl}
                alt={title}
                className="w-28 sm:w-36 md:w-40 aspect-[2/3] object-cover rounded-2xl border border-[#CBD5E1]/35 shadow-2xl mb-4"
              />
            )}

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-[#121316] text-[#CBD5E1] border border-[#CBD5E1]/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              {isPlaylist
                ? `${t.exclusivePlaylist} • ${t.track} ${currentTrackIndex + 1}`
                : t.exclusiveVideo}
            </span>

            <h2 className="text-xl sm:text-3xl font-serif font-bold text-white max-w-2xl leading-snug">
              {title}
            </h2>

            {subtitle && (
              <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1.5 max-w-xl">
                {subtitle}
              </p>
            )}

            <div className="flex items-center gap-3 mt-6">
              {isPlaylist && (
                <button
                  type="button"
                  onClick={handlePrevTrack}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#121316] hover:bg-white/10 text-white border border-white/15 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <SkipBack className="w-4 h-4" /> {t.prev}
                </button>
              )}

              <button
                type="button"
                onClick={togglePlay}
                disabled={!isReady}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] font-bold text-sm shadow-lg shadow-white/10 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                {hasStarted ? t.resumeNow : t.startNow}
              </button>

              {isPlaylist && (
                <button
                  type="button"
                  onClick={handleNextTrack}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#121316] hover:bg-white/10 text-white border border-white/15 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t.next} <SkipForward className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* BARRA INFERIOR DE CONTROLES */}
        <div className="relative z-30 px-5 sm:px-7 pb-4 pt-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-3">
          {/* SLIDER DE PROGRESSO */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-[#CBD5E1]">
            <span className="w-11 text-left">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#CBD5E1]"
            />
            <span className="w-11 text-right">{formatTime(duration)}</span>
          </div>

          {/* BOTÕES DE CONTROLE */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isPlaylist && (
                <button
                  type="button"
                  onClick={handlePrevTrack}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#121316] hover:bg-white/10 text-white border border-white/10 text-xs font-medium cursor-pointer"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.prev}</span>
                </button>
              )}

              <button
                type="button"
                onClick={togglePlay}
                className="p-2.5 rounded-xl bg-[#CBD5E1] hover:bg-[#F1F5F9] text-[#09090B] cursor-pointer shadow-md"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>

              {isPlaylist && (
                <button
                  type="button"
                  onClick={handleNextTrack}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#121316] hover:bg-white/10 text-white border border-white/10 text-xs font-medium cursor-pointer"
                >
                  <span className="hidden sm:inline">{t.next}</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => seekBy(-10)}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#121316] hover:bg-white/10 text-white border border-white/10 text-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#CBD5E1]" /> -10s
              </button>

              <button
                type="button"
                onClick={() => seekBy(10)}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#121316] hover:bg-white/10 text-white border border-white/10 text-xs cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#CBD5E1]" /> +10s
              </button>

              <div className="hidden md:flex items-center gap-2 ml-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="text-[#CBD5E1] hover:text-white cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#CBD5E1]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 relative">
              <button
                type="button"
                onClick={cycleLoopMode}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs cursor-pointer ${
                  loopMode !== "off"
                    ? "bg-[#CBD5E1] text-[#09090B] border-[#CBD5E1] font-semibold"
                    : "bg-[#121316] text-[#CBD5E1] border-white/10 hover:text-white"
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>
                  {loopMode === "off"
                    ? t.loopOff
                    : loopMode === "one"
                    ? t.loopOne
                    : t.loopAll}
                </span>
              </button>

              {isPlaylist && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTrackMenu(!showTrackMenu)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#121316] hover:bg-white/10 text-[#CBD5E1] border border-white/10 text-xs cursor-pointer"
                  >
                    <ListMusic className="w-3.5 h-3.5" />
                    <span>
                      {t.track} {currentTrackIndex + 1}
                    </span>
                  </button>

                  {showTrackMenu && (
                    <div className="absolute bottom-12 right-0 w-44 max-h-48 overflow-y-auto bg-[#121316] border border-[#CBD5E1]/35 rounded-xl p-1.5 shadow-2xl z-50">
                      {Array.from({ length: totalTracks }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => playTrackAt(i)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs cursor-pointer ${
                            i === currentTrackIndex
                              ? "bg-[#CBD5E1] text-[#09090B] font-bold"
                              : "text-[#CBD5E1] hover:bg-white/10"
                          }`}
                        >
                          {t.track} {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={cyclePlaybackRate}
                className="px-3 py-2 rounded-xl bg-[#121316] hover:bg-white/10 text-[#CBD5E1] border border-white/10 text-xs font-semibold cursor-pointer"
              >
                {playbackRate}x
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-[#121316] hover:bg-white/10 text-[#CBD5E1] border border-white/10 cursor-pointer"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}