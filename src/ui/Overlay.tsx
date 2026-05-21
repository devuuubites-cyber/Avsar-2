/** Brand corner mark during phase 1. Fades on phase-2 entry (Turn C). */
export function Overlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      <div className="absolute left-6 top-6 sm:left-10 sm:top-10">
        <p className="text-xs sm:text-sm font-medium tracking-[0.32em] text-white/70">
          BIOLOGICAL
        </p>
        <p className="text-xs sm:text-sm font-medium tracking-[0.32em] text-white/70">
          OBSOLESCENCE
        </p>
      </div>
    </div>
  );
}
