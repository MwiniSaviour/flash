/**
 * The waiting state.
 *
 * Every screen in Flash reads from the database, so every screen can be
 * waiting. The skeleton keeps the same rhythm as the real content so the
 * layout does not jump when the data lands.
 */
export default function Loading() {
  return (
    <div className="px-5 pt-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="h-7 w-44 animate-pulse rounded-[10px] bg-surface-2" />

      <div className="mt-5 space-y-2.5">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="h-[92px] animate-pulse rounded-[16px] border border-line/90 bg-surface"
          />
        ))}
      </div>

      <div className="mt-6 h-40 animate-pulse rounded-[16px] border border-line/90 bg-surface" />
    </div>
  );
}
