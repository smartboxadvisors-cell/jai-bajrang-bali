import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONFIG, sheetCsvUrl } from '../config';
import {
  applyFilters,
  ensureArray,
  normalizeSheetRow,
  parseCsvRows
} from '../lib/utils';

const isConfigured = (value) => typeof value === 'string' && value.trim() !== '' && !value.includes('PASTE');

const DEFAULT_FILTERS = {
  date: null,
  from: null,
  to: null,
  search: ''
};

export const useSheetData = (filters = DEFAULT_FILTERS) => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(null);
  const activeController = useRef(null);

  const fetchFromCsv = useCallback(
    async (signal) => {
      if (!isConfigured(CONFIG.SHEET_ID) || !isConfigured(CONFIG.SHEET_NAME)) {
        throw new Error('कृपया CONFIG में SHEET_ID और SHEET_NAME सेट करें।');
      }
      const url = sheetCsvUrl(CONFIG.SHEET_ID, CONFIG.SHEET_NAME);
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'text/csv' },
        signal
      });
      if (!res.ok) {
        throw new Error(`Google Sheet से डेटा पढ़ा नहीं जा सका (स्थिति ${res.status})`);
      }
      const text = await res.text();
      const rows = parseCsvRows(text);
      return ensureArray(rows).map(normalizeSheetRow);
    },
    []
  );

  const fetchFromJson = useCallback(
    async (signal) => {
      const url = CONFIG.APPSCRIPT_GET_URL;
      if (!isConfigured(url)) {
        return null;
      }
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal
      });
      if (!res.ok) {
        throw new Error(`Apps Script JSON endpoint से डेटा नहीं मिल सका (स्थिति ${res.status})`);
      }
      const payload = await res.json();
      if (!payload?.ok) {
        throw new Error('Apps Script JSON endpoint ने ok:true नहीं लौटाया।');
      }
      return ensureArray(payload.data).map(normalizeSheetRow);
    },
    []
  );

  const loadRows = useCallback(async () => {
    activeController.current?.abort?.();
    const controller = new AbortController();
    activeController.current = controller;
    setLoading(true);
    setError(null);
    try {
      let rows = await fetchFromJson(controller.signal);
      if (!rows) {
        rows = await fetchFromCsv(controller.signal);
      }
      lastFetchRef.current = new Date();
      setRawData(rows);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFromCsv, fetchFromJson]);

  useEffect(() => {
    loadRows();
    return () => {
      activeController.current?.abort?.();
    };
  }, [loadRows]);

  const normalizedFilters = useMemo(() => ({
    ...DEFAULT_FILTERS,
    ...filters,
    date: filters?.date instanceof Date && !isNaN(filters.date)
      ? filters.date
      : filters?.date
      ? new Date(filters.date)
      : null,
    from: filters?.from instanceof Date && !isNaN(filters.from)
      ? filters.from
      : filters?.from
      ? new Date(filters.from)
      : null,
    to: filters?.to instanceof Date && !isNaN(filters.to)
      ? filters.to
      : filters?.to
      ? new Date(filters.to)
      : null
  }), [filters]);

  const filteredData = useMemo(() => applyFilters(rawData, normalizedFilters), [rawData, normalizedFilters]);

  return {
    rawData,
    filteredData,
    loading,
    error,
    refetch: loadRows,
    lastUpdated: lastFetchRef.current
  };
};
