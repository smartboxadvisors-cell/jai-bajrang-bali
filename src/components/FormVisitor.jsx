import { useState } from 'react';
import toast from 'react-hot-toast';
import { CONFIG } from '../config';

const initialForm = Object.freeze({
  entryNumber: '',
  name: '',
  male: '0',
  female: '0',
  children: '0',
  address: '',
  mobile: '',
  fromWhere: '',
  purpose: '',
  exitDate: '',
  photo: '',
  eCard: '',
  incomeCard: '',
  otherIncomeCard: '',
  roomNumber: '',
  email: ''
});

const isConfigured = (value) => typeof value === 'string' && value.trim() !== '' && !value.includes('PASTE');

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) {
    errors.name = 'नाम अनिवार्य है';
  }
  if (!/^\d{10}$/.test(form.mobile.trim())) {
    errors.mobile = 'मोबाइल नंबर (10 अंक)';
  }
  ['male', 'female', 'children'].forEach((field) => {
    const value = Number(form[field]);
    if (Number.isNaN(value) || value < 0) {
      errors[field] = 'मान 0 से कम नहीं हो सकता';
    }
  });
  if (form.exitDate) {
    const date = new Date(form.exitDate);
    if (Number.isNaN(date.getTime())) {
      errors.exitDate = 'कृपया वैध तारीख चुनें';
    }
  }
  return errors;
};

const fieldConfig = [
  { name: 'entryNumber', label: 'Entry Number', type: 'text', required: false },
  { name: 'name', label: 'आपका नाम क्या है?', type: 'text', required: true },
  { name: 'male', label: 'आप कितने आदमी हैं?', type: 'number', min: 0 },
  { name: 'female', label: 'आप कितने महिलाएं है?', type: 'number', min: 0 },
  { name: 'children', label: 'कितने बच्चे आएं हैं?', type: 'number', min: 0 },
  { name: 'address', label: 'अतिथिगणों का स्थायी पता?', type: 'text' },
  { name: 'mobile', label: 'मोबाइल नंबर?', type: 'tel', required: true },
  { name: 'fromWhere', label: 'कहा से आये है आप?', type: 'text' },
  { name: 'purpose', label: 'यात्री के आने का उद्देश्य', type: 'text' },
  { name: 'exitDate', label: 'जाने की तारीख (date)', type: 'date' },
  { name: 'email', label: 'Email address', type: 'email' },
  { name: 'photo', label: 'आपकी फ़ोटो (optional URL string)', type: 'url' },
  { name: 'incomeCard', label: 'आय कार्ड की फ़ोटो (optional URL string)', type: 'url' },
  { name: 'otherIncomeCard', label: 'और आय कार्ड की फ़ोटो (optional URL string)', type: 'url' },
  { name: 'eCard', label: 'ई कार्ड नम्बर', type: 'text' },
  { name: 'roomNumber', label: 'रूम या अलमारी नम्बर', type: 'text' }
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
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error('कृपया त्रुटियां सुधारें');
      return;
    }

    if (!isConfigured(CONFIG.APPSCRIPT_POST_URL)) {
      toast.error('कृपया CONFIG.APPSCRIPT_POST_URL सेट करें');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        entryNumber: form.entryNumber.trim(),
        name: form.name.trim(),
        male: Number(form.male) || 0,
        female: Number(form.female) || 0,
        children: Number(form.children) || 0,
        address: form.address.trim(),
        mobile: form.mobile.trim(),
        fromWhere: form.fromWhere.trim(),
        purpose: form.purpose.trim(),
        exitDate: form.exitDate,
        photo: form.photo.trim(),
        eCard: form.eCard.trim(),
        incomeCard: form.incomeCard.trim(),
        otherIncomeCard: form.otherIncomeCard.trim(),
        roomNumber: form.roomNumber.trim(),
        email: form.email.trim()
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

      toast.success('फॉर्म सफलतापूर्वक जमा हुआ');
      setForm(initialForm);
      setErrors({});
    } catch (err) {
      console.error('Submission error', err);
      toast.error('सबमिट करते समय त्रुटि');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {fieldConfig.map((field) => (
          <label key={field.name} className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">
              {field.label}
              {field.required ? <span className="text-red-500"> *</span> : null}
            </span>
            <input
              type={field.type}
              inputMode={field.type === 'tel' ? 'numeric' : undefined}
              min={field.min}
              step={field.type === 'number' ? '1' : undefined}
              value={form[field.name] ?? ''}
              onChange={handleChange(field.name)}
              className={`w-full rounded-md border px-3 py-2 text-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                errors[field.name] ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors[field.name] && (
              <span className="text-xs text-red-600">{errors[field.name]}</span>
            )}
          </label>
        ))}
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

