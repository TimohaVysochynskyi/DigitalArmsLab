# DigitalArmsLab

Освітня платформа для вивчення будови та принципу роботи зброї: 3D-моделі + анімації збірки/розбірки.

## Стек
- React 19 + TypeScript, Vite 8
- react-router-dom 7 (маршрутизація)
- yup (валідація форм)
- CSS Modules (`*.module.css`)
- 3D: @react-three/fiber + @react-three/drei (Three.js), scroll — GSAP ScrollTrigger. Один fixed-overlay Canvas, керування скролом (обрано; ще не встановлено)
- Немає: state-менеджера, data-fetching бібліотеки, тестів

## Обов'язкові принципи
- **SOLID** — кожна одиниця має одну відповідальність; залежності через абстракції (типи/сервіси), не через конкретику.
- **Feature-based архітектура** — код групується за фічами, не за типами файлів.

## Структура
- `src/pages/<Page>/` — сторінки рівня маршруту: `ui/` + `index.ts` (barrel).
- `src/widgets/` — композитні крос-сторінкові блоки (Header, Footer, Layout).
- `src/features/<feature>/` — самодостатні фічі:
  - `model/` — типи (`*.types.ts`), mock (`*.mock.ts`), валідація yup (`*.validation.ts`)
  - `services/` — запити (`*.service.ts`); поки бекенду нема — повертають mock
  - `hooks/` — `use-*.ts` (стан/логіка)
  - `ui/` — компоненти (кожен: папка + `*.module.css` + `index.ts`); головний збиральний файл `*Layout.tsx`
  - `index.ts` — публічний API фічі (експорт фічі + типів)
- `src/shared/` — перевикористовувані одиниці (кожна: папка + `.module.css` + `index.ts`).
- `src/features/_feature-template/` — **еталон-приклад** архітектури (контент профілю/фішингу з іншого проєкту, НЕ реальна фіча).

## Конвенції
- Компонент: `const X = () => {}` + `export default X`; пропси — inline `type XProps = {}`.
- Кожна одиниця має barrel `index.ts` (`export { default } from "./X"`).
- CSS Modules імпортуються як `css`.
- Типи — централізовано в `model/`, експортуються для перевикористання (без дублювання).
- Валідація — лише yup: `*FormValues` + `*InitialValues` + `*ValidationSchema`.
- Alias `@/` → `src/` (напр. `@/assets/svg/logo.svg`).
- UI-текст і коментарі — українською.

## Адаптивність
- Брейкпоінти (px): 1280, 1024, 900, 768, 600, 425, 375.
- Бургер-меню: з'являється при ≤1024px. Діапазон 768–1024px — пункти меню рівняються по правому краю (бургер справа, зручніше для фокусу); <768px — рівняння по лівому (чітко як у Figma).

## Розподіл робіт
- **Користувач**: верстка + перенесення дизайн-системи.
- **Claude**: інтеграція анімацій, зв'язки компонентів, логіка (стани/хуки/взаємодії), 3D-розміщення та взаємодія.

## Стан та дані
- Глобальний стан — **Redux**, але лише за реальної потреби (напр. auth); де можна обійтися локальним станом — обходимось. Тека `src/redux/` (темплейт надасть користувач).
- Усе на mock; бекенду немає й найближчим часом не буде.
- У реальних задачах `services`/хуки закладають стани **loading** та **error**.

## Поточний стан
Готово:
- Каркас: `main` → BrowserRouter → App → Layout.
- Layout: Header (десктопна навігація + мобільне бургер-меню `MobileMenu` ≤1024px), Footer (wrapper).
- Маршрут `/` → HomePage (порожня).
- Loader (shared), еталон-фіча профілю.
- Alias `@/` → `src/` (vite.config.ts + tsconfig.app.json).
- VisionScanner (shared) — фоновий canvas-ефект «комп'ютерного зору» за курсором; приймає `className`, кладеться позаду контенту секції.
- Якірна навігація: `shared/lib/anchorScroll.ts` + `useAnchorScroll` (у Layout). `NavigationLink` з `to="#id"` скасовує клік (react-router не робить нативний перехід до фрагмента), скролить `window.scrollTo({behavior:"smooth"})` з відступом на висоту хедера, URL не змінює. З іншої сторінки — якір їде через `location.state`. ID секцій: `#hero`, `#about`, `#features`, `#cta`, `#contact`.

- LaboratoryPage (`/lab`): GuideSection (+ `AudioPlayer` — риски хвилі рахуються від ширини через ResizeObserver, стан played, демо-таймлайн поки нема `src`), ArsenalSection.
- ArsenalSection: дані — фіча `features/arsenal` (model/services/hooks, mock: 4 категорії × 2 одиниці, картинки тимчасово akms). Логіка — `useArsenalSlider`: стрілки рухають вибір на 1 картку, трек зсувається на сторінку лише коли вибір вийшов за видиме вікно. Розмір вікна = `--visible-slides` (читається з CSS через `getComputedStyle`); ширина картки за замовчуванням рахується з нього так, щоб слайдер зайняв усю доступну ширину, а `--slide-width` (за замовчуванням `initial`) — необовʼязкове перекриття через `var(--slide-width, …)`. Зсув береться з `offsetLeft` картки. Безкінечність — список ×3 копії + безшовний стрибок у середню після transitionend.
- Вибір категорії: `CategoryList` (десктопна стрічка; зсув миттєвий і рівно на потрібну величину, градієнт `pointer-events:none` стоїть на тому краю, за який виїхали кнопки; `contain:inline-size` на `.strip`, щоб кнопки не роздували min-content сторінки) і `CategoryDropdown` (мобільний, розкриття через `grid-template-rows 0fr→1fr`). Обидва рендеряться завжди з однаковими пропсами, перемикання — класами `.categoryList`/`.categoryDropdown` в `ArsenalSection.module.css`.

Частково (перший прохід, потребує тюнінгу наживо):
- 3D HomePage: `shared/Scene3D` (fixed overlay, z-index −1, dpr [1,2], IBL через `<Environment>`+Lightformers) + `pages/HomePage/ui/scene/` (DroneModel, AkmModel, HomeScene, useHomeChoreography, math, types). Оркестрація — GSAP ScrollTrigger у HomePage; спільний мутабельний `Choreo` (без ре-рендерів) + `featuresStep` (React-стан для картки).
  - Дрон: Hero(центр, на нас)→About(вправо, поворот вліво) + легкий ховер; без зашитих анімацій.
  - АКМ: одна модель, трекінг DOM-бокса слота (`#akm-slot-features` / `#akm-slot-cta` — замість колишніх картинок akms). Features пін на 3 кроки: картка 01/02/03 + кліпи `idle`/`diassemble`/`assemble` (скраб скролом). CTA — профіль, idle.
  - Z-контракт: медіа секцій `z-index:-2` → 3D `-1` → VisionScanner `0` → текст `≥1`; секції не мають бути stacking context.
  - Тюнити наживо: `SLOT_TUNE` (AkmModel), `DRONE_TUNE` (DroneModel).

Не готово / далі:
- 3D: тюнінг позицій/обертів; `<Environment>` для відблисків металу (АКМ) — ще не додано; стиснення важких glb (drone 16 МБ / akm 12 МБ); перф (frameloop `always` → пауза поза екраном); код-спліт 3D-чанка.
- Секції HomePage — у процесі верстки.

## Правила роботи
- Тримати цей файл стислим: без дублювання, без води; оновлювати «Поточний стан» при змінах.
