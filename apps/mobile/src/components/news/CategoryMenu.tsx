import { useEffect, useRef, useState } from "react";

import { Icon } from "~/components/ui/Icon";
import { cn } from "~/lib/cn";

export interface NewsCategory {
  slug: string;
  name: string;
  count: number;
}

/**
 * The newsroom's category menu: a menu button in the masthead that opens a
 * sheet listing every desk from the shared taxonomy, with the number of stories
 * in each. Choosing one filters the page; choosing it again clears the filter.
 */
export function CategoryMenu({
  categories,
  active,
  onSelect,
}: {
  categories: NewsCategory[];
  active: string | null;
  onSelect: (slug: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Close on Escape and on a click outside, the way a real menu behaves.
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const total = categories.reduce((sum, category) => sum + category.count, 0);

  return (
    <div className="relative flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="News categories"
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full border transition active:scale-95",
          open ? "border-brand/40 bg-brand-soft text-brand" : "border-line bg-surface/80 text-ink",
        )}
      >
        <Icon name="menu" size={18} />
      </button>

      {open ? (
        <div
          ref={panelRef}
          role="menu"
          aria-label="News categories"
          className="animate-fade absolute right-0 top-11 z-30 w-[248px] overflow-hidden rounded-[5px] border border-line bg-surface shadow-raised"
        >
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              Categories
            </span>
            <span className="text-[10.5px] font-medium tabular-nums text-muted-soft">
              {total} stories
            </span>
          </div>

          <ul className="max-h-[60vh] overflow-y-auto py-1">
            <li>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={active === null}
                onClick={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3.5 py-2 text-left text-[13.5px] transition active:opacity-60",
                  active === null ? "font-semibold text-brand" : "font-medium text-ink",
                )}
              >
                All news
                <span className="text-[11px] tabular-nums text-muted-soft">{total}</span>
              </button>
            </li>

            {categories.map((category) => {
              const selected = active === category.slug;
              return (
                <li key={category.slug}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => {
                      onSelect(selected ? null : category.slug);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3.5 py-2 text-left text-[13.5px] transition active:opacity-60",
                      selected ? "font-semibold text-brand" : "font-medium text-ink",
                    )}
                  >
                    {category.name}
                    <span className="text-[11px] tabular-nums text-muted-soft">{category.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
