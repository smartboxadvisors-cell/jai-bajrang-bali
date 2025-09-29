const formatter = new Intl.NumberFormat('en-IN');

const cards = [
  { key: 'totalVisitors', label: 'कुल यात्री' },
  { key: 'totalMale', label: 'कुल पुरुष' },
  { key: 'totalFemale', label: 'कुल महिलाएं' },
  { key: 'totalChildren', label: 'कुल बच्चे' },
  { key: 'totalEntries', label: 'कुल प्रविष्टियां', fullWidth: true }
];

export function KpiCards({ totals, lastUpdated }) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const value = Math.max(0, totals?.[card.key] ?? 0);
          const colSpanClass = card.fullWidth ? 'sm:col-span-2' : '';

          return (
            <article
              key={card.key}
              className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${colSpanClass}`}
            >
              <p className="text-sm font-medium text-slate-600">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatter.format(value)}</p>
            </article>
          );
        })}
      </div>
      {lastUpdated && (
        <p className="text-xs text-slate-500">
          अंतिम अपडेट: {lastUpdated.toLocaleString('hi-IN')}
        </p>
      )}
    </section>
  );
}
