import { eur, initials } from "@/lib/utils";
import { Badge, Card } from "@/components/ui/ui";
import Link from "next/link";

export function StatusBadge({ status }: { status: string }) {
  const tone: "zinc" | "green" | "amber" | "red" | "violet" | "blue" = status === "PUBLISHED" || status === "ACCEPTED" || status === "APPROVED" || status === "ACTIVE" || status === "COMPLETED" ? "green"
    : status === "PENDING" || status === "PENDING_REVIEW" || status === "SHORTLISTED" || status === "PAUSED" ? "amber"
    : status === "REJECTED" || status === "SUSPENDED" || status === "ARCHIVED" ? "red" : "violet";
  return <Badge tone={tone}>{status}</Badge>;
}

export function CampaignCard({ c, brandName }: { c: { title: string; slug: string; shortDescription: string; category: string; budgetCents: number; platforms: string[]; campaignObjective: string; status: string; targetCities: string[] }; brandName: string }) {
  return (
    <Card className="flex flex-col gap-3 transition hover:border-violet-700">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-10 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 text-sm font-bold">{initials(brandName)}</span>
          <div><p className="text-xs text-zinc-500">{brandName} · {c.category}</p>
          <Link href={`/campanhas/${c.slug}`} className="font-semibold text-zinc-100 hover:text-violet-300">{c.title}</Link></div>
        </div>
        <StatusBadge status={c.status} />
      </div>
      <p className="text-sm text-zinc-400">{c.shortDescription}</p>
      <div className="flex flex-wrap gap-1">
        {(c.platforms ?? []).map((p) => <Badge key={p} tone="blue">{p}</Badge>)}
        <Badge>{c.campaignObjective}</Badge>
        {(c.targetCities ?? []).slice(0, 3).map((t) => <Badge key={t}>{t}</Badge>)}
      </div>
      <div className="mt-auto flex items-center justify-between">
        <span className="font-bold text-violet-300">{eur(c.budgetCents)}</span>
        <Link href={`/campanhas/${c.slug}`} className="text-sm text-violet-300 hover:underline">Ver detalhes →</Link>
      </div>
    </Card>
  );
}
