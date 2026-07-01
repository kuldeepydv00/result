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
    <header className="border-b border-zinc-200 dark:border-zinc-800 py-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <Link to="/" className="text-2xl font-black tracking-widest bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400 hover:opacity-85">
            {t('site_title').toUpperCase()}
          </Link>
          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-400 mt-0.5 font-bold">
            FAST LIVE RESULTS PLATFORM (INFORMATIONAL ONLY)
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            className="px-3.5 py-1.5 text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:border-indigo-600 dark:hover:text-white rounded-lg transition-all"
          >
            {t('home').toUpperCase()}
          </Link>
          <Link
            to="/charts"
            className="px-3.5 py-1.5 text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:border-indigo-600 dark:hover:text-white rounded-lg transition-all"
          >
            {t('charts').toUpperCase()}
          </Link>

          {/* Admin Link */}
          {admin && (
            <Link
              to="/admin"
              className="px-3.5 py-1.5 text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:border-indigo-600 dark:hover:text-white rounded-lg flex items-center gap-1 transition-all"
            >
              <LayoutDashboard size={12} />
              <span>{t('admin').toUpperCase()}</span>
            </Link>
          )}

          {admin && (
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-xs font-bold border border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all flex items-center gap-1"
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
