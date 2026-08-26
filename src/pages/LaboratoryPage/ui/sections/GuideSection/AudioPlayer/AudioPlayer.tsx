import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { loadWaveform, resampleWaveform } from "./waveform";
import css from "./AudioPlayer.module.css";

/* Риски мають фіксовану ширину — при зміні ширини компонента змінюється їхня кількість. */
const BAR_WIDTH = 2;
const BAR_GAP = 3;
const BAR_MIN_HEIGHT = 4;
const BAR_MAX_HEIGHT = 28;

/** Хвиля перетікає в нову форму зі зсувом по індексу — виходить пробіг зліва направо. */
const MORPH_STAGGER = 4;
const MORPH_STAGGER_CAP = 240;

const SEEK_STEP = 0.05;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const barHeight = (level: number) =>
  Math.round(BAR_MIN_HEIGHT + clamp01(level) * (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT));

type AudioPlayerProps = {
  /** Джерело аудіо. Немає — плеєр показується неактивним. */
  src?: string;
  className?: string;
  onPlayChange?: (isPlaying: boolean) => void;
};

const AudioPlayer = ({ src, className, onPlayChange }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [barCount, setBarCount] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);

  const isDisabled = !src;

  const onPlayChangeRef = useRef(onPlayChange);
  onPlayChangeRef.current = onPlayChange;

  const changePlaying = useCallback((next: boolean) => {
    setIsPlaying(next);
    onPlayChangeRef.current?.(next);
  }, []);

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

  // Профіль гучності нової доріжки. Старий лишається на екрані, доки не приїде новий.
  useEffect(() => {
    if (!src) {
      setPeaks([]);
      return;
    }

    let isCurrent = true;
    void loadWaveform(src).then((loaded) => {
      if (isCurrent) setPeaks(loaded);
    });

    return () => {
      isCurrent = false;
    };
  }, [src]);

  /* Нова зброя — доріжка з початку і на паузі. Клінап зупиняє попередній елемент:
     без нього відʼєднаний <audio> (перехід на дрона) продовжував би грати. */
  useEffect(() => {
    const audio = audioRef.current;

    setProgress(0);
    changePlaying(false);
    if (audio) audio.currentTime = 0;

    return () => audio?.pause();
  }, [src, changePlaying]);

  /* Прогрес знімаємо покадрово, а не з timeupdate: той спрацьовує 4 рази на секунду
     і риски перемикались би ривками. */
  useEffect(() => {
    if (!isPlaying) return;

    let frame = 0;
    const tick = () => {
      const audio = audioRef.current;
      if (audio?.duration) setProgress(clamp01(audio.currentTime / audio.duration));

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  const levels = useMemo(
    () => resampleWaveform(peaks, barCount),
    [peaks, barCount],
  );

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      changePlaying(false);
      return;
    }

    void audio.play().then(
      () => changePlaying(true),
      () => changePlaying(false),
    );
  };

  const seekTo = (ratio: number) => {
    const value = clamp01(ratio);
    setProgress(value);

    const audio = audioRef.current;
    if (audio?.duration) audio.currentTime = value * audio.duration;
  };

  const handleWaveClick = (event: MouseEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    const { left, width } = event.currentTarget.getBoundingClientRect();
    if (width) seekTo((event.clientX - left) / width);
  };

  const handleWaveKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    if (event.key === "ArrowRight") seekTo(progress + SEEK_STEP);
    else if (event.key === "ArrowLeft") seekTo(progress - SEEK_STEP);
    else return;

    event.preventDefault();
  };

  return (
    <>
      <div
        className={`${css.player} ${isDisabled ? css.playerDisabled : ""} ${className ?? ""}`}
      >
        {src && (
          <audio
            ref={audioRef}
            src={src}
            preload="metadata"
            onEnded={() => {
              setProgress(0);
              changePlaying(false);
            }}
          />
        )}

        <button
          type="button"
          className={css.button}
          onClick={togglePlay}
          disabled={isDisabled}
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
          tabIndex={isDisabled ? -1 : 0}
          aria-label="Позиція відтворення"
          aria-disabled={isDisabled}
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
                style={{
                  width: BAR_WIDTH,
                  height: barHeight(levels[index] ?? 0),
                  transitionDelay: `${Math.min(index * MORPH_STAGGER, MORPH_STAGGER_CAP)}ms`,
                }}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

export default AudioPlayer;
