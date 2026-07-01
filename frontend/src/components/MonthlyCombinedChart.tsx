import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { format, subMonths, addMonths } from 'date-fns';

interface ChartDay {
  day: number;
  result: string;
}

interface GameChart {
  gameId: string;
  code: string;
  name: string;
  data: ChartDay[];
}

const getAbbreviation = (code: string) => {
  const c = code.toLowerCase().trim();
  if (c === 'disawar' || c === 'desawar') return 'DSWR';
  if (c === 'faridabad') return 'FRBD';
  if (c === 'ghaziabad') return 'GZBD';
  if (c === 'gali') return 'GALI';
  if (c === 'taj') return 'TAJ';
  if (c === 'delhi_bazar' || c === 'delhibazar') return 'DLB';
  if (c === 'shri_ganesh' || c === 'shriganesh') return 'SG';
  return code.substring(0, 4).toUpperCase();
};

export const MonthlyCombinedChart: React.FC = () => {
  const { games, fetchGames } = useAppStore();
  const [charts, setCharts] = useState<GameChart[]>([]);
  const [loading, setLoading] = useState(false);

  // Active chart Month and Year state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Form temporary inputs
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);

  // Sync temp selectors with active year/month
  useEffect(() => {
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
  }, [selectedMonth, selectedYear]);

  // Load chart contents
  useEffect(() => {
    const loadCharts = async () => {
      setLoading(true);
      try {
        if (games.length === 0) {
          await fetchGames();
        }

        const activeGames = games.filter(g => g.is_active);

        const promises = activeGames.map(async (game) => {
          try {
            const res = await api.get(`/charts/${game._id}/${selectedYear}/${selectedMonth}`);
            return {
              gameId: game._id,
              code: game.code,
              name: game.name,
              data: res.data.data as ChartDay[]
            };
          } catch (e) {
            return {
              gameId: game._id,
              code: game.code,
              name: game.name,
              data: []
            };
          }
        });

        const results = await Promise.all(promises);
        setCharts(results);
      } catch (err) {
        console.error('Failed to load combined charts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCharts();
  }, [games.length, fetchGames, selectedYear, selectedMonth]);

  const activeGames = games.filter(g => g.is_active);
  const gamesAbbrList = activeGames.map(g => getAbbreviation(g.code)).join(', ');

  if (charts.length === 0 && !loading) return null;

  // Days in month calculation
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Prev / Next month labels and triggers
  const activeDate = new Date(selectedYear, selectedMonth - 1, 1);
  const prevDate = subMonths(activeDate, 1);
  const nextDate = addMonths(activeDate, 1);

  const handlePrevMonth = () => {
    setSelectedYear(prevDate.getFullYear());
    setSelectedMonth(prevDate.getMonth() + 1);
  };

  const handleNextMonth = () => {
    setSelectedYear(nextDate.getFullYear());
    setSelectedMonth(nextDate.getMonth() + 1);
  };

  const handleResetToLatest = () => {
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
  };

  const handleGo = () => {
    setSelectedMonth(tempMonth);
    setSelectedYear(tempYear);
  };

  // Generate years from 2015 to current year
  const currentYearVal = new Date().getFullYear();
  const yearsRange = Array.from({ length: currentYearVal - 2015 + 1 }, (_, i) => 2015 + i);

  // Format header title text
  const currentMonthName = format(activeDate, 'MMMM yyyy');

  return (
    <div className="mt-12 mb-8">
      {/* Chart Grid Container */}
      <div className="border border-black dark:border-white overflow-hidden bg-white dark:bg-zinc-950">
        
        {/* Sleek Dark Alert Bar */}
        <div className="bg-gray-800 dark:bg-zinc-800 text-white text-center py-2 px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          New Show Disawar as the last column of the past day
        </div>

        {/* Main Sleek Black Chart Header */}
        <div className="bg-black dark:bg-white text-white dark:text-black text-center py-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider border-t border-black dark:border-white">
          Combined Record Chart: {currentMonthName.toUpperCase()} ({gamesAbbrList})
        </div>

        {/* Table loader */}
        {loading ? (
          <div className="text-center py-24 text-xs font-black text-gray-500 animate-pulse uppercase">
            LOADING RECORD CHARTS...
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse text-center text-xs font-black min-w-[600px]">
              <thead>
                {/* Sleek Slate Column Headers */}
                <tr className="bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 border-b border-black dark:border-white text-[10px] sm:text-xs">
                  <th className="p-1.5 sm:p-2.5 border-r border-gray-300 dark:border-zinc-800 text-red-600 font-black w-12 sm:w-20">DATE</th>
                  {charts.map(c => (
                    <th key={c.gameId} className="p-1.5 sm:p-2.5 border-r border-gray-300 dark:border-zinc-800 last:border-r-0">
                      {getAbbreviation(c.code)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {daysArray.map((day, idx) => {
                  const formattedDay = String(day).padStart(2, '0');
                  return (
                    <tr
                      key={day}
                      className={`border-b border-gray-200 dark:border-zinc-900 last:border-0 ${
                        idx % 2 === 0 ? 'bg-white dark:bg-zinc-950' : 'bg-gray-50 dark:bg-zinc-900/50'
                      }`}
                    >
                      <td className="p-1.5 sm:p-2.5 border-r border-gray-300 dark:border-zinc-800 text-red-600 font-extrabold text-[11px] sm:text-xs">
                        {formattedDay}
                      </td>
                      {charts.map(c => {
                        const dayData = c.data.find(d => d.day === day);
                        const val = dayData?.result || '';
                        return (
                          <td
                            key={c.gameId}
                            className={`p-1.5 sm:p-2.5 border-r border-gray-300 dark:border-zinc-800 last:border-r-0 font-mono tracking-tighter text-[11px] sm:text-sm font-bold ${
                              val ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-700'
                            }`}
                          >
                            {val || '--'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. Prev / Next Month Navigation Buttons */}
      <div className="flex gap-4 items-center justify-between mt-4 select-none">
        <button
          onClick={handlePrevMonth}
          className="flex-1 bg-black dark:bg-white text-white dark:text-black py-2.5 px-2 sm:px-4 font-black uppercase text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-center border border-black dark:border-white"
        >
          <span className="inline sm:hidden">{format(prevDate, 'MMM yy')}</span>
          <span className="hidden sm:inline">{format(prevDate, 'MMMM yyyy')}</span>
        </button>
        <div className="text-gray-300 font-bold dark:text-zinc-700">-</div>
        <button
          onClick={handleNextMonth}
          className="flex-1 bg-black dark:bg-white text-white dark:text-black py-2.5 px-2 sm:px-4 font-black uppercase text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-center border border-black dark:border-white"
        >
          <span className="inline sm:hidden">{format(nextDate, 'MMM yy')}</span>
          <span className="hidden sm:inline">{format(nextDate, 'MMMM yyyy')}</span>
        </button>
      </div>

      {/* 2. Reset back to latest Month Banner */}
      <button
        onClick={handleResetToLatest}
        className="w-full mt-4 bg-transparent text-black dark:text-white py-3.5 px-4 font-black uppercase text-[10px] sm:text-xs tracking-wider text-center hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors border border-black dark:border-white"
      >
        Reset to Latest Record Chart
      </button>

      {/* 3. Sleek Selector Dropdown Panel (Bordered, Grey background) */}
      <div className="bg-gray-50 dark:bg-zinc-900/50 p-4 mt-4 border border-black dark:border-white text-center">
        <label className="block text-gray-900 dark:text-zinc-100 font-black text-xs uppercase tracking-wider mb-3">
          Query Monthly Record Charts
        </label>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center max-w-lg mx-auto">
          <select
            value={tempMonth}
            onChange={(e) => setTempMonth(Number(e.target.value))}
            className="w-full sm:w-auto flex-1 p-2 bg-white dark:bg-zinc-950 text-black dark:text-white border border-black dark:border-white font-black text-xs focus:outline-none"
          >
            <option value={1}>January</option>
            <option value={2}>February</option>
            <option value={3}>March</option>
            <option value={4}>April</option>
            <option value={5}>May</option>
            <option value={6}>June</option>
            <option value={7}>July</option>
            <option value={8}>August</option>
            <option value={9}>September</option>
            <option value={10}>October</option>
            <option value={11}>November</option>
            <option value={12}>December</option>
          </select>

          <select
            value={tempYear}
            onChange={(e) => setTempYear(Number(e.target.value))}
            className="w-full sm:w-auto flex-1 p-2 bg-white dark:bg-zinc-950 text-black dark:text-white border border-black dark:border-white font-black text-xs focus:outline-none"
          >
            {yearsRange.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={handleGo}
            className="w-full sm:w-24 p-2 bg-black dark:bg-white text-white dark:text-black font-black text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors uppercase border border-black dark:border-white"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};
export default MonthlyCombinedChart;
