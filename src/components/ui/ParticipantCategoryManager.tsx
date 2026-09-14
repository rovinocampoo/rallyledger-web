import { useState, type SubmitEvent } from "react";
import {
  createParticipantCategory,
  deleteParticipantCategory,
  updateParticipantCategory,
} from "../../api/participantCategories";
import type { ParticipantCategory } from "../../types/participantCategory";

type ParticipantCategoryManagerProps = {
  categories: ParticipantCategory[];
  canManage: boolean;
  onChanged: () => void;
  onClose: () => void;
};

function ParticipantCategoryManager({
  categories,
  canManage,
  onChanged,
  onClose,
}: ParticipantCategoryManagerProps) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingActive, setEditingActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      await createParticipantCategory({
        name,
        isActive: true,
      });
      setName("");
      await onChanged();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to create category",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(category: ParticipantCategory) {
    try {
      setSubmitting(true);
      setError(null);
      await updateParticipantCategory(category.id, {
        name: editingName,
        isActive: editingActive,
      });
      setEditingId(null);
      await onChanged();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to update category",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(category: ParticipantCategory) {
    const confirmed = window.confirm(`Delete ${category.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await deleteParticipantCategory(category.id);
      await onChanged();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to delete category",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div className="flex items-start justify-between gap-4 text-left">
        <div>
          <h2 className="text-lg font-semibold">Participant Categories</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Categories belong to the current organization and can have separate
            fee rules.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
        >
          Close
        </button>
      </div>

      {error && <p className="mt-4 text-left text-sm text-red-400">{error}</p>}

      <form
        onSubmit={handleCreate}
        className="mt-5 flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New category name"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
        />
        {canManage && (
          <button
            type="submit"
            disabled={submitting}
            className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Add Category
          </button>
        )}
      </form>

      <div className="mt-5 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        {categories.map((category) => (
          <div
            key={category.id}
            className="border-b border-zinc-200 p-3 text-left last:border-b-0 dark:border-zinc-800"
          >
            {canManage && editingId === category.id ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                />

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editingActive}
                    disabled={category.isSystem}
                    onChange={(event) => setEditingActive(event.target.checked)}
                  />
                  Active
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleUpdate(category)}
                    className="primary-action rounded-lg px-3 py-2 text-sm disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="secondary-action rounded-lg px-3 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{category.name}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {category.code}
                    {category.isSystem ? " · System" : ""}
                    {!category.isActive ? " · Inactive" : ""}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(category.id);
                          setEditingName(category.name);
                          setEditingActive(category.isActive);
                          setError(null);
                        }}
                        className="secondary-action rounded-lg px-3 py-1.5 text-sm"
                      >
                        Edit
                      </button>
                      {!category.isSystem && (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void handleDelete(category)}
                          className="danger-action rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default ParticipantCategoryManager;
