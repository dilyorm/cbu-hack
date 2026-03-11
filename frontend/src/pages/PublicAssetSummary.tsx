import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheckIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import type { Asset } from '../types';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, formatCurrency } from '../utils/status';

export default function PublicAssetSummary() {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use a plain axios call (no auth interceptor needed — public endpoint)
    axios.get(`/api/public/assets/${id}/summary`)
      .then(res => setAsset(res.data))
      .catch(() => setError('Asset not found or unavailable'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Asset Not Found</h2>
          <p className="mt-2 text-sm text-gray-500">{error || 'The requested asset could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <ShieldCheckIcon className="mx-auto h-10 w-10 text-indigo-600" />
          <h1 className="mt-2 text-lg font-bold text-gray-900">Bank Asset Summary</h1>
          <p className="text-xs text-gray-400">Smart Banking Office Asset Management</p>
        </div>

        {/* Asset Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Title Bar */}
          <div className="bg-indigo-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">{asset.name}</h2>
            <p className="text-indigo-200 text-sm font-mono">{asset.serialNumber}</p>
          </div>

          {/* Status */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">Current Status</span>
            <StatusBadge status={asset.status} />
          </div>

          {/* Details */}
          <div className="px-6 py-4 space-y-3">
            <DetailRow label="Type" value={asset.type} />
            <DetailRow label="Category" value={asset.categoryName} />
            {asset.description && <DetailRow label="Description" value={asset.description} />}
            {asset.purchaseDate && <DetailRow label="Purchase Date" value={formatDate(asset.purchaseDate)} />}
            {asset.purchaseCost != null && <DetailRow label="Purchase Cost" value={formatCurrency(asset.purchaseCost)} />}
            {asset.warrantyExpiryDate && (
              <DetailRow
                label="Warranty"
                value={formatDate(asset.warrantyExpiryDate) + (asset.warrantyExpired ? ' (EXPIRED)' : ' (Active)')}
              />
            )}
          </div>

          {/* Assignment */}
          {asset.currentEmployee && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Assignment</h3>
              <DetailRow label="Assigned To" value={asset.currentEmployee.fullName} />
              {asset.currentDepartment && <DetailRow label="Department" value={asset.currentDepartment.name} />}
              {asset.currentBranch && <DetailRow label="Branch" value={asset.currentBranch.name} />}
            </div>
          )}

          {/* Download PDF */}
          <div className="px-6 py-4 border-t border-gray-200">
            <a
              href={`/api/public/assets/${id}/pdf`}
              download
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Download PDF Summary
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          This page is publicly accessible via QR code scan.
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
