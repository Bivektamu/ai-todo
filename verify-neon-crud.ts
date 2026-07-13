import { prisma } from "./lib/prisma";

async function main() {
  console.log("=== Neon CRUD Verification ===\n");

  // 1. CREATE: Add a todo
  console.log("1. CREATE: adding 'Test verify create'...");
  const created = await prisma.todo.create({
    data: { title: "Test verify create" },
  });
  console.log(`   Created: id=${created.id}, title="${created.title}", completed=${created.completed}`);
  if (created.id <= 0) throw new Error("CREATE failed: invalid id");
  if (created.title !== "Test verify create") throw new Error("CREATE failed: wrong title");
  console.log("   PASS\n");

  // 2. CREATE a second todo for richer list
  await prisma.todo.create({ data: { title: "Test verify second" } });

  // 3. READ: List all todos
  console.log("2. READ: listing all todos...");
  const allTodos = await prisma.todo.findMany({ orderBy: { id: "asc" } });
  console.log(`   Found ${allTodos.length} todos`);
  if (allTodos.length < 2) throw new Error("READ failed: expected at least 2 todos");
  for (const t of allTodos) {
    console.log(`   id=${t.id} "${t.title}" completed=${t.completed}`);
  }
  console.log("   PASS\n");

  // 4. TOGGLE: Mark first todo as completed
  console.log(`3. TOGGLE: marking id=${created.id} as completed...`);
  const toggled = await prisma.todo.update({
    where: { id: created.id },
    data: { completed: true },
  });
  console.log(`   Toggled: id=${toggled.id}, completed=${toggled.completed}`);
  if (!toggled.completed) throw new Error("TOGGLE failed: expected completed=true");
  console.log("   PASS\n");

  // 5. TOGGLE back to uncompleted
  console.log(`4. TOGGLE back: marking id=${created.id} as not completed...`);
  const toggledBack = await prisma.todo.update({
    where: { id: created.id },
    data: { completed: false },
  });
  console.log(`   Toggled back: id=${toggledBack.id}, completed=${toggledBack.completed}`);
  if (toggledBack.completed) throw new Error("TOGGLE back failed: expected completed=false");
  console.log("   PASS\n");

  // 6. DELETE: Remove the first todo
  console.log(`5. DELETE: removing id=${created.id}...`);
  await prisma.todo.delete({ where: { id: created.id } });
  const afterDelete = await prisma.todo.findUnique({ where: { id: created.id } });
  console.log(`   Deleted: findUnique returned ${afterDelete}`);
  if (afterDelete !== null) throw new Error("DELETE failed: todo still exists");
  console.log("   PASS\n");

  // 7. Cleanup: delete the second todo too
  const remaining = await prisma.todo.findMany();
  for (const t of remaining) {
    await prisma.todo.delete({ where: { id: t.id } });
  }

  const final = await prisma.todo.findMany();
  console.log(`Final state: ${final.length} todos (cleaned up)`);
  if (final.length !== 0) throw new Error("Cleanup failed: todos remain");

  console.log("\n=== All CRUD operations PASSED ===");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error("\nFAIL:", e.message);
    process.exit(1);
  });
