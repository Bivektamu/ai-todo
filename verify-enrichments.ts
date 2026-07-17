import { prisma } from "@/lib/prisma";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

async function main() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: "verify-enrich@test.com" },
    update: {},
    create: { email: "verify-enrich@test.com" },
  });

  console.log("=== Verify todo-enrichments (ADR 004) ===\n");

  // AC-1: Create with priority and due date
  console.log("--- AC-1: Due dates ---");
  const withDate = await prisma.todo.create({
    data: {
      title: "VERIFY: due date test",
      priority: "HIGH",
      dueDate: new Date("2025-06-15T00:00:00.000Z"),
      userId: user.id,
    },
  });
  assert(
    withDate.dueDate !== null && withDate.dueDate.toISOString().startsWith("2025-06-15"),
    "Created todo has correct dueDate"
  );
  assert(withDate.priority === "HIGH", "Created todo has HIGH priority");

  // AC-1: Create without due date (null)
  const withoutDate = await prisma.todo.create({
    data: { title: "VERIFY: no date", userId: user.id },
  });
  assert(withoutDate.dueDate === null, "Created todo without date has null dueDate");
  assert(withoutDate.priority === "MEDIUM", "Created todo defaults to MEDIUM priority");

  // AC-2: Priority enum values
  console.log("\n--- AC-2: Priority ---");
  const lowPrio = await prisma.todo.create({
    data: { title: "VERIFY: LOW prio", priority: "LOW", userId: user.id },
  });
  assert(lowPrio.priority === "LOW", "Created todo has LOW priority");
  const highPrio = await prisma.todo.create({
    data: { title: "VERIFY: HIGH prio", priority: "HIGH", userId: user.id },
  });
  assert(highPrio.priority === "HIGH", "Created todo has HIGH priority");

  // AC-4: Update priority and due date
  console.log("\n--- AC-4: Inline editing via updateTodo equivalent ---");
  const updated = await prisma.todo.update({
    where: { id: withDate.id, userId: user.id },
    data: { priority: "LOW", dueDate: new Date("2025-12-25T00:00:00.000Z") },
  });
  assert(updated.priority === "LOW", "Updated priority from HIGH to LOW");
  assert(
    updated.dueDate !== null && updated.dueDate.toISOString().startsWith("2025-12-25"),
    "Updated dueDate to 2025-12-25"
  );

  // AC-1: Clear due date (set to null)
  const cleared = await prisma.todo.update({
    where: { id: withDate.id, userId: user.id },
    data: { dueDate: null },
  });
  assert(cleared.dueDate === null, "Cleared dueDate to null");

  // AC-5: Read all and verify existing todos still work
  console.log("\n--- AC-5: Backward compatibility ---");
  const all = await prisma.todo.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  assert(all.length >= 4, "At least 4 todos exist (including new verify ones)");

  // Clean up verify todos
  console.log("\n--- Cleanup ---");
  await prisma.todo.deleteMany({
    where: {
      userId: user.id,
      title: {
        in: [
          "VERIFY: due date test",
          "VERIFY: no date",
          "VERIFY: LOW prio",
          "VERIFY: HIGH prio",
        ],
      },
    },
  });
  console.log("Cleaned up verify test data");

  if (process.exitCode !== 1) {
    console.log("\n=== All checks PASSED ===");
  } else {
    console.log("\n=== Some checks FAILED ===");
  }
}

main().catch((e) => {
  console.error("Verification crashed:", e);
  process.exit(1);
});
