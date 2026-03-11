import { useEffect, useState } from 'react';
import { assetApi } from '../api/assets';
import type { Asset } from '../types';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, formatCurrency } from '../utils/status';

export default function Analytics() {
  const [expiredWarranty, setExpiredWarranty] = useState<Asset[]>([]);
  const [agingAssets, setAgingAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [agingYears, setAgingYears] = useState(5);

  useEffect(() => {
    Promise.all([
      assetApi.getExpiredWarranty(),
      assetApi.getAgingAssets(agingYears),
    ])
      .then(([expired, aging]) => {
        setExpiredWarranty(expired);
        setAgingAssets(aging);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agingYears]);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-8">
      {/* Expired Warranty Assets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Expired Warranty Assets</h2>
          <p className="text-sm text-gray-500">Assets with expired warranty coverage</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warranty Expiry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expiredWarranty.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No expired warranty assets</td></tr>
              ) : (
                expiredWarranty.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{asset.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{asset.serialNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{asset.categoryName}</td>
                    <td className="px-6 py-4"><StatusBadge status={asset.status} size="sm" /></td>
                    <td className="px-6 py-4 text-sm text-red-600 font-medium">{formatDate(asset.warrantyExpiryDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(asset.purchaseCost)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aging Assets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Aging Assets</h2>
            <p className="text-sm text-gray-500">Assets older than the specified threshold</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Years:</label>
            <select
              value={agingYears}
              onChange={(e) => setAgingYears(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              {[3, 5, 7, 10].map(y => (
                <option key={y} value={y}>{y} years</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {agingAssets.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No aging assets found</td></tr>
              ) : (
                agingAssets.map((asset) => {
                  const ageYears = asset.purchaseDate
                    ? Math.floor((Date.now() - new Date(asset.purchaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                    : 0;
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{asset.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{asset.serialNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{asset.categoryName}</td>
                      <td className="px-6 py-4"><StatusBadge status={asset.status} size="sm" /></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(asset.purchaseDate)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-orange-600">{ageYears} years</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
