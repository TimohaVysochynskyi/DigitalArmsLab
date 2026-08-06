import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import css from "./AudioPlayer.module.css";

/* Риски мають фіксовану ширину — при зміні ширини компонента змінюється їхня кількість. */
const BAR_WIDTH = 2;
const BAR_GAP = 3;
const BAR_MIN_HEIGHT = 4;
const BAR_MAX_HEIGHT = 28;

/** Демо-тривалість (сек), поки немає реального файлу. */
const DEMO_DURATION = 30;

const SEEK_STEP = 0.05;

/** Детермінований шум: висота риски не стрибає при ресайзі. */
const noise = (index: number) => {
  const value = Math.sin((index + 1) * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const barHeight = (index: number) => {
  const envelope = 0.55 + 0.45 * Math.sin(index * 0.35);
  const amplitude = 0.25 + 0.75 * noise(index) * envelope;
  return Math.round(BAR_MIN_HEIGHT + (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT) * amplitude);
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

type AudioPlayerProps = {
  /** Джерело аудіо. Поки його немає — плеєр програє демо-таймлайн. */
  src?: string;
  className?: string;
  onPlayChange?: (isPlaying: boolean) => void;
};

const AudioPlayer = ({ src, className, onPlayChange }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [barCount, setBarCount] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  const applyProgress = useCallback((value: number) => {
    progressRef.current = value;
    setProgress(value);
  }, []);

  const changePlaying = useCallback(
    (next: boolean) => {
      setIsPlaying(next);
      onPlayChange?.(next);
    },
    [onPlayChange],
  );

  useLayoutEffect(() => {
    const node = waveRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setBarCount(Math.max(0, Math.floor((width + BAR_GAP) / (BAR_WIDTH + BAR_GAP))));
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () =>
      applyProgress(audio.duration ? clamp01(audio.currentTime / audio.duration) : 0);
    const handleEnded = () => {
      applyProgress(0);
      changePlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src, applyProgress, changePlaying]);

  useEffect(() => {
    if (src || !isPlaying) return;

    let frame = 0;
    let prev = performance.now();

    const tick = (now: number) => {
      const next = progressRef.current + (now - prev) / 1000 / DEMO_DURATION;
      prev = now;

      if (next >= 1) {
        applyProgress(0);
        changePlaying(false);
        return;
      }

      applyProgress(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [src, isPlaying, applyProgress, changePlaying]);

  const togglePlay = () => {
    const next = !isPlaying;
    changePlaying(next);

    const audio = audioRef.current;
    if (!audio) return;
    if (next) void audio.play();
    else audio.pause();
  };

  const seekTo = (ratio: number) => {
    const value = clamp01(ratio);
    applyProgress(value);

    const audio = audioRef.current;
    if (audio?.duration) audio.currentTime = value * audio.duration;
  };

  const handleWaveClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    if (width) seekTo((event.clientX - left) / width);
  };

  const handleWaveKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") seekTo(progress + SEEK_STEP);
    else if (event.key === "ArrowLeft") seekTo(progress - SEEK_STEP);
    else return;

    event.preventDefault();
  };

  return (
    <>
      <div className={`${css.player} ${className ?? ""}`}>
        {src && <audio ref={audioRef} src={src} preload="metadata" />}

        <button
          type="button"
          className={css.button}
          onClick={togglePlay}
          aria-label={isPlaying ? "Пауза" : "Відтворити"}
          aria-pressed={isPlaying}
        >
          {isPlaying ? (
            <svg className={css.icon} viewBox="0 0 27 27" aria-hidden="true">
              <path d="M10.2116 18.75H11.7116V8.25H10.2116V18.75ZM15.2884 18.75H16.7884V8.25H15.2884V18.75ZM13.5049 27C11.6381 27 9.883 26.6458 8.2395 25.9373C6.59625 25.2288 5.16675 24.2673 3.951 23.0527C2.73525 21.8382 1.77287 20.41 1.06387 18.768C0.354625 17.1262 0 15.3719 0 13.5049C0 11.6381 0.35425 9.883 1.06275 8.2395C1.77125 6.59625 2.73275 5.16675 3.94725 3.951C5.16175 2.73525 6.59 1.77287 8.232 1.06387C9.87375 0.354625 11.6281 0 13.4951 0C15.3619 0 17.117 0.354251 18.7605 1.06275C20.4038 1.77125 21.8333 2.73275 23.049 3.94725C24.2647 5.16175 25.2271 6.59 25.9361 8.232C26.6454 9.87375 27 11.6281 27 13.4951C27 15.3619 26.6458 17.117 25.9373 18.7605C25.2288 20.4037 24.2673 21.8333 23.0527 23.049C21.8382 24.2647 20.41 25.2271 18.768 25.9361C17.1262 26.6454 15.3719 27 13.5049 27Z" />
            </svg>
          ) : (
            <svg className={css.icon} viewBox="0 0 27 27" aria-hidden="true">
              <path d="M8.82675 18.0866H10.3267V8.91338H8.82675V18.0866ZM13.6733 18.0866L20.5673 13.5L13.6733 8.91338V18.0866ZM13.5049 27C11.6381 27 9.883 26.6458 8.2395 25.9373C6.59625 25.2288 5.16675 24.2673 3.951 23.0527C2.73525 21.8382 1.77287 20.41 1.06387 18.768C0.354625 17.1262 0 15.3719 0 13.5049C0 11.6381 0.35425 9.883 1.06275 8.2395C1.77125 6.59625 2.73275 5.16675 3.94725 3.951C5.16175 2.73525 6.59 1.77287 8.232 1.06387C9.87375 0.354625 11.6281 0 13.4951 0C15.3619 0 17.117 0.354251 18.7605 1.06275C20.4038 1.77125 21.8333 2.73275 23.049 3.94725C24.2647 5.16175 25.2271 6.59 25.9361 8.232C26.6454 9.87375 27 11.6281 27 13.4951C27 15.3619 26.6458 17.117 25.9373 18.7605C25.2288 20.4037 24.2673 21.8333 23.0527 23.049C21.8382 24.2647 20.41 25.2271 18.768 25.9361C17.1262 26.6454 15.3719 27 13.5049 27Z" />
            </svg>
          )}
        </button>

        <div
          ref={waveRef}
          className={css.wave}
          style={{ height: BAR_MAX_HEIGHT, gap: BAR_GAP }}
          onClick={handleWaveClick}
          onKeyDown={handleWaveKeyDown}
          role="slider"
          tabIndex={0}
          aria-label="Позиція відтворення"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          {Array.from({ length: barCount }, (_, index) => {
            const isPlayed = (index + 0.5) / barCount <= progress;

            return (
              <span
                key={index}
                className={`${css.bar} ${isPlayed ? css.barPlayed : ""}`}
                style={{ width: BAR_WIDTH, height: barHeight(index) }}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

export default AudioPlayer;
