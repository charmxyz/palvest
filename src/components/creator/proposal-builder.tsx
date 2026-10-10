"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CheckIcon,
  Loader2Icon,
  PencilLineIcon,
  PlusIcon,
  RocketIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { ViewsChart } from "@/components/charts/views-chart";
import { Cover, COVER_PRESETS } from "@/components/cover";
import { NumberField } from "@/components/number-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client";
import { buildForecast, estimatedReturn, metricsSample } from "@/lib/finance";
import { ScenarioTable } from "@/components/scenario-table";
import { compactNumber, money, moneyCents, moneyShort } from "@/lib/format";
import type { BudgetItem, CreatorProfile, ProposalForecast } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SHARE_MONTHS } from "./funding-simulator";

type Draft = {
  title: string;
  summary: string;
  creatorPitch: string;
  fundingTarget: number;
  recommendedRevenueSharePercent: number;
  revenueShareMonths: number;
  budget: BudgetItem[];
  risks: string[];
  comparableVideoIds: string[];
  forecastExplanation: string;
};

const GEN_STEPS = [
  "Reading your channel history",
  "Picking comparable videos",
  "Drafting the budget",
  "Writing your pitch",
];

export function ProposalBuilder({
  creator,
  basePath,
  defaults,
}: {
  creator: CreatorProfile;
  basePath: string;
  defaults: { budget: number; share: number; months: number };
}) {
  const [stage, setStage] = useState<"idea" | "generating" | "edit">("idea");
  const [idea, setIdea] = useState("");
  const [budgetInput, setBudgetInput] = useState(defaults.budget);
  const [genStep, setGenStep] = useState(0);
  const [aiUsed, setAiUsed] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [pitch, setPitch] = useState("");
  const [cover, setCover] = useState<string>(COVER_PRESETS[0]);
  const [target, setTarget] = useState(defaults.budget);
  const [share, setShare] = useState(defaults.share);
  const [months, setMonths] = useState(defaults.months);
  const [rpm, setRpm] = useState(creator.assumedRpm);
  const [budget, setBudget] = useState<BudgetItem[]>([]);
  const [risks, setRisks] = useState<string[]>([]);
  const [comparables, setComparables] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");

  const sampleViews = useMemo(
    () => metricsSample(creator.videos).map((v) => v.viewCount),
    [creator.videos],
  );
  const byId = useMemo(() => new Map(creator.videos.map((v) => [v.videoId, v])), [creator.videos]);

  const forecast: ProposalForecast = useMemo(
    () =>
      buildForecast({
        sampleViews,
        comparableViews: comparables.map((id) => byId.get(id)?.viewCount ?? 0),
        comparableVideoIds: comparables,
        rpm,
        sharePercent: share,
        explanation,
      }),
    [sampleViews, comparables, byId, rpm, share, explanation],
  );

  const budgetTotal = budget.reduce((a, b) => a + (b.amount || 0), 0);

  function applyDraft(d: Draft) {
    setTitle(d.title);
    setSummary(d.summary);
    setPitch(d.creatorPitch);
    setTarget(d.fundingTarget);
    setShare(d.recommendedRevenueSharePercent);
    setMonths(d.revenueShareMonths);
    setBudget(d.budget);
    setRisks(d.risks);
    setComparables(d.comparableVideoIds);
    setExplanation(d.forecastExplanation);
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setStage("generating");
    setGenStep(0);
    const timer = setInterval(() => setGenStep((s) => Math.min(s + 1, GEN_STEPS.length - 1)), 1600);
    try {
      const { draft } = await api<{ draft: Draft }>("/api/proposals/generate", {
        creatorId: creator.id,
        idea,
        budget: budgetInput,
      });
      applyDraft(draft);
      setAiUsed(true);
      setStage("edit");
    } catch (err) {
      toast.error("Couldn't draft the proposal", { description: (err as Error).message });
      setStage("idea");
    } finally {
      clearInterval(timer);
    }
  }

  function writeManually() {
    applyDraft({
      title: "",
      summary: idea,
      creatorPitch: "",
      fundingTarget: budgetInput,
      recommendedRevenueSharePercent: share,
      revenueShareMonths: months,
      budget: [
        { label: "Production", amount: Math.round(budgetInput * 0.6) },
        { label: "Editing", amount: budgetInput - Math.round(budgetInput * 0.6) },
      ],
      risks: [],
      comparableVideoIds: [],
      forecastExplanation: "",
    });
    setAiUsed(false);
    setStage("edit");
  }

  async function publish() {
    if (title.trim().length < 3) {
      toast.error("Give your video a title");
      return;
    }
    setPublishing(true);
    try {
      const { id } = await api<{ id: string }>("/api/proposals", {
        creatorId: creator.id,
        title,
        description: summary,
        creatorPitch: pitch,
        coverImageUrl: cover,
        fundingTarget: target,
        revenueSharePercent: share,
        revenueShareMonths: months,
        assumedRpm: rpm,
        budget: budget.filter((b) => b.label.trim()),
        risks: risks.filter((r) => r.trim()),
        comparableVideoIds: comparables,
        forecastExplanation: explanation || null,
      });
      // Full page load: the success page and sidebar project list come back fresh, and a
      // slow client-side navigation can't leave the button spinning.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`${basePath}/projects/${id}/published`);
    } catch (err) {
      toast.error((err as Error).message);
      setPublishing(false);
    }
  }

  if (stage !== "edit") {
    return (
      <Card className="bg-grid mx-auto w-full max-w-2xl">
        <CardContent className="flex flex-col gap-6 py-8">
          <div className="flex flex-col gap-2">
            <span className="label-mono">New proposal · {creator.channelTitle}</span>
            <h2 className="text-2xl font-medium tracking-tight">What do you want to make?</h2>
            <p className="text-sm text-muted-foreground">
              A sentence or two is enough. AI uses your {creator.videos.length} recent uploads to draft the
              proposal and pick comparable videos for the forecast.
            </p>
          </div>
          {stage === "generating" ? (
            <div className="flex flex-col gap-4 rounded-xl border bg-surface p-5">
              <div className="flex items-center gap-2 text-sm">
                <SparklesIcon className="size-4 animate-pulse" /> Building your proposal
              </div>
              <ol className="grid gap-2 font-mono text-xs">
                {GEN_STEPS.map((s, i) => (
                  <li
                    key={s}
                    className={cn(
                      "flex items-center gap-2 transition-colors",
                      i <= genStep ? "text-foreground" : "text-muted-foreground/40",
                    )}
                  >
                    {i < genStep ? (
                      <CheckIcon className="size-3.5 text-positive" />
                    ) : i === genStep ? (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    ) : (
                      <span className="mx-1.5 size-1 rounded-full bg-current" />
                    )}
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <form onSubmit={generate} className="flex flex-col gap-5">
              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={5}
                autoFocus
                placeholder="Describe your video idea in a sentence or two"
                className="resize-none text-base"
              />
              <div className="flex flex-col gap-2">
                <label className="label-mono">How much do you think you need?</label>
                <NumberField value={budgetInput} onChange={setBudgetInput} prefix="$" min={100} max={250000} className="max-w-48" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="lg" disabled={idea.trim().length < 15}>
                  <SparklesIcon /> Build my proposal
                </Button>
                <Button type="button" variant="ghost" onClick={writeManually}>
                  <PencilLineIcon /> Write it myself
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  const ret10 = estimatedReturn(10, target, forecast.palPool);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setStage("idea")}>
            <ArrowLeftIcon /> Back to idea
          </Button>
          {aiUsed ? (
            <Badge variant="outline" className="gap-1 font-mono text-[10px] uppercase">
              <SparklesIcon className="size-3" /> AI draft · everything is editable
            </Badge>
          ) : null}
        </div>

        <Card className="overflow-hidden pt-0">
          <Cover cover={cover} title={title} className="h-44">
            <div className="absolute inset-x-0 bottom-0 p-5">
              <span className="label-mono text-white/70">Cover preview</span>
            </div>
          </Cover>
          <CardContent className="flex flex-col gap-5">
            <Field label="Cover">
              <div className="flex flex-wrap items-center gap-2">
                {COVER_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCover(c)}
                    className={cn(
                      "rounded-md ring-offset-2 ring-offset-card transition",
                      cover === c ? "ring-2 ring-foreground" : "opacity-70 hover:opacity-100",
                    )}
                    aria-label={`Cover ${c}`}
                  >
                    <Cover cover={c} className="h-9 w-14 rounded-md" />
                  </button>
                ))}
                <Input
                  placeholder="or paste an image URL"
                  className="h-9 max-w-64 font-mono text-xs"
                  value={cover.startsWith("http") ? cover : ""}
                  onChange={(e) => setCover(e.target.value || COVER_PRESETS[0])}
                />
              </div>
            </Field>
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 text-lg font-medium" maxLength={120} />
            </Field>
            <Field label="Description">
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
            </Field>
            <Field label="Why this needs funding">
              <Textarea value={pitch} onChange={(e) => setPitch(e.target.value)} rows={3} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
            <CardDescription>What Pals&apos; money pays for.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {budget.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={b.label}
                  onChange={(e) => setBudget(budget.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  className="flex-1"
                />
                <NumberField
                  value={b.amount}
                  onChange={(n) => setBudget(budget.map((x, j) => (j === i ? { ...x, amount: n } : x)))}
                  prefix="$"
                  min={0}
                  className="w-32"
                />
                <Button variant="ghost" size="icon" onClick={() => setBudget(budget.filter((_, j) => j !== i))} aria-label="Remove line">
                  <Trash2Icon />
                </Button>
              </div>
            ))}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <Button variant="ghost" size="sm" onClick={() => setBudget([...budget, { label: "", amount: 0 }])}>
                <PlusIcon /> Add line
              </Button>
              <div className="flex items-center gap-3 font-mono text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="num">{money(budgetTotal)}</span>
                {budgetTotal !== target ? (
                  <Button variant="outline" size="sm" onClick={() => setTarget(budgetTotal)}>
                    Set target to {money(budgetTotal)}
                  </Button>
                ) : (
                  <CheckIcon className="size-4 text-positive" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risks</CardTitle>
            <CardDescription>Being upfront builds trust with Pals.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {risks.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={r} onChange={(e) => setRisks(risks.map((x, j) => (j === i ? e.target.value : x)))} />
                <Button variant="ghost" size="icon" onClick={() => setRisks(risks.filter((_, j) => j !== i))} aria-label="Remove risk">
                  <XIcon />
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="self-start" onClick={() => setRisks([...risks, ""])}>
              <PlusIcon /> Add risk
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comparable videos</CardTitle>
            <CardDescription>
              The forecast weights these 65/35 against your channel median. Click to include or exclude.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <ViewsChart videos={creator.videos} highlight={comparables} />
            <div className="flex flex-wrap gap-2">
              {creator.videos.map((v) => {
                const on = comparables.includes(v.videoId);
                return (
                  <button
                    key={v.videoId}
                    type="button"
                    onClick={() =>
                      setComparables(on ? comparables.filter((id) => id !== v.videoId) : [...comparables, v.videoId])
                    }
                    className={cn(
                      "flex max-w-72 items-center gap-2 rounded-full border px-3 py-1 text-xs transition",
                      on ? "border-foreground/60 bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {on ? <CheckIcon className="size-3 shrink-0" /> : null}
                    <span className="truncate">{v.title}</span>
                    <span className="num shrink-0 font-mono text-[10px] text-muted-foreground">{compactNumber(v.viewCount)}</span>
                  </button>
                );
              })}
            </div>
            {explanation ? (
              <Field label="Forecast explanation">
                <Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} />
              </Field>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Pal terms</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Field label="Funding target">
              <NumberField value={target} onChange={setTarget} prefix="$" min={100} max={250000} />
            </Field>
            <Field label="Revenue share" value={`${share}%`}>
              <Slider value={[share]} min={5} max={50} step={1} onValueChange={([v]) => setShare(v)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Share period">
                <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
                  <SelectTrigger className="w-full font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...new Set([...SHARE_MONTHS, months])].sort((a, b) => a - b).map((m) => (
                      <SelectItem key={m} value={String(m)} className="font-mono">
                        {m} months
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Assumed RPM">
                <NumberField value={rpm} onChange={setRpm} prefix="$" min={0.1} max={100} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Forecast
              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                {forecast.method === "similarity" ? `${comparables.length} comparables` : "Channel percentiles"}
              </Badge>
            </CardTitle>
            <CardDescription>Three outcomes based on how the video performs.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScenarioTable
              compact
              rows={[
                { label: "Views", values: forecast.views, format: compactNumber },
                { label: "Revenue", values: forecast.revenue, format: moneyShort },
                { label: "To Pals", values: forecast.palPool, format: moneyShort },
                { label: "You keep", values: forecast.creatorKeeps, format: moneyShort, strong: true },
                { label: "$10 Pal gets", values: ret10, format: moneyCents },
              ]}
            />
          </CardContent>
        </Card>

        <Button size="lg" onClick={publish} disabled={publishing} className="h-12">
          {publishing ? <Loader2Icon className="animate-spin" /> : <RocketIcon />}
          Publish proposal
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Publishing lists the video in the Pals marketplace. Funding goes straight to PayPal.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="label-mono">{label}</span>
        {value ? <span className="num font-mono text-sm">{value}</span> : null}
      </div>
      {children}
    </div>
  );
}
