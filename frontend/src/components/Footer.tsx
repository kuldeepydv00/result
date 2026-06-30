import React from 'react';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-black dark:border-white py-8 mt-12 text-center text-xs text-gray-500 dark:text-zinc-400">
      <p className="font-bold mb-2">
        &copy; {new Date().getFullYear()} {t('site_title').toUpperCase()}. ALL RIGHTS RESERVED.
      </p>
      <div className="max-w-2xl mx-auto space-y-1 mt-4 px-4 leading-relaxed">
        <p>
          <strong>DISCLAIMER:</strong> THIS WEBSITE IS PURELY INFORMATIONAL AND DOES NOT PROMOTE, 
          FACILITATE, OR ENCOURAGE ANY ILLEGAL BETTING OR GAMBLING ACTIVITIES.
        </p>
        <p>
          NO REAL MONEY OR WAGERING TRANSACTIONS TAKE PLACE ON THIS PLATFORM. ALL RESULTS AND SCHEDULES 
          DISPLAYED ARE COMPILED FROM PUBLICLY AVAILABLE REPUTABLE SOURCES FOR RESEARCH PURPOSES ONLY.
        </p>
      </div>
    </footer>
  );
};
