import { useState } from 'react';
import toast from 'react-hot-toast';
import { CONFIG } from '../config';

const initialForm = Object.freeze({
  entryNumber: '',
  manualEntryNumber: '',
  timestamp: '',
  arrivalTime: '',
  name: '',
  male: '0',
  female: '0',
  children: '0',
  address: '',
  pinCode: '',
  state: '',
  mobile: '',
  whatsapp: '',
  fromWhere: '',
  purpose: '',
  destination: '',
  exitDate: '',
  photo: '',
  eCard: '',
  incomeCard: '',
  otherIncomeCard: '',
  roomNumber: '',
  email: '',
  totalTravellers: '0',
  stayingTravellers: '0',
  genderSummary: '',
  occupancyStatus: ''
});

const isConfigured = (value) => typeof value === 'string' && value.trim() !== '' && !value.includes('PASTE');

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) {
    errors.name = 'कृपया नाम दर्ज करें';
  }
  if (!/^\d{10}$/.test(form.mobile.trim())) {
    errors.mobile = 'मोबाइल नंबर (10 अंकों) में भरें';
  }
  ['male', 'female', 'children', 'totalTravellers', 'stayingTravellers'].forEach((field) => {
    const value = Number(form[field]);
    if (Number.isNaN(value) || value < 0) {
      errors[field] = 'मान 0 या अधिक होना चाहिए';
    }
  });
  if (form.exitDate) {
    const exit = new Date(form.exitDate);
    if (Number.isNaN(exit.getTime())) {
      errors.exitDate = 'जाने की तारीख मान्य नहीं है';
    }
  }
  if (form.timestamp) {
    const stamp = new Date(form.timestamp);
    if (Number.isNaN(stamp.getTime())) {
      errors.timestamp = 'Timestamp मान्य नहीं है';
    }
  }
  return errors;
};

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

const pad2 = (value) => String(value).padStart(2, '0');

const formatDateForSheet = (value) => {
  if (!value) return '';
  const normalized = normalizeDigitString(String(value));
  const dateParts = normalized.split(/[-/]/);
  if (dateParts.length === 3) {
    const [part1, part2, part3] = dateParts;
    if (part1.length === 4) {
      return `${pad2(part3)}\/${pad2(part2)}\/${part1}`;
    }
    if (part3.length === 4) {
      return `${pad2(part1)}\/${pad2(part2)}\/${part3}`;
    }
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return normalized;
  return `${pad2(date.getDate())}\/${pad2(date.getMonth() + 1)}\/${date.getFullYear()}`;
};

const formatTimeForSheet = (value) => {
  if (!value) return '';
  const normalized = normalizeDigitString(String(value).trim());
  const timeParts = normalized.split(':');
  if (timeParts.length >= 2) {
    const [hour, minute, second = '00'] = timeParts;
    return `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
  }
  const parsed = new Date(`1970-01-01T${normalized}`);
  if (Number.isNaN(parsed.getTime())) return normalized;
  return `${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}:${pad2(parsed.getSeconds())}`;
};

const formatTimestampForSheet = (value) => {
  if (!value) return '';
  const normalized = normalizeDigitString(String(value).trim());
  if (normalized.includes('T')) {
    const [datePart, timePart = '00:00'] = normalized.split('T');
    return `${formatDateForSheet(datePart)} ${formatTimeForSheet(timePart)}`.trim();
  }
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return normalized;
  return `${pad2(date.getDate())}\/${pad2(date.getMonth() + 1)}\/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`.trim();
};

const fieldConfig = [
  { name: 'entryNumber', label: 'Entry Number', type: 'text' },
  { name: 'manualEntryNumber', label: 'मॅन्युअल नोंदणी एंट्री नंबर', type: 'text' },
  { name: 'timestamp', label: 'Timestamp', type: 'datetime-local' },
  { name: 'arrivalTime', label: 'आगमन का समय', type: 'time' },
  { name: 'name', label: 'आपका नाम क्या है?', type: 'text', required: true },
  { name: 'male', label: 'आप कितने आदमी हैं?', type: 'number', min: 0 },
  { name: 'female', label: 'आप कितने महिलाएं है?', type: 'number', min: 0 },
  { name: 'children', label: 'कितने बच्चे आएं हैं?', type: 'number', min: 0 },
  { name: 'address', label: 'अतिथिगणों का स्थायी पता?', type: 'text' },
  { name: 'pinCode', label: 'PinCode', type: 'text', inputMode: 'numeric' },
  { name: 'state', label: 'State', type: 'text' },
  { name: 'mobile', label: 'मोबाइल नंबर?', type: 'tel', required: true },
  {
    name: 'whatsapp',
    label: 'Whatsapp no (Y/N)',
    type: 'select',
    options: [
      { value: '', label: 'Select' },
      { value: 'Y', label: 'Y' },
      { value: 'N', label: 'N' }
    ]
  },
  { name: 'fromWhere', label: 'कहा से आये है आप?', type: 'text' },
  { name: 'purpose', label: 'यात्री के आने का उद्देश्य', type: 'text' },
  { name: 'destination', label: 'कहा जाना है', type: 'text' },
  { name: 'exitDate', label: 'जाने की तारीख', type: 'date' },
  { name: 'photo', label: 'आपकी फ़ोटो (URL)', type: 'url' },
  { name: 'eCard', label: 'ई कार्ड नम्बर', type: 'text' },
  { name: 'incomeCard', label: 'आय कार्ड की फ़ोटो (URL)', type: 'url' },
  { name: 'otherIncomeCard', label: 'और आय कार्ड की फ़ोटो (URL)', type: 'url' },
  { name: 'roomNumber', label: 'रूम या अलमारी नम्बर', type: 'text' },
  { name: 'email', label: 'Email address', type: 'email' },
  { name: 'totalTravellers', label: 'सभी यात्रियों की संख्या', type: 'number', min: 0 },
  { name: 'stayingTravellers', label: 'यात्री संख्या जो रह रहे है', type: 'number', min: 0 },
  { name: 'genderSummary', label: 'पुरुष, महिला, बच्चे, एकुन लोग', type: 'text' },
  {
    name: 'occupancyStatus',
    label: 'Occupied/Empty',
    type: 'select',
    options: [
      { value: '', label: 'Select status' },
      { value: 'Occupied', label: 'Occupied' },
      { value: 'Empty', label: 'Empty' }
    ]
  }
];

export function FormVisitor() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isConfigured(CONFIG.APPSCRIPT_POST_URL)) {
      toast.error('कृपया Apps Script URL सेट करें');
      return;
    }

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error('कृपया आवश्यक जानकारी जांचें');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const formattedTimestamp = formatTimestampForSheet(form.timestamp || now.toISOString());
      const formattedArrivalTime = formatTimeForSheet(
        form.arrivalTime || `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
      );
      const formattedExitDate = formatDateForSheet(form.exitDate);

      const maleValue = Number(form.male) || 0;
      const femaleValue = Number(form.female) || 0;
      const childrenValue = Number(form.children) || 0;
      const totalTravellersValue =
        Number(form.totalTravellers) || maleValue + femaleValue + childrenValue;
      const stayingTravellersValue = Number(form.stayingTravellers) || 0;

      const payload = {
        entryNumber: form.entryNumber.trim(),
        manualEntryNumber: form.manualEntryNumber.trim(),
        timestamp: formattedTimestamp,
        arrivalTime: formattedArrivalTime,
        name: form.name.trim(),
        male: maleValue,
        female: femaleValue,
        children: childrenValue,
        address: form.address.trim(),
        pinCode: form.pinCode.trim(),
        state: form.state.trim(),
        mobile: form.mobile.trim(),
        whatsapp: form.whatsapp.trim(),
        fromWhere: form.fromWhere.trim(),
        purpose: form.purpose.trim(),
        destination: form.destination.trim(),
        exitDate: formattedExitDate,
        photo: form.photo.trim(),
        eCard: form.eCard.trim(),
        incomeCard: form.incomeCard.trim(),
        otherIncomeCard: form.otherIncomeCard.trim(),
        roomNumber: form.roomNumber.trim(),
        email: form.email.trim(),
        totalTravellers: totalTravellersValue,
        stayingTravellers: stayingTravellersValue,
        genderSummary: form.genderSummary.trim(),
        occupancyStatus: form.occupancyStatus.trim()
      };

      const response = await fetch(CONFIG.APPSCRIPT_POST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        mode: 'cors',
        body: JSON.stringify({
          ...payload,
          sheetValues: [
            payload.entryNumber,
            payload.manualEntryNumber,
            payload.timestamp,
            payload.arrivalTime,
            payload.name,
            payload.male,
            payload.female,
            payload.children,
            payload.address,
            payload.pinCode,
            payload.state,
            payload.mobile,
            payload.whatsapp,
            payload.fromWhere,
            payload.purpose,
            payload.destination,
            payload.exitDate,
            payload.photo,
            payload.eCard,
            payload.incomeCard,
            payload.otherIncomeCard,
            payload.roomNumber,
            payload.email,
            payload.totalTravellers,
            payload.stayingTravellers,
            payload.genderSummary,
            payload.occupancyStatus
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json().catch(() => ({ ok: false }));
      if (!result.ok) {
        throw new Error(result.error || 'Unknown error');
      }

      toast.success('फॉर्म सफलतापूर्वक सबमिट हुआ');
      setForm(initialForm);
      setErrors({});
    } catch (err) {
      console.error('Submission error', err);
      toast.error('सबमिशन में समस्या आई');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {fieldConfig.map((field) => {
          const hasError = Boolean(errors[field.name]);
          const commonProps = {
            value: form[field.name] ?? '',
            onChange: handleChange(field.name),
            className: `w-full rounded-md border px-3 py-2 text-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 ${
              hasError ? 'border-red-500' : 'border-slate-300'
            }`
          };

          return (
            <label key={field.name} className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">
                {field.label}
                {field.required ? <span className="text-red-500"> *</span> : null}
              </span>
              {field.type === 'select' ? (
                <select {...commonProps}>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  inputMode={field.inputMode}
                  min={field.min}
                  step={field.type === 'number' ? '1' : undefined}
                  {...commonProps}
                />
              )}
              {hasError ? (
                <span className="text-xs text-red-600">{errors[field.name]}</span>
              ) : null}
            </label>
          );
        })}
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? '...' : 'फॉर्म जमा करें'}
        </button>
      </div>
    </form>
  );
}


