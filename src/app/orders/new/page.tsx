'use client';
import { useEffect, useRef, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

/** Select מותאם אישית (ללא ספריות), RTL */
type Option<T extends string = string> = { value: T; label: string; className?: string };
type SelectBoxProps<T extends string = string> = {
  value: T | '';
  onChange: (v: T) => void;
  placeholder?: string;
  options: Option<T>[];
  buttonClassName?: string;
  menuClassName?: string;
};
function SelectBox<T extends string = string>({
  value,
  onChange,
  placeholder = 'בחר',
  options,
  buttonClassName,
  menuClassName,
}: SelectBoxProps<T>) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const current = options.find(o => o.value === value);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={
          buttonClassName ??
          // RTL + כהה + יישור לימין
          'w-full p-2 rounded bg-black/90 text-white border border-white/20 flex items-center justify-between text-right'
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        dir="rtl"
      >
        <span className={`flex-1 ${current?.className ?? ''}`}>
          {current ? current.label : <span className="opacity-60">{placeholder}</span>}
        </span>
        <span className="mr-2">▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          className={
            menuClassName ??
            // RTL תפריט כהה
            'absolute z-50 mt-1 w-full rounded border border-white/20 bg-neutral-900 shadow-lg max-h-64 overflow-auto text-right'
          }
          dir="rtl"
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 hover:bg-white/10 ${opt.className ?? ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewOrderPage() {
  const router = useRouter();

  const [f, setF] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    amount: '',
    paymentMethod: '' as '' | 'cash' | 'card' | 'online',
    prepTimeMinutes: '' as '' | '10' | '15' | '20' | '30' | '60',
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!auth.currentUser) return alert('חייבים להיות מחוברים');

    if (!f.customerName || !f.customerPhone || !f.customerAddress) {
      return alert('נא למלא שם, טלפון וכתובת לקוח');
    }
    if (!f.paymentMethod) return alert('נא לבחור אמצעי תשלום');
    if (!f.prepTimeMinutes) return alert('נא לבחור זמן הכנה');

    setLoading(true);
    try {
      await addDoc(collection(db, 'orders'), {
        restaurantId: auth.currentUser.uid,
        customerName: f.customerName.trim(),
        customerPhone: f.customerPhone.trim(),
        customerAddress: f.customerAddress.trim(),
        amount: Number(f.amount || 0),
        paymentMethod: f.paymentMethod,
        prepTimeMinutes: Number(f.prepTimeMinutes),
        status: 'pending',
        createdAt: serverTimestamp(),
        // שדות למעקב עתידי
        assignedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
      });
      router.push('/dashboard');
    } catch (err: any) {
      alert('שגיאה: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // אפשרויות
  const paymentOptions: Option<'cash' | 'card' | 'online'>[] = [
    { value: 'cash',   label: 'מזומן' },
    { value: 'card',   label: 'אשראי' },
    { value: 'online', label: 'אונליין' },
  ];

  // צבעי “רמזור” לזמן ההכנה
  const prepOptions: Option<'10' | '15' | '20' | '30' | '60'>[] = [
    { value: '10', label: '10 דקות',        className: 'text-green-400'  },
    { value: '15', label: '15 דקות',        className: 'text-green-300'  },
    { value: '20', label: '20 דקות',        className: 'text-yellow-300' },
    { value: '30', label: '30 דקות',        className: 'text-orange-300' },
    { value: '60', label: '60 דקות (שעה)',  className: 'text-red-400'    },
  ];

  return (
    <main className="p-6 max-w-xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">הוספת משלוח חדש</h1>

      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
          placeholder="שם לקוח"
          value={f.customerName}
          onChange={(e) => setF({ ...f, customerName: e.target.value })}
        />

        <input
          className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
          placeholder="טלפון לקוח"
          value={f.customerPhone}
          onChange={(e) => setF({ ...f, customerPhone: e.target.value })}
        />

        <input
          className="w-full p-2 rounded bg-black/90 text-white border border-white/20 text-right"
          placeholder="כתובת לקוח"
          value={f.customerAddress}
          onChange={(e) => setF({ ...f, customerAddress: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            className="p-2 rounded bg-black/90 text-white border border-white/20 text-right"
            placeholder="סכום לתשלום (₪)"
            type="number"
            value={f.amount}
            onChange={(e) => setF({ ...f, amount: e.target.value })}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm opacity-80">אמצעי תשלום</label>
            <SelectBox
              value={f.paymentMethod}
              onChange={(v) => setF({ ...f, paymentMethod: v })}
              placeholder="בחר אמצעי תשלום"
              options={paymentOptions}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm opacity-80">זמן הכנה</label>
          <SelectBox
            value={f.prepTimeMinutes}
            onChange={(v) => setF({ ...f, prepTimeMinutes: v })}
            placeholder="בחר זמן הכנה"
            options={prepOptions}
          />
        </div>

        <button
          disabled={loading}
          className="px-4 py-2 rounded bg-green-600 disabled:opacity-60"
        >
          {loading ? 'שומר…' : 'צור משלוח'}
        </button>
      </form>
    </main>
  );
}



