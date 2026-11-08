import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminProductsService } from '../../lib/admin/adminProducts';
import { ProductItem, ServiceCategory } from '../../types';
import { formatKoboToNgn } from '../../lib/formatters';
import { Modal } from '../shared/Modal';
import { BulkImportModal } from './modals/BulkImportModal';
import {
  Sliders,
  Plus,
  Upload,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
} from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>(adminProductsService.getProducts());
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('data');
  const [searchQuery, setSearchQuery] = useState('');

  // Service on/off map
  const [serviceStatusMap, setServiceStatusMap] = useState<Record<string, boolean>>({
    airtime: true,
    data: true,
    tv: true,
    electricity: true,
    exam: true,
    remit: true,
    invoice: true,
    giftcard: true,
    transport: true,
    travel: true,
  });

  // Modal: Add / Edit Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState('MTN');
  const [formPlanCode, setFormPlanCode] = useState('');
  const [formBasePriceNgn, setFormBasePriceNgn] = useState<number>(240);
  const [formUserPriceNgn, setFormUserPriceNgn] = useState<number>(270);
  const [formAgentPriceNgn, setFormAgentPriceNgn] = useState<number>(260);
  const [formVendorPriceNgn, setFormVendorPriceNgn] = useState<number>(250);
  const [formValidity, setFormValidity] = useState('30 Days');
  const [formCategory, setFormCategory] = useState('SME');

  // In-app Delete Confirmation Modal (Zero Browser Dialogs)
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);

  // Modal: Bulk Import
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const refreshList = () => {
    setProducts(adminProductsService.getProducts());
  };

  useEffect(() => {
    const unsubscribe = adminProductsService.subscribeProducts((items) => {
      setProducts(items);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleService = (svc: string) => {
    setServiceStatusMap((prev) => ({ ...prev, [svc]: !prev[svc] }));
  };

  const handleToggleProductActive = async (p: ProductItem) => {
    await adminProductsService.toggleProductActive(
      p.id,
      user?.uid || 'admin',
      user?.name || 'Administrator'
    );
    refreshList();
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    await adminProductsService.deleteProduct(
      productToDelete.id,
      user?.uid || 'admin',
      user?.name || 'Administrator'
    );
    setFeedbackToast(`Product "${productToDelete.name}" successfully deleted.`);
    setProductToDelete(null);
    refreshList();
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormProvider(activeCategory === 'data' ? 'MTN' : 'General');
    setFormPlanCode('');
    setFormBasePriceNgn(240);
    setFormUserPriceNgn(270);
    setFormAgentPriceNgn(260);
    setFormVendorPriceNgn(250);
    setFormValidity('30 Days');
    setFormCategory('SME');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormProvider(p.provider);
    setFormPlanCode(p.plan_code);
    setFormBasePriceNgn((p.base_price || p.cost_price || 0) / 100);
    setFormUserPriceNgn((p.user_price || p.selling_price || 0) / 100);
    setFormAgentPriceNgn((p.agent_price || p.selling_price || 0) / 100);
    setFormVendorPriceNgn((p.vendor_price || p.cost_price || 0) / 100);
    setFormValidity(p.validity || '30 Days');
    setFormCategory(p.category || 'SME');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const baseKobo = Math.round(formBasePriceNgn * 100);
    const userKobo = Math.round(formUserPriceNgn * 100);
    const agentKobo = Math.round(formAgentPriceNgn * 100);
    const vendorKobo = Math.round(formVendorPriceNgn * 100);

    const actorId = user?.uid || 'admin';
    const actorName = user?.name || 'Administrator';

    if (editingProduct) {
      await adminProductsService.updateProductPricing(
        editingProduct.id,
        {
          name: formName,
          provider: formProvider,
          plan_code: formPlanCode,
          base_price: baseKobo,
          cost_price: baseKobo,
          user_price: userKobo,
          selling_price: userKobo,
          agent_price: agentKobo,
          vendor_price: vendorKobo,
          validity: formValidity,
          category: formCategory,
        },
        actorId,
        actorName
      );
      setFeedbackToast(`Plan "${formName}" updated successfully.`);
    } else {
      const newProd: ProductItem = {
        id: `prod_${activeCategory}_${Date.now()}`,
        service: activeCategory,
        provider: formProvider,
        plan_code: formPlanCode || `CODE_${Date.now().toString(36).toUpperCase()}`,
        name: formName,
        base_price: baseKobo,
        cost_price: baseKobo,
        user_price: userKobo,
        selling_price: userKobo,
        agent_price: agentKobo,
        vendor_price: vendorKobo,
        validity: formValidity,
        category: formCategory,
        active: true,
      };
      await adminProductsService.addProduct(newProd, actorId, actorName);
      setFeedbackToast(`New plan "${formName}" added to catalog.`);
    }

    setIsModalOpen(false);
    refreshList();
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const services: Array<{ id: ServiceCategory; label: string }> = [
    { id: 'data', label: 'Data Bundles' },
    { id: 'airtime', label: 'Airtime VTU' },
    { id: 'electricity', label: 'Electricity DisCos' },
    { id: 'tv', label: 'Cable TV' },
    { id: 'exam', label: 'Exam PINs' },
    { id: 'remit', label: 'Remit Banks' },
    { id: 'invoice', label: 'Invoices' },
    { id: 'giftcard', label: 'Gift Cards' },
    { id: 'transport', label: 'Transport & Toll' },
    { id: 'travel', label: 'Travel & Hotel' },
  ];

  let currentProducts = products.filter((p) => p.service === activeCategory);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    currentProducts = currentProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.provider.toLowerCase().includes(q) ||
        p.plan_code.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            Product & Service Catalog Manager
          </h2>
          <p className="text-xs text-slate-400">
            Control multi-tier customer tariffs, wholesale costs, and batch SKU imports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV Bulk Import</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Plan</span>
          </button>
        </div>
      </div>

      {feedbackToast && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Service Tab Switcher with 1-Click Master Toggle */}
      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {services.map((svc) => (
            <button
              key={svc.id}
              onClick={() => {
                setActiveCategory(svc.id);
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeCategory === svc.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {svc.label}
            </button>
          ))}
        </div>

        {/* Master ON/OFF Switch for this entire service */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">Service Status:</span>
          <button
            onClick={() => handleToggleService(activeCategory)}
            className={`font-bold px-2 py-0.5 rounded text-[11px] transition-colors ${
              serviceStatusMap[activeCategory]
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            {serviceStatusMap[activeCategory] ? 'Enabled (Vending Live)' : 'Disabled (Maintenance)'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
        <Search className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeCategory} catalog by plan name, network, or plan code...`}
          className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-hidden"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-[11px] text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-4">Plan Name</th>
                <th className="py-2.5 px-4">Provider / Network</th>
                <th className="py-2.5 px-4">Plan Code</th>
                <th className="py-2.5 px-4 text-right">Cost Price</th>
                <th className="py-2.5 px-4 text-right">User Retail Price</th>
                <th className="py-2.5 px-4 text-right">Agent Tier Price</th>
                <th className="py-2.5 px-4 text-right">Net Margin</th>
                <th className="py-2.5 px-4 text-center">Active</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {currentProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No products found for {activeCategory.toUpperCase()}. Click &quot;Add Plan&quot; or &quot;CSV Bulk Import&quot;.
                  </td>
                </tr>
              ) : (
                currentProducts.map((p) => {
                  const cost = p.base_price || p.cost_price || 0;
                  const userPrice = p.user_price || p.selling_price || 0;
                  const agentPrice = p.agent_price || userPrice;
                  const profitKobo = userPrice - cost;
                  const marginPercent = cost > 0 ? ((profitKobo / cost) * 100).toFixed(1) : '0';

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{p.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {p.category || 'Standard'} · {p.validity || '30 Days'}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-300">{p.provider}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{p.plan_code}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {formatKoboToNgn(cost)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {formatKoboToNgn(userPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {formatKoboToNgn(agentPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                        +{formatKoboToNgn(profitKobo)} ({marginPercent}%)
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleProductActive(p)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.active
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {p.active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded text-[11px] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="py-1 px-2 text-rose-400 hover:bg-rose-950 rounded text-[11px]"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit Plan: ${editingProduct.name}` : `Add New Plan to ${activeCategory.toUpperCase()}`}
        subtitle="Configure upstream aggregator plan code, cost, and multi-tier pricing tariffs"
        maxWidth="md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-slate-200 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Plan Display Name</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. MTN SME 1.5GB (30 Days)"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Provider / Network</label>
              <input
                type="text"
                required
                value={formProvider}
                onChange={(e) => setFormProvider(e.target.value)}
                placeholder="MTN, Airtel, Glo, 9mobile"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Upstream Plan Code</label>
              <input
                type="text"
                required
                value={formPlanCode}
                onChange={(e) => setFormPlanCode(e.target.value)}
                placeholder="e.g. MTN_SME_1GB"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cost Price (₦)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formBasePriceNgn}
                onChange={(e) => setFormBasePriceNgn(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">User Price (₦)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formUserPriceNgn}
                onChange={(e) => setFormUserPriceNgn(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Agent Price (₦)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formAgentPriceNgn}
                onChange={(e) => setFormAgentPriceNgn(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono font-bold text-indigo-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Validity Period</label>
              <input
                type="text"
                value={formValidity}
                onChange={(e) => setFormValidity(e.target.value)}
                placeholder="30 Days"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Type / Category</label>
              <input
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="SME, Corporate, Gifting"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Save Product Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation In-App Modal (Zero Browser Dialogs) */}
      <Modal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="Confirm Plan Deletion"
        subtitle="This action permanently removes the plan from the customer catalog"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Are you sure you want to delete <strong className="text-white">{productToDelete?.name}</strong> (
            {productToDelete?.plan_code})?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setProductToDelete(null)}
              className="py-2 px-3 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk CSV Import Modal */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        actorId={user?.uid || 'admin'}
        actorName={user?.name || 'Administrator'}
        onSuccess={(count) => {
          setFeedbackToast(`Successfully bulk-imported ${count} product SKU(s) into catalog.`);
          refreshList();
          setTimeout(() => setFeedbackToast(null), 4000);
        }}
      />
    </div>
  );
};
