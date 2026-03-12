import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
};

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['ADMIN', 'MANAGER', 'USER'] },
  { name: 'Assets', href: '/assets', icon: CubeIcon, roles: ['ADMIN', 'MANAGER', 'USER'] },
  { name: 'Employees', href: '/employees', icon: UserGroupIcon, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Departments', href: '/departments', icon: BuildingOfficeIcon, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Branches', href: '/branches', icon: BuildingOffice2Icon, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Audit Logs', href: '/audit', icon: ClipboardDocumentListIcon, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, roles: ['ADMIN', 'MANAGER'] },
  { name: 'AI Insights', href: '/ai', icon: CpuChipIcon, roles: ['ADMIN', 'MANAGER'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNav = navigation.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600/75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-8 w-8 text-indigo-600" />
                <span className="text-lg font-bold text-gray-900">BankAssets</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              {visibleNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 mb-1 text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
            {/* User info - mobile */}
            {user && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-700">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.role}</p>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
            <div className="px-4 py-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">Made by Iceberg team</p>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-200">
            <ShieldCheckIcon className="h-8 w-8 text-indigo-600" />
            <span className="text-lg font-bold text-gray-900">BankAssets</span>
          </div>
          <nav className="flex-1 overflow-y-auto p-4">
            {visibleNav.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 mb-1 text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          {/* User info - desktop */}
          {user && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-700">
                    {user.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.role}</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
          <div className="px-4 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">Made by Iceberg team</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 items-center bg-white border-b border-gray-200 px-4 lg:px-8">
          <button
            className="lg:hidden -ml-2 p-2 text-gray-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="ml-2 lg:ml-0 text-lg font-semibold text-gray-900">
            {navigation.find(n => n.href === location.pathname)?.name || 'Bank Asset Management'}
          </h1>
          {/* Desktop user indicator in top bar */}
          {user && (
            <div className="ml-auto hidden lg:flex items-center gap-2 text-sm text-gray-500">
              <span>{user.fullName}</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                {user.role}
              </span>
            </div>
          )}
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
