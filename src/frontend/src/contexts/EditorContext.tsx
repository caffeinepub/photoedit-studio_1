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
  | "cinematiccold"
  | "vivid"
  | "bw"
  | "warm"
  | "cool"
  | "fade"
  | "chrome"
  | "vintage"
  | "hdr"
  | "matte"
  | "fuji"
  | "moody"
  | "lomo"
  | "clarendon"
  | "juno"
  | "lark"
  | "moon"
  | "gaminggreen"
  | "nightvision";

export type TextAnimation = "none" | "typing" | "glow" | "bounce" | "fadein";

export interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  sharpness: number;
  temperature: number;
  hue: number;
  grayscale: number;
  sepia: number;
  vignette: number;
  grain: number;
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
  fontStyle:
    | "normal"
    | "bold"
    | "neon"
    | "glitch"
    | "gradient"
    | "shadow"
    | "stroke"
    | "text3d";
  fontFamily:
    | "default"
    | "poppins"
    | "pacifico"
    | "orbitron"
    | "bebas"
    | "playfair";
  color: string;
  fontSize: number;
  x: number;
  y: number;
  align?: "left" | "center" | "right";
  letterSpacing?: number;
  textAnimation?: TextAnimation;
  rotation?: number;
  scale?: number;
}

export interface StickerLayer {
  id: string;
  content: string; // emoji or dataURL
  isCustom: boolean;
  x: number;
  y: number;
  size: number;
  rotation?: number;
  scale?: number;
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
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
  specialEffect: string | null;
  bgColor: string | null;
  selectedLayerId: string | null;
  selectedLayerType: "text" | "sticker" | null;
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
  | { type: "SET_BACKGROUND"; url: string | null }
  | { type: "SET_SPECIAL_EFFECT"; effect: string | null }
  | { type: "SET_BG_COLOR"; color: string | null }
  | {
      type: "SET_SELECTED_LAYER";
      id: string | null;
      layerType: "text" | "sticker" | null;
    }
  | { type: "UPDATE_TEXT_LAYER"; id: string; changes: Partial<TextLayer> }
  | {
      type: "UPDATE_STICKER_LAYER";
      id: string;
      changes: Partial<StickerLayer>;
    };

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
  specialEffect: null,
  bgColor: null,
  selectedLayerId: null,
  selectedLayerType: null,
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
        specialEffect: null,
        bgColor: null,
      };
      return pushHistory(reset);
    }
    case "AUTO_ADJUST": {
      const auto = {
        ...state,
        adjustments: {
          ...state.adjustments,
          brightness: 10,
          contrast: 20,
          saturation: 30,
          hue: 0,
          grayscale: 0,
          sepia: 0,
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
    case "SET_SPECIAL_EFFECT":
      return { ...state, specialEffect: action.effect };
    case "SET_BG_COLOR":
      return { ...state, bgColor: action.color };
    case "SET_SELECTED_LAYER":
      return {
        ...state,
        selectedLayerId: action.id,
        selectedLayerType: action.layerType,
      };
    case "UPDATE_TEXT_LAYER":
      return {
        ...state,
        textLayers: state.textLayers.map((l) =>
          l.id === action.id ? { ...l, ...action.changes } : l,
        ),
      };
    case "UPDATE_STICKER_LAYER":
      return {
        ...state,
        stickerLayers: state.stickerLayers.map((l) =>
          l.id === action.id ? { ...l, ...action.changes } : l,
        ),
      };
    default:
      return state;
  }
}

interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<Action>;
  buildFilterString: (
    adj: Adjustments,
    filter: FilterPreset,
    specialEffect?: string | null,
  ) => string;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export const FILTER_DEFINITIONS: Record<FilterPreset, string> = {
  normal: "",
  cinematic: "contrast(1.15) brightness(0.88) saturate(0.65) sepia(0.12)",
  cinematiccold:
    "contrast(1.25) brightness(0.92) saturate(0.75) hue-rotate(-20deg)",
  vivid: "saturate(1.6) contrast(1.1) brightness(1.05)",
  bw: "grayscale(1) contrast(1.1)",
  warm: "sepia(0.25) saturate(1.3) brightness(1.05)",
  cool: "hue-rotate(-20deg) saturate(0.85) brightness(1.05)",
  fade: "brightness(1.15) contrast(0.75) saturate(0.75)",
  chrome: "contrast(1.25) saturate(1.4) brightness(1.02)",
  vintage:
    "sepia(0.45) contrast(0.85) brightness(0.95) saturate(0.75) hue-rotate(-5deg)",
  hdr: "contrast(1.45) saturate(1.65) brightness(1.05) sharpness(1.2)",
  matte: "brightness(1.05) contrast(0.9) saturate(0.8) sepia(0.1)",
  fuji: "saturate(1.2) brightness(1.02) contrast(0.95) hue-rotate(5deg)",
  moody: "brightness(0.85) contrast(1.2) saturate(0.7) hue-rotate(-10deg)",
  lomo: "contrast(1.3) saturate(1.4) brightness(0.9) sepia(0.15)",
  clarendon: "contrast(1.2) saturate(1.5) brightness(1.03)",
  juno: "sepia(0.08) contrast(1.1) saturate(1.3) brightness(1.05) hue-rotate(5deg)",
  lark: "brightness(1.1) saturate(0.9) contrast(0.95) hue-rotate(3deg)",
  moon: "grayscale(1) contrast(1.2) brightness(1.05)",
  gaminggreen:
    "hue-rotate(100deg) saturate(1.6) contrast(1.35) brightness(0.95)",
  nightvision: "hue-rotate(80deg) saturate(1.8) contrast(1.5) brightness(0.9)",
};

const SPECIAL_EFFECT_FILTERS: Record<string, string> = {
  blur: "blur(5px)",
  sharp: "contrast(150%)",
  glow: "drop-shadow(0 0 10px cyan)",
  invert: "invert(100%)",
};

export function buildFilterString(
  adj: Adjustments,
  filter: FilterPreset,
  specialEffect?: string | null,
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
    adj.hue !== 0 ? `hue-rotate(${adj.hue}deg)` : "",
    adj.grayscale !== 0 ? `grayscale(${adj.grayscale}%)` : "",
    adj.sepia !== 0 ? `sepia(${adj.sepia}%)` : "",
    FILTER_DEFINITIONS[filter],
    specialEffect ? (SPECIAL_EFFECT_FILTERS[specialEffect] ?? "") : "",
  ];
  return parts.filter(Boolean).join(" ");
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const buildFilter = useCallback(
    (adj: Adjustments, filter: FilterPreset, specialEffect?: string | null) =>
      buildFilterString(adj, filter, specialEffect),
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
