import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md" }: Props) {
  return (
    <div
      className={cn(
        "animate-[spin_1.25s_ease-out_infinite] rounded-full border-primary-foreground border-t-transparent motion-reduce:hidden",
        size === "sm" && "h-4 w-4 border-2",
        size === "md" && "h-6 w-6 border-2",
        size === "lg" && "h-8 w-8 border-4",
        className,
      )}
      aria-hidden={true}
    />
  );
}
