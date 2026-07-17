import { prisma } from "./lib/prisma";

async function main() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: "verify@test.com" },
    update: {},
    create: { email: "verify@test.com" },
  });

  console.log("=== CREATE ===");
  const created = await prisma.todo.create({
    data: { title: "Verify CRUD: create test", userId: user.id },
  });
  console.log("Created:", JSON.stringify(created));

  console.log("\n=== READ (all) ===");
  const all = await prisma.todo.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  console.log("Count:", all.length);
  all.forEach((t) =>
    console.log(`  id=${t.id} title="${t.title}" completed=${t.completed}`)
  );

  console.log("\n=== TOGGLE (update completed) ===");
  const toggled = await prisma.todo.update({
    where: { id: created.id, userId: user.id },
    data: { completed: true },
  });
  console.log("Toggled:", JSON.stringify(toggled));

  console.log("\n=== DELETE ===");
  await prisma.todo.delete({ where: { id: created.id, userId: user.id } });
  const afterDelete = await prisma.todo.findUnique({ where: { id: created.id, userId: user.id } });
  console.log("After delete, todo exists:", afterDelete !== null);

  console.log("\n=== FINAL STATE ===");
  const remaining = await prisma.todo.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  console.log("Remaining todos:", remaining.length);

  console.log("\nALL CRUD OPERATIONS PASSED");
}

main()
  .catch((e) => {
    console.error("FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
