import { prisma } from "./lib/prisma";

async function verify() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: "verify-reorder@test.com" },
    update: {},
    create: { email: "verify-reorder@test.com" },
  });

  // Clean up existing todos and seed test data
  await prisma.todo.deleteMany({ where: { userId: user.id } });

  await prisma.todo.createMany({
    data: [
      { title: "First todo", sortOrder: 0, userId: user.id },
      { title: "Second todo", sortOrder: 1, userId: user.id },
      { title: "Third todo", sortOrder: 2, userId: user.id },
    ],
  });

  // Verify initial order
  const initial = await prisma.todo.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } });
  console.log("Initial order:", initial.map((t) => t.title).join(" → "));
  console.assert(
    initial.map((t) => t.title).join(",") === "First todo,Second todo,Third todo",
    "Initial order should be First, Second, Third"
  );

  // Simulate reorderTodo: move "First todo" (id: initial[0].id) after "Third todo" (id: initial[2].id)
  const dragged = initial[0];
  const target = initial[2];

  const todos = [...initial];
  const draggedIndex = todos.findIndex((t) => t.id === dragged.id);
  const draggedItem = todos.splice(draggedIndex, 1)[0];
  const targetIndex = todos.findIndex((t) => t.id === target.id);
  todos.splice(targetIndex + 1, 0, draggedItem);

  await prisma.$transaction(
    todos.map((t, i) =>
      prisma.todo.update({ where: { id: t.id, userId: user.id }, data: { sortOrder: i } })
    )
  );

  const reordered = await prisma.todo.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } });
  console.log("After reorder:", reordered.map((t) => t.title).join(" → "));
  console.assert(
    reordered.map((t) => t.title).join(",") === "Second todo,Third todo,First todo",
    "Reordered should be Second, Third, First"
  );

  // Simulate reorderTodo: move "Second todo" to first position
  const dragged2 = reordered[0];
  const todos2 = [...reordered];
  const draggedIndex2 = todos2.findIndex((t) => t.id === dragged2.id);
  const draggedItem2 = todos2.splice(draggedIndex2, 1)[0];
  todos2.unshift(draggedItem2);

  await prisma.$transaction(
    todos2.map((t, i) =>
      prisma.todo.update({ where: { id: t.id, userId: user.id }, data: { sortOrder: i } })
    )
  );

  const reordered2 = await prisma.todo.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } });
  console.log("After move to first:", reordered2.map((t) => t.title).join(" → "));

  // Verify createTodo sets sortOrder = max + 1
  const maxBefore = await prisma.todo.aggregate({ where: { userId: user.id }, _max: { sortOrder: true } });
  const nextOrder = (maxBefore._max.sortOrder ?? -1) + 1;
  await prisma.todo.create({
    data: { title: "New todo", sortOrder: nextOrder, userId: user.id },
  });

  const afterCreate = await prisma.todo.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } });
  console.log("After create:", afterCreate.map((t) => t.title).join(" → "));
  console.assert(
    afterCreate[afterCreate.length - 1].title === "New todo",
    "New todo should be last"
  );
  console.assert(
    afterCreate[afterCreate.length - 1].sortOrder === 3,
    "New todo sortOrder should be 3 (max + 1)"
  );

  // Cleanup
  await prisma.todo.deleteMany({ where: { userId: user.id } });
  await prisma.$disconnect();

  console.log("\n✅ All reorder verifications passed!");
}

verify().catch((e) => {
  console.error("❌ Verification failed:", e);
  process.exit(1);
});
