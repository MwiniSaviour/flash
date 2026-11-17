import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Station } from "~/lib/types";

import { flagshipStation, stations as stationFixtures } from "~/data/stations";

/**
 * Live audio.
 *
 * A station's stream is never hard-coded: it comes from the CMS document (or, in
 * the offline seed, from the fixture) and the URL is only contacted once the
 * listener taps play. With no stream configured the player still toggles and
 * reports the state through an aria-live region — same contract as the web app,
 * so a licensing question can never produce a silent, unexplained button.
 */
interface PlayerState {
  station: Station;
  isPlaying: boolean;
  /** Human-readable status for the aria-live region under the hero. */
  status: string;
  toggle: (station?: Station) => void;
  play: (station?: Station) => void;
  pause: () => void;
  /** 0..1 pseudo-levels used by the waveform animation while playing. */
  levels: number[];
}

const PlayerContext = createContext<PlayerState | null>(null);

const STREAM_URL = (import.meta.env.VITE_STREAM_URL ?? "").trim();

const BARS = 26;
// A fixed, deterministic bar pattern keeps the waveform identical across renders
// (no random hydration mismatch) while still reading as live audio.
const BASE_LEVELS = Array.from({ length: BARS }, (_, index) => {
  const wave = Math.sin(index * 0.85) * 0.5 + Math.cos(index * 0.42) * 0.35;
  const envelope = Math.sin((index / (BARS - 1)) * Math.PI) * 0.55 + 0.45;
  return Math.min(1, Math.max(0.18, Math.abs(wave) * envelope + 0.2));
});

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [station, setStation] = useState<Station>(flagshipStation);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState("");

  const streamFor = useCallback((target: Station) => {
    if (target.streamUrl) return target.streamUrl;
    if (target.flagship && STREAM_URL) return STREAM_URL;
    return "";
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setStatus("Playback paused");
  }, []);

  const play = useCallback(
    (target?: Station) => {
      const next = target ?? station;
      setStation(next);

      if (!next.streamUrl && !(next.flagship && STREAM_URL)) {
        setIsPlaying(false);
        setStatus(
          `Live stream for ${next.name} is not configured yet. Configure it in the CMS to start playback.`,
        );
        return;
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = "none";
      }
      const audio = audioRef.current;
      const url = streamFor(next);
      if (audio.src !== url) audio.src = url;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setStatus(`Playing ${next.name} live`);
        })
        .catch(() => {
          setIsPlaying(false);
          setStatus(`Could not start ${next.name}. Check your connection and try again.`);
        });
    },
    [station, streamFor],
  );

  const toggle = useCallback(
    (target?: Station) => {
      const next = target ?? station;
      const switching = target !== undefined && target.id !== station.id;
      if (!switching && isPlaying) {
        pause();
        return;
      }
      play(next);
    },
    [isPlaying, pause, play, station],
  );

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // The design boots into the flagship station, but offline the fixtures should
  // still show the CMS's station order if it differs.
  useEffect(() => {
    const flagship = stationFixtures.find((item) => item.flagship);
    if (flagship) setStation((current) => (current.id === flagship.id ? current : flagship));
  }, []);

  const levels = useMemo(() => BASE_LEVELS, []);

  const value = useMemo<PlayerState>(
    () => ({ station, isPlaying, status, toggle, play, pause, levels }),
    [isPlaying, levels, pause, play, station, status, toggle],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerState {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return context;
}
