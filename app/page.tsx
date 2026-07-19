import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { signOut } from "@/auth";
import { LandingPage } from "@/components/LandingPage";
import { TodoForm } from "@/components/TodoForm";
import { TodoFilter } from "@/components/TodoFilter";
import { CategoryModal } from "@/components/CategoryModal";
import { Button } from "@/components/ui/Button";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Todo — Stay organized, one task at a time",
  description:
    "A simple, fast todo app with priorities, categories, and drag-and-drop reorder. Sign in to get started.",
  openGraph: {
    title: "Todo — Stay organized, one task at a time",
    description:
      "A simple, fast todo app with priorities, categories, and drag-and-drop reorder.",
  },
};

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) {
    return <LandingPage />;
  }
  const userId = parseInt(session.user.id, 10);

  let todos;
  let categories;
  try {
    [todos, categories] = await Promise.all([
      prisma.todo.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Prisma query failed:", message);
    throw error;
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-background font-sans">
      <main className="flex w-full max-w-xl flex-1 flex-col py-16 px-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Todo
          </h1>
          <div className="flex items-center gap-3">
            <CategoryModal categories={categories} />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
        <TodoForm categories={categories} />
        <div className="mt-6">
          <TodoFilter todos={todos} categories={categories} />
        </div>
      </main>
    </div>
  );
}
