"use client";

import { createTodo } from "@/app/actions";
import { useRef } from "react";
import type { Category } from "@/app/generated/prisma/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

export function TodoForm({ categories }: { categories: Category[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createTodo(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex gap-2">
        <Input
          type="text"
          name="title"
          placeholder="What needs to be done?"
          required
          className="flex-1"
        />
        <Button type="submit" variant="primary">
          Add
        </Button>
      </div>
      <div className="flex gap-2">
        <Select name="priority" defaultValue="MEDIUM">
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </Select>
        {categories.length > 0 && (
          <Select name="categoryId" defaultValue="">
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        )}
        <Input type="date" name="dueDate" />
      </div>
    </form>
  );
}
