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
  vivid: "Vivid",
  bw: "B&W",
  warm: "Warm",
  cool: "Cool",
  fade: "Fade",
  chrome: "Chrome",
  vintage: "Vintage",
  hdr: "HDR",
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
};

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
            ? "border-primary"
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
              background:
                "linear-gradient(135deg, oklch(0.40 0.08 200), oklch(0.60 0.12 280))",
              filter: filter || "none",
            }}
          />
        )}
      </div>
      <span
        className={cn(
          "text-[10px] font-medium",
          isActive ? "text-primary" : "text-muted-foreground",
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
    <div className="px-3 py-3">
      <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
        Instagram Filters
      </p>
      <div className="grid grid-cols-4 gap-1">
        {(Object.keys(FILTER_DEFINITIONS) as FilterPreset[]).map((preset) => (
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
  );
}
