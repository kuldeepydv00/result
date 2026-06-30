import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

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
  is_featured?: boolean;
}

interface ResultsGridProps {
  todayResults: ResultItem[];
  yesterdayResults: ResultItem[];
}

const isDrawTimePassed = (scheduleTimeStr: string): boolean => {
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const match = scheduleTimeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return false;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();

    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const drawMinutes = hours * 60 + minutes;
    return currentMinutes >= drawMinutes;
  } catch (e) {
    return false;
  }
};

export const ResultsGrid: React.FC<ResultsGridProps> = ({ todayResults, yesterdayResults }) => {
  const { t } = useTranslation();
  const starredGames = useAppStore(state => state.starredGames);
  const toggleFavorite = useAppStore(state => state.toggleFavorite);

  if (todayResults.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-300 dark:border-zinc-700 text-xs font-bold text-gray-500 uppercase">
        {t('no_results')}
      </div>
    );
  }

  // Sort helper to pin starred games first
  const sortStarredFirst = (a: ResultItem, b: ResultItem) => {
    const aStarred = starredGames.includes(a.game_id);
    const bStarred = starredGames.includes(b.game_id);
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;
    return 0;
  };

  // Partition results into LIVE and NEXT lists and apply pinning sort
  const liveGames = todayResults
    .filter(g => g.status === 'announced' || isDrawTimePassed(g.schedule_time))
    .sort(sortStarredFirst);
  
  const nextGames = todayResults
    .filter(g => g.status !== 'announced' && !isDrawTimePassed(g.schedule_time))
    .sort(sortStarredFirst);

  const renderGameRow = (game: ResultItem) => {
    // Find yesterday's equivalent result
    const yesterdayGame = yesterdayResults.find(y => y.game_id === game.game_id);
    
    const todayPending = game.status === 'pending';
    const todayNum = todayPending ? 'XX' : (game.result_number || 'XX');

    const yesterdayPending = yesterdayGame ? yesterdayGame.status === 'pending' : true;
    const yesterdayNum = yesterdayGame ? (yesterdayPending ? 'XX' : (yesterdayGame.result_number || 'XX')) : 'XX';

    const isStarred = starredGames.includes(game.game_id);

    return (
      <div
        key={game.game_id}
        className={`grid grid-cols-12 items-center p-4 border-b border-gray-200 dark:border-zinc-900 transition-colors ${
          game.is_featured 
            ? 'bg-[#fbbf24] dark:bg-yellow-950/20 text-gray-900 dark:text-zinc-100' 
            : 'bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100'
        }`}
      >
        {/* Left Column: Game Information */}
        <div className="col-span-6 sm:col-span-8 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(game.game_id)}
              className="text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors flex-shrink-0"
              title="Toggle Favorite"
            >
              <Star
                size={14}
                className={isStarred ? "fill-yellow-500 text-yellow-500" : ""}
              />
            </button>
            <span className="font-extrabold text-sm sm:text-base tracking-wider uppercase truncate">
              {game.display_name}
            </span>
          </div>
          <div className="text-[10px] font-bold mt-1 opacity-70 pl-[22px]">
            at {game.schedule_time} |{' '}
            <Link
              to={`/charts?game=${game.game_id}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('record_chart_link')}
            </Link>
          </div>
        </div>

        {/* Yesterday Column */}
        <div className="col-span-3 sm:col-span-2 text-center text-2xl sm:text-4xl font-extrabold font-mono tracking-tighter select-all">
          {yesterdayNum}
        </div>
        
        {/* Today Column */}
        <div className={`col-span-3 sm:col-span-2 text-center text-2xl sm:text-4xl font-black font-mono tracking-tighter select-all ${
          todayPending ? 'opacity-40' : 'text-red-600 dark:text-red-500'
        }`}>
          {todayNum}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 1. LIVE SECTION */}
      {liveGames.length > 0 && (
        <div>
          <div className="bg-gray-50 dark:bg-zinc-900/50 px-4 py-2 border-b border-gray-200 dark:border-zinc-900 flex items-center">
            <div className="border-l-4 border-red-600 pl-2 text-[10px] sm:text-xs font-black text-red-600 tracking-widest uppercase">
              LIVE
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-zinc-900">
            {liveGames.map(renderGameRow)}
          </div>
        </div>
      )}

      {/* 2. NEXT SECTION */}
      {nextGames.length > 0 && (
        <div>
          <div className="bg-gray-50 dark:bg-zinc-900/50 px-4 py-2 border-b border-gray-200 dark:border-zinc-900 border-t border-black dark:border-white flex items-center">
            <div className="border-l-4 border-red-600 pl-2 text-[10px] sm:text-xs font-black text-red-600 tracking-widest uppercase">
              NEXT
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-zinc-900">
            {nextGames.map(renderGameRow)}
          </div>
        </div>
      )}
    </div>
  );
};
export default ResultsGrid;
