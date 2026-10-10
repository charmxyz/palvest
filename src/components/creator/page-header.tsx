import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:rounded-t-xl">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4!" />
      <div className="flex min-w-0 items-baseline gap-2">
        {eyebrow ? <span className="label-mono hidden sm:inline">{eyebrow}</span> : null}
        <h1 className="truncate text-sm font-medium">{title}</h1>
      </div>
      <div className="ml-auto flex items-center gap-2">{actions}</div>
    </header>
  );
}
