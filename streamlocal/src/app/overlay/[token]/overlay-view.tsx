"use client";
import { QRCodeSVG } from "qrcode.react";
import { useEffect } from "react";

export default function OverlayView({ brand, campaign, coupon, qr, theme, token, destination }: {
  brand: string; campaign: string; coupon: string | null; qr: boolean; theme: string; token: string; destination: string | null;
}) {
  useEffect(() => {
    fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, type: "OVERLAY_SESSION_STARTED" }) }).catch(() => {});
  }, [token]);
  const bg = theme === "LIGHT" ? "bg-white text-zinc-900" : theme === "NEON" ? "bg-black text-lime-300" : "bg-zinc-950/90 text-zinc-100";
  const url = typeof window !== "undefined" ? `${window.location.origin}/go/${token}` : `/go/${token}`;
  return (
    <div className={`flex min-h-[180px] items-center gap-4 rounded-2xl border border-violet-700 p-4 ${bg}`}>
      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-violet-600 text-lg font-bold text-white" aria-hidden>{brand.slice(0, 2).toUpperCase()}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide opacity-70">Parceria paga · Conteúdo patrocinado</p>
        <p className="truncate text-lg font-bold">{brand} · {campaign}</p>
        {coupon ? <p className="font-mono text-xl font-bold text-emerald-400">Cupão {coupon}</p> : null}
        {destination ? <p className="text-xs opacity-70">{destination}</p> : null}
      </div>
      {qr ? <div className="shrink-0 rounded-lg bg-white p-1"><QRCodeSVG value={url} size={96} aria-label="QR da campanha" /></div> : null}
    </div>
  );
}
