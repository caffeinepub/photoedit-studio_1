import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob, Project } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useListProjects() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<Project[]>({
    queryKey: ["projects", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.listUserProjects(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useCreateProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      photo,
    }: {
      id: string;
      name: string;
      photo: ExternalBlob;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.createProject(id, name, photo);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.deleteProject(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProjectName() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.updateProjectName(id, name);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
