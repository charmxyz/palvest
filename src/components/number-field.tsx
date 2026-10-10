"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Numeric input with optional prefix/suffix that tolerates partial typing ("4.", ""). */
export function NumberField({
  value,
  onChange,
  onCommit,
  prefix,
  suffix,
  min,
  max,
  step,
  className,
  inputClassName,
  id,
  "aria-label": ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  onCommit?: (n: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  inputClassName?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const [text, setText] = useState(String(value));
  // Follow external value changes (e.g. a slider) without clobbering partial typing.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (Number(text) !== value) setText(String(value));
  }

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

  return (
    <div className={cn("relative flex items-center", className)}>
      {prefix ? (
        <span className="pointer-events-none absolute left-3 font-mono text-sm text-muted-foreground">
          {prefix}
        </span>
      ) : null}
      <Input
        id={id}
        aria-label={ariaLabel}
        inputMode="decimal"
        value={text}
        step={step}
        onChange={(e) => {
          const t = e.target.value.replace(/[^0-9.]/g, "");
          setText(t);
          const n = Number(t);
          if (t !== "" && Number.isFinite(n)) onChange(clamp(n));
        }}
        onBlur={() => {
          const n = clamp(Number(text) || min || 0);
          setText(String(n));
          onChange(n);
          onCommit?.(n);
        }}
        className={cn("num font-mono", prefix && "pl-7", suffix && "pr-10", inputClassName)}
      />
      {suffix ? (
        <span className="pointer-events-none absolute right-3 font-mono text-xs text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
