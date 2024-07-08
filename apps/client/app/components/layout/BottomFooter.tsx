import { cn } from "~/lib/utils";

export default function BottomFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        "flex flex-row gap-6 bg-zinc-900 border-zinc-600 border-b px-5 py-4",
        className
      )}
    >
      {children}
    </footer>
  );
}
