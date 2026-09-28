"use client";
import { useState } from "react";
import { Button } from "./ui";

export function ConfirmButton({ action, label, confirmLabel = "Confirmar?" }: { action: () => Promise<unknown>; label: string; confirmLabel?: string }) {
  const [arm, setArm] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!arm) return <Button variant="outline" onClick={() => setArm(true)}>{label}</Button>;
  return (
    <span className="inline-flex gap-2">
      <Button variant="danger" disabled={busy} onClick={async () => { setBusy(true); await action(); setBusy(false); }}>{busy ? "…" : confirmLabel}</Button>
      <Button variant="ghost" onClick={() => setArm(false)}>Cancelar</Button>
    </span>
  );
}

export function Toast({ message }: { message?: string | null }) {
  if (!message) return null;
  return <div role="status" className="mb-4 rounded-lg border border-amber-800 bg-amber-950 px-4 py-2 text-sm text-amber-200">{message}</div>;
}
