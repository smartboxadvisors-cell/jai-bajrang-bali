import { FormVisitor } from '../components/FormVisitor';

export function NewEntry() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-800">भक्त पंजीकरण</h1>
        <p className="mt-2 text-sm text-slate-600">
          कृपया सभी अनिवार्य विवरण भरें और जमा करें। सफल सबमिशन पर डेटा स्वतः Google Sheet में जुड़ जाएगा।
        </p>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <FormVisitor />
      </section>
    </div>
  );
}
