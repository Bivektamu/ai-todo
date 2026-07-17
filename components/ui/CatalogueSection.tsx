import type { ReactNode } from "react";

export function CatalogueSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-medium text-muted mb-3">{title}</h2>
      <div className="rounded-lg border border-border p-4 bg-surface">{children}</div>
    </section>
  );
}
