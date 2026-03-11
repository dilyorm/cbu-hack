import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CubeIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  ArchiveBoxXMarkIcon,
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '../api/dashboard';
import type { DashboardStats } from '../types';
import { formatCurrency } from '../utils/status';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!stats) return <p className="text-red-500">Failed to load dashboard data</p>;

  const statusCards = [
    { label: 'Total Assets', value: stats.totalAssets, icon: CubeIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Registered', value: stats.registeredCount, icon: CheckCircleIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Assigned', value: stats.assignedCount, icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'In Repair', value: stats.inRepairCount, icon: WrenchScrewdriverIcon, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Lost', value: stats.lostCount, icon: ExclamationTriangleIcon, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Written Off', value: stats.writtenOffCount, icon: ArchiveBoxXMarkIcon, color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  const categoryData = Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }));
  const statusData = Object.entries(stats.byStatus).map(([name, value]) => ({ name, value }));
  const departmentData = Object.entries(stats.byDepartment).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statusCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total Value and Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Active Asset Value</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{formatCurrency(stats.totalAssetValue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Expired Warranty</h3>
          <p className="mt-2 text-3xl font-bold text-orange-600">{stats.expiredWarrantyCount}</p>
          <Link to="/analytics" className="text-sm text-indigo-600 hover:text-indigo-800">View details</Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Aging Assets (5+ years)</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">{stats.agingAssetsCount}</p>
          <Link to="/analytics" className="text-sm text-indigo-600 hover:text-indigo-800">View details</Link>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={100} dataKey="value">
                  {categoryData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-12">No data available</p>}
        </div>

        {/* By Status Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-12">No data available</p>}
        </div>

        {/* By Department */}
        {departmentData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets by Department</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
