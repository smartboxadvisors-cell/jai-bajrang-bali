import { useMemo, useState } from 'react';
import { Filters } from '../components/Filters';
import { Charts } from '../components/Charts';
import { KpiCards } from '../components/KpiCards';
import { OccupancySummary } from '../components/OccupancySummary';
import { useSheetData } from '../hooks/useSheetData';
import { aggregateTotals, computeOccupancySummary } from '../lib/utils';
import { isValid, startOfDay } from 'date-fns';

const initialFilters = Object.freeze({ date: null, from: null, to: null, search: '' });

const resolveSelectedDate = (filters) => {
  if (filters?.date && isValid(filters.date)) return filters.date;
  if (filters?.to && isValid(filters.to)) return filters.to;
  if (filters?.from && isValid(filters.from)) return filters.from;
  return new Date();
};

export function Dashboard() {
  const [filters, setFilters] = useState(initialFilters);
  const { rawData, filteredData, loading, error, refetch, lastUpdated } = useSheetData(filters);

  const totals = useMemo(() => aggregateTotals(filteredData), [filteredData]);

  const selectedDate = useMemo(() => startOfDay(resolveSelectedDate(filters)), [filters]);

  const occupancy = useMemo(
    () => computeOccupancySummary(rawData, selectedDate),
    [rawData, selectedDate]
  );

  return (
    <div className="space-y-6">
      <Filters value={filters} onChange={setFilters} />

      {loading && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(5)].map((_, idx) => (
              <div
                key={idx}
                className={`h-20 animate-pulse rounded-lg bg-slate-200 ${idx === 4 ? 'sm:col-span-2' : ''}`}
              />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-80 animate-pulse rounded-lg bg-slate-200" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">डेटा लोड करने में समस्या</p>
          <p className="mt-2 text-sm">{error.message}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            पुनः प्रयास करें
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <OccupancySummary summary={occupancy} />
          <KpiCards totals={totals} lastUpdated={lastUpdated} />
          <Charts rows={filteredData} />
          {filteredData.length === 0 && (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              चयनित फिल्टर के लिए कोई रिकॉर्ड उपलब्ध नहीं है
            </p>
          )}
        </>
      )}
    </div>
  );
}
