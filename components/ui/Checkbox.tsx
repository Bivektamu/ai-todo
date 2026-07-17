"use client";

import { useState, type InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {}

export function Checkbox({ className = "", defaultChecked, checked: controlledChecked, onChange, ...props }: CheckboxProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (controlledChecked === undefined) {
      setInternalChecked(e.target.checked);
    }
    onChange?.(e);
  }

  return (
    <label className={`relative inline-flex items-center cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="sr-only peer"
        {...props}
      />
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-border peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 transition-colors ${isChecked ? "bg-primary border-primary" : "bg-surface"}`}>
        {isChecked && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
    </label>
  );
}
