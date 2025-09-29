import { formatDateLabel } from '../lib/utils';

const numberFormatter = new Intl.NumberFormat('en-IN');

const formatNumber = (value) => {
  const numeric = Number(value);
  return numberFormatter.format(Number.isFinite(numeric) ? Math.max(numeric, 0) : 0);
};

const formatRoomsList = (rooms) => {
  if (!Array.isArray(rooms) || rooms.length === 0) return 'None';
  return rooms.join(', ');
};

export function OccupancySummary({ summary }) {
  if (!summary) return null;

  const {
    date,
    occupiedRooms,
    vacantRooms,
    roomsFilled,
    roomsVacant
  } = summary;

  const occupiedList = Array.isArray(occupiedRooms) ? occupiedRooms : [];
  const vacantList = Array.isArray(vacantRooms) ? vacantRooms : [];
  const roomsFilledCount = Number.isFinite(roomsFilled) ? roomsFilled : occupiedList.length;
  const roomsVacantCount = Number.isFinite(roomsVacant) ? roomsVacant : vacantList.length;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6 flex flex-col gap-1 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <span>Present status for {date ? formatDateLabel(date) : 'Unknown date'}</span>
        <span className="text-xs text-slate-500">Guests counted when arrival is on/before the selected day and exit is empty or later.</span>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <article className="rounded-md border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Rooms filled</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatNumber(roomsFilledCount)}</p>
          <p className="mt-2 text-xs text-slate-500">{formatRoomsList(occupiedList)}</p>
        </article>
        <article className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Rooms vacant</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-900">{formatNumber(roomsVacantCount)}</p>
          <p className="mt-2 text-xs text-emerald-700">{formatRoomsList(vacantList)}</p>
        </article>
      </div>
    </section>
  );
}
