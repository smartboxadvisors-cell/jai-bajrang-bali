import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import {
  buildDailyStackedDataset,
  buildGenderPieDataset,
  buildStateBarDataset
} from '../lib/utils';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
};

function useDebouncedData(data, delay = 200) {
  const [debounced, setDebounced] = useState(data);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(data), delay);
    return () => clearTimeout(timeout);
  }, [data, delay]);

  return debounced;
}

export function Charts({ rows }) {
  const debouncedRows = useDebouncedData(rows);

  const pieData = useMemo(() => buildGenderPieDataset(debouncedRows), [debouncedRows]);
  const dailyData = useMemo(() => buildDailyStackedDataset(debouncedRows), [debouncedRows]);
  const stateData = useMemo(() => buildStateBarDataset(debouncedRows, 12), [debouncedRows]);
  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-2">
      <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-700">लिंग आधारित वितरण</h2>
        <div className="mt-4 h-72">
          <Pie data={pieData} options={defaultOptions} />
        </div>
      </article>
      <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-700">राज्यवार स्थायी पता</h2>
        <div className="mt-4 h-72">
          <Bar
            data={stateData}
            options={{
              ...defaultOptions,
              indexAxis: 'y',
              scales: {
                x: { beginAtZero: true }
              }
            }}
          />
        </div>
      </article>
      <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
        <h2 className="text-base font-semibold text-slate-700">दैनिक आगमन</h2>
        <div className="mt-4 h-80">
          <Bar
            data={dailyData}
            options={{
              ...defaultOptions,
              scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
              }
            }}
          />
        </div>
      </article>
    </section>
  );
}
