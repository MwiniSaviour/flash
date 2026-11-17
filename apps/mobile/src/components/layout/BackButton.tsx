import { cn } from "~/lib/cn";
import { Icon } from "~/components/ui/Icon";

/** A back affordance that matches the mock's plain chevron in a soft circle. */
export function BackButton({
  onClick,
  tone = "light",
  label = "Go back",
}: {
  onClick: () => void;
  tone?: "light" | "dark";
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full transition active:scale-95",
        tone === "light"
          ? "text-white [filter:drop-shadow(0_1px_5px_rgb(0_0_0/0.55))]"
          : "bg-surface/85 text-ink ring-1 ring-line",
      )}
    >
      <Icon name="chevron-left" size={21} />
    </button>
  );
}
