import { useEditor } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FACE_EFFECTS = [
  {
    id: "glamour",
    label: "Glamour",
    emoji: "💄",
    desc: "Warm & radiant skin",
    color: "from-pink-500/20 to-rose-500/20",
    border: "border-pink-500/30",
    adj: { brightness: 15, saturation: 20, temperature: 20, blur: 0.5 },
    filter: null,
    specialEffect: null,
  },
  {
    id: "cartoon",
    label: "Cartoon",
    emoji: "🎨",
    desc: "Bold edges & vivid colors",
    color: "from-yellow-500/20 to-orange-500/20",
    border: "border-yellow-500/30",
    adj: { contrast: 60, saturation: 80 },
    filter: null,
    specialEffect: null,
  },
  {
    id: "dreamy",
    label: "Dreamy",
    emoji: "✨",
    desc: "Soft glow & ethereal look",
    color: "from-purple-500/20 to-blue-500/20",
    border: "border-purple-500/30",
    adj: { blur: 1.5, brightness: 10, saturation: -20, contrast: -10 },
    filter: null,
    specialEffect: null,
  },
  {
    id: "vintage_portrait",
    label: "Vintage",
    emoji: "📷",
    desc: "Classic sepia portrait",
    color: "from-amber-600/20 to-yellow-700/20",
    border: "border-amber-600/30",
    adj: { sepia: 50, contrast: -10, brightness: 5 },
    filter: "vintage",
    specialEffect: null,
  },
  {
    id: "neon_night",
    label: "Neon Night",
    emoji: "🌃",
    desc: "Cyberpunk neon glow",
    color: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500/30",
    adj: { hue: 180, saturation: 80, contrast: 20 },
    filter: null,
    specialEffect: "glow",
  },
  {
    id: "oil_paint",
    label: "Oil Paint",
    emoji: "🖌️",
    desc: "Artistic painterly texture",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
    adj: { contrast: 30, saturation: 50, sharpness: 3 },
    filter: null,
    specialEffect: null,
  },
  {
    id: "soft_focus",
    label: "Soft Focus",
    emoji: "🌸",
    desc: "Gentle blurred softness",
    color: "from-rose-400/20 to-pink-400/20",
    border: "border-rose-400/30",
    adj: { blur: 1, brightness: 8, contrast: -20, saturation: 10 },
    filter: null,
    specialEffect: null,
  },
  {
    id: "bw_portrait",
    label: "B&W Portrait",
    emoji: "🎞️",
    desc: "Dramatic monochrome",
    color: "from-gray-500/20 to-slate-600/20",
    border: "border-gray-500/30",
    adj: { grayscale: 100, contrast: 20 },
    filter: "bw",
    specialEffect: null,
  },
  {
    id: "golden_hour",
    label: "Golden Hour",
    emoji: "🌅",
    desc: "Warm sunset tones",
    color: "from-orange-400/20 to-amber-500/20",
    border: "border-orange-400/30",
    adj: { brightness: 8, temperature: 60, saturation: 25, contrast: 5 },
    filter: "warm",
    specialEffect: null,
  },
  {
    id: "cold_steel",
    label: "Cold Steel",
    emoji: "❄️",
    desc: "Icy blue-gray tones",
    color: "from-blue-400/20 to-slate-500/20",
    border: "border-blue-400/30",
    adj: { temperature: -50, saturation: -20, contrast: 15 },
    filter: "cool",
    specialEffect: null,
  },
];

export default function FaceEffectsTab() {
  const { state, dispatch } = useEditor();

  function applyEffect(effect: (typeof FACE_EFFECTS)[0]) {
    for (const [key, value] of Object.entries(effect.adj)) {
      dispatch({
        type: "SET_ADJUSTMENT",
        key: key as any,
        value: value as number,
      });
    }
    if (effect.filter) {
      dispatch({ type: "SET_FILTER", filter: effect.filter as any });
    }
    dispatch({ type: "SET_SPECIAL_EFFECT", effect: effect.specialEffect });
    dispatch({ type: "PUSH_HISTORY" });
    toast.success(`${effect.label} applied!`);
  }

  return (
    <div className="px-3 py-3 space-y-3 pb-20">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Portrait Effects
        </p>
        <span className="text-[10px] text-muted-foreground">
          Click to apply
        </span>
      </div>

      {!state.imageUrl && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Upload an image first
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {FACE_EFFECTS.map((effect) => (
          <button
            key={effect.id}
            type="button"
            onClick={() => applyEffect(effect)}
            disabled={!state.imageUrl}
            className={cn(
              "flex flex-col items-start gap-1 rounded-xl p-3 border transition-all text-left",
              `bg-gradient-to-br ${effect.color} ${effect.border}`,
              "hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
            )}
            data-ocid={`face.${effect.id}.button`}
          >
            <span className="text-2xl">{effect.emoji}</span>
            <span className="text-xs font-bold text-foreground leading-tight">
              {effect.label}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {effect.desc}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          dispatch({ type: "RESET" });
          toast.success("Effects cleared");
        }}
        disabled={!state.imageUrl}
        className="w-full py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
        data-ocid="face.reset.button"
      >
        Clear All Effects
      </button>
    </div>
  );
}
