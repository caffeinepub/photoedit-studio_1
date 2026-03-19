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
import { useEditor } from "@/contexts/EditorContext";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useCreateProject } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import {
  Camera,
  Crown,
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
    // Reset input so same file can be re-selected
    e.target.value = "";
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
    // Apply random filter
    const filter =
      VIRAL_FILTERS[Math.floor(Math.random() * VIRAL_FILTERS.length)];
    dispatch({ type: "SET_FILTER", filter });

    // Add random text
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

    // Add 2 random stickers
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
      <div className="flex items-center gap-2">
        {/* New Photo Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleNewPhoto}
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
        </TooltipProvider>

        {/* Auto Viral Edit */}
        {state.imageUrl && (
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
        )}

        {/* Before/After toggle */}
        {state.imageUrl && (
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
        )}
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
