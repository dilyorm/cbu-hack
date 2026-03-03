import { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { branchApi } from '../api/organization';
import type { Branch, BranchRequest } from '../types';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<BranchRequest>({ name: '', code: '' });

  const load = () => {
    setLoading(true);
    branchApi.getAll()
      .then(setBranches)
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      await branchApi.create(form);
      toast.success('Branch created');
      setShowCreate(false);
      setForm({ name: '', code: '' });
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this branch?')) return;
    try {
      await branchApi.delete(id);
      toast.success('Branch deleted');
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{branches.length} branches</p>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          <PlusIcon className="h-4 w-4" /> Add Branch
        </button>
      </div>

      {branches.length === 0 ? (
        <EmptyState title="No branches" description="Add your first branch" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {branches.map((branch) => (
                <tr key={branch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{branch.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{branch.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{branch.address || '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(branch.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Branch">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
            <input type="text" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. BR-001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value || undefined })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleCreate}
              disabled={!form.name || !form.code}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">Create</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
