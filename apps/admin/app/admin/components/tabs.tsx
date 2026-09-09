"use client";

import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
} from "react";
import type { KeyboardEvent, ReactNode } from "react";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  order: string[];
  triggerId: (value: string) => string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>.");
  return ctx;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  order,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  order: string[];
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? order[0]);
  const baseId = useId();

  const value = controlledValue ?? internalValue;

  const setValue = (next: string) => {
    if (controlledValue === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  const triggerId = (key: string) => `${baseId}-${key}`;

  const ctx = useMemo(
    () => ({ value, setValue, order, triggerId }),
    [value, setValue, order],
  );

  return <TabsContext.Provider value={ctx}>{children}</TabsContext.Provider>;
}

export function TabsList({
  children,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  "aria-label"?: string;
}) {
  const ctx = useTabsContext();

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = ctx.order.indexOf(ctx.value);
    if (idx === -1) return;

    const move = (target: string) => {
      e.preventDefault();
      ctx.setValue(target);
      document.getElementById(ctx.triggerId(target))?.focus();
    };

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        move(ctx.order[(idx + 1) % ctx.order.length]);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        move(ctx.order[(idx - 1 + ctx.order.length) % ctx.order.length]);
        break;
      case "Home":
        move(ctx.order[0]);
        break;
      case "End":
        move(ctx.order[ctx.order.length - 1]);
        break;
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className="flex gap-1 overflow-x-auto border-b border-zinc-200"
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  const ctx = useTabsContext();
  const id = ctx.triggerId(value);
  const active = ctx.value === value;

  return (
    <button
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={`${id}-panel`}
      tabIndex={active ? 0 : -1}
      onClick={() => ctx.setValue(value)}
      className={
        "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 " +
        (active
          ? "border-blue-700 text-blue-700"
          : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700")
      }
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  const ctx = useTabsContext();
  const triggerId = ctx.triggerId(value);
  const active = ctx.value === value;

  return (
    <div
      role="tabpanel"
      id={`${triggerId}-panel`}
      aria-labelledby={triggerId}
      tabIndex={0}
      hidden={!active}
    >
      {children}
    </div>
  );
}