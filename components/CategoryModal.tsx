"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createCategory, renameCategory, deleteCategory } from "@/app/actions";
import type { Category } from "@/app/generated/prisma/client";

const CATEGORY_COLOURS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6",
  "#3B82F6", "#8B5CF6", "#EC4899", "#78716C", "#A855F7",
] as const;

interface CategoryModalProps {
  categories: Category[];
}

export function CategoryModal({ categories }: CategoryModalProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColour, setNewColour] = useState<string>(CATEGORY_COLOURS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const newNameRef = useRef<HTMLInputElement>(null);
  const editNameRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setEditingId(null);
    setEditName("");
    setNewName("");
    setNewColour(CATEGORY_COLOURS[0]);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("keydown", onKeyDown);
    // Focus the add input when modal opens
    newNameRef.current?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  function startEditing(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    // Focus the edit input on next tick
    setTimeout(() => editNameRef.current?.focus(), 0);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
  }

  async function handleCreate(formData: FormData) {
    await createCategory(formData);
    setNewName("");
    setNewColour(CATEGORY_COLOURS[0]);
    newNameRef.current?.focus();
  }

  async function handleRename(formData: FormData) {
    await renameCategory(formData);
    cancelEditing();
  }

  async function handleDelete(id: number) {
    const formData = new FormData();
    formData.append("id", id.toString());
    await deleteCategory(formData);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
      >
        Manage categories
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={(e) => {
          if (e.target === overlayRef.current) close();
        }}
      >
        {/* Modal card */}
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Categories
            </h2>
            <button
              type="button"
              onClick={close}
              className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Existing categories */}
          {categories.length > 0 && (
            <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center gap-2 rounded-lg p-1.5"
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.colour }}
                  />

                  {editingId === cat.id ? (
                    <form
                      action={handleRename}
                      className="flex flex-1 items-center gap-1"
                    >
                      <input type="hidden" name="id" value={cat.id} />
                      <input
                        ref={editNameRef}
                        type="text"
                        name="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 rounded border border-zinc-300 px-2 py-0.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                      <button
                        type="submit"
                        className="rounded px-2 py-0.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded px-2 py-0.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                        {cat.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEditing(cat)}
                        className="rounded px-1.5 py-0.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        aria-label={`Rename ${cat.name}`}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id)}
                        className="rounded px-1.5 py-0.5 text-xs text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                        aria-label={`Delete ${cat.name}`}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {categories.length === 0 && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-4">
              No categories yet. Create one below.
            </p>
          )}

          {/* Add new category */}
          <form action={handleCreate} className="flex flex-col gap-2">
            <input
              ref={newNameRef}
              type="text"
              name="name"
              placeholder="New category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <input type="hidden" name="colour" value={newColour} />
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColour(c)}
                  className={`h-6 w-6 rounded-full border-2 transition-colors ${
                    newColour === c
                      ? "border-zinc-900 dark:border-zinc-100 scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Colour ${c}`}
                />
              ))}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 mt-1"
            >
              Add category
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
