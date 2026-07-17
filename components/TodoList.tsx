"use client";

import { toggleTodo, deleteTodo, updateTodo } from "@/app/actions";
import type { Todo, Category } from "@/app/generated/prisma/client";
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
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
      <span className="block h-0.5 w-3 rounded-full bg-muted" />
      <span className="block h-0.5 w-3 rounded-full bg-muted" />
      <span className="block h-0.5 w-3 rounded-full bg-muted" />
    </span>
  );
}

function getCategory(categories: Category[], categoryId: number | null): Category | undefined {
  if (categoryId === null) return undefined;
  return categories.find((c) => c.id === categoryId);
}

function SortableTodoRow({
  todo,
  categories,
}: {
  todo: Todo;
  categories: Category[];
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
  const category = getCategory(categories, todo.categoryId);

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
        className="shrink-0 cursor-grab touch-none rounded p-0.5 text-muted hover:text-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripHandle />
      </button>

      <form action={toggleTodo} className="contents">
        <input type="hidden" name="id" value={todo.id} />
        <button
          type="submit"
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            todo.completed
              ? "bg-primary border-primary"
              : "border-border bg-surface"
          }`}
          aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
        >
          {todo.completed && (
            <svg
              className="h-3 w-3 text-white"
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
            ? "text-muted line-through"
            : "text-foreground"
        }`}
      >
        {todo.title}
      </span>

      <Badge className={PRIORITY_COLORS[priority]}>
        {PRIORITY_LABELS[priority]}
      </Badge>

      {category && (
        <Badge color={category.colour} className="text-white">
          {category.name}
        </Badge>
      )}

      {todo.dueDate && (
        <span
          className={`shrink-0 text-xs ${
            overdue
              ? "font-semibold text-danger"
              : "text-muted"
          }`}
        >
          {overdue ? "Overdue: " : ""}
          {formatDueDate(todo.dueDate)}
        </span>
      )}

      <form action={updateTodo} className="contents">
        <input type="hidden" name="id" value={todo.id} />
        <Select
          name="priority"
          defaultValue={priority}
          className="px-1.5 py-0.5 text-xs"
          aria-label="Change priority"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </Select>
      </form>

      {categories.length > 0 && (
        <form action={updateTodo} className="contents">
          <input type="hidden" name="id" value={todo.id} />
          <Select
            name="categoryId"
            defaultValue={todo.categoryId?.toString() ?? ""}
            className="px-1.5 py-0.5 text-xs"
            aria-label="Change category"
          >
            <option value="">None</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </form>
      )}

      <form action={updateTodo} className="contents">
        <input type="hidden" name="id" value={todo.id} />
        <Input
          type="date"
          name="dueDate"
          defaultValue={formatDueDate(todo.dueDate)}
          className="px-1.5 py-0.5 text-xs"
          aria-label="Change due date"
        />
      </form>

      <form action={deleteTodo} className="contents">
        <input type="hidden" name="id" value={todo.id} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-muted hover:text-danger"
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
        </Button>
      </form>
    </li>
  );
}

interface TodoListProps {
  todos: Todo[];
  categories: Category[];
  isCustomSort: boolean;
  onReorder: (activeId: string, overId: string) => void;
}

export function TodoList({ todos, categories, isCustomSort, onReorder }: TodoListProps) {
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
      <p className="py-8 text-center text-sm text-muted">
        No todos yet. Add one above.
      </p>
    );
  }

  if (!isCustomSort) {
    return (
      <ul className="divide-y divide-border">
        {todos.map((todo) => {
          const overdue = isOverdue(todo.dueDate);
          const priority = todo.priority ?? "MEDIUM";
          const category = getCategory(categories, todo.categoryId);

          return (
            <li
              key={todo.id}
              className="flex flex-wrap items-center gap-2 py-3"
            >
              <form action={toggleTodo} className="contents">
                <input type="hidden" name="id" value={todo.id} />
                <button
                  type="submit"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    todo.completed
                      ? "bg-primary border-primary"
                      : "border-border bg-surface"
                  }`}
                  aria-label={
                    todo.completed ? "Mark incomplete" : "Mark complete"
                  }
                >
                  {todo.completed && (
                    <svg
                      className="h-3 w-3 text-white"
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
                    ? "text-muted line-through"
                    : "text-foreground"
                }`}
              >
                {todo.title}
              </span>

              <Badge className={PRIORITY_COLORS[priority]}>
                {PRIORITY_LABELS[priority]}
              </Badge>

              {category && (
                <Badge color={category.colour} className="text-white">
                  {category.name}
                </Badge>
              )}

              {todo.dueDate && (
                <span
                  className={`shrink-0 text-xs ${
                    overdue
                      ? "font-semibold text-danger"
                      : "text-muted"
                  }`}
                >
                  {overdue ? "Overdue: " : ""}
                  {formatDueDate(todo.dueDate)}
                </span>
              )}

              <form action={updateTodo} className="contents">
                <input type="hidden" name="id" value={todo.id} />
                <Select
                  name="priority"
                  defaultValue={priority}
                  className="px-1.5 py-0.5 text-xs"
                  aria-label="Change priority"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </Select>
              </form>

              {categories.length > 0 && (
                <form action={updateTodo} className="contents">
                  <input type="hidden" name="id" value={todo.id} />
                  <Select
                    name="categoryId"
                    defaultValue={todo.categoryId?.toString() ?? ""}
                    className="px-1.5 py-0.5 text-xs"
                    aria-label="Change category"
                  >
                    <option value="">None</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                </form>
              )}

              <form action={updateTodo} className="contents">
                <input type="hidden" name="id" value={todo.id} />
                <Input
                  type="date"
                  name="dueDate"
                  defaultValue={formatDueDate(todo.dueDate)}
                  className="px-1.5 py-0.5 text-xs"
                  aria-label="Change due date"
                />
              </form>

              <form action={deleteTodo} className="contents">
                <input type="hidden" name="id" value={todo.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-muted hover:text-danger"
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
                </Button>
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
        <ul className="divide-y divide-border">
          {todos.map((todo) => (
            <SortableTodoRow key={todo.id} todo={todo} categories={categories} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
