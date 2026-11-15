import React from "react";

function Block({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-[#E7E8DF] ${className}`} />;
}

export function PageSkeleton({
  cards = 4,
  detailPanels = 2,
}: {
  cards?: number;
  detailPanels?: number;
}) {
  const cardGridClass = cards >= 4 ? "lg:grid-cols-4" : cards === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return (
    <div
      className="space-y-8 animate-pulse"
      aria-busy="true"
      aria-label="Loading page data"
      role="status"
    >
      <span className="sr-only">Loading current farm observations</span>
      <section className="rounded-2xl border border-[#E8E2D2] bg-white p-6">
        <Block className="mb-3 h-3 w-32" />
        <Block className="mb-3 h-8 w-2/3 max-w-xl" />
        <Block className="h-3 w-1/2 max-w-md" />
      </section>

      <section className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${cardGridClass}`}>
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="rounded-2xl border border-[#E8E2D2] bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <Block className="h-4 w-28" />
              <Block className="h-8 w-8 rounded-full" />
            </div>
            <Block className="mb-3 h-9 w-24" />
            <Block className="mb-2 h-3 w-full" />
            <Block className="h-3 w-3/4" />
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: detailPanels }, (_, index) => (
          <div key={index} className="rounded-2xl border border-[#E8E2D2] bg-white p-6">
            <Block className="mb-6 h-5 w-48" />
            <Block className="mb-3 h-4 w-full" />
            <Block className="mb-3 h-4 w-11/12" />
            <Block className="mb-3 h-4 w-4/5" />
            <Block className="mt-8 h-32 w-full" />
          </div>
        ))}
      </section>
    </div>
  );
}
