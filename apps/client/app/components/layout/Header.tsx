import { cn } from "~/lib/utils";

export const Header = ({
  className,
  ...props
}: React.ComponentProps<"header">) => {
  return (
    <header
      className={cn(
        "flex flex-row gap-6 bg-zinc-900 border-zinc-600 border-b px-5 py-4",
        className
      )}
      {...props}
    />
  );
};
