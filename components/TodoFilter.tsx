"use client";

import { useState, useMemo } from "react";
import { TodoList } from "@/components/TodoList";
import type { Todo } from "@/app/generated/prisma/client";

type FilterStatus = "all" | "active" | "completed";
type SortKey = "priority" | "dueDate" | "newest";

const SORT_LABELS: Record<SortKey, string> = {
  priority: "Priority",
  dueDate: "Due date",
  newest: "Newest",
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

function sortTodos(todos: Todo[], sort: SortKey): Todo[] {
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
  }

  return copy;
}

const STATUSES: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

export function TodoFilter({ todos }: { todos: Todo[] }) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const filteredSorted = useMemo(() => {
    const filtered = filterTodos(todos, filter);
    return sortTodos(filtered, sort);
  }, [todos, filter, sort]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setFilter(s.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filter === s.key
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <label htmlFor="todo-sort" className="text-zinc-500 dark:text-zinc-400">
            Sort:
          </label>
          <select
            id="todo-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded border border-zinc-300 px-2 py-1 text-zinc-700 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <TodoList todos={filteredSorted} />
    </>
  );
}
