import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bank, CreditCard, Plus, PencilSimple, Power, X } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { fadeUp, scaleIn, staggerContainer, staggerItem } from '../../components/animations/variants';

export default function BankAccounts() {
  const toast = useToast();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCompany, setFilterCompany] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [formName, setFormName] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formLastFour, setFormLastFour] = useState('');
  const [formCompanyId, setFormCompanyId] = useState('');
  const [formType, setFormType] = useState<'cuenta' | 'tarjeta_credito'>('cuenta');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [accts, comps] = await Promise.all([
        (api as any).control.bankAccounts.list(),
        (api as any).control.companies.list(),
      ]);
      setAccounts(accts.data || accts);
      setCompanies(comps.data || comps);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar cuentas bancarias');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = 'Cuentas Bancarias — Control de Gastos';
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormBankName('');
    setFormLastFour('');
    setFormCompanyId('');
    setFormType('cuenta');
    setShowModal(true);
  };

  const openEdit = (account: any) => {
    setEditing(account);
    setFormName(account.name || '');
    setFormBankName(account.bankName || '');
    setFormLastFour(account.lastFourDigits || '');
    setFormCompanyId(account.companyId || account.company?._id || '');
    setFormType(account.type || 'cuenta');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formBankName || !formLastFour || !formCompanyId) {
      toast.error('Completa todos los campos');
      return;
    }
    setSubmitting(true);
    try {
      const data = { name: formName, bankName: formBankName, lastFourDigits: formLastFour, company: formCompanyId, type: formType };
      if (editing) {
        await (api as any).control.bankAccounts.update(editing._id, data);
        toast.success('Cuenta actualizada');
      } else {
        await (api as any).control.bankAccounts.create(data);
        toast.success('Cuenta creada');
      }
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar cuenta');
    }
    setSubmitting(false);
  };

  const toggleActive = async (account: any) => {
    try {
      if (account.active === false) {
        await (api as any).control.bankAccounts.activate(account._id);
        toast.success('Cuenta activada');
      } else {
        await (api as any).control.bankAccounts.deactivate(account._id);
        toast.success('Cuenta desactivada');
      }
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Error al cambiar estado');
    }
  };

  const filtered = filterCompany
    ? accounts.filter(a => (a.companyId || a.company?._id) === filterCompany)
    : accounts;

  // Group by company
  const grouped = filtered.reduce((acc: Record<string, any[]>, a) => {
    const companyName = a.companyName || a.company?.shortName || companies.find(c => c._id === a.companyId)?.shortName || 'Sin empresa';
    if (!acc[companyName]) acc[companyName] = [];
    acc[companyName].push(a);
    return acc;
  }, {});

  return (
    <motion.div {...fadeUp} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cuentas Bancarias</h1>
          <p className="text-sm text-slate-500 mt-0.5">Administra las cuentas bancarias del grupo</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-sm shadow-blue-glow hover:opacity-90 transition-all ease-out active:scale-[0.97]"
        >
          <Plus size={18} weight="duotone" />
          Nueva Cuenta
        </button>
      </div>

      {/* Filter */}
      <div className="max-w-xs">
        <select
          value={filterCompany}
          onChange={e => setFilterCompany(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
        >
          <option value="">Todas las empresas</option>
          {companies.map((c: any) => (
            <option key={c._id} value={c._id}>{c.shortName || c.name}</option>
          ))}
        </select>
      </div>

      {/* Accounts grouped */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Bank size={64} weight="duotone" className="text-slate-200 mb-4" />
          <p className="text-lg font-semibold text-slate-400">No hay cuentas bancarias</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([companyName, accts]) => (
            <div key={companyName}>
              <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-blue" />
                {companyName}
              </h3>
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(accts as any[]).map((account: any) => (
                  <motion.div
                    key={account._id}
                    variants={staggerItem}
                    className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${account.active === false ? 'border-slate-200 opacity-60' : 'border-slate-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                        {account.type === 'tarjeta_credito' ? (
                          <CreditCard size={18} weight="duotone" className="text-purple-600" />
                        ) : (
                          <Bank size={18} weight="duotone" className="text-emerald-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate text-sm">{account.name}</p>
                        <p className="text-xs text-slate-500">
                          {account.type === 'tarjeta_credito' ? 'Tarjeta de Crédito' : 'Cuenta Bancaria'} · {account.bankName} · ****{account.lastFourDigits}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => openEdit(account)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all active:scale-[0.97]"
                      >
                        <PencilSimple size={12} />
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActive(account)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] ${account.active === false ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`}
                      >
                        <Power size={12} />
                        {account.active === false ? 'Activar' : 'Desactivar'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              {...scaleIn}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">{editing ? 'Editar Cuenta' : formType === 'tarjeta_credito' ? 'Nueva Tarjeta de Crédito' : 'Nueva Cuenta Bancaria'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${formType === 'cuenta' ? 'border-brand-blue bg-blue-50/50 ring-1 ring-brand-blue/20' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" name="accountType" value="cuenta" checked={formType === 'cuenta'} onChange={() => setFormType('cuenta')} className="sr-only" />
                      <Bank size={16} weight="duotone" className={formType === 'cuenta' ? 'text-brand-blue' : 'text-slate-400'} />
                      <span className={`text-sm font-medium ${formType === 'cuenta' ? 'text-brand-blue' : 'text-slate-600'}`}>Cuenta Bancaria</span>
                    </label>
                    <label className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${formType === 'tarjeta_credito' ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500/20' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" name="accountType" value="tarjeta_credito" checked={formType === 'tarjeta_credito'} onChange={() => setFormType('tarjeta_credito')} className="sr-only" />
                      <CreditCard size={16} weight="duotone" className={formType === 'tarjeta_credito' ? 'text-purple-600' : 'text-slate-400'} />
                      <span className={`text-sm font-medium ${formType === 'tarjeta_credito' ? 'text-purple-600' : 'text-slate-600'}`}>Tarjeta de Crédito</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la cuenta <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                    placeholder="Ej: Cuenta Principal"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Banco <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formBankName}
                    onChange={e => setFormBankName(e.target.value)}
                    required
                    placeholder="Ej: BBVA, Banorte, etc."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Últimos 4 dígitos <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formLastFour}
                    onChange={e => setFormLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    maxLength={4}
                    placeholder="1234"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Empresa <span className="text-red-400">*</span></label>
                  <select
                    value={formCompanyId}
                    onChange={e => setFormCompanyId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  >
                    <option value="">Seleccionar empresa...</option>
                    {companies.map((c: any) => (
                      <option key={c._id} value={c._id}>{c.shortName || c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.97]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.97]"
                  >
                    {submitting ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
