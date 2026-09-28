import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({ className, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" | "danger" }) {
  const styles = {
    primary: "bg-violet-600 hover:bg-violet-500 text-white",
    ghost: "hover:bg-zinc-800 text-zinc-200",
    outline: "border border-zinc-700 hover:border-zinc-500 text-zinc-100",
    danger: "bg-red-600 hover:bg-red-500 text-white",
  }[variant];
  return <button {...props} className={cn("focus-visible-ring inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50", styles, className)} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("rounded-xl border border-zinc-800 bg-zinc-900/70 p-5", className)} />;
}

export function Badge({ tone = "zinc", children }: { tone?: "zinc" | "green" | "amber" | "red" | "violet" | "blue"; children: React.ReactNode }) {
  const map = {
    zinc: "bg-zinc-800 text-zinc-200", green: "bg-emerald-950 text-emerald-300 border border-emerald-800",
    amber: "bg-amber-950 text-amber-300 border border-amber-800", red: "bg-red-950 text-red-300 border border-red-800",
    violet: "bg-violet-950 text-violet-300 border border-violet-800", blue: "bg-blue-950 text-blue-300 border border-blue-800",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", map[tone])}>{children}</span>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("focus-visible-ring w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500", props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("focus-visible-ring w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500", props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("focus-visible-ring w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100", props.className)} />;
}
export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-zinc-300">{children}</label>;
}
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <div><Label>{label}</Label>{children}{hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}</div>;
}
export function Empty({ title, hint }: { title: string; hint?: string }) {
  return <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center"><p className="font-medium text-zinc-200">{title}</p>{hint ? <p className="mt-1 text-sm text-zinc-500">{hint}</p> : null}</div>;
}
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-zinc-800", className)} />;
}
