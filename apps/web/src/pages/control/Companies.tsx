import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Buildings, Plus, MagnifyingGlass, PencilSimple, Power, X } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { fadeUp, scaleIn, staggerContainer, staggerItem } from '../../components/animations/variants';

export default function Companies() {
  const toast = useToast();

  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formRfc, setFormRfc] = useState('');
  const [formColor, setFormColor] = useState('#01AEF0');

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await (api as any).control.companies.list();
      setCompanies(res.data || res);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar empresas');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = 'Empresas — Control de Gastos';
    fetchCompanies();
  }, [fetchCompanies]);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormShortName('');
    setFormRfc('');
    setFormColor('#01AEF0');
    setShowModal(true);
  };

  const openEdit = (company: any) => {
    setEditing(company);
    setFormName(company.name || '');
    setFormShortName(company.shortName || '');
    setFormRfc(company.rfc || '');
    setFormColor(company.color || '#01AEF0');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formShortName) {
      toast.error('Completa los campos requeridos');
      return;
    }
    setSubmitting(true);
    try {
      const data = { name: formName, shortName: formShortName, rfc: formRfc || undefined, color: formColor };
      if (editing) {
        await (api as any).control.companies.update(editing._id, data);
        toast.success('Empresa actualizada');
      } else {
        await (api as any).control.companies.create(data);
        toast.success('Empresa creada');
      }
      setShowModal(false);
      fetchCompanies();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar empresa');
    }
    setSubmitting(false);
  };

  const toggleActive = async (company: any) => {
    try {
      if (company.active === false) {
        await (api as any).control.companies.activate(company._id);
        toast.success('Empresa activada');
      } else {
        await (api as any).control.companies.deactivate(company._id);
        toast.success('Empresa desactivada');
      }
      fetchCompanies();
    } catch (e: any) {
      toast.error(e.message || 'Error al cambiar estado');
    }
  };

  const filtered = companies.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.shortName?.toLowerCase().includes(search.toLowerCase()) ||
    c.rfc?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div {...fadeUp} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Administra las empresas del grupo</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-sm shadow-blue-glow hover:opacity-90 transition-all ease-out active:scale-[0.97]"
        >
          <Plus size={18} weight="duotone" />
          Nueva Empresa
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar empresa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
        />
      </div>

      {/* Company Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Buildings size={64} weight="duotone" className="text-slate-200 mb-4" />
          <p className="text-lg font-semibold text-slate-400">No se encontraron empresas</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company: any) => (
            <motion.div
              key={company._id}
              variants={staggerItem}
              className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${company.active === false ? 'border-slate-200 opacity-60' : 'border-slate-100'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${company.color || '#01AEF0'}1A` }}>
                    <Buildings size={20} weight="duotone" style={{ color: company.color || '#01AEF0' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{company.name}</p>
                    <p className="text-xs text-slate-500">{company.shortName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: company.color || '#01AEF0' }} />
                  <span className={`w-2.5 h-2.5 rounded-full ${company.active === false ? 'bg-slate-300' : 'bg-green-400'}`} />
                </div>
              </div>

              {company.rfc && (
                <p className="text-xs text-slate-500 mt-3 font-mono bg-slate-50 rounded-lg px-2 py-1 inline-block">{company.rfc}</p>
              )}

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openEdit(company)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all active:scale-[0.97]"
                >
                  <PencilSimple size={14} />
                  Editar
                </button>
                <button
                  onClick={() => toggleActive(company)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] ${company.active === false ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`}
                >
                  <Power size={14} />
                  {company.active === false ? 'Activar' : 'Desactivar'}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
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
                <h3 className="text-lg font-bold text-slate-900">{editing ? 'Editar Empresa' : 'Nueva Empresa'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                    placeholder="Nombre completo de la empresa"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre corto <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formShortName}
                    onChange={e => setFormShortName(e.target.value)}
                    required
                    placeholder="Ej: GRAFICA"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">RFC</label>
                  <input
                    type="text"
                    value={formRfc}
                    onChange={e => setFormRfc(e.target.value.toUpperCase())}
                    placeholder="RFC de la empresa"
                    maxLength={13}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Color de la empresa</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formColor}
                      onChange={e => setFormColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                    />
                    <div className="flex-1 flex gap-2 flex-wrap">
                      {['#01AEF0', '#8B5CF6', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormColor(c)}
                          className={`w-7 h-7 rounded-lg transition-all ${formColor === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
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
