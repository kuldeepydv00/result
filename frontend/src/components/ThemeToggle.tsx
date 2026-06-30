import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAppStore();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 border border-black dark:border-white text-xs flex items-center gap-1 font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
      title={theme === 'light' ? t('dark_mode') : t('light_mode')}
    >
      {theme === 'light' ? (
        <>
          <Moon size={14} />
          <span className="hidden sm:inline">{t('dark_mode')}</span>
        </>
      ) : (
        <>
          <Sun size={14} />
          <span className="hidden sm:inline">{t('light_mode')}</span>
        </>
      )}
    </button>
  );
};
