import { ExternalBlob } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { buildFilterString, useEditor } from "@/contexts/EditorContext";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useCreateProject } from "@/hooks/useQueries";
import type { VoiceAction } from "@/hooks/useVoiceCommands";
import { cn } from "@/lib/utils";
import {
  Camera,
  Crown,
  Download,
  ImagePlus,
  Layers2,
  Loader2,
  LogIn,
  LogOut,
  Save,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import VoiceCommandButton from "./VoiceCommandButton";

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const VIRAL_FILTERS = [
  "cinematic",
  "vivid",
  "chrome",
  "vintage",
  "hdr",
  "clarendon",
  "juno",
] as const;
const VIRAL_TEXTS = [
  "VIBES ✨",
  "🔥 FIRE 🔥",
  "NO CAP 💯",
  "GLOW UP ✨",
  "ICONIC 👑",
  "BEAST MODE 💪",
];
const VIRAL_STICKERS = ["🔥", "✨", "💯", "👑", "🎉", "😍", "🌟", "⚡"];
const VIRAL_FONTS = ["poppins", "orbitron", "bebas"] as const;
const VIRAL_STYLES = ["neon", "gradient", "shadow"] as const;
const RANDOM_STICKERS = ["🔥", "✨", "💯", "👑", "😍"];

const FONT_MAP: Record<string, string> = {
  default: "sans-serif",
  poppins: "'Poppins', sans-serif",
  pacifico: "'Pacifico', cursive",
  orbitron: "'Orbitron', sans-serif",
  bebas: "'Bebas Neue', sans-serif",
  playfair: "'Playfair Display', serif",
};

export default function EditorHeader() {
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const { state, dispatch } = useEditor();
  const createProject = useCreateProject();
  const [saveOpen, setSaveOpen] = useState(false);
  const [projectName, setProjectName] = useState(
    state.imageName || "My Project",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  function handleNewPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      dispatch({
        type: "LOAD_IMAGE",
        url: reader.result as string,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleDownload() {
    if (!state.imageUrl) {
      toast.error("Upload an image first!");
      return;
    }
    setIsDownloading(true);
    try {
      const baseImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = state.imageUrl as string;
      });

      const canvas = document.createElement("canvas");
      canvas.width = baseImg.naturalWidth;
      canvas.height = baseImg.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      const filterStr = buildFilterString(
        state.adjustments,
        state.activeFilter,
        state.specialEffect,
      );
      if (filterStr) {
        ctx.filter = filterStr;
      }

      ctx.save();
      if (state.flipH || state.flipV) {
        ctx.translate(
          state.flipH ? canvas.width : 0,
          state.flipV ? canvas.height : 0,
        );
        ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
      }
      ctx.drawImage(baseImg, 0, 0);
      ctx.restore();
      ctx.filter = "none";

      for (const layer of state.stickerLayers) {
        const px = (layer.x / 100) * canvas.width;
        const py = (layer.y / 100) * canvas.height;
        const sz = layer.size * (canvas.width / 500);

        if (layer.isCustom) {
          try {
            const stickerImg = await new Promise<HTMLImageElement>(
              (resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = layer.content;
              },
            );
            ctx.save();
            if (layer.rotation) {
              ctx.translate(px, py);
              ctx.rotate((layer.rotation * Math.PI) / 180);
              ctx.drawImage(stickerImg, -sz / 2, -sz / 2, sz, sz);
            } else {
              ctx.drawImage(stickerImg, px - sz / 2, py - sz / 2, sz, sz);
            }
            ctx.restore();
          } catch {
            // Skip sticker if image load fails
          }
        } else {
          ctx.save();
          ctx.font = `${sz}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          if (layer.rotation) {
            ctx.translate(px, py);
            ctx.rotate((layer.rotation * Math.PI) / 180);
            ctx.fillText(layer.content, 0, 0);
          } else {
            ctx.fillText(layer.content, px, py);
          }
          ctx.restore();
        }
      }

      for (const layer of state.textLayers) {
        const px = (layer.x / 100) * canvas.width;
        const py = (layer.y / 100) * canvas.height;
        const fs = layer.fontSize * (canvas.width / 500);
        const fontFamily = FONT_MAP[layer.fontFamily] || "sans-serif";

        ctx.save();
        ctx.font = `${layer.fontStyle === "bold" ? "bold" : ""} ${fs}px ${fontFamily}`;
        ctx.textAlign = layer.align || "center";
        ctx.textBaseline = "middle";

        if (layer.rotation) {
          ctx.translate(px, py);
          ctx.rotate((layer.rotation * Math.PI) / 180);
        } else {
          ctx.translate(px, py);
        }

        switch (layer.fontStyle) {
          case "neon":
            ctx.fillStyle = "#fff";
            ctx.shadowColor = "cyan";
            ctx.shadowBlur = 20;
            ctx.fillText(layer.text, 0, 0);
            break;
          case "gradient": {
            const grad = ctx.createLinearGradient(-fs * 2, 0, fs * 2, 0);
            grad.addColorStop(0, "red");
            grad.addColorStop(1, "blue");
            ctx.fillStyle = grad;
            ctx.fillText(layer.text, 0, 0);
            break;
          }
          case "shadow":
            ctx.shadowColor = "rgba(0,0,0,0.7)";
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            ctx.fillStyle = layer.color || "#ffffff";
            ctx.fillText(layer.text, 0, 0);
            break;
          case "stroke":
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.strokeText(layer.text, 0, 0);
            ctx.fillStyle = layer.color || "#ffffff";
            ctx.fillText(layer.text, 0, 0);
            break;
          case "text3d":
            ctx.fillStyle = "#555";
            ctx.fillText(layer.text, 4, 4);
            ctx.fillStyle = "#000";
            ctx.fillText(layer.text, 2, 2);
            ctx.fillStyle = layer.color || "#ffffff";
            ctx.fillText(layer.text, 0, 0);
            break;
          case "glitch":
            ctx.fillStyle = "rgba(255,0,0,0.7)";
            ctx.fillText(layer.text, -2, 0);
            ctx.fillStyle = "rgba(0,255,255,0.7)";
            ctx.fillText(layer.text, 2, 0);
            ctx.fillStyle = layer.color || "#ffffff";
            ctx.fillText(layer.text, 0, 0);
            break;
          default:
            ctx.fillStyle = layer.color || "#ffffff";
            ctx.fillText(layer.text, 0, 0);
        }
        ctx.restore();
      }

      const pngData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "edited-photo.png";
      link.href = pngData;
      link.click();
      toast.success("Downloaded as PNG! 🎉");
    } catch (err) {
      console.error(err);
      toast.error("Download failed. Try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleSave() {
    if (!state.imageUrl) return;
    setIsSaving(true);
    try {
      const res = await fetch(state.imageUrl);
      const arr = await res.arrayBuffer();
      const blob = ExternalBlob.fromBytes(new Uint8Array(arr));
      await createProject.mutateAsync({
        id: generateId(),
        name: projectName,
        photo: blob,
      });
      toast.success("Project saved!");
      setSaveOpen(false);
    } catch {
      toast.error("Failed to save project");
    } finally {
      setIsSaving(false);
    }
  }

  function autoViralEdit() {
    if (!state.imageUrl) {
      toast.error("Upload an image first!");
      return;
    }
    const filter =
      VIRAL_FILTERS[Math.floor(Math.random() * VIRAL_FILTERS.length)];
    dispatch({ type: "SET_FILTER", filter });

    const textContent =
      VIRAL_TEXTS[Math.floor(Math.random() * VIRAL_TEXTS.length)];
    const fontFamily =
      VIRAL_FONTS[Math.floor(Math.random() * VIRAL_FONTS.length)];
    const fontStyle =
      VIRAL_STYLES[Math.floor(Math.random() * VIRAL_STYLES.length)];
    const textLayer = {
      id: `viral-text-${Date.now()}`,
      text: textContent,
      fontStyle,
      fontFamily,
      color: "#ffffff",
      fontSize: 48,
      x: 50,
      y: 80,
      align: "center" as const,
      letterSpacing: 2,
      textAnimation: "fadein" as const,
    };
    dispatch({
      type: "SET_TEXT_LAYERS",
      layers: [...state.textLayers, textLayer],
    });

    const usedIndices: number[] = [];
    for (let i = 0; i < 2; i++) {
      let idx: number;
      do {
        idx = Math.floor(Math.random() * VIRAL_STICKERS.length);
      } while (usedIndices.includes(idx));
      usedIndices.push(idx);
      const stickerLayer = {
        id: `viral-sticker-${Date.now()}-${i}`,
        content: VIRAL_STICKERS[idx],
        isCustom: false,
        x: 20 + Math.random() * 60,
        y: 10 + Math.random() * 40,
        size: 56,
      };
      dispatch({
        type: "SET_STICKER_LAYERS",
        layers: [...state.stickerLayers, stickerLayer],
      });
    }

    dispatch({ type: "PUSH_HISTORY" });
    toast.success("Auto Viral Edit applied! 🔥 Ready for Instagram!");
  }

  function handleVoiceCommand(action: VoiceAction | null) {
    if (!action) {
      toast.error("Samajh nahi aaya, dobara bolo 🎤");
      return;
    }

    switch (action.type) {
      case "SET_ADJUSTMENT": {
        const current = state.adjustments[action.key] ?? 0;
        const next = Math.max(-100, Math.min(100, current + action.value));
        dispatch({ type: "SET_ADJUSTMENT", key: action.key, value: next });
        const dir = action.value > 0 ? "badha diya" : "kam kar diya";
        const keyLabel =
          action.key === "brightness"
            ? "Brightness"
            : action.key === "contrast"
              ? "Contrast"
              : "Saturation";
        toast.success(`${keyLabel} ${dir}! 🎤`);
        break;
      }
      case "SET_FILTER":
        dispatch({ type: "SET_FILTER", filter: action.filter });
        toast.success(`${action.filter} filter laga diya! 🎬`);
        break;
      case "SET_SPECIAL_EFFECT":
        dispatch({ type: "SET_SPECIAL_EFFECT", effect: action.effect });
        toast.success(`${action.effect} effect laga diya! ✨`);
        break;
      case "UNDO":
        dispatch({ type: "UNDO" });
        toast.success("Undo ho gaya! ↩️");
        break;
      case "RESET":
        dispatch({ type: "RESET" });
        toast.success("Reset ho gaya! 🔄");
        break;
      case "TOGGLE_BEFORE_AFTER":
        dispatch({ type: "TOGGLE_BEFORE_AFTER" });
        toast.success("Before/After toggle ho gaya! 👁️");
        break;
      case "ROTATE_90":
        dispatch({ type: "ROTATE_90", dir: action.dir });
        toast.success("Rotate ho gaya! 🔄");
        break;
      case "FLIP_H":
        dispatch({ type: "FLIP_H" });
        toast.success("Flip ho gaya! ↔️");
        break;
      case "CUSTOM":
        handleCustomCommand(action.command);
        break;
    }
  }

  function handleCustomCommand(command: string) {
    switch (command) {
      case "ADD_NEON_TEXT": {
        const neonLayer = {
          id: `voice-neon-${Date.now()}`,
          text: "Neon ✨",
          fontStyle: "neon" as const,
          fontFamily: "orbitron" as const,
          color: "#fff",
          fontSize: 48,
          x: 50,
          y: 50,
          align: "center" as const,
        };
        dispatch({
          type: "SET_TEXT_LAYERS",
          layers: [...state.textLayers, neonLayer],
        });
        toast.success("Neon text add ho gaya! 🌟");
        break;
      }
      case "ADD_TEXT": {
        const textLayer = {
          id: `voice-text-${Date.now()}`,
          text: "Your Text",
          fontStyle: "normal" as const,
          fontFamily: "poppins" as const,
          color: "#ffffff",
          fontSize: 36,
          x: 50,
          y: 50,
          align: "center" as const,
        };
        dispatch({
          type: "SET_TEXT_LAYERS",
          layers: [...state.textLayers, textLayer],
        });
        toast.success("Text add ho gaya! ✍️");
        break;
      }
      case "ADD_STICKER": {
        const emoji =
          RANDOM_STICKERS[Math.floor(Math.random() * RANDOM_STICKERS.length)];
        const stickerLayer = {
          id: `voice-sticker-${Date.now()}`,
          content: emoji,
          isCustom: false,
          x: 30 + Math.random() * 40,
          y: 20 + Math.random() * 60,
          size: 56,
        };
        dispatch({
          type: "SET_STICKER_LAYERS",
          layers: [...state.stickerLayers, stickerLayer],
        });
        toast.success(`Sticker ${emoji} add ho gaya! 😎`);
        break;
      }
      case "AUTO_VIRAL":
        autoViralEdit();
        break;
    }
  }

  return (
    <header
      className="flex items-center justify-between px-4 border-b border-border flex-shrink-0"
      style={{ height: 52, backgroundColor: "oklch(0.13 0.010 20)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.65 0.22 15), oklch(0.72 0.18 55))",
          }}
        >
          <Camera className="w-4 h-4" style={{ color: "oklch(0.98 0 0)" }} />
        </div>
        <span className="gradient-text font-display font-bold text-base tracking-wide">
          PhotoEdit Studio
        </span>
        {state.isPremium && (
          <Badge
            className="text-[9px] h-4 px-1.5 gap-0.5"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.65 0.22 15))",
              color: "white",
            }}
          >
            <Crown className="w-2.5 h-2.5" /> PRO
          </Badge>
        )}
      </div>

      {/* Center buttons */}
      <div className="flex items-center gap-1.5">
        {/* New Photo Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleNewPhoto}
          id="uploadImage"
          data-ocid="header.upload.input"
        />
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-semibold border transition-all hover:opacity-90"
                style={{
                  background: "oklch(0.18 0.015 20)",
                  borderColor: "oklch(0.65 0.22 15 / 0.6)",
                  color: "oklch(0.75 0.15 15)",
                }}
                data-ocid="header.upload.button"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Photo</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Upload a new photo</TooltipContent>
          </Tooltip>

          {/* Download PNG */}
          {state.imageUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-semibold border transition-all hover:opacity-90 disabled:opacity-60"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.45 0.18 145), oklch(0.4 0.16 165))",
                    borderColor: "oklch(0.5 0.18 145 / 0.5)",
                    color: "white",
                  }}
                  data-ocid="header.download.button"
                >
                  {isDownloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Download PNG</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Download as PNG (bakes all layers)
              </TooltipContent>
            </Tooltip>
          )}

          {/* Auto Viral Edit */}
          {state.imageUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={autoViralEdit}
                  className="flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-bold border transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.6 0.25 45), oklch(0.55 0.28 20))",
                    borderColor: "oklch(0.65 0.25 45 / 0.5)",
                    color: "white",
                  }}
                  data-ocid="header.auto_viral.button"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Auto Viral</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Auto Viral Edit</TooltipContent>
            </Tooltip>
          )}

          {/* Before/After toggle */}
          {state.imageUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "TOGGLE_BEFORE_AFTER" })}
                  className={cn(
                    "flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium border transition-all",
                    state.showBeforeAfter
                      ? "border-primary bg-primary/20 text-primary glow-primary"
                      : "border-border bg-card/40 text-muted-foreground hover:text-foreground",
                  )}
                  data-ocid="header.before_after.toggle"
                >
                  <Layers2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Before / After</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Before / After</TooltipContent>
            </Tooltip>
          )}

          {/* Voice Command Button */}
          <VoiceCommandButton onCommand={handleVoiceCommand} />
        </TooltipProvider>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <TooltipProvider delayDuration={300}>
          {state.imageUrl && isLoggedIn && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setProjectName(state.imageName || "My Project");
                    setSaveOpen(true);
                  }}
                  data-ocid="header.save.button"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Project</TooltipContent>
            </Tooltip>
          )}

          {!state.isPremium && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.65 0.22 15))",
                    color: "white",
                  }}
                  onClick={() => dispatch({ type: "SET_PREMIUM", value: true })}
                  data-ocid="header.upgrade.button"
                >
                  <Crown className="w-3 h-3" />
                  Upgrade
                </Button>
              </TooltipTrigger>
              <TooltipContent>Unlock Premium Features</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>

        {isLoggedIn ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 text-xs gap-1.5"
            onClick={clear}
            data-ocid="header.logout.button"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            data-ocid="header.signin.button"
          >
            {isLoggingIn ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogIn className="w-3.5 h-3.5" />
            )}
            Sign In
          </Button>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent
          className="bg-card border-border text-foreground"
          data-ocid="save_project.dialog"
        >
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Project Name
            </Label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-input border-border"
              placeholder="Enter project name..."
              data-ocid="save_project.input"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSaveOpen(false)}
              data-ocid="save_project.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground"
              onClick={handleSave}
              disabled={isSaving || !projectName.trim()}
              data-ocid="save_project.confirm_button"
            >
              {isSaving && (
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
