import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRevalidatePath = vi.fn();
const mockPrisma = {
  todo: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("createTodo", () => {
  let createTodo: (formData: FormData) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/actions");
    createTodo = mod.createTodo;
  });

  // AC-1: User can add a todo with a title
  it("creates a todo with a valid title and default priority (covers: AC-1)", async () => {
    const formData = new FormData();
    formData.set("title", "Buy groceries");

    await createTodo(formData);

    expect(mockPrisma.todo.create).toHaveBeenCalledWith({
      data: { title: "Buy groceries", priority: "MEDIUM", dueDate: null },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("trims whitespace from the title", async () => {
    const formData = new FormData();
    formData.set("title", "  Walk the dog  ");

    await createTodo(formData);

    expect(mockPrisma.todo.create).toHaveBeenCalledWith({
      data: { title: "Walk the dog", priority: "MEDIUM", dueDate: null },
    });
  });

  it("does not create a todo when title is missing", async () => {
    const formData = new FormData();

    await createTodo(formData);

    expect(mockPrisma.todo.create).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("does not create a todo when title is an empty string", async () => {
    const formData = new FormData();
    formData.set("title", "");

    await createTodo(formData);

    expect(mockPrisma.todo.create).not.toHaveBeenCalled();
  });

  it("does not create a todo when title is whitespace only", async () => {
    const formData = new FormData();
    formData.set("title", "   ");

    await createTodo(formData);

    expect(mockPrisma.todo.create).not.toHaveBeenCalled();
  });

  // AC-1: Create with due date
  it("creates a todo with a due date (covers: AC-1)", async () => {
    const formData = new FormData();
    formData.set("title", "Submit report");
    formData.set("dueDate", "2025-06-15");

    await createTodo(formData);

    expect(mockPrisma.todo.create).toHaveBeenCalledWith({
      data: {
        title: "Submit report",
        priority: "MEDIUM",
        dueDate: new Date("2025-06-15T00:00:00.000Z"),
      },
    });
  });

  // AC-2: Create with priority
  it("creates a todo with a non-default priority (covers: AC-2)", async () => {
    const formData = new FormData();
    formData.set("title", "Urgent fix");
    formData.set("priority", "HIGH");

    await createTodo(formData);

    expect(mockPrisma.todo.create).toHaveBeenCalledWith({
      data: {
        title: "Urgent fix",
        priority: "HIGH",
        dueDate: null,
      },
    });
  });

  it("ignores invalid priority values and defaults to MEDIUM", async () => {
    const formData = new FormData();
    formData.set("title", "Task");
    formData.set("priority", "CRITICAL");

    await createTodo(formData);

    expect(mockPrisma.todo.create).toHaveBeenCalledWith({
      data: {
        title: "Task",
        priority: "MEDIUM",
        dueDate: null,
      },
    });
  });
});

describe("toggleTodo", () => {
  let toggleTodo: (formData: FormData) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/actions");
    toggleTodo = mod.toggleTodo;
  });

  // AC-3: Check it off (and uncheck)
  it("toggles a todo from incomplete to complete (covers: AC-3)", async () => {
    const todo = { id: 1, title: "Test", completed: false };
    mockPrisma.todo.findUnique.mockResolvedValue(todo);

    const formData = new FormData();
    formData.set("id", "1");

    await toggleTodo(formData);

    expect(mockPrisma.todo.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(mockPrisma.todo.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { completed: true },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("toggles a todo from complete to incomplete (covers: AC-3)", async () => {
    const todo = { id: 2, title: "Test", completed: true };
    mockPrisma.todo.findUnique.mockResolvedValue(todo);

    const formData = new FormData();
    formData.set("id", "2");

    await toggleTodo(formData);

    expect(mockPrisma.todo.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { completed: false },
    });
  });

  it("does nothing when id is missing", async () => {
    const formData = new FormData();

    await toggleTodo(formData);

    expect(mockPrisma.todo.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.todo.update).not.toHaveBeenCalled();
  });

  it("does nothing when todo is not found", async () => {
    mockPrisma.todo.findUnique.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("id", "999");

    await toggleTodo(formData);

    expect(mockPrisma.todo.update).not.toHaveBeenCalled();
  });
});

describe("updateTodo", () => {
  let updateTodo: (formData: FormData) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/actions");
    updateTodo = mod.updateTodo;
  });

  // AC-4: Inline editing of priority
  it("updates priority (covers: AC-4)", async () => {
    const formData = new FormData();
    formData.set("id", "1");
    formData.set("priority", "HIGH");

    await updateTodo(formData);

    expect(mockPrisma.todo.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { priority: "HIGH" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  // AC-1: Inline editing of due date
  it("updates due date (covers: AC-1)", async () => {
    const formData = new FormData();
    formData.set("id", "1");
    formData.set("dueDate", "2025-12-25");

    await updateTodo(formData);

    expect(mockPrisma.todo.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { dueDate: new Date("2025-12-25T00:00:00.000Z") },
    });
  });

  // AC-1: Clear the date
  it("clears due date when given empty string (covers: AC-1)", async () => {
    const formData = new FormData();
    formData.set("id", "1");
    formData.set("dueDate", "");

    await updateTodo(formData);

    expect(mockPrisma.todo.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { dueDate: null },
    });
  });

  it("updates both priority and due date together", async () => {
    const formData = new FormData();
    formData.set("id", "1");
    formData.set("priority", "LOW");
    formData.set("dueDate", "2025-08-01");

    await updateTodo(formData);

    expect(mockPrisma.todo.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        priority: "LOW",
        dueDate: new Date("2025-08-01T00:00:00.000Z"),
      },
    });
  });

  it("does nothing when id is missing", async () => {
    const formData = new FormData();
    formData.set("priority", "HIGH");

    await updateTodo(formData);

    expect(mockPrisma.todo.update).not.toHaveBeenCalled();
  });

  it("does nothing when neither priority nor dueDate is present", async () => {
    const formData = new FormData();
    formData.set("id", "1");

    await updateTodo(formData);

    expect(mockPrisma.todo.update).not.toHaveBeenCalled();
  });
});

describe("deleteTodo", () => {
  let deleteTodo: (formData: FormData) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/actions");
    deleteTodo = mod.deleteTodo;
  });

  // AC-4: Delete it
  it("deletes a todo by id (covers: AC-4)", async () => {
    const formData = new FormData();
    formData.set("id", "1");

    await deleteTodo(formData);

    expect(mockPrisma.todo.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("does nothing when id is missing", async () => {
    const formData = new FormData();

    await deleteTodo(formData);

    expect(mockPrisma.todo.delete).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
