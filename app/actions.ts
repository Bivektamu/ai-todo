"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

function parsePriority(value: FormDataEntryValue | null): "LOW" | "MEDIUM" | "HIGH" {
  if (typeof value === "string" && VALID_PRIORITIES.includes(value as typeof VALID_PRIORITIES[number])) {
    return value as "LOW" | "MEDIUM" | "HIGH";
  }
  return "MEDIUM";
}

function parseDueDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = new Date(value + "T00:00:00.000Z");
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

export async function createTodo(formData: FormData) {
  const title = formData.get("title");

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return;
  }

  const priority = parsePriority(formData.get("priority"));
  const dueDate = parseDueDate(formData.get("dueDate"));

  try {
    await prisma.todo.create({
      data: { title: title.trim(), priority, dueDate },
    });
  } catch (error) {
    console.error("Failed to create todo:", error);
  }

  revalidatePath("/");
}

export async function toggleTodo(formData: FormData) {
  const id = formData.get("id");

  if (!id || typeof id !== "string") {
    return;
  }

  try {
    const todo = await prisma.todo.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!todo) {
      return;
    }

    await prisma.todo.update({
      where: { id: todo.id },
      data: { completed: !todo.completed },
    });
  } catch (error) {
    console.error("Failed to toggle todo:", error);
  }

  revalidatePath("/");
}

export async function updateTodo(formData: FormData) {
  const id = formData.get("id");

  if (!id || typeof id !== "string") {
    return;
  }

  const priorityRaw = formData.get("priority");
  const dueDateRaw = formData.get("dueDate");

  // If neither field is present in the form submission, nothing to update
  const hasPriority = formData.has("priority");
  const hasDueDate = formData.has("dueDate");

  if (!hasPriority && !hasDueDate) {
    return;
  }

  try {
    const data: { priority?: "LOW" | "MEDIUM" | "HIGH"; dueDate?: Date | null } = {};

    if (hasPriority) {
      data.priority = parsePriority(priorityRaw);
    }

    if (hasDueDate) {
      data.dueDate = parseDueDate(dueDateRaw);
    }

    await prisma.todo.update({
      where: { id: parseInt(id, 10) },
      data,
    });
  } catch (error) {
    console.error("Failed to update todo:", error);
  }

  revalidatePath("/");
}

export async function deleteTodo(formData: FormData) {
  const id = formData.get("id");

  if (!id || typeof id !== "string") {
    return;
  }

  try {
    await prisma.todo.delete({
      where: { id: parseInt(id, 10) },
    });
  } catch (error) {
    console.error("Failed to delete todo:", error);
  }

  revalidatePath("/");
}
