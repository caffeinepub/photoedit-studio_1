import {
  FILTER_DEFINITIONS,
  type FilterPreset,
  buildFilterString,
  useEditor,
} from "@/contexts/EditorContext";
import type { Adjustments } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";

const FILTER_LABELS: Record<FilterPreset, string> = {
  normal: "Normal",
  cinematic: "Cinematic",
  cinematiccold: "Ice Film",
  vivid: "Vivid",
  bw: "B&W",
  warm: "Warm",
  cool: "Cool",
  fade: "Fade",
  chrome: "Chrome",
  vintage: "Vintage",
  hdr: "HDR",
  matte: "Matte",
  fuji: "Fuji",
  moody: "Moody",
  lomo: "Lomo",
  clarendon: "Clarendon",
  juno: "Juno",
  lark: "Lark",
  moon: "Moon",
  gaminggreen: "Matrix",
  nightvision: "NightVis",
};

const FILTER_SWATCHES: Record<FilterPreset, string> = {
  normal: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  cinematic: "linear-gradient(135deg, #e86b2c 0%, #1a2a4a 100%)",
  cinematiccold: "linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)",
  vivid: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
  bw: "linear-gradient(135deg, #000000 0%, #ffffff 100%)",
  warm: "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)",
  cool: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
  fade: "linear-gradient(135deg, #c9d6ff 0%, #e2e2e2 100%)",
  chrome: "linear-gradient(135deg, #f7971e 0%, #b8860b 100%)",
  vintage: "linear-gradient(135deg, #c8a96e 0%, #7b5c3e 100%)",
  hdr: "linear-gradient(135deg, #8e2de2 0%, #f9690e 100%)",
  matte: "linear-gradient(135deg, #c9a882 0%, #8e7c6e 100%)",
  fuji: "linear-gradient(135deg, #a8edea 0%, #7eaa92 100%)",
  moody: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  lomo: "linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #ff9f43 100%)",
  clarendon: "linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)",
  juno: "linear-gradient(135deg, #f7b733 0%, #fc4a1a 100%)",
  lark: "linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)",
  moon: "linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)",
  gaminggreen: "linear-gradient(135deg, #0f3443 0%, #34e89e 100%)",
  nightvision: "linear-gradient(135deg, #003300 0%, #00ff66 100%)",
};

const DUMMY_ADJ: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  sharpness: 0,
  temperature: 0,
  hue: 0,
  grayscale: 0,
  sepia: 0,
  vignette: 0,
  grain: 0,
};

const FILTER_GROUPS = [
  {
    label: "Classic",
    filters: ["normal", "bw", "fade", "vintage"] as FilterPreset[],
  },
  {
    label: "Popular",
    filters: ["cinematic", "vivid", "warm", "cool"] as FilterPreset[],
  },
  {
    label: "Instagram",
    filters: ["clarendon", "juno", "lark", "moon"] as FilterPreset[],
  },
  {
    label: "Cinematic",
    filters: ["cinematiccold", "chrome", "moody", "matte"] as FilterPreset[],
  },
  {
    label: "Gaming / HDR",
    filters: ["gaminggreen", "nightvision", "hdr", "lomo"] as FilterPreset[],
  },
  {
    label: "Film",
    filters: ["fuji"] as FilterPreset[],
  },
];

function FilterThumb({
  preset,
  imageUrl,
  isActive,
  onClick,
}: {
  preset: FilterPreset;
  imageUrl: string | null;
  isActive: boolean;
  onClick: () => void;
}) {
  const filter = buildFilterString(DUMMY_ADJ, preset);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 group rounded-md p-1 transition-colors",
        isActive ? "" : "hover:bg-muted/50",
      )}
      data-ocid={`filter.${preset}.button`}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-md overflow-hidden border-2 transition-colors",
          isActive
            ? "border-primary ring-2 ring-primary/30"
            : "border-border group-hover:border-muted-foreground/40",
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={preset}
            className="w-full h-full object-cover"
            style={{ filter: filter || "none" }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: FILTER_SWATCHES[preset],
              filter: filter || "none",
            }}
          />
        )}
      </div>
      <span
        className={cn(
          "text-[10px] font-medium",
          isActive ? "text-primary font-bold" : "text-muted-foreground",
        )}
      >
        {FILTER_LABELS[preset]}
      </span>
    </button>
  );
}

export default function FiltersTab() {
  const { state, dispatch } = useEditor();
  return (
    <div className="px-3 py-3 space-y-4 pb-20">
      {FILTER_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {group.label}
          </p>
          <div className="grid grid-cols-4 gap-1">
            {group.filters.map((preset) => (
              <FilterThumb
                key={preset}
                preset={preset}
                imageUrl={state.imageUrl}
                isActive={state.activeFilter === preset}
                onClick={() => {
                  dispatch({ type: "SET_FILTER", filter: preset });
                  dispatch({ type: "PUSH_HISTORY" });
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
