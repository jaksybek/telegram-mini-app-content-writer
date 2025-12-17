import { useEffect, useMemo, useState } from "react";
import { initTelegram } from "./lib/telegram";

type Platform = "instagram" | "threads";

type SliderKey = "brevity" | "creativity" | "sarcasm" | "controversy" | "humor";

type Sliders = Record<SliderKey, number>;

type LlmTier = "fast" | "quality";
type ResponseLanguage = "auto" | "ru" | "en";

const DEFAULTS: Sliders = {
  brevity: 50,
  creativity: 50,
  sarcasm: 20,
  controversy: 10,
  humor: 0
};

const sliderLabels: Record<SliderKey, string> = {
  brevity: "Краткость",
  creativity: "Креативность",
  sarcasm: "Сарказм",
  controversy: "Контроверсия",
  humor: "Юмор"
};

const platformLimits = {
  instagram: { limit: 2200, warnAt: 1800, label: "Instagram" },
  threads: { limit: 500, warnAt: 450, label: "Threads" }
};

export default function App() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [text, setText] = useState("");
  const [sliders, setSliders] = useState<Sliders>(DEFAULTS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [b2bMode, setB2bMode] = useState(false);
  const [essayMode, setEssayMode] = useState(false);
  const [llmTier, setLlmTier] = useState<LlmTier>("fast");
  const [responseLanguage, setResponseLanguage] = useState<ResponseLanguage>("auto");
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    initTelegram();
  }, []);

  useEffect(() => {
    setSliders((prev) => applyCaps(prev, b2bMode, essayMode));
  }, [b2bMode, essayMode]);

  const limits = platformLimits[platform];
  const chars = text.length;
  const exceeds = chars > limits.limit;
  const nearLimit = !exceeds && chars >= limits.warnAt;

  const allMaxed =
    sliders.brevity === 100 &&
    sliders.creativity === 100 &&
    sliders.sarcasm === 100 &&
    sliders.controversy === 100 &&
    sliders.humor === 100;

  useEffect(() => {
    if (allMaxed) {
      setWarning("Все параметры на 100% — значения будут усреднены для безопасности.");
    } else {
      setWarning(null);
    }
  }, [allMaxed]);

  const handleSliderChange = (key: SliderKey, value: number) => {
    // If essay mode is on, clamp brevity to the essay range.
    if (essayMode && key === "brevity") {
      setSliders((prev) => applyCaps({ ...prev, brevity: value }, b2bMode, essayMode));
      return;
    }
    setSliders((prev) => applyCaps({ ...prev, [key]: value }, b2bMode, essayMode));
  };

  const handleGenerate = () => {
    if (!text.trim()) {
      setWarning("Добавьте текст черновика перед генерацией.");
      return;
    }
    if (exceeds) {
      setWarning(`Лимит для ${limits.label}: ${limits.limit} символов. Укоротите текст.`);
      return;
    }

    const payload = {
      platform,
      text,
      sliders,
      b2bMode,
      essayMode,
      llmTier,
      responseLanguage,
      advancedShown: showAdvanced
    };

    // eslint-disable-next-line no-console
    console.log("Generate payload", payload);
    setWarning(null);
  };

  const sliderList = useMemo(() => {
    const base: SliderKey[] = ["brevity", "creativity", "sarcasm", "controversy"];
    if (showAdvanced) base.push("humor");
    return base;
  }, [showAdvanced]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-24 pt-6">
        <header className="mb-4">
          <h1 className="text-xl font-semibold">AI Content Styler</h1>
          <p className="text-sm text-slate-300">
            Тонкая настройка постов Instagram и Threads. Новая мысль — новый абзац, избегайте
            двойных пробелов.
          </p>
        </header>

        <section className="mb-3 flex items-center gap-2 rounded-xl bg-slate-900 p-1">
          <PlatformTab current={platform} value="instagram" onSelect={setPlatform} />
          <PlatformTab current={platform} value="threads" onSelect={setPlatform} />
        </section>

        <section className="mb-3 rounded-xl bg-slate-900 p-4">
          <label className="flex items-center justify-between text-sm font-medium text-slate-200">
            Черновик
            <span
              className={`text-xs ${
                exceeds ? "text-red-400" : nearLimit ? "text-amber-300" : "text-slate-400"
              }`}
            >
              {chars}/{limits.limit}
            </span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="О чем пишем сегодня?"
            className="mt-2 h-32 w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-500"
          />
          {exceeds && (
            <p className="mt-1 text-xs text-red-400">Превышен лимит {limits.limit} символов.</p>
          )}
          {warning && !exceeds && (
            <p className="mt-1 text-xs text-amber-300" role="status">
              {warning}
            </p>
          )}
        </section>

        <section className="mb-3 rounded-xl bg-slate-900 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-100">Style Sliders</p>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={b2bMode}
                onChange={(e) => setB2bMode(e.target.checked)}
                className="h-4 w-4 accent-indigo-500"
              />
              Режим B2B (кап на сарказм/юмор)
            </label>
          </div>
          <label className="mb-2 flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={essayMode}
              onChange={(e) => setEssayMode(e.target.checked)}
              className="h-4 w-4 accent-indigo-500"
            />
            Режим «Эссе» (Краткость 20–30%)
          </label>
          <div className="space-y-3">
            {sliderList.map((key) => (
              <Slider
                key={key}
                label={key === "brevity" && essayMode ? `${sliderLabels[key]} (эссе)` : sliderLabels[key]}
                value={sliders[key]}
                min={key === "brevity" && essayMode ? 20 : 0}
                max={key === "brevity" && essayMode ? 30 : 100}
                disabled={key === "brevity" && essayMode}
                onChange={(value) => handleSliderChange(key, value)}
              />
            ))}
          </div>
          <button
            type="button"
            className="mt-3 text-xs text-indigo-300 underline decoration-dotted"
            onClick={() => setShowAdvanced((s) => !s)}
          >
            {showAdvanced ? "Скрыть дополнительно" : "Дополнительно (Юмор)"}
          </button>
          {allMaxed && (
            <p className="mt-2 text-xs text-amber-300">
              Все параметры на максимуме — значения будут усреднены для безопасности.
            </p>
          )}
        </section>

        <section className="mb-3 rounded-xl bg-slate-900 p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">Режим LLM</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <SelectButton
                label="Быстро (gpt-4o-mini)"
                active={llmTier === "fast"}
                onClick={() => setLlmTier("fast")}
              />
              <SelectButton
                label="Качество (gpt-4o)"
                active={llmTier === "quality"}
                onClick={() => setLlmTier("quality")}
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">Язык ответа</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <SelectButton
                label="Auto"
                active={responseLanguage === "auto"}
                onClick={() => setResponseLanguage("auto")}
              />
              <SelectButton
                label="RU"
                active={responseLanguage === "ru"}
                onClick={() => setResponseLanguage("ru")}
              />
              <SelectButton
                label="EN"
                active={responseLanguage === "en"}
                onClick={() => setResponseLanguage("en")}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Auto: если вход на русском и нет запроса на английский — отвечаем на русском.
            </p>
          </div>
        </section>

        <div className="sticky bottom-0 left-0 right-0 mt-auto -mx-4 border-t border-slate-800 bg-slate-950 px-4 pb-6 pt-3">
          <button
            type="button"
            onClick={handleGenerate}
            className="w-full rounded-full bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 active:scale-[0.99]"
          >
            Сгенерировать
          </button>
          <p className="mt-2 text-xs text-slate-400">
            Instagram: абзацы + CTA + хэштеги. Threads: до 500 символов на часть, авто-разбиение
            1/X.
          </p>
        </div>
      </div>
    </div>
  );
}

function PlatformTab({
  current,
  value,
  onSelect
}: {
  current: Platform;
  value: Platform;
  onSelect: (p: Platform) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? "bg-indigo-500 text-white" : "bg-transparent text-slate-300"
      }`}
      aria-pressed={active}
    >
      {platformLimits[value].label}
    </button>
  );
}

function Slider({
  label,
  value,
  min = 0,
  max = 100,
  disabled = false,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-slate-200">
        <span>{label}</span>
        <span className="text-xs text-slate-400">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-indigo-500 disabled:opacity-60"
        disabled={disabled}
      />
    </div>
  );
}

function SelectButton({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function applyCaps(values: Sliders, b2b: boolean, essay: boolean): Sliders {
  const capped: Sliders = { ...values };
  if (b2b) {
    if (capped.sarcasm > 30) capped.sarcasm = 30;
    if (capped.humor > 40) capped.humor = 40;
  }
  if (essay) {
    if (capped.brevity > 30) capped.brevity = 30;
    if (capped.brevity < 20) capped.brevity = 20;
  }
  const allAtHundred =
    capped.brevity === 100 &&
    capped.creativity === 100 &&
    capped.sarcasm === 100 &&
    capped.controversy === 100 &&
    capped.humor === 100;
  if (allAtHundred) {
    // Усредняем мягко, чтобы снять конфликт.
    return {
      brevity: 70,
      creativity: 70,
      sarcasm: b2b ? 30 : 70,
      controversy: 70,
      humor: b2b ? Math.min(40, 60) : 60
    };
  }
  return capped;
}
