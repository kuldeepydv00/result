import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChartDay {
  day: number;
  result: string;
}

export const Charts: React.FC = () => {
  const { games, fetchGames } = useAppStore();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch games on load
  useEffect(() => {
    const loadGames = async () => {
      await fetchGames();
    };
    loadGames();
  }, [fetchGames]);

  // Set default game from URL or first available game
  useEffect(() => {
    if (games.length > 0) {
      const urlGame = searchParams.get('game');
      if (urlGame && games.some(g => g._id === urlGame)) {
        setSelectedGameId(urlGame);
      } else {
        setSelectedGameId(games[0]._id);
      }
    }
  }, [games, searchParams]);

  // Fetch chart data
  const loadChart = async () => {
    if (!selectedGameId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/charts/${selectedGameId}/${selectedYear}/${selectedMonth}`);
      setChartData(response.data.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load chart records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGameId) {
      loadChart();
    }
  }, [selectedGameId, selectedYear, selectedMonth]);

  // Generate Year Range
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));

  // Export to CSV
  const handleExportCSV = () => {
    if (chartData.length === 0) return;
    const gameObj = games.find(g => g._id === selectedGameId);
    const headers = 'Day,Result\n';
    const csvRows = chartData.map(d => `${d.day},${d.result || ''}`).join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${gameObj?.code || 'chart'}_${selectedYear}_${selectedMonth}.csv`);
    a.click();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-2">
      <div className="border border-black dark:border-white p-4">
        <h2 className="text-lg font-black tracking-widest border-b border-black dark:border-white pb-3 mb-6">
          {t('chart_title').toUpperCase()}
        </h2>

        {/* Selection Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Game Selector */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 mb-1">{t('game').toUpperCase()}</label>
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="w-full text-xs font-black border border-black dark:border-white bg-transparent p-2 focus:outline-none"
            >
              <option value="" className="text-black">{t('select_date')}...</option>
              {games.map(game => (
                <option key={game._id} value={game._id} className="text-black">
                  {game.display_name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 mb-1">{t('year').toUpperCase()}</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full text-xs font-black border border-black dark:border-white bg-transparent p-2 focus:outline-none"
            >
              {years.map(y => (
                <option key={y} value={y} className="text-black">{y}</option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 mb-1">{t('month').toUpperCase()}</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs font-black border border-black dark:border-white bg-transparent p-2 focus:outline-none"
            >
              {months.map(m => (
                <option key={m} value={m} className="text-black">
                  {new Date(2000, parseInt(m) - 1).toLocaleString('default', { month: 'long' }).toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        {chartData.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 border border-black dark:border-white text-xs font-bold flex items-center gap-1.5 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              <Download size={12} />
              EXPORT CSV
            </button>
          </div>
        )}

        {/* Chart Output Grid */}
        {loading ? (
          <div className="text-center py-12 text-xs font-bold text-gray-500 animate-pulse">
            {t('loading').toUpperCase()}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-xs font-bold text-red-600">
            {error.toUpperCase()}
          </div>
        ) : chartData.length > 0 ? (
          <div className="border border-black dark:border-white overflow-hidden">
            <table className="w-full border-collapse text-left text-xs font-bold">
              <thead>
                <tr className="border-b border-black dark:border-white bg-gray-50 dark:bg-zinc-900">
                  <th className="p-3 border-r border-gray-200 dark:border-zinc-800 w-24">DAY</th>
                  <th className="p-3">RESULT NUMBER</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, idx) => (
                  <tr
                    key={row.day}
                    className={`border-b border-gray-200 dark:border-zinc-800 last:border-0 ${
                      idx % 2 === 0 ? 'bg-white dark:bg-zinc-950' : 'bg-gray-50 dark:bg-zinc-900/50'
                    }`}
                  >
                    <td className="p-3 border-r border-gray-200 dark:border-zinc-800 font-black">{row.day}</td>
                    <td className={`p-3 text-lg font-black ${row.result ? 'text-red-600 dark:text-red-500' : 'text-gray-400'}`}>
                      {row.result || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-300 dark:border-zinc-700 text-xs font-bold text-gray-500">
            SELECT CONFIGURATION TO DISPLAY DATA
          </div>
        )}
      </div>
    </div>
  );
};
