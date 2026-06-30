import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ThemeToggle } from './ThemeToggle';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Header: React.FC = () => {
  const { admin, logout } = useAppStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-black dark:border-white py-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <Link to="/" className="text-2xl font-black tracking-tighter hover:opacity-80">
            {t('site_title').toUpperCase()}
          </Link>
          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-400 mt-0.5 font-bold">
            FAST LIVE RESULTS PLATFORM (INFORMATIONAL ONLY)
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            className="px-3 py-2 text-xs font-bold border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            {t('home').toUpperCase()}
          </Link>
          <Link
            to="/charts"
            className="px-3 py-2 text-xs font-bold border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            {t('charts').toUpperCase()}
          </Link>

          {/* Admin Link */}
          {admin && (
            <Link
              to="/admin"
              className="px-3 py-2 text-xs font-bold border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 flex items-center gap-1 transition-colors"
            >
              <LayoutDashboard size={12} />
              <span>{t('admin').toUpperCase()}</span>
            </Link>
          )}

          {admin && (
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-xs font-bold border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center gap-1"
            >
              <LogOut size={12} />
              <span>{t('logout').toUpperCase()}</span>
            </button>
          )}

          <div className="flex items-center gap-1 border-t sm:border-t-0 sm:border-l border-gray-300 dark:border-zinc-700 pt-2 sm:pt-0 sm:pl-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
