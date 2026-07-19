function PriorityIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 2.5V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 5L12.5 2.5V11.25L5 8.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CategoriesIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="2.5" width="6.25" height="6.25" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.25" y="2.5" width="6.25" height="6.25" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11.25" width="6.25" height="6.25" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.25" y="11.25" width="6.25" height="6.25" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function DragIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6.25" cy="4.375" r="0.75" fill="currentColor" />
      <circle cx="13.75" cy="4.375" r="0.75" fill="currentColor" />
      <path d="M6.25 4.375H13.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6.25" cy="10" r="0.75" fill="currentColor" />
      <circle cx="13.75" cy="10" r="0.75" fill="currentColor" />
      <path d="M6.25 10H13.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6.25" cy="15.625" r="0.75" fill="currentColor" />
      <circle cx="13.75" cy="15.625" r="0.75" fill="currentColor" />
      <path d="M6.25 15.625H13.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const features = [
  {
    icon: <PriorityIcon />,
    color: "primary" as const,
    title: "Priorities",
    description: "Mark tasks as low, medium, or high priority with colour coded badges so you always know what to tackle first.",
  },
  {
    icon: <CategoriesIcon />,
    color: "danger" as const,
    title: "Categories",
    description: "Organize todos into named categories with custom colours to keep work, home, and projects separate.",
  },
  {
    icon: <DragIcon />,
    color: "success" as const,
    title: "Drag & drop",
    description: "Reorder your list by dragging items into place. Your custom order persists across page reloads.",
  },
];

const iconColorMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  danger: "bg-danger/10 text-danger",
  success: "bg-success/10 text-success",
};

export function LandingPage() {
  return (
    <div className="flex flex-col items-center bg-background font-sans min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center text-center py-32 px-6 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Never miss a deadline again
        </h1>
        <p className="mt-4 text-lg text-muted max-w-lg">
          A simple, fast todo app that helps you stay on top of everything with
          priorities, categories, and drag and drop reorder.
        </p>
        <a
          href="/login"
          className="mt-8 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Get started
        </a>
      </section>

      {/* Feature cards */}
      <section className="w-full max-w-4xl px-6 pb-32">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-border p-6"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${iconColorMap[feature.color]}`}
              >
                {feature.icon}
              </div>
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="w-full bg-surface py-20 px-6">
        <div className="flex flex-col items-center text-center max-w-lg mx-auto">
          <h2 className="text-2xl font-semibold text-foreground">
            Ready to get organized?
          </h2>
          <p className="mt-2 text-muted">
            Start tracking your tasks in seconds. Free, no credit card
            required.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Get started
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-border py-8 px-6 mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-4xl mx-auto gap-4 text-sm text-muted">
          <span>© 2026 Todo</span>
          <div className="flex gap-4">
            <a
              href="/login"
              className="hover:text-foreground transition-colors"
            >
              Login
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
