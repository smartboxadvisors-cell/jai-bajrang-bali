const formatter = new Intl.NumberFormat('en-IN');

const cards = [
  { key: 'totalVisitors', label: 'कुल यात्री' },
  { key: 'totalMale', label: 'कुल पुरुष' },
  { key: 'totalFemale', label: 'कुल महिलाएं' },
  { key: 'totalChildren', label: 'कुल बच्चे' },
  { key: 'totalEntries', label: 'कुल प्रविष्टियां' }
];

export function KpiCards({ totals, lastUpdated }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <article key={card.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatter.format(Math.max(0, totals?.[card.key] ?? 0))}
          </p>
        </article>
      ))}
      {lastUpdated && (
        <p className="md:col-span-2 xl:col-span-5 text-xs text-slate-500">
          अंतिम अपडेट: {lastUpdated.toLocaleString('hi-IN')}
        </p>
      )}
    </section>
  );
}
