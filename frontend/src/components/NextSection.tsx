import React from 'react';
import { useTranslation } from 'react-i18next';
import { BellRing } from 'lucide-react';

interface ResultItem {
  game_id: string;
  name: string;
  code: string;
  display_name: string;
  schedule_time: string;
  result_number: string | null;
  status: 'announced' | 'pending';
  source: 'api' | 'manual';
  updated_at: string | null;
}

interface NextSectionProps {
  results: ResultItem[];
}

export const NextSection: React.FC<NextSectionProps> = ({ results }) => {
  const { t } = useTranslation();

  const pendingResults = results.filter((r) => r.status === 'pending');

  if (pendingResults.length === 0) return null;

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-md bg-zinc-50/30 dark:bg-zinc-900/10 mb-6">
      <h3 className="text-xs font-black tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
        <BellRing size={14} className="animate-pulse" />
        {t('next_announce').toUpperCase()}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {pendingResults.map((game) => (
          <div
            key={game.game_id}
            className="border border-zinc-200/60 dark:border-zinc-800/60 p-3 flex justify-between items-center bg-white dark:bg-zinc-950 rounded-xl hover:border-indigo-500 transition-all shadow-sm"
          >
            <div>
              <div className="font-black text-xs tracking-wider text-gray-800 dark:text-zinc-200">
                {game.display_name.toUpperCase()}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">
                {game.schedule_time}
              </div>
            </div>
            <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-black px-2 py-0.5 rounded-md">
              UPCOMING
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
