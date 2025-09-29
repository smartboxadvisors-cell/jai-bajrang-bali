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
      const payload = {
        entryNumber: form.entryNumber.trim(),
        manualEntryNumber: form.manualEntryNumber.trim(),
        timestamp: form.timestamp,
        arrivalTime: form.arrivalTime,
        name: form.name.trim(),
        male: Number(form.male) || 0,
        female: Number(form.female) || 0,
        children: Number(form.children) || 0,
        address: form.address.trim(),
        pinCode: form.pinCode.trim(),
        state: form.state.trim(),
        mobile: form.mobile.trim(),
        whatsapp: form.whatsapp.trim(),
        fromWhere: form.fromWhere.trim(),
        purpose: form.purpose.trim(),
        destination: form.destination.trim(),
        exitDate: form.exitDate,
        photo: form.photo.trim(),
        eCard: form.eCard.trim(),
        incomeCard: form.incomeCard.trim(),
        otherIncomeCard: form.otherIncomeCard.trim(),
        roomNumber: form.roomNumber.trim(),
        email: form.email.trim(),
        totalTravellers: Number(form.totalTravellers) || 0,
        stayingTravellers: Number(form.stayingTravellers) || 0,
        genderSummary: form.genderSummary.trim(),
        occupancyStatus: form.occupancyStatus.trim()
      };

      const response = await fetch(CONFIG.APPSCRIPT_POST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        mode: 'cors',
        body: JSON.stringify(payload)
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
