import { useState } from 'react';
import { User, Phone, WhatsappLogo, Receipt } from '@phosphor-icons/react';

interface Data {
  customerName: string;
  customerPhone: string;
  wantsInvoice: boolean;
  invoiceName: string;
  invoiceCFDI: string;
}
interface Props { initial: Data; onComplete: (data: Data) => void; }

function Field({ label, icon: Icon, required, hint, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-brand-ink mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <Icon size={16} weight="light" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all duration-200 text-brand-ink placeholder:text-slate-300 text-sm font-medium" {...props} />
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const CFDI_OPTIONS = [
  { value: 'G03', label: 'G03 - Gastos en general' },
  { value: 'G01', label: 'G01 - Adquisición de mercancías' },
];

export default function Step2Customer({ initial, onComplete }: Props) {
  const [data, setData]   = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof Data) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = k === 'customerPhone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value;
    setData(d => ({ ...d, [k]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!data.customerName.trim()) err.customerName = 'Requerido';
    const digits = data.customerPhone.replace(/\D/g, '');
    if (!digits) err.customerPhone = 'Requerido';
    else if (digits.length !== 10) err.customerPhone = 'Ingresa exactamente 10 dígitos';
    if (data.wantsInvoice) {
      if (!data.invoiceName.trim()) err.invoiceName = 'Requerido para factura';
      if (!data.invoiceCFDI) err.invoiceCFDI = 'Selecciona un uso de CFDI';
    }
    if (Object.keys(err).length) { setErrors(err); return; }
    onComplete({ ...data, customerPhone: digits });
  };

  return (
    <form id="step-form" onSubmit={handleSubmit} className="px-6 lg:px-10 py-10">
      <span className="eyebrow bg-brand-blue-pale text-brand-blue">02. Datos del cliente</span>

      <h2 className="text-3xl font-black text-brand-ink tracking-tight mt-5">Cuéntanos<br/>quién eres</h2>
      <p className="text-slate-400 mt-2 text-sm">Sin registro ni contraseña. Solo necesitamos tu contacto.</p>

      <div className="mt-8 space-y-5">
        <div>
          <Field label="Nombre completo" icon={User} required type="text"
            placeholder="Laura Rico" value={data.customerName} onChange={set('customerName')} />
          {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
        </div>
        <div>
          <Field label="WhatsApp" icon={WhatsappLogo} required type="tel"
            placeholder="4441234567" maxLength={10}
            hint="10 dígitos sin espacios ni caracteres especiales."
            value={data.customerPhone} onChange={set('customerPhone')} />
          {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>}
        </div>

        {/* Invoice checkbox */}
        <div className="pt-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
              data.wantsInvoice
                ? 'bg-brand-blue border-brand-blue'
                : 'border-slate-300 group-hover:border-brand-blue/50'
            }`}>
              {data.wantsInvoice && (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <input type="checkbox" checked={data.wantsInvoice}
              onChange={(e) => setData(d => ({ ...d, wantsInvoice: e.target.checked }))}
              className="sr-only" />
            <div className="flex items-center gap-2">
              <Receipt size={16} weight="light" className={`transition-colors ${data.wantsInvoice ? 'text-brand-blue' : 'text-slate-400 group-hover:text-brand-blue/60'}`} />
              <span className="text-sm font-semibold text-brand-ink">Desea factura</span>
            </div>
          </label>
        </div>

        {/* Invoice fields — shown only when checked */}
        {data.wantsInvoice && (
          <div className="space-y-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div>
              <label className="block text-sm font-semibold text-brand-ink mb-1.5">
                Nombre o Razón Social <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Laura Rico / Empresa S.A. de C.V."
                value={data.invoiceName}
                onChange={(e) => setData(d => ({ ...d, invoiceName: e.target.value }))}
                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all text-brand-ink placeholder:text-slate-300 text-sm font-medium"
              />
              {errors.invoiceName && <p className="text-red-500 text-xs mt-1">{errors.invoiceName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-ink mb-1.5">
                Uso de CFDI <span className="text-red-400">*</span>
              </label>
              <select
                value={data.invoiceCFDI}
                onChange={(e) => setData(d => ({ ...d, invoiceCFDI: e.target.value }))}
                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all text-brand-ink text-sm font-medium appearance-none cursor-pointer"
              >
                <option value="">Seleccionar uso de CFDI</option>
                {CFDI_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.invoiceCFDI && <p className="text-red-500 text-xs mt-1">{errors.invoiceCFDI}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center gap-3 bg-brand-yellow-pale border border-brand-yellow/30 rounded-2xl px-4 py-3">
        <Phone size={18} className="text-brand-yellow flex-shrink-0" weight="fill" />
        <p className="text-xs text-slate-600 leading-relaxed">
          Cuando tu pedido esté listo, te contactaremos por WhatsApp al número que indiques.
        </p>
      </div>
    </form>
  );
}
