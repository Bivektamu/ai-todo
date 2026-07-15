import { prisma } from "./lib/prisma";

async function backfill() {
  const todos = await prisma.todo.findMany({
    orderBy: { createdAt: "asc" },
  });

  for (let i = 0; i < todos.length; i++) {
    await prisma.todo.update({
      where: { id: todos[i].id },
      data: { sortOrder: i },
    });
  }

  console.log(`Backfilled sortOrder for ${todos.length} todos.`);
  await prisma.$disconnect();
}

backfill().catch((e) => {
  console.error(e);
  process.exit(1);
});
