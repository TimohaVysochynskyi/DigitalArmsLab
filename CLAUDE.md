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

- Фіча `arsenal` доповнена: `Weapon.modelUrl` (тимчасово akm.opt.glb для всього, крім дронів), `WeaponDetails` (опис/ТТХ/принцип роботи/джерела) у `weapon-details.mock.ts`, `getWeaponDetail(id)` + `useWeaponDetail(id)`. Активна картка слайдера — `<Link>` на `/lab/:weaponId`.
- Спільне 3D: `shared/Scene3D` експортує ще `StudioEnvironment` (світло+IBL, спільне для сцен) і `tuneMaterials` (envMapIntensity/мін. roughness).

Частково (перший прохід, потребує тюнінгу наживо):
- ScenePage (`/lab/:weaponId`): `WeaponViewer` — власний (не overlay) `<Canvas>` з подіями миші: `WeaponModel` (glb нормалізується bounding-сферою до `MODEL_RADIUS` і центрується, доворот з `MODEL_FACING`, тогл розбирання = кліп `diassemble`/`assemble` один раз із `clampWhenFinished`; якщо кліпу збирання нема — розбирання у зворотному напрямку) + `ViewControls` (OrbitControls без пану, зум у межах fit-дистанції; скидання виду — плавний переліт у сферичних координатах за `RESET_DURATION`, далі автообертання; ручний pointerdown його зупиняє). Початковий розмір адаптивний: `projectVertices` міряє реальні вершини моделі в стартовому ракурсі (габаритна коробка для тонкого автомата дає завеликі поля), `fitDistance` ставить камеру так, щоб модель займала `FRAME_FILL` кадру за поточного аспекту канваса — на будь-якому екрані без обрізання; при ресайзі відносний зум зберігається. Тюнити: `viewer.config.ts`. Стан UI — `useSceneControls`. Решта UI: `SceneToolbar` (?, скид виду, розбирання), `WeaponCaption`, `WeaponInfoDrawer` (Esc, `inert` у закритому стані). CSS цих компонентів — заготовки класів, стилі за користувачем.
- 3D HomePage: `shared/Scene3D` (fixed overlay, z-index −1, dpr [1,2], IBL через `<Environment>`+Lightformers) + `pages/HomePage/ui/scene/` (DroneModel, AkmModel, HomeScene, useHomeChoreography, math, types). Оркестрація — GSAP ScrollTrigger у HomePage; спільний мутабельний `Choreo` (без ре-рендерів) + `featuresStep` (React-стан для картки).
  - Розмір моделей адаптивний за еталоном (як ScenePage): `REF` 1920×1080 + коефіцієнт `min(1, w/1920, h/1080)`; на 1920 — як задизайнено, нижче плавно меншає за меншим виміром. Дрон — `sizeFrac` від висоти еталона; АКМ — вписування у `REF_SLOT` (розміри боксів на 1920) × коефіцієнт. DOM-бокси слотів дають лише ЦЕНТР (позицію); їхній CSS-розмір не впливає на масштаб, лише має не давати горизонтального скролу (CTA `min(940px,49vw)`, Features `max-width` на ≤1024).
  - Дрон: десктоп (>600) — Hero(центр, на нас)→About(вправо на 30% менший, поворот вліво) + легкий ховер. Мобайл (≤600, `gsap.matchMedia`) — спуск СТРОГО по центру через About (фаза 1), тоді доворот у вид ЗГОРИ (top-down, ×1.5, сталий скейл) в окремій геп-зоні `#drone-gap` між About і Features (фаза 2, `choreo.droneGap`; висота зони — `min(72vw,380px)` у HomePage.module.css). Тюн: `TUNE` (DroneModel).
  - АКМ: одна модель, трекінг DOM-бокса слота (`#akm-slot-features` / `#akm-slot-cta` — замість колишніх картинок akms); на ≤600 ×2 і у Features вертикальніший (екранний roll ~80°, `FEATURES_MOBILE_ROLL`; зникає при перельоті в CTA). Features пін на 3 кроки: картка 01/02/03 + кліпи `idle`/`diassemble`/`assemble` (скраб скролом). CTA — профіль, idle.
  - Z-контракт: медіа секцій `z-index:-2` → 3D `-1` → VisionScanner `0` → текст `≥1`; секції не мають бути stacking context.
  - Тюнити наживо: `SLOT_TUNE` (AkmModel), `DRONE_TUNE` (DroneModel).

Не готово / далі:
- 3D: тюнінг позицій/обертів; стиснення важких glb (drone 16 МБ / akm 12 МБ); перф (frameloop `always` → пауза поза екраном).
- ScenePage: реальні glb під кожну одиницю; взаємодія з окремими частинами моделі (підсвітка/клік).
- Секції HomePage — у процесі верстки.

## Правила роботи
- Тримати цей файл стислим: без дублювання, без води; оновлювати «Поточний стан» при змінах.
