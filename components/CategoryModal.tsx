"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createCategory, renameCategory, deleteCategory } from "@/app/actions";
import type { Category } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

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
    if (open) {
      newNameRef.current?.focus();
    }
  }, [open]);

  function startEditing(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
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

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Manage categories
      </Button>

      <Modal open={open} onClose={close} title="Categories">
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
                    <Input
                      ref={editNameRef}
                      type="text"
                      name="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2 py-0.5 text-sm"
                    />
                    <Button type="submit" variant="primary" size="sm">
                      Save
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-foreground">
                      {cat.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(cat)}
                      aria-label={`Rename ${cat.name}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cat.id)}
                      className="text-muted hover:text-danger"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {categories.length === 0 && (
          <p className="text-sm text-muted mb-4">
            No categories yet. Create one below.
          </p>
        )}

        {/* Add new category */}
        <form action={handleCreate} className="flex flex-col gap-2">
          <Input
            ref={newNameRef}
            type="text"
            name="name"
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <input type="hidden" name="colour" value={newColour} />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_COLOURS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColour(c)}
                aria-pressed={newColour === c}
                className={`h-6 w-6 rounded-full border-2 transition-colors ${
                  newColour === c
                    ? "border-foreground scale-110"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select colour ${c}`}
              />
            ))}
          </div>
          <Button type="submit" variant="primary" className="mt-1">
            Add category
          </Button>
        </form>
      </Modal>
    </>
  );
}
