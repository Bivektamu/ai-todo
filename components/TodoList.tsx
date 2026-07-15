"use client";

import { toggleTodo, deleteTodo, updateTodo } from "@/app/actions";
import type { Todo } from "@/app/generated/prisma/client";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  HIGH: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function isOverdue(dueDate: Date | null): boolean {
  if (!dueDate) return false;
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  return dueDate < today;
}

function formatDueDate(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function GripHandle() {
  return (
    <span className="flex shrink-0 flex-col gap-0.5 py-0.5">
      <span className="block h-0.5 w-3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
      <span className="block h-0.5 w-3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
      <span className="block h-0.5 w-3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
    </span>
  );
}

function SortableTodoRow({
  todo,
}: {
  todo: Todo;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const overdue = isOverdue(todo.dueDate);
  const priority = todo.priority ?? "MEDIUM";

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-2 py-3"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="shrink-0 cursor-grab touch-none rounded p-0.5 text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-500 dark:hover:text-zinc-300"
        aria-label="Drag to reorder"
      >
        <GripHandle />
      </button>

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

      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[priority]}`}
      >
        {PRIORITY_LABELS[priority]}
      </span>

      {todo.dueDate && (
        <span
          className={`shrink-0 text-xs ${
            overdue
              ? "font-semibold text-red-600 dark:text-red-400"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {overdue ? "Overdue: " : ""}
          {formatDueDate(todo.dueDate)}
        </span>
      )}

      <form action={updateTodo} className="contents">
        <input type="hidden" name="id" value={todo.id} />
        <select
          name="priority"
          defaultValue={priority}
          className="shrink-0 rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-700 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          aria-label="Change priority"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </form>

      <form action={updateTodo} className="contents">
        <input type="hidden" name="id" value={todo.id} />
        <input
          type="date"
          name="dueDate"
          defaultValue={formatDueDate(todo.dueDate)}
          className="shrink-0 rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-700 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          aria-label="Change due date"
        />
      </form>

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
  );
}

interface TodoListProps {
  todos: Todo[];
  isCustomSort: boolean;
  onReorder: (activeId: string, overId: string) => void;
}

export function TodoList({ todos, isCustomSort, onReorder }: TodoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (todos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No todos yet. Add one above.
      </p>
    );
  }

  if (!isCustomSort) {
    return (
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {todos.map((todo) => {
          const overdue = isOverdue(todo.dueDate);
          const priority = todo.priority ?? "MEDIUM";

          return (
            <li
              key={todo.id}
              className="flex flex-wrap items-center gap-2 py-3"
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
                  aria-label={
                    todo.completed ? "Mark incomplete" : "Mark complete"
                  }
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

              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[priority]}`}
              >
                {PRIORITY_LABELS[priority]}
              </span>

              {todo.dueDate && (
                <span
                  className={`shrink-0 text-xs ${
                    overdue
                      ? "font-semibold text-red-600 dark:text-red-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {overdue ? "Overdue: " : ""}
                  {formatDueDate(todo.dueDate)}
                </span>
              )}

              <form action={updateTodo} className="contents">
                <input type="hidden" name="id" value={todo.id} />
                <select
                  name="priority"
                  defaultValue={priority}
                  className="shrink-0 rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-700 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  aria-label="Change priority"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </form>

              <form action={updateTodo} className="contents">
                <input type="hidden" name="id" value={todo.id} />
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={formatDueDate(todo.dueDate)}
                  className="shrink-0 rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-700 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  aria-label="Change due date"
                />
              </form>

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
          );
        })}
      </ul>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id.toString(), over.id.toString());
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={todos.map((t) => t.id.toString())}
        strategy={verticalListSortingStrategy}
      >
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {todos.map((todo) => (
            <SortableTodoRow key={todo.id} todo={todo} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
