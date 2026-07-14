import { prisma } from "@/lib/prisma";
import { TodoForm } from "@/components/TodoForm";
import { TodoFilter } from "@/components/TodoFilter";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Todo",
};

export default async function Home() {
  let todos;
  try {
    todos = await prisma.todo.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Prisma findMany failed:", message);
    throw error;
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-1 flex-col py-16 px-6">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Todo
        </h1>
        <TodoForm />
        <div className="mt-6">
          <TodoFilter todos={todos} />
        </div>
      </main>
    </div>
  );
}
