import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className = "", type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={`bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
        {...props}
      />
    );
  }
);
