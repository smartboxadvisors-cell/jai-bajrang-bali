import Papa from 'papaparse';
import { addDays, format, isValid, parse, parseISO, startOfDay, isWithinInterval } from 'date-fns';

const HEADER_MAP = {
  timestamp: ['Timestamp'],
  entryNumber: ['"Entry Number"', 'Entry Number'],
  manualEntryNumber: ['???????? ?????? ?????? ????', 'Manual Entry Number'],
  arrivalTime: ['???? ?? ???', 'Arrival Time'],
  name: ['"???? ??? ???? ???"', '???? ??? ???? ???', 'Name'],
  male: ['?? ????? ???? ????', 'Male'],
  female: ['?? ????? ??????? ???', 'Female'],
  children: ['????? ????? ??? ????', 'Children'],
  address: ['????????? ?? ?????? ????', 'Address'],
  pinCode: ['PinCode', 'Pincode'],
  state: ['State'],
  mobile: ['?????? ?????', 'Mobile'],
  whatsapp: ['Whasapp no (Y/N)', 'Whatsapp no (Y/N)'],
  fromWhere: ['??? ?? ??? ?? ???', 'From Where'],
  purpose: ['?????? ?? ??? ?? ????????', 'Purpose'],
  destination: ['??? ???? ??', 'Destination'],
  exitDate: ['???? ?? ?????', '???? ?? ????? (date)', 'Exit Date'],
  photo: ['???? ????', '???? ???? (optional URL string)', 'Photo'],
  eCard: ['? ????? ?????', 'E Card Number'],
  incomeCard: ['?? ????? ?? ????', '?? ????? ?? ???? (optional URL string)', 'Income Card Photo'],
  otherIncomeCard: ['?? ?? ????? ?? ????', 'Other Income Card Photo'],
  roomNumber: ['??? ?? ?????? ?????', 'Room Number'],
  email: ['Email address', 'Email'],
  totalTravellers: ['??? ????????? ?? ??????', 'Total Travellers'],
  stayingTravellers: ['?????? ?????? ?? ?? ??? ??', 'Staying Travellers'],
  genderSummary: ['?????, ?????, ?????, ???? ???', 'Gender Summary'],
  occupancyStatus: ['Occupied/Empty', 'Status']
};

const HEADER_ORDER = [
  'entryNumber',
  'manualEntryNumber',
  'timestamp',
  'arrivalTime',
  'name',
  'male',
  'female',
  'children',
  'address',
  'pinCode',
  'state',
  'mobile',
  'whatsapp',
  'fromWhere',
  'purpose',
  'destination',
  'exitDate',
  'photo',
  'eCard',
  'incomeCard',
  'otherIncomeCard',
  'roomNumber',
  'email',
  'totalTravellers',
  'stayingTravellers',
  'genderSummary',
  'occupancyStatus'
];

const HEADER_INDEX = HEADER_ORDER.reduce((acc, key, index) => {
  acc[key] = index;
  return acc;
}, {});

let detectedColumns = null;
const numberFields = ['male', 'female', 'children', 'totalTravellers', 'stayingTravellers'];

const DEVANAGARI_DIGITS = {
  '\u0966': '0',
  '\u0967': '1',
  '\u0968': '2',
  '\u0969': '3',
  '\u096A': '4',
  '\u096B': '5',
  '\u096C': '6',
  '\u096D': '7',
  '\u096E': '8',
  '\u096F': '9'
};

const normalizeDigitString = (value) =>
  String(value).replace(/[\u0966-\u096F]/g, (char) => DEVANAGARI_DIGITS[char] ?? char);

const safeNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = normalizeDigitString(String(value).trim());
  if (text === '') return 0;
  const match = text.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return 0;
  const normalized = match[0].replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
};

const readCell = (row, key) => {
  if (!row) return '';
  if (!detectedColumns) {
    detectedColumns = Object.keys(row);
  }
  const header = HEADER_MAP[key];
  if (header) {
    const headers = Array.isArray(header) ? header : [header];
    for (const name of headers) {
      if (name in row) {
        return row[name];
      }
    }
  } else if (key in row) {
    return row[key];
  }

  const index = HEADER_INDEX[key];
  if (detectedColumns && typeof index === 'number' && index >= 0 && index < detectedColumns.length) {
    const fallbackKey = detectedColumns[index];
    if (fallbackKey in row) {
      return row[fallbackKey];
    }
  }

  return '';
};

const SUPPORTED_DATE_FORMATS = [
  'dd/MM/yyyy',
  'd/M/yyyy',
  'dd-MM-yyyy',
  'd-M-yyyy',
  'dd/MM/yyyy HH:mm',
  'dd/MM/yyyy HH:mm:ss',
  'dd/MM/yyyy hh:mm a',
  'dd/MM/yyyy h:mm a',
  'dd-MM-yyyy HH:mm',
  'dd-MM-yyyy HH:mm:ss',
  'dd-MM-yyyy hh:mm a',
  'dd-MM-yyyy h:mm a',
  'yyyy-MM-dd',
  'yyyy-MM-dd HH:mm',
  'yyyy-MM-dd HH:mm:ss',
  'yyyy-MM-dd hh:mm a',
  'yyyy-MM-dd h:mm a',
  "yyyy-MM-dd'T'HH:mm",
  "yyyy-MM-dd'T'HH:mm:ss",
  'yyyy/MM/dd',
  'yyyy/MM/dd HH:mm',
  'yyyy/MM/dd HH:mm:ss',
  'yyyy/MM/dd hh:mm a',
  'yyyy/MM/dd h:mm a',
  'MM/dd/yyyy',
  'M/d/yyyy',
  'MM/dd/yyyy HH:mm',
  'M/d/yyyy HH:mm',
  'MM/dd/yyyy hh:mm a',
  'M/d/yyyy hh:mm a',
  'MM/dd/yyyy h:mm a',
  'M/d/yyyy h:mm a',
  'MM-dd-yyyy',
  'M-d-yyyy',
  'MM-dd-yyyy HH:mm',
  'M-d-yyyy HH:mm',
  'MM-dd-yyyy hh:mm a',
  'M-d-yyyy hh:mm a',
  'MM-dd-yyyy h:mm a',
  'M-d-yyyy h:mm a',
  'dd MMM yyyy',
  'd MMM yyyy',
  'MMM d, yyyy',
  'MMMM d, yyyy'
];

const parseGenderSummary = (value) => {
  if (!value) return null;
  const normalized = normalizeDigitString(String(value));
  const tokens = normalized
    .split(/[^0-9.,-]+/)
    .map((token) => safeNumber(token))
    .filter((num) => Number.isFinite(num) && num > 0);
  if (tokens.length >= 3) {
    return { male: tokens[0], female: tokens[1], children: tokens[2] };
  }
  return null;
};

const parseDateValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    const excelEpoch = new Date(Math.round((value - 25569) * 86400 * 1000));
    return isValid(excelEpoch) ? excelEpoch : null;
  }

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const iso = parseISO(trimmed);
  if (isValid(iso)) return iso;

  for (const formatString of SUPPORTED_DATE_FORMATS) {
    const parsed = parse(trimmed, formatString, new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  }

  const fallback = new Date(trimmed);
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

  Object.keys(HEADER_MAP).forEach((key) => {
    data[key] = readCell(row, key);
  });

  numberFields.forEach((field) => {
    data[field] = safeNumber(data[field]);
  });

  data.timestamp = parseDateValue(readCell(row, 'timestamp'));
  data.exitDate = parseDateValue(readCell(row, 'exitDate'));
  data.arrivalDate = parseDateValue(readCell(row, 'arrivalTime'));

  const toTrimmedString = (value) => (typeof value === 'string' ? value.trim() : value ?? '');

  data.arrivalTime = toTrimmedString(data.arrivalTime);
  data.totalTravellers = safeNumber(data.totalTravellers);
  data.stayingTravellers = safeNumber(data.stayingTravellers);

  const totalByGender = (data.male || 0) + (data.female || 0) + (data.children || 0);
  data.totalVisitors = data.totalTravellers || data.stayingTravellers || totalByGender;

  return {
    ...data,
    entryNumber: toTrimmedString(data.entryNumber),
    manualEntryNumber: toTrimmedString(data.manualEntryNumber),
    arrivalTime: toTrimmedString(data.arrivalTime),
    arrivalDate: data.arrivalDate,
    name: toTrimmedString(data.name),
    address: toTrimmedString(data.address),
    pinCode: toTrimmedString(data.pinCode),
    state: toTrimmedString(data.state),
    mobile: toTrimmedString(data.mobile),
    whatsapp: toTrimmedString(data.whatsapp),
    fromWhere: toTrimmedString(data.fromWhere),
    purpose: toTrimmedString(data.purpose),
    destination: toTrimmedString(data.destination),
    photo: toTrimmedString(data.photo),
    eCard: toTrimmedString(data.eCard),
    incomeCard: toTrimmedString(data.incomeCard),
    otherIncomeCard: toTrimmedString(data.otherIncomeCard),
    roomNumber: toTrimmedString(data.roomNumber),
    email: toTrimmedString(data.email),
    genderSummary: toTrimmedString(data.genderSummary),
    occupancyStatus: toTrimmedString(data.occupancyStatus),
    totalTravellers: data.totalTravellers,
    stayingTravellers: data.stayingTravellers,
    totalVisitors: data.totalVisitors
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
      const genderBreakdown = parseGenderSummary(row.genderSummary);
      const maleValue = (() => {
        const direct = safeNumber(row.male);
        if (direct > 0) return direct;
        return genderBreakdown?.male ? safeNumber(genderBreakdown.male) : 0;
      })();
      const femaleValue = (() => {
        const direct = safeNumber(row.female);
        if (direct > 0) return direct;
        return genderBreakdown?.female ? safeNumber(genderBreakdown.female) : 0;
      })();
      const childrenValue = (() => {
        const direct = safeNumber(row.children);
        if (direct > 0) return direct;
        return genderBreakdown?.children ? safeNumber(genderBreakdown.children) : 0;
      })();

      const visitorsValue = (() => {
        const direct = safeNumber(row.totalVisitors);
        if (direct > 0) return direct;
        const alt = safeNumber(row.totalTravellers) || safeNumber(row.stayingTravellers);
        if (alt > 0) return alt;
        const fallback = maleValue + femaleValue + childrenValue;
        return fallback > 0 ? fallback : 0;
      })();

      acc.totalVisitors += visitorsValue;
      acc.totalMale += maleValue;
      acc.totalFemale += femaleValue;
      acc.totalChildren += childrenValue;
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

export const buildStateBarDataset = (rows, limit = 10) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      labels: [],
      datasets: [
        { label: 'राज्य अनुसार अतिथि', data: [], backgroundColor: '#6366f1' }
      ]
    };
  }

  const counts = rows.reduce((acc, row) => {
    const stateRaw = typeof row?.state === 'string' ? row.state.trim() : '';
    const addressRaw = typeof row?.address === 'string' ? row.address.trim() : '';
    const key = stateRaw || addressRaw || 'अज्ञात';
    const total = safeNumber(row?.totalVisitors) || 1;
    acc.set(key, (acc.get(key) || 0) + total);
    return acc;
  }, new Map());

  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  return {
    labels: sorted.map(([state]) => state),
    datasets: [
      {
        label: 'राज्य अनुसार अतिथि',
        data: sorted.map(([, count]) => count),
        backgroundColor: '#6366f1'
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


export const computeOccupancySummary = (rows, targetDate) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { date: null, totalPeople: 0, occupiedRooms: [], vacantRooms: [] };
  }

  const effectiveDate = targetDate && isValid(targetDate)
    ? startOfDay(targetDate)
    : startOfDay(new Date());

  const normalizeRoom = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    return String(value).trim();
  };

  const resolveArrival = (row) => {
    if (row?.arrivalDate && isValid(row.arrivalDate)) {
      return startOfDay(row.arrivalDate);
    }
    if (row?.timestamp && isValid(row.timestamp)) {
      return startOfDay(row.timestamp);
    }
    return null;
  };

  const allRooms = new Set();
  const occupiedRoomsSet = new Set();
  let totalPeople = 0;
  let maleCount = 0;
  let femaleCount = 0;
  let childrenCount = 0;

  rows.forEach((row) => {
    const room = normalizeRoom(row?.roomNumber);
    if (room) {
      allRooms.add(room);
    }

    const arrivalDay = resolveArrival(row);
    if (!arrivalDay || arrivalDay > effectiveDate) {
      return;
    }

    const status =
      typeof row?.occupancyStatus === 'string'
        ? row.occupancyStatus.trim().toLowerCase()
        : '';

    if (status === 'empty' || status === 'vacant') {
      if (room) {
        occupiedRoomsSet.delete(room);
      }
      return;
    }

    const exitDay = (() => {
      if (row?.exitDate && isValid(row.exitDate)) {
        return startOfDay(row.exitDate);
      }
      if (arrivalDay) {
        return addDays(arrivalDay, 6);
      }
      return null;
    })();

    if (exitDay && exitDay < effectiveDate) {
      if (room) {
        occupiedRoomsSet.delete(room);
      }
      return;
    }

    const numeric = (value) => Math.max(safeNumber(value), 0);
    const genderBreakdown = parseGenderSummary(row?.genderSummary);

    const maleValue = (() => {
      const direct = numeric(row?.male);
      if (direct > 0) return direct;
      return genderBreakdown?.male ? numeric(genderBreakdown.male) : 0;
    })();

    const femaleValue = (() => {
      const direct = numeric(row?.female);
      if (direct > 0) return direct;
      return genderBreakdown?.female ? numeric(genderBreakdown.female) : 0;
    })();

    const childrenValue = (() => {
      const direct = numeric(row?.children);
      if (direct > 0) return direct;
      return genderBreakdown?.children ? numeric(genderBreakdown.children) : 0;
    })();

    const fallbackHeadCount = maleValue + femaleValue + childrenValue;

    const headCountSources = [
      row?.stayingTravellers,
      row?.totalTravellers,
      row?.totalVisitors,
      fallbackHeadCount || null
    ];

    const headCountCandidate = headCountSources.find((value) => {
      const num = Number(value);
      return Number.isFinite(num) && num > 0;
    });

    let headCount = Number(headCountCandidate);
    if (!Number.isFinite(headCount) || headCount <= 0) {
      headCount = fallbackHeadCount > 0 ? fallbackHeadCount : 1;
    }

    totalPeople += headCount;

    maleCount += maleValue;
    femaleCount += femaleValue;
    childrenCount += childrenValue;

    if (room) {
      occupiedRoomsSet.add(room);
    }
  });

  const occupiedRooms = Array.from(occupiedRoomsSet).sort((a, b) => a.localeCompare(b, 'hi-IN'));
  const vacantRooms = Array.from(allRooms)
    .filter((room) => !occupiedRoomsSet.has(room))
    .sort((a, b) => a.localeCompare(b, 'hi-IN'));

  return {
    date: effectiveDate,
    totalPeople,
    occupiedRooms,
    vacantRooms,
    roomsFilled: occupiedRooms.length,
    roomsVacant: vacantRooms.length,
    breakdown: {
      male: maleCount,
      female: femaleCount,
      children: childrenCount
    }
  };
};


