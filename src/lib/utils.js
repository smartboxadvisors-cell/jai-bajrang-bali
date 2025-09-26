import Papa from 'papaparse';
import { format, parseISO, isValid, startOfDay, isWithinInterval } from 'date-fns';

const HEADER_MAP = {
  timestamp: 'Timestamp',
  entryNumber: 'Entry Number',
  name: 'आपका नाम क्या है?',
  male: 'आप कितने आदमी हैं?',
  female: 'आप कितने महिलाएं है?',
  children: 'कितने बच्चे आएं हैं?',
  address: 'अतिथिगणों का स्थायी पता?',
  mobile: 'मोबाइल नंबर?',
  fromWhere: 'कहा से आये है आप?',
  purpose: 'यात्री के आने का उद्देश्य',
  exitDate: 'जाने की तारीख (date)',
  photo: 'आपकी फ़ोटो (optional URL string)',
  eCard: 'ई कार्ड नम्बर',
  incomeCard: 'आय कार्ड की फ़ोटो (optional URL string)',
  otherIncomeCard: 'और आय कार्ड की फ़ोटो (optional URL string)',
  roomNumber: 'रूम या अलमारी नम्बर',
  email: 'Email address'
};

const numberFields = ['male', 'female', 'children'];

const safeNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const parseDateValue = (value) => {
  if (!value) return null;
  const isNumericDate = typeof value === 'number';
  if (isNumericDate) {
    const excelEpoch = new Date(Math.round((value - 25569) * 86400 * 1000));
    return isValid(excelEpoch) ? excelEpoch : null;
  }
  const iso = parseISO(String(value));
  if (isValid(iso)) return iso;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
};

export const parseCsvRows = (csvText) => {
  if (!csvText) return [];
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.warn('CSV parse errors', parsed.errors);
  }
  return parsed.data || [];
};

export const normalizeSheetRow = (row) => {
  const data = {};
  Object.entries(HEADER_MAP).forEach(([key, header]) => {
    data[key] = row?.[header] ?? '';
  });

  numberFields.forEach((field) => {
    data[field] = safeNumber(data[field]);
  });

  data.timestamp = parseDateValue(row?.[HEADER_MAP.timestamp]);
  data.exitDate = parseDateValue(row?.[HEADER_MAP.exitDate]);
  data.totalVisitors = (data.male ?? 0) + (data.female ?? 0) + (data.children ?? 0);

  return {
    ...data,
    entryNumber: data.entryNumber?.toString().trim() || '',
    name: data.name?.toString().trim() || '',
    address: data.address?.toString().trim() || '',
    mobile: data.mobile?.toString().trim() || '',
    fromWhere: data.fromWhere?.toString().trim() || '',
    purpose: data.purpose?.toString().trim() || '',
    photo: data.photo?.toString().trim() || '',
    eCard: data.eCard?.toString().trim() || '',
    incomeCard: data.incomeCard?.toString().trim() || '',
    otherIncomeCard: data.otherIncomeCard?.toString().trim() || '',
    roomNumber: data.roomNumber?.toString().trim() || '',
    email: data.email?.toString().trim() || ''
  };
};

export const formatDateLabel = (date) => {
  if (!date || !isValid(date)) return 'Unknown';
  return format(date, 'dd MMM yyyy');
};

export const toDateInputValue = (date) => {
  if (!date || !isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
};

export const applyFilters = (rows, { date, from, to, search }) => {
  if (!Array.isArray(rows)) return [];
  const trimmedSearch = search?.trim().toLowerCase();
  return rows.filter((row) => {
    const rowDate = row.timestamp ? startOfDay(row.timestamp) : null;
    let dateMatch = true;
    if (date) {
      const singleDate = startOfDay(date);
      dateMatch = rowDate ? rowDate.getTime() === singleDate.getTime() : false;
    } else if (from || to) {
      const range = {
        start: from ? startOfDay(from) : new Date(-8640000000000000),
        end: to ? startOfDay(to) : new Date(8640000000000000)
      };
      dateMatch = rowDate ? isWithinInterval(rowDate, range) : false;
    }

    let searchMatch = true;
    if (trimmedSearch) {
      const haystack = [row.name, row.mobile, row.entryNumber, row.fromWhere]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      searchMatch = haystack.includes(trimmedSearch);
    }

    return dateMatch && searchMatch;
  });
};

export const aggregateTotals = (rows) => {
  return rows.reduce(
    (acc, row) => {
      acc.totalVisitors += row.totalVisitors || 0;
      acc.totalMale += row.male || 0;
      acc.totalFemale += row.female || 0;
      acc.totalChildren += row.children || 0;
      acc.totalEntries += 1;
      return acc;
    },
    { totalVisitors: 0, totalMale: 0, totalFemale: 0, totalChildren: 0, totalEntries: 0 }
  );
};

export const buildGenderPieDataset = (rows) => {
  const totals = rows.reduce(
    (acc, row) => {
      acc.male += row.male || 0;
      acc.female += row.female || 0;
      acc.children += row.children || 0;
      return acc;
    },
    { male: 0, female: 0, children: 0 }
  );

  return {
    labels: ['पुरुष', 'महिलाएं', 'बच्चे'],
    datasets: [
      {
        label: 'Visitors',
        data: [totals.male, totals.female, totals.children],
        backgroundColor: ['#2563eb', '#ec4899', '#f97316']
      }
    ]
  };
};

export const buildDailyStackedDataset = (rows) => {
  const dailyMap = new Map();
  rows.forEach((row) => {
    if (!row.timestamp || !isValid(row.timestamp)) return;
    const key = format(row.timestamp, 'yyyy-MM-dd');
    if (!dailyMap.has(key)) {
      dailyMap.set(key, { male: 0, female: 0, children: 0, date: row.timestamp });
    }
    const entry = dailyMap.get(key);
    entry.male += row.male || 0;
    entry.female += row.female || 0;
    entry.children += row.children || 0;
  });

  const sorted = Array.from(dailyMap.values()).sort((a, b) => a.date - b.date);

  return {
    labels: sorted.map((item) => formatDateLabel(item.date)),
    datasets: [
      {
        label: 'पुरुष',
        data: sorted.map((item) => item.male),
        backgroundColor: '#2563eb'
      },
      {
        label: 'महिलाएं',
        data: sorted.map((item) => item.female),
        backgroundColor: '#ec4899'
      },
      {
        label: 'बच्चे',
        data: sorted.map((item) => item.children),
        backgroundColor: '#f97316'
      }
    ]
  };
};

export const buildOriginBarDataset = (rows, limit = 10) => {
  const originCounts = rows.reduce((acc, row) => {
    const origin = row.fromWhere || 'अज्ञात';
    const current = acc.get(origin) || 0;
    acc.set(origin, current + (row.totalVisitors || 0));
    return acc;
  }, new Map());

  const sorted = Array.from(originCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  return {
    labels: sorted.map(([origin]) => origin),
    datasets: [
      {
        label: 'कुल यात्री',
        data: sorted.map(([, count]) => count),
        backgroundColor: '#10b981'
      }
    ]
  };
};

export const ensureArray = (value) => (Array.isArray(value) ? value : []);
