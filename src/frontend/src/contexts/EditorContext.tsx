import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useReducer,
} from "react";

export type Tool = "select" | "crop" | "rotate" | "fliph" | "flipv";

export type FilterPreset =
  | "normal"
  | "cinematic"
  | "vivid"
  | "bw"
  | "warm"
  | "cool"
  | "fade"
  | "chrome"
  | "vintage"
  | "hdr";

export interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  sharpness: number;
  temperature: number;
}

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type AspectRatio = "free" | "1:1" | "16:9" | "4:3" | "3:2";

export interface TextLayer {
  id: string;
  text: string;
  fontStyle: "normal" | "bold" | "neon" | "glitch";
  color: string;
  fontSize: number;
  x: number;
  y: number;
}

export interface StickerLayer {
  id: string;
  content: string; // emoji or dataURL
  isCustom: boolean;
  x: number;
  y: number;
  size: number;
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  sharpness: 0,
  temperature: 0,
};

interface HistoryEntry {
  adjustments: Adjustments;
  filter: FilterPreset;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

export interface EditorState {
  imageUrl: string | null;
  imageName: string;
  adjustments: Adjustments;
  activeFilter: FilterPreset;
  activeTool: Tool;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  zoom: number;
  cropRect: CropRect | null;
  isCropping: boolean;
  cropAspect: AspectRatio;
  history: HistoryEntry[];
  historyIndex: number;
  activePanel: string;
  textLayers: TextLayer[];
  stickerLayers: StickerLayer[];
  beforeImageUrl: string | null;
  showBeforeAfter: boolean;
  isPremium: boolean;
  backgroundUrl: string | null;
}

type Action =
  | { type: "LOAD_IMAGE"; url: string; name: string }
  | { type: "CLEAR_IMAGE" }
  | { type: "SET_ADJUSTMENT"; key: keyof Adjustments; value: number }
  | { type: "SET_FILTER"; filter: FilterPreset }
  | { type: "SET_TOOL"; tool: Tool }
  | { type: "SET_ROTATION"; degrees: number }
  | { type: "ROTATE_90"; dir: "left" | "right" }
  | { type: "FLIP_H" }
  | { type: "FLIP_V" }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_CROP_RECT"; rect: CropRect | null }
  | { type: "APPLY_CROP"; url: string }
  | { type: "SET_CROP_ASPECT"; aspect: AspectRatio }
  | { type: "RESET" }
  | { type: "AUTO_ADJUST" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "PUSH_HISTORY" }
  | { type: "SET_ACTIVE_PANEL"; panel: string }
  | { type: "SET_TEXT_LAYERS"; layers: TextLayer[] }
  | { type: "SET_STICKER_LAYERS"; layers: StickerLayer[] }
  | { type: "SET_BEFORE_IMAGE"; url: string | null }
  | { type: "TOGGLE_BEFORE_AFTER" }
  | { type: "SET_PREMIUM"; value: boolean }
  | { type: "SET_BACKGROUND"; url: string | null };

const INITIAL_STATE: EditorState = {
  imageUrl: null,
  imageName: "",
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  activeFilter: "normal",
  activeTool: "select",
  rotation: 0,
  flipH: false,
  flipV: false,
  zoom: 1,
  cropRect: null,
  isCropping: false,
  cropAspect: "free",
  history: [],
  historyIndex: -1,
  activePanel: "adjust",
  textLayers: [],
  stickerLayers: [],
  beforeImageUrl: null,
  showBeforeAfter: false,
  isPremium: false,
  backgroundUrl: null,
};

function snapshotState(state: EditorState): HistoryEntry {
  return {
    adjustments: { ...state.adjustments },
    filter: state.activeFilter,
    rotation: state.rotation,
    flipH: state.flipH,
    flipV: state.flipV,
  };
}

function pushHistory(state: EditorState): EditorState {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(snapshotState(state));
  if (newHistory.length > 20) newHistory.shift();
  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "LOAD_IMAGE":
      return {
        ...INITIAL_STATE,
        imageUrl: action.url,
        imageName: action.name,
        beforeImageUrl: action.url,
        history: [snapshotState(INITIAL_STATE)],
        historyIndex: 0,
      };
    case "CLEAR_IMAGE":
      return { ...INITIAL_STATE };
    case "SET_ADJUSTMENT": {
      const next = {
        ...state,
        adjustments: { ...state.adjustments, [action.key]: action.value },
      };
      return next;
    }
    case "SET_FILTER":
      return { ...state, activeFilter: action.filter };
    case "SET_TOOL":
      return {
        ...state,
        activeTool: action.tool,
        isCropping: action.tool === "crop",
        cropRect: action.tool === "crop" ? state.cropRect : null,
      };
    case "SET_ROTATION":
      return { ...state, rotation: action.degrees };
    case "ROTATE_90": {
      const delta = action.dir === "left" ? -90 : 90;
      return { ...state, rotation: (state.rotation + delta + 360) % 360 };
    }
    case "FLIP_H":
      return { ...state, flipH: !state.flipH };
    case "FLIP_V":
      return { ...state, flipV: !state.flipV };
    case "SET_ZOOM":
      return { ...state, zoom: Math.max(0.1, Math.min(5, action.zoom)) };
    case "SET_CROP_RECT":
      return { ...state, cropRect: action.rect };
    case "APPLY_CROP":
      return {
        ...state,
        imageUrl: action.url,
        cropRect: null,
        isCropping: false,
        activeTool: "select",
      };
    case "SET_CROP_ASPECT":
      return { ...state, cropAspect: action.aspect };
    case "RESET": {
      const reset = {
        ...state,
        adjustments: { ...DEFAULT_ADJUSTMENTS },
        activeFilter: "normal" as FilterPreset,
        rotation: 0,
        flipH: false,
        flipV: false,
      };
      return pushHistory(reset);
    }
    case "AUTO_ADJUST": {
      const auto = {
        ...state,
        adjustments: {
          ...state.adjustments,
          brightness: 5,
          contrast: 10,
          saturation: 8,
        },
      };
      return pushHistory(auto);
    }
    case "PUSH_HISTORY":
      return pushHistory(state);
    case "UNDO": {
      if (state.historyIndex <= 0) return state;
      const idx = state.historyIndex - 1;
      const entry = state.history[idx];
      return {
        ...state,
        adjustments: { ...entry.adjustments },
        activeFilter: entry.filter,
        rotation: entry.rotation,
        flipH: entry.flipH,
        flipV: entry.flipV,
        historyIndex: idx,
      };
    }
    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;
      const idx = state.historyIndex + 1;
      const entry = state.history[idx];
      return {
        ...state,
        adjustments: { ...entry.adjustments },
        activeFilter: entry.filter,
        rotation: entry.rotation,
        flipH: entry.flipH,
        flipV: entry.flipV,
        historyIndex: idx,
      };
    }
    case "SET_ACTIVE_PANEL":
      return { ...state, activePanel: action.panel };
    case "SET_TEXT_LAYERS":
      return { ...state, textLayers: action.layers };
    case "SET_STICKER_LAYERS":
      return { ...state, stickerLayers: action.layers };
    case "SET_BEFORE_IMAGE":
      return { ...state, beforeImageUrl: action.url };
    case "TOGGLE_BEFORE_AFTER":
      return { ...state, showBeforeAfter: !state.showBeforeAfter };
    case "SET_PREMIUM":
      return { ...state, isPremium: action.value };
    case "SET_BACKGROUND":
      return { ...state, backgroundUrl: action.url };
    default:
      return state;
  }
}

interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<Action>;
  buildFilterString: (adj: Adjustments, filter: FilterPreset) => string;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export const FILTER_DEFINITIONS: Record<FilterPreset, string> = {
  normal: "",
  cinematic: "contrast(1.1) brightness(0.9) saturate(0.7) sepia(0.1)",
  vivid: "saturate(1.6) contrast(1.1) brightness(1.05)",
  bw: "grayscale(1) contrast(1.1)",
  warm: "sepia(0.25) saturate(1.3) brightness(1.05)",
  cool: "hue-rotate(-20deg) saturate(0.85) brightness(1.05)",
  fade: "brightness(1.15) contrast(0.75) saturate(0.75)",
  chrome: "contrast(1.25) saturate(1.4) brightness(1.02)",
  vintage:
    "sepia(0.45) contrast(0.85) brightness(0.95) saturate(0.75) hue-rotate(-5deg)",
  hdr: "contrast(1.35) saturate(1.55) brightness(1.05)",
};

export function buildFilterString(
  adj: Adjustments,
  filter: FilterPreset,
): string {
  const b = 1 + adj.brightness / 100;
  const c = 1 + adj.contrast / 100;
  const s = 1 + adj.saturation / 100;
  const blur = adj.blur;
  const hue = adj.temperature * 0.4;
  const parts = [
    `brightness(${b.toFixed(3)})`,
    `contrast(${c.toFixed(3)})`,
    `saturate(${s.toFixed(3)})`,
    blur > 0 ? `blur(${blur.toFixed(1)}px)` : "",
    hue !== 0 ? `hue-rotate(${hue.toFixed(1)}deg)` : "",
    FILTER_DEFINITIONS[filter],
  ];
  return parts.filter(Boolean).join(" ");
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const buildFilter = useCallback(
    (adj: Adjustments, filter: FilterPreset) => buildFilterString(adj, filter),
    [],
  );

  return (
    <EditorContext.Provider
      value={{ state, dispatch, buildFilterString: buildFilter }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
}
