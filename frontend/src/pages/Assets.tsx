import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, PhotoIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { assetApi } from '../api/assets';
import { aiApi } from '../api/dashboard';
import type { Asset, AssetCreateRequest, AssetCategory, Page, AiCategoryRecommendation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../utils/status';

export default function Assets() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canDelete = user?.role === 'ADMIN';

  const [assets, setAssets] = useState<Page<Asset> | null>(null);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<AiCategoryRecommendation | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState<AssetCreateRequest>({
    name: '', serialNumber: '', type: '', categoryId: 0,
  });

  const loadAssets = useCallback(() => {
    setLoading(true);
    const promise = search
      ? assetApi.search(search, page, 20)
      : assetApi.getAll(page, 20, 'createdAt,desc', {
          status: statusFilter || undefined,
          categoryId: categoryFilter ? Number(categoryFilter) : undefined,
          type: typeFilter || undefined,
        });

    promise
      .then(setAssets)
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, categoryFilter, typeFilter]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    assetApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetModal = () => {
    setShowCreate(false);
    setForm({ name: '', serialNumber: '', type: '', categoryId: 0 });
    setAiRecommendation(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleCreate = async () => {
    try {
      const newAsset = await assetApi.create(form);
      if (photoFile) {
        try {
          await assetApi.uploadImage(newAsset.id, photoFile);
        } catch {
          toast.error('Asset created but photo upload failed');
        }
      }
      toast.success('Asset created successfully');
      resetModal();
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

  const [isRecommending, setIsRecommending] = useState(false);

  const handleAiRecommend = async () => {
    if (!form.name) {
      toast.error('Please enter a name first');
      return;
    }
    setIsRecommending(true);
    try {
      const rec = await aiApi.recommendCategory(form.name, form.description);
      setAiRecommendation(rec);
      const cat = categories.find(c => c.name.toLowerCase() === rec.recommendedCategory.toLowerCase().trim());
      if (cat) {
        setForm(prev => ({ ...prev, categoryId: cat.id, type: rec.recommendedType }));
      }
      toast.success(`AI recommends: ${rec.recommendedCategory} (${(rec.confidence * 100).toFixed(0)}% confidence)`);
    } catch {
      toast.error('AI recommendation failed');
    } finally {
      setIsRecommending(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadAssets();
  };

  const handleFilterChange = () => {
    setPage(0);
  };

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
              onChange={(e) => { setSearch(e.target.value); if (!e.target.value) setPage(0); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2 items-center">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); handleFilterChange(); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="REGISTERED">Registered</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_REPAIR">In Repair</option>
            <option value="LOST">Lost</option>
            <option value="WRITTEN_OFF">Written Off</option>
          </select>

          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); handleFilterChange(); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filter by type..."
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); handleFilterChange(); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36"
          />

          {canEdit && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4" />
              Add Asset
            </button>
          )}
        </div>
      </div>

      {/* Asset Table */}
      {loading ? (
        <LoadingSpinner />
      ) : !assets || assets.content.length === 0 ? (
        <EmptyState
          title="No assets found"
          description={canEdit ? "Get started by adding your first asset" : "No assets match the current filters"}
          action={
            canEdit ? (
              <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                Add Asset
              </button>
            ) : undefined
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
                {assets.content.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {asset.imagePath ? (
                          <img
                            src={`/api/assets/${asset.id}/image-url`}
                            alt={asset.name}
                            className="h-8 w-8 rounded object-cover flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <PhotoIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <Link to={`/assets/${asset.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                          {asset.name}
                        </Link>
                      </div>
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
                        {canDelete && (
                          <button onClick={() => handleDelete(asset.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                        )}
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
      {canEdit && (
        <Modal open={showCreate} onClose={resetModal} title="Add New Asset" size="lg">
          <div className="space-y-4">

            {/* ── Photo upload — first ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Photo{' '}
                <span className="text-gray-400 font-normal">(recommended — enables AI risk insights)</span>
              </label>
              <label
                htmlFor="create-asset-photo"
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-indigo-400 transition-colors"
              >
                {photoPreview ? (
                  <div className="w-full text-center">
                    <img src={photoPreview} alt="Preview" className="mx-auto h-32 object-contain rounded-lg mb-2" />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setPhotoFile(null); setPhotoPreview(null); }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove photo
                    </button>
                  </div>
                ) : (
                  <>
                    <PhotoIcon className="h-10 w-10 text-gray-400" />
                    <p className="mt-1 text-sm text-gray-500">Click to upload a photo</p>
                    <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10 MB</p>
                  </>
                )}
                <input
                  id="create-asset-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            </div>

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
                    disabled={isRecommending || !form.name}
                    className="px-3 py-2 bg-purple-600 text-white flex items-center gap-1 rounded-lg text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title="AI will recommend category and type"
                  >
                    {isRecommending ? (
                      <>
                        <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Suggesting...
                      </>
                    ) : 'AI Suggest'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description{' '}
                <span className="text-gray-400 font-normal">(recommended — enables AI risk insights)</span>
              </label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value || undefined })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe the asset condition, specs, or usage..."
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
              <button onClick={resetModal}
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
      )}
    </div>
  );
}
