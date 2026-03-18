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
  Layers2,
  Loader2,
  LogIn,
  LogOut,
  Save,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

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

  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

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

  return (
    <header
      className="flex items-center justify-between px-4 border-b border-border flex-shrink-0"
      style={{ height: 52, backgroundColor: "oklch(0.19 0.022 222)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <Camera className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground tracking-wide">
          PhotoEdit Studio
        </span>
        {state.isPremium && (
          <Badge
            className="text-[9px] h-4 px-1.5 gap-0.5"
            style={{ background: "oklch(0.55 0.18 60)", color: "white" }}
          >
            <Crown className="w-2.5 h-2.5" /> PRO
          </Badge>
        )}
      </div>

      {/* Center: Before/After toggle */}
      {state.imageUrl && (
        <button
          type="button"
          onClick={() => dispatch({ type: "TOGGLE_BEFORE_AFTER" })}
          className={cn(
            "flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium border transition-all",
            state.showBeforeAfter
              ? "border-primary bg-primary/20 text-primary"
              : "border-border bg-card/40 text-muted-foreground hover:text-foreground",
          )}
          data-ocid="header.before_after.toggle"
        >
          <Layers2 className="w-3.5 h-3.5" />
          Before / After
        </button>
      )}

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
                  style={{ background: "oklch(0.55 0.18 60)", color: "white" }}
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
            Sign Out
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
