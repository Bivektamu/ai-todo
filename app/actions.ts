"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createTodo(formData: FormData) {
  const title = formData.get("title");

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return;
  }

  try {
    await prisma.todo.create({
      data: { title: title.trim() },
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
