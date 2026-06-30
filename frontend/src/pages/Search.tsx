import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';
import { SearchBar } from '../components/SearchBar';

interface SearchResultGame {
  _id: string;
  name: string;
  display_name: string;
  code: string;
}

interface SearchResultItem {
  date: string;
  result_number: string;
  status?: string;
  game_name: string;
  game_code?: string;
}

interface SearchData {
  query: string;
  games: SearchResultGame[];
  results_by_date: SearchResultItem[];
  results_by_number: SearchResultItem[];
  results_by_game: SearchResultItem[];
}

export const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const query = searchParams.get('q') || '';

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;
      setLoading(true);
      setError('');
      try {
        const response = await api.post('/search', { query });
        setData(response.data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch search results.');
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [query]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toISOString().split('T')[0];
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-2">
      <div className="flex justify-center mb-8">
        <SearchBar />
      </div>

      <div className="border border-black dark:border-white p-4">
        <h2 className="text-lg font-black tracking-widest border-b border-black dark:border-white pb-3 mb-6">
          SEARCH RESULTS FOR: "{query.toUpperCase()}"
        </h2>

        {loading ? (
          <div className="text-center py-12 text-xs font-bold text-gray-500 animate-pulse">
            {t('loading').toUpperCase()}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-xs font-bold text-red-600">
            {error.toUpperCase()}
          </div>
        ) : data ? (
          <div className="space-y-8 text-xs font-bold">
            {/* Matches in Games */}
            {data.games.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-gray-400 mb-3 tracking-widest">GAMES MATCHED</h3>
                <div className="border border-black dark:border-white divide-y divide-black dark:divide-white">
                  {data.games.map(g => (
                    <div key={g._id} className="p-3 flex justify-between items-center bg-gray-50 dark:bg-zinc-900">
                      <div>
                        <div className="font-black text-sm">{g.display_name.toUpperCase()}</div>
                        <div className="text-[10px] text-gray-500 font-bold mt-0.5">CODE: {g.code}</div>
                      </div>
                      <Link
                        to={`/charts?game=${g._id}`}
                        className="px-3 py-1.5 border border-black dark:border-white text-[10px] font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                      >
                        VIEW CHART
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matches by Specific Date */}
            {data.results_by_date.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-gray-400 mb-3 tracking-widest">RESULTS FOR DATE</h3>
                <div className="border border-black dark:border-white divide-y divide-black dark:divide-white">
                  {data.results_by_date.map((r, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center">
                      <div>
                        <div className="font-black">{r.game_name.toUpperCase()}</div>
                        <div className="text-[10px] text-gray-500 font-bold mt-0.5">{formatDate(r.date)}</div>
                      </div>
                      <div className="text-3xl font-black text-red-600">{r.result_number || 'XX'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matches by Result Number */}
            {data.results_by_number.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-gray-400 mb-3 tracking-widest">MATCHES WITH THIS NUMBER</h3>
                <div className="border border-black dark:border-white divide-y divide-black dark:divide-white">
                  {data.results_by_number.map((r, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center">
                      <div>
                        <div className="font-black">{r.game_name.toUpperCase()}</div>
                        <div className="text-[10px] text-gray-500 font-bold mt-0.5">{formatDate(r.date)}</div>
                      </div>
                      <div className="text-3xl font-black text-red-600">{r.result_number}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matches by Game Matches */}
            {data.results_by_game.length > 0 && data.games.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-gray-400 mb-3 tracking-widest">RECENT RESULTS FOR MATCHED GAMES</h3>
                <div className="border border-black dark:border-white divide-y divide-black dark:divide-white">
                  {data.results_by_game.slice(0, 15).map((r, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center">
                      <div>
                        <div className="font-black">{r.game_name.toUpperCase()}</div>
                        <div className="text-[10px] text-gray-500 font-bold mt-0.5">{formatDate(r.date)}</div>
                      </div>
                      <div className="text-3xl font-black text-red-600">{r.result_number}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.games.length === 0 &&
             data.results_by_date.length === 0 &&
             data.results_by_number.length === 0 &&
             data.results_by_game.length === 0 && (
              <div className="text-center py-12 border border-dashed border-gray-300 dark:border-zinc-700 text-xs font-bold text-gray-500">
                {t('no_results').toUpperCase()}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-xs font-bold text-gray-500">
            ENTER SEARCH TERM ABOVE TO START
          </div>
        )}
      </div>
    </div>
  );
};
