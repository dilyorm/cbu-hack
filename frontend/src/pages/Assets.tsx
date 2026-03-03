import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { assetApi } from '../api/assets';
import { aiApi } from '../api/dashboard';
import type { Asset, AssetCreateRequest, AssetCategory, Page, AiCategoryRecommendation } from '../types';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../utils/status';

export default function Assets() {
  const [assets, setAssets] = useState<Page<Asset> | null>(null);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<AiCategoryRecommendation | null>(null);

  const [form, setForm] = useState<AssetCreateRequest>({
    name: '', serialNumber: '', type: '', categoryId: 0,
  });

  const loadAssets = useCallback(() => {
    setLoading(true);
    const promise = search
      ? assetApi.search(search, page, 20)
      : assetApi.getAll(page, 20);

    promise
      .then(setAssets)
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    assetApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  const handleCreate = async () => {
    try {
      await assetApi.create(form);
      toast.success('Asset created successfully');
      setShowCreate(false);
      setForm({ name: '', serialNumber: '', type: '', categoryId: 0 });
      setAiRecommendation(null);
      loadAssets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await assetApi.delete(id);
      toast.success('Asset deleted');
      loadAssets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAiRecommend = async () => {
    if (!form.name) return;
    try {
      const rec = await aiApi.recommendCategory(form.name, form.description);
      setAiRecommendation(rec);
      const cat = categories.find(c => c.name === rec.recommendedCategory);
      if (cat) {
        setForm(prev => ({ ...prev, categoryId: cat.id, type: rec.recommendedType }));
      }
      toast.success(`AI recommends: ${rec.recommendedCategory} (${(rec.confidence * 100).toFixed(0)}% confidence)`);
    } catch {
      toast.error('AI recommendation failed');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadAssets();
  };

  const filteredAssets = assets?.content.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (categoryFilter && a.categoryId !== Number(categoryFilter)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            Search
          </button>
        </form>

        <div className="flex gap-2 items-center">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="REGISTERED">Registered</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_REPAIR">In Repair</option>
            <option value="LOST">Lost</option>
            <option value="WRITTEN_OFF">Written Off</option>
          </select>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Asset
          </button>
        </div>
      </div>

      {/* Asset Table */}
      {loading ? (
        <LoadingSpinner />
      ) : !filteredAssets || filteredAssets.length === 0 ? (
        <EmptyState
          title="No assets found"
          description="Get started by adding your first asset"
          action={
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              Add Asset
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/assets/${asset.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        {asset.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{asset.serialNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{asset.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{asset.categoryName}</td>
                    <td className="px-6 py-4"><StatusBadge status={asset.status} size="sm" /></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{asset.currentEmployee?.fullName || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(asset.purchaseCost)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link to={`/assets/${asset.id}`} className="text-sm text-indigo-600 hover:text-indigo-800">View</Link>
                        <button onClick={() => handleDelete(asset.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {assets && (
        <Pagination page={assets.number} totalPages={assets.totalPages} totalElements={assets.totalElements} onPageChange={setPage} />
      )}

      {/* Create Asset Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setAiRecommendation(null); }} title="Add New Asset" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Dell Latitude 5520"
                />
                <button
                  type="button"
                  onClick={handleAiRecommend}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 whitespace-nowrap"
                  title="AI will recommend category and type"
                >
                  AI Suggest
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number *</label>
              <input
                type="text"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. SN-2024-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <input
                type="text"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. LAPTOP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0}>Select category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={form.purchaseDate || ''}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Cost</label>
              <input
                type="number"
                step="0.01"
                value={form.purchaseCost || ''}
                onChange={(e) => setForm({ ...form, purchaseCost: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
              <input
                type="date"
                value={form.warrantyExpiryDate || ''}
                onChange={(e) => setForm({ ...form, warrantyExpiryDate: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value || undefined })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value || undefined })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* AI Recommendation Banner */}
          {aiRecommendation && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm font-medium text-purple-800">AI Recommendation</p>
              <p className="text-sm text-purple-700">
                Category: <strong>{aiRecommendation.recommendedCategory}</strong> |
                Type: <strong>{aiRecommendation.recommendedType}</strong> |
                Confidence: <strong>{(aiRecommendation.confidence * 100).toFixed(0)}%</strong>
              </p>
              <p className="text-xs text-purple-600 mt-1">{aiRecommendation.reasoning}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setShowCreate(false); setAiRecommendation(null); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleCreate}
              disabled={!form.name || !form.serialNumber || !form.type || !form.categoryId}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
              Create Asset
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
