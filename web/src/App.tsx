import { type FormEvent, useState } from "react";
import {
  getGetItemsQueryKey,
  useDeleteItemsId,
  useGetItems,
  usePatchItemsId,
  usePostItems,
} from "./api";
import { useQueryClient } from "@tanstack/react-query";

interface ResourceForm {
  title: string;
  description: string;
  resourceType: string;
}

const emptyForm = (): ResourceForm => ({ title: "", description: "", resourceType: "" });

export default function App() {
  const [createForm, setCreateForm] = useState<ResourceForm>(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ResourceForm>(emptyForm());
  const [search, setSearch] = useState("");

  const queryClient = useQueryClient();
  const searchParam = search.trim() || undefined;
  const refreshItems = () =>
    queryClient.invalidateQueries({ queryKey: getGetItemsQueryKey(searchParam ? { search: searchParam } : undefined) });

  const itemsQuery = useGetItems(searchParam ? { search: searchParam } : undefined);

  const createMutation = usePostItems({
    mutation: {
      onSuccess: async () => {
        setCreateForm(emptyForm());
        await refreshItems();
      },
    },
  });

  const deleteMutation = useDeleteItemsId({
    mutation: { onSuccess: refreshItems },
  });

  const updateMutation = usePatchItemsId({
    mutation: {
      onSuccess: async () => {
        setEditingId(null);
        await refreshItems();
      },
    },
  });

  const resources = itemsQuery.data?.items ?? [];
  const deletingId = deleteMutation.variables?.id;

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = createForm.title.trim();
    if (!title || createMutation.isPending) return;
    createMutation.mutate({
      data: {
        title,
        description: createForm.description.trim() || null,
        resourceType: createForm.resourceType.trim() || null,
      },
    });
  };

  const startEdit = (resource: { id: number; title: string; description: string | null; resourceType: string | null }) => {
    setEditingId(resource.id);
    setEditForm({
      title: resource.title,
      description: resource.description ?? "",
      resourceType: resource.resourceType ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm());
  };

  const handleSave = (id: number) => {
    const title = editForm.title.trim();
    if (!title || updateMutation.isPending) return;
    updateMutation.mutate({
      id,
      data: {
        title,
        description: editForm.description.trim() || null,
        resourceType: editForm.resourceType.trim() || null,
      },
    });
  };

  return (
    <main className="min-h-screen bg-[#f4f7fa] px-4 py-10 text-[#18293d]">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold text-[#18293d]">Resources</h1>
          <p className="text-sm text-[#4c637a]">
            Add, edit, and remove bookable resources.
          </p>
        </header>

        {/* Create form */}
        <form
          className="flex flex-col gap-3 rounded-lg border border-[#cdd7e0] bg-white p-4"
          onSubmit={handleCreate}
        >
          <input
            value={createForm.title}
            onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Resource name"
            maxLength={120}
            className="rounded-md border border-[#cdd7e0] px-3 py-2 text-sm outline-none focus:border-[#1b3d5e]"
          />
          <input
            value={createForm.resourceType}
            onChange={(e) => setCreateForm((f) => ({ ...f, resourceType: e.target.value }))}
            placeholder="Type / category (e.g. Room, Vehicle)"
            maxLength={60}
            className="rounded-md border border-[#cdd7e0] px-3 py-2 text-sm outline-none focus:border-[#1b3d5e]"
          />
          <textarea
            value={createForm.description}
            onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            maxLength={500}
            rows={2}
            className="rounded-md border border-[#cdd7e0] px-3 py-2 text-sm outline-none focus:border-[#1b3d5e] resize-none"
          />
          <button
            type="submit"
            disabled={!createForm.title.trim() || createMutation.isPending}
            className="rounded-md bg-[#1b3d5e] px-4 py-2 text-sm font-medium text-white hover:bg-[#153050] disabled:cursor-not-allowed disabled:bg-[#9aabb8]"
          >
            {createMutation.isPending ? "Adding..." : "Add resource"}
          </button>
        </form>

        {createMutation.isError && (
          <p className="text-sm text-[#b91c1c]">
            Could not add the resource: {createMutation.error.message}
          </p>
        )}
        {deleteMutation.isError && (
          <p className="text-sm text-[#b91c1c]">
            Could not remove the resource: {deleteMutation.error.message}
          </p>
        )}
        {updateMutation.isError && (
          <p className="text-sm text-[#b91c1c]">
            Could not update the resource: {updateMutation.error.message}
          </p>
        )}

        {/* Resource list */}
        <section className="rounded-lg border border-[#cdd7e0] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[#18293d]">Resources</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources…"
              className="rounded-md border border-[#cdd7e0] px-3 py-1.5 text-sm outline-none focus:border-[#1b3d5e] w-48"
            />
          </div>

          {itemsQuery.isPending && (
            <p className="mt-3 text-sm text-[#4c637a]">Loading resources...</p>
          )}
          {itemsQuery.isError && (
            <p className="mt-3 text-sm text-[#b91c1c]">
              Could not load resources: {itemsQuery.error.message}
            </p>
          )}

          {!itemsQuery.isPending && !itemsQuery.isError && (
            resources.length > 0 ? (
              <ul className="mt-3 divide-y divide-[#cdd7e0]">
                {resources.map((resource) =>
                  editingId === resource.id ? (
                    /* Inline edit row */
                    <li key={resource.id} className="flex flex-col gap-2 py-3">
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Resource name"
                        maxLength={120}
                        className="rounded-md border border-[#cdd7e0] px-3 py-2 text-sm outline-none focus:border-[#1b3d5e]"
                      />
                      <input
                        value={editForm.resourceType}
                        onChange={(e) => setEditForm((f) => ({ ...f, resourceType: e.target.value }))}
                        placeholder="Type / category"
                        maxLength={60}
                        className="rounded-md border border-[#cdd7e0] px-3 py-2 text-sm outline-none focus:border-[#1b3d5e]"
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Description"
                        maxLength={500}
                        rows={2}
                        className="rounded-md border border-[#cdd7e0] px-3 py-2 text-sm outline-none focus:border-[#1b3d5e] resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSave(resource.id)}
                          disabled={!editForm.title.trim() || updateMutation.isPending}
                          className="rounded-md bg-[#1b3d5e] px-3 py-1 text-sm font-medium text-white hover:bg-[#153050] disabled:cursor-not-allowed disabled:bg-[#9aabb8]"
                        >
                          {updateMutation.isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={updateMutation.isPending}
                          className="rounded-md border border-[#cdd7e0] px-3 py-1 text-sm text-[#18293d] hover:bg-[#f4f7fa] disabled:cursor-not-allowed disabled:text-[#9aabb8]"
                        >
                          Cancel
                        </button>
                      </div>
                    </li>
                  ) : (
                    /* Normal row */
                    <li key={resource.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium text-[#18293d] truncate">{resource.title}</p>
                        {resource.resourceType && (
                          <span className="inline-block bg-[#e4ecf4] text-[#1b3d5e] text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded">
                            {resource.resourceType}
                          </span>
                        )}
                        {resource.description && (
                          <p className="text-sm text-[#4c637a]">{resource.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(resource)}
                          disabled={deleteMutation.isPending && deletingId === resource.id}
                          className="rounded-md border border-[#cdd7e0] px-3 py-1 text-sm text-[#18293d] hover:bg-[#f4f7fa] disabled:cursor-not-allowed disabled:text-[#9aabb8]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate({ id: resource.id })}
                          disabled={deleteMutation.isPending}
                          className="rounded-md border border-[#cdd7e0] px-3 py-1 text-sm text-[#18293d] hover:bg-[#f4f7fa] disabled:cursor-not-allowed disabled:text-[#9aabb8]"
                        >
                          {deleteMutation.isPending && deletingId === resource.id
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[#4c637a]">
                {search.trim() ? "No resources match your search." : "No resources yet."}
              </p>
            )
          )}
        </section>
      </div>
    </main>
  );
}
