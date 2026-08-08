export type AccentLink = {
  to: string;
  label: string;
};

export type LayoutConfig = {
  /** Прибрати футер на цій сторінці. */
  hideFooter: boolean;
  /** Правий акцентний лінк у хедері та мобільному меню. */
  accentLink: AccentLink;
};

const DEFAULT_CONFIG: LayoutConfig = {
  hideFooter: false,
  accentLink: { to: "/lab", label: "Лабораторія" },
};

/** Винятки за маршрутом. Ключ покриває і вкладені шляхи (`/lab` → `/lab/akm`). */
const ROUTE_OVERRIDES: Record<string, Partial<LayoutConfig>> = {
  "/lab": {
    hideFooter: true,
    accentLink: { to: "/", label: "Головна" },
  },
};

export const getLayoutConfig = (pathname: string): LayoutConfig => {
  const override = Object.entries(ROUTE_OVERRIDES).find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`),
  )?.[1];

  return { ...DEFAULT_CONFIG, ...override };
};
