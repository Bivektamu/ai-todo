"use client";

import { toggleTodo, deleteTodo } from "@/app/actions";
import type { Todo } from "@/app/generated/prisma/client";

export function TodoList({ todos }: { todos: Todo[] }) {
  if (todos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No todos yet. Add one above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {todos.map((todo) => (
        <li
          key={todo.id}
          className="flex items-center gap-3 py-3"
        >
          <form action={toggleTodo} className="contents">
            <input type="hidden" name="id" value={todo.id} />
            <button
              type="submit"
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                todo.completed
                  ? "border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100"
                  : "border-zinc-300 dark:border-zinc-600"
              }`}
              aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
            >
              {todo.completed && (
                <svg
                  className="h-3 w-3 text-white dark:text-zinc-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          </form>

          <span
            className={`flex-1 text-sm ${
              todo.completed
                ? "text-zinc-400 line-through dark:text-zinc-500"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {todo.title}
          </span>

          <form action={deleteTodo} className="contents">
            <input type="hidden" name="id" value={todo.id} />
            <button
              type="submit"
              className="text-sm text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
              aria-label="Delete todo"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
