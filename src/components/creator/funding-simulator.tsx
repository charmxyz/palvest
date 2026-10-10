"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { NumberField } from "@/components/number-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { revenueFor } from "@/lib/finance";
import { ScenarioTable } from "@/components/scenario-table";
import { compactNumber, money } from "@/lib/format";
import type { ChannelMetrics } from "@/lib/types";

export const SHARE_MONTHS = [6, 12, 18, 24, 36];

const UPSIDE = [
  "Subscriber growth",
  "Future sponsor value",
  "Future channel growth",
  "Secondary content exposure",
];

export function FundingSimulator({
  metrics,
  rpm,
  onRpmChange,
  sampleSize,
  basePath,
}: {
  metrics: ChannelMetrics;
  rpm: number;
  onRpmChange: (n: number) => void;
  sampleSize: number;
  basePath: string;
}) {
  const [budget, setBudget] = useState(4000);
  const [share, setShare] = useState(20);
  const [months, setMonths] = useState(12);

  const s = share / 100;
  const views = { low: metrics.p25Views, base: metrics.medianViews, high: metrics.p75Views };
  const revenue = {
    low: revenueFor(views.low, rpm),
    base: revenueFor(views.base, rpm),
    high: revenueFor(views.high, rpm),
  };
  const scale = (k: number) => ({ low: revenue.low * k, base: revenue.base * k, high: revenue.high * k });
  const whole = (n: number) => money(n, { cents: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funding simulator</CardTitle>
        <CardDescription>
          Based on your last {sampleSize} long-form uploads. Adjust the terms to see the trade-off.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-6">
          <Field label="Project budget">
            <NumberField value={budget} onChange={setBudget} prefix="$" min={100} max={250000} />
            <Slider value={[budget]} min={500} max={25000} step={250} onValueChange={([v]) => setBudget(v)} />
          </Field>
          <Field label="Revenue share" value={`${share}%`}>
            <Slider value={[share]} min={5} max={50} step={1} onValueChange={([v]) => setShare(v)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Share period">
              <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
                <SelectTrigger className="w-full font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHARE_MONTHS.map((m) => (
                    <SelectItem key={m} value={String(m)} className="font-mono">
                      {m} months
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Assumed RPM">
              <NumberField value={rpm} onChange={onRpmChange} prefix="$" min={0.1} max={100} />
            </Field>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border bg-surface p-5">
            <div className="label-mono">Production funding received upfront</div>
            <div className="num mt-1 text-4xl font-medium tracking-tight">{money(budget)}</div>
          </div>
          <ScenarioTable
            rows={[
              { label: "Views", values: views, format: compactNumber },
              { label: "Video revenue", values: revenue, format: whole },
              { label: `Shared with Pals (${share}%, ${months} mo)`, values: scale(s), format: whole },
              { label: "You keep", values: scale(1 - s), format: whole, strong: true },
            ]}
          />
          <div className="rounded-xl border border-dashed p-4">
            <div className="label-mono mb-3">Additional creator upside — always 100% yours</div>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {UPSIDE.map((u) => (
                <li key={u} className="flex items-center gap-2">
                  <CheckIcon className="size-4 text-positive" />
                  {u}
                </li>
              ))}
            </ul>
          </div>
          <Button asChild size="lg" className="self-start">
            <Link href={`${basePath}/new-proposal?budget=${budget}&share=${share}&months=${months}`}>
              Start proposal <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="label-mono">{label}</span>
        {value ? <span className="num font-mono text-sm">{value}</span> : null}
      </div>
      {children}
    </div>
  );
}
