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
  it("creates a todo with a valid title (covers: AC-1)", async () => {
    const formData = new FormData();
    formData.set("title", "Buy groceries");

    await createTodo(formData);

    expect(mockPrisma.todo.create).toHaveBeenCalledWith({
      data: { title: "Buy groceries" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("trims whitespace from the title", async () => {
    const formData = new FormData();
    formData.set("title", "  Walk the dog  ");

    await createTodo(formData);

    expect(mockPrisma.todo.create).toHaveBeenCalledWith({
      data: { title: "Walk the dog" },
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
