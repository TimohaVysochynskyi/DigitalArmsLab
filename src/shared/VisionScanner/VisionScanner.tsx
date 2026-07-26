/* Декоративний фоновий ефект «комп'ютерного зору»: за рухом курсора з'являються
   рамки-детекції з підписами та приціл-перехрестя. Рендериться абсолютним canvas-шаром
   ПОЗАДУ контенту секції (pointer-events: none), тож кліки/скрол не перехоплює.

   Використання — покласти першим елементом секції:
     <section className={css.sectionWrapper}>   // position: relative
       <VisionScanner />
       <div className={css.content}>...</div>    // position: relative; z-index: 1
     </section>

   Особливості:
   - Canvas виходить за межі секції на `overflow` px (типово = radius) ЛИШЕ згори/знизу,
     щоб ефект на верхньому/нижньому бордері не обрізався (по X не розширюємо — інакше
     зʼявляється горизонтальний скрол). Зона активності при цьому — рівно секція: коли
     курсор виходить за її межі, ефект перестає слідувати за мишкою.
   - Працює і під час скролу без руху миші: за останніми координатами курсора
     перераховуємо позицію відносно секції.
   - forceSpawn (типово): детекції з'являються біля курсора без зображення.
     variance: якщо передати `image` і forceSpawn={false} — детекції виникають там, де у
     зображенні висока варіація яскравості.

   Уся анімаційна логіка живе в closure/ref, а не в React-стані — компонент не ре-рендериться
   на кадрах. */

import { useEffect, useRef } from "react";
import css from "./VisionScanner.module.css";

type ScannerStyle = "brackets" | "rect" | "target";
type GradientMapping = "lifetime" | "spatialY" | "confidence";
type GradientStop = { offset: number; color: string }; // offset у діапазоні 0..1

type VisionScannerProps = {
  /** Джерело для режиму variance-скану. Без нього працює forceSpawn. */
  image?: string;
  /** Радіус зони сканування навколо курсора, px. */
  radius?: number;
  /** 0..100. У forceSpawn — імовірність спавну; у variance — поріг чутливості. */
  sensitivity?: number;
  /** true — спавн біля курсора без аналізу зображення. */
  forceSpawn?: boolean;
  /** Час згасання детекції, сек. */
  persistence?: number;
  /** Форма рамки детекції. */
  style?: ScannerStyle;
  /** 0..1 — деталізація підписів (ID / CONF / TYPE, підписи курсора). */
  complexity?: number;
  /** Градієнт кольору детекцій (стопи з offset 0..1). */
  gradient?: GradientStop[];
  /** Чим керується колір: часом життя, координатою Y чи впевненістю. */
  gradientMapping?: GradientMapping;
  /** На скільки px canvas виходить за межі секції згори/знизу, щоб не обрізатися. Типово = radius. */
  overflow?: number;
  className?: string;
};

type ScannerConfig = Required<
  Omit<VisionScannerProps, "image" | "className" | "overflow">
> & { overflow: number | null };

const DEFAULT_GRADIENT: GradientStop[] = [{ offset: 1, color: "#D3D3D3" }];

const DEFAULT_CONFIG: ScannerConfig = {
  radius: 142,
  sensitivity: 69,
  forceSpawn: true,
  persistence: 0.7,
  style: "brackets",
  complexity: 0.3,
  gradient: DEFAULT_GRADIENT,
  gradientMapping: "lifetime",
  overflow: null,
};

const DETECTION_CLASSES = ["OBJECT", "FEATURE", "NODE", "SIGNAL", "PATTERN"];
const SCAN_INTERVAL_MS = 60;
const MIN_SPAWN_DISTANCE = 30;

type Rgb = { r: number; g: number; b: number };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const parseHex = (hex: string): Rgb => {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  const num = parseInt(c, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

const getColorAt = (t: number, stops: GradientStop[]): Rgb => {
  if (stops.length === 0) return { r: 0, g: 255, b: 65 };
  const sorted = [...stops].sort((a, b) => a.offset - b.offset);
  t = clamp01(t);
  let lower = sorted[0];
  let upper = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (t >= sorted[i].offset && t <= sorted[i + 1].offset) {
      lower = sorted[i];
      upper = sorted[i + 1];
      break;
    }
  }
  if (lower === upper) return parseHex(lower.color);
  const range = upper.offset - lower.offset;
  const f = range === 0 ? 0 : (t - lower.offset) / range;
  const c1 = parseHex(lower.color);
  const c2 = parseHex(upper.color);
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * f),
    g: Math.round(c1.g + (c2.g - c1.g) * f),
    b: Math.round(c1.b + (c2.b - c1.b) * f),
  };
};

const rgba = (c: Rgb, a: number) => `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;

const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
) => {
  if (!img.width || !img.height) return;
  const ar = img.width / img.height;
  const car = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (ar > car) {
    sw = img.height * car;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / car;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
};

class Detection {
  x: number;
  y: number;
  size: number;
  targetSize: number;
  confidence: number;
  id: string;
  klass: string;
  life = 1;

  constructor(x: number, y: number, size: number, confidence: number) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.targetSize = size;
    this.confidence = confidence;
    this.id = Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .toUpperCase()
      .padStart(6, "0");
    this.klass = DETECTION_CLASSES[Math.floor(Math.random() * DETECTION_CLASSES.length)];
  }

  update(dt: number, persistence: number) {
    this.life -= dt / persistence;
    this.size += (this.targetSize - this.size) * 0.2;
    return this.life > 0;
  }

  draw(ctx: CanvasRenderingContext2D, cfg: ScannerConfig, height: number) {
    const alpha = Math.min(1, this.life * 2);

    let t = 0.5;
    if (cfg.gradientMapping === "spatialY") t = this.y / height;
    else if (cfg.gradientMapping === "confidence") t = this.confidence;
    else if (cfg.gradientMapping === "lifetime") t = this.life;

    const rgb = getColorAt(t, cfg.gradient);
    ctx.strokeStyle = rgba(rgb, 0.8 * alpha);
    ctx.lineWidth = 1;

    const s = this.size / 2;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (cfg.style === "rect") {
      ctx.strokeRect(-s, -s, this.size, this.size);
    } else if (cfg.style === "brackets") {
      const len = this.size * 0.2;
      ctx.beginPath();
      ctx.moveTo(-s + len, -s);
      ctx.lineTo(-s, -s);
      ctx.lineTo(-s, -s + len);
      ctx.moveTo(s - len, -s);
      ctx.lineTo(s, -s);
      ctx.lineTo(s, -s + len);
      ctx.moveTo(-s + len, s);
      ctx.lineTo(-s, s);
      ctx.lineTo(-s, s - len);
      ctx.moveTo(s - len, s);
      ctx.lineTo(s, s);
      ctx.lineTo(s, s - len);
      ctx.stroke();
    } else if (cfg.style === "target") {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 1.2, 0);
      ctx.lineTo(s * 1.2, 0);
      ctx.moveTo(0, -s * 1.2);
      ctx.lineTo(0, s * 1.2);
      ctx.stroke();
    }

    if (cfg.complexity > 0.2) {
      ctx.fillStyle = rgba(rgb, 0.9 * alpha);
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      const labelY = -s - 5;
      ctx.fillText(`ID: 0x${this.id}`, -s, labelY);
      if (cfg.complexity > 0.6) {
        ctx.fillText(`CONF: ${this.confidence.toFixed(2)}`, -s, labelY - 12);
        ctx.fillText(`TYPE: ${this.klass}`, -s, s + 12);
      }
    }

    ctx.restore();
  }
}

const drawCursor = (
  ctx: CanvasRenderingContext2D,
  cfg: ScannerConfig,
  mouse: { x: number; y: number },
  height: number,
) => {
  const color = rgba(getColorAt(mouse.y / height, cfg.gradient), 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([4, 4]);

  ctx.beginPath();
  ctx.moveTo(mouse.x - cfg.radius, mouse.y);
  ctx.lineTo(mouse.x + cfg.radius, mouse.y);
  ctx.moveTo(mouse.x, mouse.y - cfg.radius);
  ctx.lineTo(mouse.x, mouse.y + cfg.radius);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, cfg.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (cfg.complexity > 0.4) {
    ctx.fillStyle = color;
    ctx.font = "9px monospace";
    ctx.fillText(`SCAN_RAD: ${cfg.radius}px`, mouse.x + 5, mouse.y - cfg.radius - 5);
    ctx.fillText(
      `X:${Math.round(mouse.x)} Y:${Math.round(mouse.y)}`,
      mouse.x + 5,
      mouse.y - cfg.radius - 15,
    );
  }
};

const VisionScanner = ({
  image,
  radius = DEFAULT_CONFIG.radius,
  sensitivity = DEFAULT_CONFIG.sensitivity,
  forceSpawn = DEFAULT_CONFIG.forceSpawn,
  persistence = DEFAULT_CONFIG.persistence,
  style = DEFAULT_CONFIG.style,
  complexity = DEFAULT_CONFIG.complexity,
  gradient = DEFAULT_GRADIENT,
  gradientMapping = DEFAULT_CONFIG.gradientMapping,
  overflow,
  className,
}: VisionScannerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef<ScannerConfig>(DEFAULT_CONFIG);
  const imageRef = useRef<{ el: HTMLImageElement | null; loaded: boolean }>({
    el: null,
    loaded: false,
  });
  const resizeRef = useRef<() => void>(() => {});

  // Тримаємо конфіг у ref, щоб цикл читав актуальні значення без перезапуску анімації.
  useEffect(() => {
    configRef.current = {
      radius,
      sensitivity,
      forceSpawn,
      persistence,
      style,
      complexity,
      gradient,
      gradientMapping,
      overflow: overflow ?? null,
    };
  }, [
    radius,
    sensitivity,
    forceSpawn,
    persistence,
    style,
    complexity,
    gradient,
    gradientMapping,
    overflow,
  ]);

  // Геометрія залежить від radius/overflow — переобчислюємо canvas при їх зміні.
  useEffect(() => {
    resizeRef.current();
  }, [radius, overflow]);

  // Завантаження зображення (лише для variance-режиму).
  useEffect(() => {
    if (!image) {
      imageRef.current = { el: null, loaded: false };
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    imageRef.current = { el: img, loaded: false };
    img.onload = () => {
      if (imageRef.current.el === img) imageRef.current.loaded = true;
    };
    img.src = image;
    return () => {
      img.onload = null;
    };
  }, [image]);

  // Ініціалізація canvas + анімаційний цикл. Виконується один раз (монтування).
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let canvasW = 1;
    let canvasH = 1;
    let offscreen: HTMLCanvasElement | null = null;
    let offCtx: CanvasRenderingContext2D | null = null;

    const mouse = { x: -9999, y: -9999, active: false };
    let lastClientX = 0;
    let lastClientY = 0;
    let hasPointer = false;

    const detections: Detection[] = [];
    let lastScan = 0;
    let lastFrame = performance.now();
    let rafId = 0;
    let running = false;

    const updateOffscreen = () => {
      const img = imageRef.current;
      if (!img.el || !img.loaded) return;
      if (!offscreen) {
        offscreen = document.createElement("canvas");
        offCtx = offscreen.getContext("2d", { willReadFrequently: true });
      }
      if (!offscreen || !offCtx) return;
      const w = Math.max(1, Math.floor(canvasW * 0.25));
      const h = Math.max(1, Math.floor(canvasH * 0.25));
      if (offscreen.width !== w || offscreen.height !== h) {
        offscreen.width = w;
        offscreen.height = h;
      }
      offCtx.drawImage(img.el, 0, 0, w, h);
    };

    // Перерахунок позиції/активності курсора за останніми клієнтськими координатами.
    // active — лише коли курсор геометрично в межах секції (parent), а не всього canvas.
    const applyClient = (cx: number, cy: number) => {
      const crect = canvas.getBoundingClientRect();
      mouse.x = cx - crect.left;
      mouse.y = cy - crect.top;
      const prect = parent.getBoundingClientRect();
      mouse.active =
        cx >= prect.left && cx < prect.right && cy >= prect.top && cy < prect.bottom;
    };

    const resize = () => {
      const cfg = configRef.current;
      const rect = parent.getBoundingClientRect();
      const sectionW = Math.max(1, Math.floor(rect.width));
      const sectionH = Math.max(1, Math.floor(rect.height));
      const margin = Math.max(0, Math.round(cfg.overflow == null ? cfg.radius : cfg.overflow));

      // Розширюємо лише по вертикалі (згори/знизу); по X — рівно ширина секції,
      // інакше canvas виходить за body і зʼявляється горизонтальний скрол.
      canvasW = sectionW;
      canvasH = sectionH + margin * 2;

      canvas.style.left = "0px";
      canvas.style.top = `${-margin}px`;
      canvas.style.width = `${canvasW}px`;
      canvas.style.height = `${canvasH}px`;

      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth <= 768 ? 1.5 : 2);
      canvas.width = Math.round(canvasW * dpr);
      canvas.height = Math.round(canvasH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      updateOffscreen();
      if (hasPointer) applyClient(lastClientX, lastClientY);
    };
    resizeRef.current = resize;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const point = "touches" in e ? (e.touches[0] ?? e.changedTouches[0]) : e;
      if (!point) return;
      lastClientX = point.clientX;
      lastClientY = point.clientY;
      hasPointer = true;
      applyClient(lastClientX, lastClientY);
    };
    const onPointerLeave = () => {
      mouse.active = false;
    };
    // Скрол рухає секцію під нерухомим курсором — перераховуємо за останніми координатами.
    const onScroll = () => {
      if (hasPointer) applyClient(lastClientX, lastClientY);
    };

    const spawnForced = (cfg: ScannerConfig) => {
      if (Math.random() >= cfg.sensitivity / 100) return;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * cfg.radius;
      const sx = mouse.x + Math.cos(angle) * dist;
      const sy = mouse.y + Math.sin(angle) * dist;
      const tooClose = detections.some(
        (d) => Math.hypot(d.x - sx, d.y - sy) < MIN_SPAWN_DISTANCE,
      );
      if (tooClose) return;
      const d = new Detection(sx, sy, 10, 0.85 + Math.random() * 0.14);
      d.targetSize = 20 + Math.random() * cfg.radius;
      detections.push(d);
    };

    const spawnFromVariance = (cfg: ScannerConfig) => {
      if (!offscreen || !offCtx) return;
      const scale = offscreen.width / canvasW;
      const rx = Math.max(0, Math.floor((mouse.x - cfg.radius) * scale));
      const ry = Math.max(0, Math.floor((mouse.y - cfg.radius) * scale));
      const rw = Math.min(offscreen.width - rx, Math.floor(cfg.radius * 2 * scale));
      const rh = Math.min(offscreen.height - ry, Math.floor(cfg.radius * 2 * scale));
      if (rw <= 5 || rh <= 5) return;

      let data: Uint8ClampedArray;
      try {
        data = offCtx.getImageData(rx, ry, rw, rh).data;
      } catch {
        return; // tainted canvas — тихо пропускаємо кадр
      }

      const samples: number[] = [];
      for (let i = 0; i < data.length; i += 32) {
        samples.push((data[i] + data[i + 1] + data[i + 2]) / 3);
      }
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance =
        samples.reduce((a, b) => a + (b - avg) ** 2, 0) / samples.length;

      if (variance <= (101 - cfg.sensitivity) * 8) return;

      const px = mouse.x + (Math.random() - 0.5) * cfg.radius * 0.6;
      const py = mouse.y + (Math.random() - 0.5) * cfg.radius * 0.6;
      const tooClose = detections.some(
        (d) => Math.hypot(d.x - px, d.y - py) < MIN_SPAWN_DISTANCE,
      );
      if (tooClose) return;
      const d = new Detection(px, py, 10, 0.85 + Math.random() * 0.14);
      d.targetSize = 20 + Math.random() * cfg.radius;
      detections.push(d);
    };

    const scan = (cfg: ScannerConfig) => {
      if (!mouse.active) return;
      const now = performance.now();
      if (now - lastScan < SCAN_INTERVAL_MS) return;
      lastScan = now;

      if (cfg.forceSpawn || !imageRef.current.loaded) spawnForced(cfg);
      else spawnFromVariance(cfg);
    };

    const render = (ts: number) => {
      const cfg = configRef.current;
      const dt = (ts - lastFrame) / 1000;
      lastFrame = ts;

      ctx.clearRect(0, 0, canvasW, canvasH);

      const img = imageRef.current;
      if (img.el && img.loaded) drawImageCover(ctx, img.el, canvasW, canvasH);

      scan(cfg);

      for (let i = detections.length - 1; i >= 0; i--) {
        if (detections[i].update(dt, cfg.persistence)) {
          detections[i].draw(ctx, cfg, canvasH);
        } else {
          detections.splice(i, 1);
        }
      }

      if (mouse.active) drawCursor(ctx, cfg, mouse, canvasH);

      rafId = requestAnimationFrame(render);
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      lastFrame = performance.now();
      rafId = requestAnimationFrame(render);
    };
    const stop = () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();

    // Крутимо цикл лише коли секція у в'юпорті — економія на кількох секціях одразу.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) start();
          else stop();
        }
      },
      { threshold: 0 },
    );
    io.observe(parent);

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      resizeRef.current = () => {};
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerLeave);
      window.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className ? `${css.canvas} ${className}` : css.canvas}
      aria-hidden="true"
    />
  );
};

export default VisionScanner;
