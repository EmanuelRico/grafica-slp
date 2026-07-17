import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersThree, Plus, PencilSimple, Power, X, MagnifyingGlass } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { fadeUp, scaleIn, staggerContainer, staggerItem } from '../../components/animations/variants';

export default function Providers() {
  const toast = useToast();

  const [providers, setProviders] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [formName, setFormName] = useState('');
  const [formCompanyIds, setFormCompanyIds] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [provs, comps] = await Promise.all([
        (api as any).control.providers.list(),
        (api as any).control.companies.list(),
      ]);
      setProviders(provs.data || provs);
      setCompanies(comps.data || comps);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar proveedores');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = 'Proveedores — Control de Gastos';
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormCompanyIds([]);
    setShowModal(true);
  };

  const openEdit = (provider: any) => {
    setEditing(provider);
    setFormName(provider.name || '');
    setFormCompanyIds(provider.companyIds || provider.companies?.map((c: any) => c._id || c) || []);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('El nombre es requerido');
      return;
    }
    setSubmitting(true);
    try {
      const data = { name: formName, companies: formCompanyIds };
      if (editing) {
        await (api as any).control.providers.update(editing._id, data);
        toast.success('Proveedor actualizado');
      } else {
        await (api as any).control.providers.create(data);
        toast.success('Proveedor creado');
      }
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar proveedor');
    }
    setSubmitting(false);
  };

  const toggleActive = async (provider: any) => {
    try {
      if (provider.active === false) {
        await (api as any).control.providers.activate(provider._id);
        toast.success('Proveedor activado');
      } else {
        await (api as any).control.providers.deactivate(provider._id);
        toast.success('Proveedor desactivado');
      }
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Error al cambiar estado');
    }
  };

  const toggleCompany = (companyId: string) => {
    setFormCompanyIds(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const filtered = providers.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getCompanyName = (id: string) => companies.find(c => c._id === id)?.shortName || id;

  return (
    <motion.div {...fadeUp} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proveedores</h1>
          <p className="text-sm text-slate-500 mt-0.5">Administra los proveedores de servicios</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-sm shadow-blue-glow hover:opacity-90 transition-all ease-out active:scale-[0.97]"
        >
          <Plus size={18} weight="duotone" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar proveedor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
        />
      </div>

      {/* Providers List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <UsersThree size={64} weight="duotone" className="text-slate-200 mb-4" />
          <p className="text-lg font-semibold text-slate-400">No se encontraron proveedores</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
          {filtered.map((provider: any) => (
            <motion.div
              key={provider._id}
              variants={staggerItem}
              className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${provider.active === false ? 'border-slate-200 opacity-60' : 'border-slate-100'}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <UsersThree size={20} weight="duotone" className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{provider.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(provider.companyIds || provider.companies || []).map((compId: any) => {
                        const name = typeof compId === 'string' ? getCompanyName(compId) : compId.shortName || compId.name;
                        return (
                          <span
                            key={typeof compId === 'string' ? compId : compId._id}
                            className="inline-flex px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100"
                          >
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(provider)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all active:scale-[0.97]"
                  >
                    <PencilSimple size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActive(provider)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] ${provider.active === false ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`}
                  >
                    <Power size={14} />
                    {provider.active === false ? 'Activar' : 'Desactivar'}
                  </button>
                </div>
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
                <h3 className="text-lg font-bold text-slate-900">{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
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
                    placeholder="Nombre del proveedor"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Empresas asociadas</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto p-3 border border-slate-200 rounded-xl">
                    {companies.map((company: any) => (
                      <label key={company._id} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formCompanyIds.includes(company._id)}
                          onChange={() => toggleCompany(company._id)}
                          className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/20"
                        />
                        <span className="text-sm text-slate-700">{company.shortName || company.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-[0.97]"
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
