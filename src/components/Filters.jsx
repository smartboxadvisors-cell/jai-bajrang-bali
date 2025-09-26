import { toDateInputValue } from '../lib/utils';

const initialState = Object.freeze({ date: null, from: null, to: null, search: '' });

export function Filters({ value = initialState, onChange }) {
  const emit = (next) => {
    onChange?.({ ...initialState, ...next });
  };

  const handleDateChange = (event) => {
    const nextValue = event.target.value ? new Date(event.target.value) : null;
    emit({ ...value, date: nextValue, from: null, to: null });
  };

  const handleRangeChange = (key) => (event) => {
    const nextValue = event.target.value ? new Date(event.target.value) : null;
    emit({ ...value, date: null, [key]: nextValue });
  };

  const handleSearchChange = (event) => {
    emit({ ...value, search: event.target.value });
  };

  const handleReset = () => emit(initialState);

  const dateValue = value?.date ? toDateInputValue(value.date) : '';
  const fromValue = value?.from ? toDateInputValue(value.from) : '';
  const toValue = value?.to ? toDateInputValue(value.to) : '';

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">तारीख</span>
          <input
            type="date"
            value={dateValue}
            onChange={handleDateChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">दिनांक से</span>
          <input
            type="date"
            value={fromValue}
            onChange={handleRangeChange('from')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">दिनांक तक</span>
          <input
            type="date"
            value={toValue}
            min={fromValue}
            onChange={handleRangeChange('to')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm xl:col-span-2">
          <span className="text-slate-600">नाम या मोबाइल खोजें</span>
          <input
            type="search"
            value={value?.search ?? ''}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          रीसेट
        </button>
      </div>
    </section>
  );
}
