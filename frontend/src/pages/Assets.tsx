import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
  const isUser = user?.role === 'USER';

  const [searchParams] = useSearchParams();
  // Special filters only available to ADMIN/MANAGER
  const specialFilter = isUser ? null : searchParams.get('filter');
  const initialStatus = isUser ? '' : (searchParams.get('status') || '');

  const [assets, setAssets] = useState<Page<Asset> | null>(null);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState<AssetCreateRequest>({
    name: '', serialNumber: '', type: '', categoryId: 0,
  });

  // ── AI ghost-text state ──────────────────────────────────────────────────
  const [aiSuggestion, setAiSuggestion] = useState<AiCategoryRecommendation | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);
  // ghostType / ghostCategoryId are only set when the corresponding field is still empty
  const [ghostType, setGhostType] = useState('');
  const [ghostCategoryId, setGhostCategoryId] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear ghosts whenever the user fills in a field themselves
  const clearGhosts = useCallback(() => {
    setGhostType('');
    setGhostCategoryId(0);
    setAiSuggestion(null);
  }, []);

  // Accept ghost suggestions into the real form
  const acceptSuggestion = useCallback(() => {
    if (!aiSuggestion) return;
    setForm(prev => ({
      ...prev,
      type: ghostType || prev.type,
      categoryId: ghostCategoryId || prev.categoryId,
    }));
    setGhostType('');
    setGhostCategoryId(0);
  }, [aiSuggestion, ghostType, ghostCategoryId]);

  // Core trigger — debounced 700 ms
  const triggerAi = useCallback((name: string, description: string | undefined, photoName?: string) => {
    const hasEnoughInput =
      name.trim().length >= 2 ||
      (description ?? '').trim().length >= 3 ||
      !!photoName;

    if (!hasEnoughInput) {
      clearGhosts();
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setIsRecommending(true);
      try {
        const effectiveName = name.trim() ||
          (photoName ? photoName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') : '');
        const effectiveDesc = description ||
          (photoName ? `Image filename: ${photoName}` : undefined);

        const rec = await aiApi.recommendCategory(effectiveName, effectiveDesc, ctrl.signal);

        if (ctrl.signal.aborted) return;

        setAiSuggestion(rec);

        // Only set ghost type if the user hasn't typed one yet
        setGhostType(prev => (form.type.trim() ? prev : rec.recommendedType || ''));

        // Only set ghost category if the user hasn't picked one yet
        if (!form.categoryId) {
          const matched = categories.find(
            c => c.name.toLowerCase() === rec.recommendedCategory.toLowerCase().trim()
          );
          setGhostCategoryId(matched ? matched.id : 0);
        }
      } catch (err: any) {
        if (err.name === 'CanceledError' || err.message === 'canceled' || err.code === 'ERR_CANCELED') return;
        // Silent — ghost suggestions are best-effort
      } finally {
        if (abortRef.current === ctrl) setIsRecommending(false);
      }
    }, 700);
  }, [categories, form.type, form.categoryId, clearGhosts]);

  const loadAssets = useCallback(() => {
    setLoading(true);

    let promise: Promise<Page<Asset>>;
    if (isUser) {
      promise = assetApi.getMyAssets().then(list => ({
        content: list, totalElements: list.length, totalPages: 1,
        size: list.length, number: 0, first: true, last: true,
      }));
    } else if (specialFilter === 'expired-warranty') {
      promise = assetApi.getExpiredWarranty().then(list => ({
        content: list, totalElements: list.length, totalPages: 1,
        size: list.length, number: 0, first: true, last: true,
      }));
    } else if (specialFilter === 'aging') {
      promise = assetApi.getAgingAssets().then(list => ({
        content: list, totalElements: list.length, totalPages: 1,
        size: list.length, number: 0, first: true, last: true,
      }));
    } else {
      promise = search
        ? assetApi.search(search, page, 20)
        : assetApi.getAll(page, 20, 'createdAt,desc', {
            status: statusFilter || undefined,
            categoryId: categoryFilter ? Number(categoryFilter) : undefined,
            type: typeFilter || undefined,
          });
    }

    promise
      .then(setAssets)
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [isUser, page, search, statusFilter, categoryFilter, typeFilter, specialFilter]);

  useEffect(() => { loadAssets(); }, [loadAssets]);
  useEffect(() => { assetApi.getCategories().then(setCategories).catch(console.error); }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    triggerAi(form.name, form.description, file.name);
  };

  const resetModal = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    setShowCreate(false);
    setForm({ name: '', serialNumber: '', type: '', categoryId: 0 });
    clearGhosts();
    setIsRecommending(false);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleCreate = async () => {
    try {
      const newAsset = await assetApi.create(form);
      if (photoFile) {
        try { await assetApi.uploadImage(newAsset.id, photoFile); }
        catch { toast.error('Asset created but photo upload failed'); }
      }
      toast.success('Asset created successfully');
      resetModal();
      loadAssets();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await assetApi.delete(id);
      toast.success('Asset deleted');
      loadAssets();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadAssets();
  };

  const handleFilterChange = () => { setPage(0); };

  // Derived display values for ghosts
  const ghostCategoryName = ghostCategoryId
    ? (categories.find(c => c.id === ghostCategoryId)?.name ?? '')
    : '';
  const hasSuggestion = !!(ghostType || ghostCategoryId);

  return (
    <div className="space-y-4">
      {/* My Assets banner for USER role */}
      {isUser && (
        <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-indigo-800">
            Showing assets currently assigned to you
          </p>
        </div>
      )}

      {/* Special filter banner */}
      {specialFilter && (
        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-orange-800">
            {specialFilter === 'expired-warranty'
              ? 'Showing assets with expired warranty'
              : 'Showing aging assets (5+ years old)'}
          </p>
          <Link to="/assets" className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-800">
            <XMarkIcon className="h-4 w-4" /> Clear filter
          </Link>
        </div>
      )}

      {/* Toolbar — hidden for USER role */}
      {!isUser && (
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {!specialFilter && (
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
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {!specialFilter && (
            <>
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
            </>
          )}

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
      )}

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

      {/* ── Create Asset Modal ─────────────────────────────────────────── */}
      {canEdit && (
        <Modal open={showCreate} onClose={resetModal} title="Add New Asset" size="lg">
          <div className="space-y-4">

            {/* Photo upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Photo <span className="text-gray-400 font-normal">(recommended — enables AI risk insights)</span>
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
                <input id="create-asset-photo" type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              </label>
            </div>

            {/* AI status bar */}
            <div className="min-h-[22px]">
              {isRecommending && (
                <div className="flex items-center gap-2 text-xs text-purple-500">
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  AI is thinking…
                </div>
              )}
              {!isRecommending && hasSuggestion && (
                <div className="flex items-center gap-1.5 text-xs text-purple-600">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse inline-block" />
                  AI suggestion ready —
                  press <kbd className="px-1 py-0.5 rounded bg-purple-100 border border-purple-300 font-mono text-purple-700 text-[11px]">Tab</kbd>
                  to accept
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm(prev => ({ ...prev, name: v }));
                    triggerAi(v, form.description, photoFile?.name);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Tab' && hasSuggestion) { e.preventDefault(); acceptSuggestion(); } }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Dell Latitude 5520"
                />
              </div>

              {/* Serial Number */}
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

              {/* Type — with ghost text overlay */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <div className="relative">
                  {/* Ghost text rendered behind the real input */}
                  {ghostType && !form.type && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center px-3 text-sm text-purple-300 pointer-events-none select-none truncate"
                    >
                      {ghostType}
                    </span>
                  )}
                  <input
                    type="text"
                    value={form.type}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, type: e.target.value }));
                      if (e.target.value) setGhostType(''); // user typed → discard ghost
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && ghostType && !form.type) {
                        e.preventDefault();
                        acceptSuggestion();
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-transparent relative z-10"
                    placeholder={ghostType ? '' : 'e.g. LAPTOP'}
                  />
                </div>
                {ghostType && !form.type && (
                  <p className="mt-0.5 text-xs text-purple-500">
                    AI suggests: <strong>{ghostType}</strong>
                  </p>
                )}
              </div>

              {/* Category — ghost suggestion badge below select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, categoryId: Number(e.target.value) }));
                    if (Number(e.target.value)) setGhostCategoryId(0); // user picked → discard ghost
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && ghostCategoryId && !form.categoryId) {
                      e.preventDefault();
                      acceptSuggestion();
                    }
                  }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 ${
                    ghostCategoryId && !form.categoryId ? 'border-purple-300' : 'border-gray-300'
                  }`}
                >
                  <option value={0}>Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {ghostCategoryName && !form.categoryId && (
                  <p className="mt-0.5 text-xs text-purple-500">
                    AI suggests: <strong>{ghostCategoryName}</strong>
                  </p>
                )}
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={form.purchaseDate || ''}
                  onChange={(e) => setForm({ ...form, purchaseDate: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Purchase Cost */}
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

              {/* Warranty Expiry */}
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

            {/* Description — triggers AI too */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400 font-normal">(recommended — enables AI suggestions)</span>
              </label>
              <textarea
                value={form.description || ''}
                onChange={(e) => {
                  const v = e.target.value || undefined;
                  setForm(prev => ({ ...prev, description: v }));
                  triggerAi(form.name, v, photoFile?.name);
                }}
                onKeyDown={(e) => { if (e.key === 'Tab' && hasSuggestion) { e.preventDefault(); acceptSuggestion(); } }}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe the asset condition, specs, or usage..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value || undefined })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Accepted suggestion confirmation */}
            {aiSuggestion && (form.type || form.categoryId) && !hasSuggestion && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm font-medium text-purple-800">AI Suggestion Applied</p>
                <p className="text-sm text-purple-700">
                  Category: <strong>{aiSuggestion.recommendedCategory}</strong> ·
                  Type: <strong>{aiSuggestion.recommendedType}</strong> ·
                  Confidence: <strong>{(aiSuggestion.confidence * 100).toFixed(0)}%</strong>
                </p>
                {aiSuggestion.reasoning && (
                  <p className="text-xs text-purple-600 mt-1">{aiSuggestion.reasoning}</p>
                )}
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
