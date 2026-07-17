"use client";

import { useState, useMemo, useCallback } from "react";
import { TodoList } from "@/components/TodoList";
import { reorderTodo } from "@/app/actions";
import type { Todo, Category } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";

type FilterStatus = "all" | "active" | "completed";
type SortKey = "priority" | "dueDate" | "newest" | "custom" | "category";

const SORT_LABELS: Record<SortKey, string> = {
  priority: "Priority",
  dueDate: "Due date",
  newest: "Newest",
  custom: "Custom",
  category: "Category",
};

const PRIORITY_ORDER: Record<string, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

function filterTodos(todos: Todo[], status: FilterStatus): Todo[] {
  if (status === "active") return todos.filter((t) => !t.completed);
  if (status === "completed") return todos.filter((t) => t.completed);
  return todos;
}

function sortTodos(todos: Todo[], sort: SortKey, categories: Category[]): Todo[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const copy = [...todos];

  if (sort === "priority") {
    copy.sort((a, b) => {
      const aP = PRIORITY_ORDER[a.priority ?? "MEDIUM"] ?? 1;
      const bP = PRIORITY_ORDER[b.priority ?? "MEDIUM"] ?? 1;
      return aP - bP;
    });
  } else if (sort === "dueDate") {
    copy.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  } else if (sort === "custom") {
    copy.sort((a, b) => a.sortOrder - b.sortOrder);
  } else if (sort === "category") {
    copy.sort((a, b) => {
      const aName = a.categoryId !== null ? categoryMap.get(a.categoryId)?.name ?? "" : "";
      const bName = b.categoryId !== null ? categoryMap.get(b.categoryId)?.name ?? "" : "";
      if (!aName && !bName) return 0;
      if (!aName) return 1;
      if (!bName) return -1;
      return aName.localeCompare(bName);
    });
  }

  return copy;
}

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const result = [...array];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

const STATUSES: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

export function TodoFilter({ todos, categories }: { todos: Todo[]; categories: Category[] }) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sort, setSort] = useState<SortKey>("custom");
  const [activeCategories, setActiveCategories] = useState<Set<number>>(new Set());

  const filteredSorted = useMemo(() => {
    let filtered = filterTodos(todos, filter);
    if (activeCategories.size > 0) {
      filtered = filtered.filter(
        (t) => t.categoryId !== null && activeCategories.has(t.categoryId)
      );
    }
    return sortTodos(filtered, sort, categories);
  }, [todos, filter, sort, activeCategories, categories]);

  const fullCustomSorted = useMemo(() => {
    if (sort !== "custom") return null;
    const copy = [...todos];
    copy.sort((a, b) => a.sortOrder - b.sortOrder);
    return copy;
  }, [todos, sort]);

  const handleReorder = useCallback(
    (activeId: string, overId: string) => {
      if (!fullCustomSorted) return;

      const activeIndex = fullCustomSorted.findIndex(
        (t) => t.id.toString() === activeId
      );
      const overIndex = fullCustomSorted.findIndex(
        (t) => t.id.toString() === overId
      );

      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
        return;
      }

      const reordered = arrayMove(fullCustomSorted, activeIndex, overIndex);
      const draggedNewIndex = reordered.findIndex(
        (t) => t.id.toString() === activeId
      );

      const targetId =
        draggedNewIndex === 0
          ? "__first__"
          : reordered[draggedNewIndex - 1].id.toString();

      const formData = new FormData();
      formData.append("id", activeId);
      formData.append("targetId", targetId);
      reorderTodo(formData);
    },
    [fullCustomSorted]
  );

  return (
    <>
      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {categories.map((cat) => {
            const active = activeCategories.has(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategories((prev) => {
                    const next = new Set(prev);
                    if (active) {
                      next.delete(cat.id);
                    } else {
                      next.add(cat.id);
                    }
                    return next;
                  });
                }}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border ${
                  active
                    ? "text-white"
                    : "text-muted bg-surface hover:text-foreground border-border"
                }`}
                style={active ? { backgroundColor: cat.colour, borderColor: cat.colour } : undefined}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 rounded-lg bg-surface p-1">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setFilter(s.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filter === s.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <label htmlFor="todo-sort" className="text-muted">
            Sort:
          </label>
          <Select
            id="todo-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="px-2 py-1"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <TodoList
        todos={filteredSorted}
        categories={categories}
        isCustomSort={sort === "custom"}
        onReorder={handleReorder}
      />
    </>
  );
}
