import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CreatorAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-8 ring-1 ring-white/10", className)}>
      {src ? <AvatarImage src={src} alt={name} referrerPolicy="no-referrer" /> : null}
      <AvatarFallback className="bg-gradient-to-br from-neutral-700 to-neutral-900 font-mono text-[11px] text-neutral-200">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
