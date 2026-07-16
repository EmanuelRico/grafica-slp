import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gear, Tag, ListDashes, Plus, PencilSimple, Power, X } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { fadeUp, scaleIn, staggerContainer, staggerItem } from '../../components/animations/variants';

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#6366F1',
  '#A855F7', '#D946EF', '#F43F5E', '#64748B', '#0EA5E9',
];

type Tab = 'categories' | 'concepts';

export default function Configuration() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('categories');

  // Categories state
  const [categories, setCategories] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState(PRESET_COLORS[0]);
  const [catSubmitting, setCatSubmitting] = useState(false);

  // Concepts state
  const [concepts, setConcepts] = useState<any[]>([]);
  const [conLoading, setConLoading] = useState(true);
  const [showConModal, setShowConModal] = useState(false);
  const [editingCon, setEditingCon] = useState<any>(null);
  const [conName, setConName] = useState('');
  const [conDescription, setConDescription] = useState('');
  const [conSubmitting, setConSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await (api as any).control.categories.list();
      setCategories(res.data || res);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar categorías');
    }
    setCatLoading(false);
  }, []);

  const fetchConcepts = useCallback(async () => {
    setConLoading(true);
    try {
      const res = await (api as any).control.concepts.list();
      setConcepts(res.data || res);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar conceptos');
    }
    setConLoading(false);
  }, []);

  useEffect(() => {
    document.title = 'Configuración — Control de Gastos';
    fetchCategories();
    fetchConcepts();
  }, [fetchCategories, fetchConcepts]);

  // Category handlers
  const openCreateCat = () => {
    setEditingCat(null);
    setCatName('');
    setCatColor(PRESET_COLORS[0]);
    setShowCatModal(true);
  };

  const openEditCat = (cat: any) => {
    setEditingCat(cat);
    setCatName(cat.name || '');
    setCatColor(cat.color || PRESET_COLORS[0]);
    setShowCatModal(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) { toast.error('El nombre es requerido'); return; }
    setCatSubmitting(true);
    try {
      const data = { name: catName, color: catColor };
      if (editingCat) {
        await (api as any).control.categories.update(editingCat._id, data);
        toast.success('Categoría actualizada');
      } else {
        await (api as any).control.categories.create(data);
        toast.success('Categoría creada');
      }
      setShowCatModal(false);
      fetchCategories();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar categoría');
    }
    setCatSubmitting(false);
  };

  const toggleCatActive = async (cat: any) => {
    try {
      if (cat.active === false) {
        await (api as any).control.categories.activate(cat._id);
        toast.success('Categoría activada');
      } else {
        await (api as any).control.categories.deactivate(cat._id);
        toast.success('Categoría desactivada');
      }
      fetchCategories();
    } catch (e: any) {
      toast.error(e.message || 'Error al cambiar estado');
    }
  };

  // Concept handlers
  const openCreateCon = () => {
    setEditingCon(null);
    setConName('');
    setConDescription('');
    setShowConModal(true);
  };

  const openEditCon = (con: any) => {
    setEditingCon(con);
    setConName(con.name || '');
    setConDescription(con.description || '');
    setShowConModal(true);
  };

  const handleConSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conName) { toast.error('El nombre es requerido'); return; }
    setConSubmitting(true);
    try {
      const data = { name: conName, description: conDescription || undefined };
      if (editingCon) {
        await (api as any).control.concepts.update(editingCon._id, data);
        toast.success('Concepto actualizado');
      } else {
        await (api as any).control.concepts.create(data);
        toast.success('Concepto creado');
      }
      setShowConModal(false);
      fetchConcepts();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar concepto');
    }
    setConSubmitting(false);
  };

  const toggleConActive = async (con: any) => {
    try {
      if (con.active === false) {
        await (api as any).control.concepts.activate(con._id);
        toast.success('Concepto activado');
      } else {
        await (api as any).control.concepts.deactivate(con._id);
        toast.success('Concepto desactivado');
      }
      fetchConcepts();
    } catch (e: any) {
      toast.error(e.message || 'Error al cambiar estado');
    }
  };

  return (
    <motion.div {...fadeUp} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Gear size={24} weight="duotone" className="text-brand-blue" />
          Configuración
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Categorías y conceptos de pago</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('categories')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97] ${activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Tag size={16} weight="duotone" />
          Categorías
        </button>
        <button
          onClick={() => setActiveTab('concepts')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97] ${activeTab === 'concepts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <ListDashes size={16} weight="duotone" />
          Conceptos
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <motion.div key="categories" {...fadeUp} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 font-medium">{categories.length} categorías</p>
            <button
              onClick={openCreateCat}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-blue text-white font-medium text-sm hover:opacity-90 transition-all ease-out active:scale-[0.97]"
            >
              <Plus size={16} />
              Nueva Categoría
            </button>
          </div>

          {catLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-3 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Tag size={48} weight="duotone" className="text-slate-200 mb-3" />
              <p className="text-slate-400 font-medium">No hay categorías</p>
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
              {categories.map((cat: any) => (
                <motion.div
                  key={cat._id}
                  variants={staggerItem}
                  className={`flex items-center justify-between p-4 ${cat.active === false ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: cat.color, borderColor: cat.color }} />
                    <span className="font-medium text-sm text-slate-800">{cat.name}</span>
                    {cat.active === false && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Inactiva</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditCat(cat)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all active:scale-[0.97]">
                      <PencilSimple size={14} />
                    </button>
                    <button
                      onClick={() => toggleCatActive(cat)}
                      className={`p-1.5 rounded-lg transition-all active:scale-[0.97] ${cat.active === false ? 'hover:bg-green-50 text-green-500' : 'hover:bg-amber-50 text-amber-500'}`}
                    >
                      <Power size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Concepts Tab */}
      {activeTab === 'concepts' && (
        <motion.div key="concepts" {...fadeUp} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 font-medium">{concepts.length} conceptos</p>
            <button
              onClick={openCreateCon}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-blue text-white font-medium text-sm hover:opacity-90 transition-all ease-out active:scale-[0.97]"
            >
              <Plus size={16} />
              Nuevo Concepto
            </button>
          </div>

          {conLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-3 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
            </div>
          ) : concepts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ListDashes size={48} weight="duotone" className="text-slate-200 mb-3" />
              <p className="text-slate-400 font-medium">No hay conceptos</p>
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
              {concepts.map((con: any) => (
                <motion.div
                  key={con._id}
                  variants={staggerItem}
                  className={`flex items-center justify-between p-4 ${con.active === false ? 'opacity-50' : ''}`}
                >
                  <div>
                    <p className="font-medium text-sm text-slate-800">{con.name}</p>
                    {con.description && <p className="text-xs text-slate-500 mt-0.5">{con.description}</p>}
                    {con.active === false && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">Inactivo</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditCon(con)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all active:scale-[0.97]">
                      <PencilSimple size={14} />
                    </button>
                    <button
                      onClick={() => toggleConActive(con)}
                      className={`p-1.5 rounded-lg transition-all active:scale-[0.97] ${con.active === false ? 'hover:bg-green-50 text-green-500' : 'hover:bg-amber-50 text-amber-500'}`}
                    >
                      <Power size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Category Modal */}
      <AnimatePresence>
        {showCatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => setShowCatModal(false)}
          >
            <motion.div
              {...scaleIn}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">{editingCat ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                <button onClick={() => setShowCatModal(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleCatSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={catName}
                    onChange={e => setCatName(e.target.value)}
                    required
                    placeholder="Ej: Servicios, Impuestos, etc."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCatColor(color)}
                        className={`w-7 h-7 rounded-full transition-all ${catColor === color ? 'ring-2 ring-offset-2 ring-brand-blue scale-110' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <label className="text-xs text-slate-500">Personalizado:</label>
                    <input
                      type="color"
                      value={catColor}
                      onChange={e => setCatColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-500">{catColor}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCatModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.97]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={catSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.97]"
                  >
                    {catSubmitting ? 'Guardando...' : editingCat ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Concept Modal */}
      <AnimatePresence>
        {showConModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => setShowConModal(false)}
          >
            <motion.div
              {...scaleIn}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">{editingCon ? 'Editar Concepto' : 'Nuevo Concepto'}</h3>
                <button onClick={() => setShowConModal(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleConSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={conName}
                    onChange={e => setConName(e.target.value)}
                    required
                    placeholder="Nombre del concepto"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <textarea
                    value={conDescription}
                    onChange={e => setConDescription(e.target.value)}
                    rows={3}
                    placeholder="Descripción del concepto (opcional)"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.97]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={conSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.97]"
                  >
                    {conSubmitting ? 'Guardando...' : editingCon ? 'Actualizar' : 'Crear'}
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
