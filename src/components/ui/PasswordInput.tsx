"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({
  className = "",
  id,
  disabled,
  style,
  autoCapitalize = "off",
  autoCorrect = "off",
  spellCheck = false,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const label = visible ? "Hide password" : "Show password";

  return (
    <div className="relative">
      <input
        id={inputId}
        type={visible ? "text" : "password"}
        disabled={disabled}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        spellCheck={spellCheck}
        style={{ ...style, paddingRight: "2.75rem" }}
        className={className}
        {...props}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-pressed={visible}
        aria-controls={inputId}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onClick={() => {
          setVisible((current) => !current);
        }}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-500 transition hover:text-stone-800 focus-visible:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 3 21 21" />
      <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.5 18.5 0 0 1-3.2 3.9" />
      <path d="M6.2 6.8C3.6 8.5 2 12 2 12s3.5 6 10 6c1.4 0 2.7-.3 3.9-.8" />
      <path d="M9.9 9.9a2.5 2.5 0 0 0 3.5 3.5" />
    </svg>
  );
}
