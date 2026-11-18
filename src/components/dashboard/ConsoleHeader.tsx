/**
 * The heading of one console section.
 *
 * The shop name lives in the sticky top bar above this, so the page only
 * names its own section. Purely server-rendered.
 */
export function ConsoleHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="pt-5">
      <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
        {title}
      </h1>
      {description ? (
        <p className="mt-1.5 text-[13px] leading-snug text-muted">{description}</p>
      ) : null}
    </header>
  );
}
