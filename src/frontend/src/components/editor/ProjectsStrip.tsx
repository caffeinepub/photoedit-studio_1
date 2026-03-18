import type { Project } from "@/backend";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEditor } from "@/contexts/EditorContext";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useDeleteProject, useListProjects } from "@/hooks/useQueries";
import { FolderOpen, Loader2, LogIn, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { dispatch } = useEditor();
  const deleteProject = useDeleteProject();
  const [deleting, setDeleting] = useState(false);
  const imageUrl = project.photo.getDirectURL();

  function handleLoad() {
    dispatch({ type: "LOAD_IMAGE", url: imageUrl, name: project.name });
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setDeleting(false);
    }
  }

  const dateStr = new Date(
    Number(project.lastModified) / 1_000_000,
  ).toLocaleDateString();

  return (
    <div
      className="flex-shrink-0 w-36 group relative rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
      style={{ backgroundColor: "oklch(0.16 0.018 222)" }}
      data-ocid={`projects.item.${index + 1}`}
    >
      <button
        type="button"
        className="w-full text-left cursor-pointer"
        onClick={handleLoad}
        onKeyDown={(e) => e.key === "Enter" && handleLoad()}
      >
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="px-2 py-1.5">
          <p className="text-[11px] font-medium text-foreground truncate">
            {project.name}
          </p>
          <p className="text-[10px] text-muted-foreground">{dateStr}</p>
        </div>
      </button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-destructive text-foreground hover:text-destructive-foreground transition-all"
            disabled={deleting}
            data-ocid={`projects.delete_button.${index + 1}`}
          >
            {deleting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent
          className="bg-card border-border text-foreground"
          data-ocid="delete_project.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete &quot;{project.name}&quot;. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border"
              data-ocid="delete_project.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              data-ocid="delete_project.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ProjectsStrip() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const { data: projects, isLoading } = useListProjects();
  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  if (!isLoggedIn) {
    return (
      <div
        className="border-t border-border px-6 py-4 flex items-center gap-4"
        style={{ backgroundColor: "oklch(0.16 0.018 222)" }}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <FolderOpen className="w-4 h-4" />
          <span className="text-xs">
            Sign in to save and access your projects
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground"
          onClick={login}
          disabled={isLoggingIn}
          data-ocid="projects.signin.button"
        >
          {isLoggingIn ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <LogIn className="w-3 h-3" />
          )}
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div
      className="border-t border-border px-4 py-3"
      style={{ backgroundColor: "oklch(0.16 0.018 222)" }}
      data-ocid="projects.panel"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Recent Projects
        </span>
        {projects && projects.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-3" data-ocid="projects.loading_state">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton count
            <Skeleton key={i} className="w-36 h-28 rounded-lg" />
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      ) : (
        <div
          className="flex items-center gap-2 text-muted-foreground py-2"
          data-ocid="projects.empty_state"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="text-xs">
            No saved projects yet. Edit an image and save your work!
          </span>
        </div>
      )}
    </div>
  );
}
