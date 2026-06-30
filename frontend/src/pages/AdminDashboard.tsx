import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  Activity,
  Calendar,
  Database,
  FileText,
  Key,
  List,
  Play,
  Trash2,
  Upload,
  Users
} from 'lucide-react';

interface ChartDay {
  day: number;
  result: string;
}

interface Game {
  _id: string;
  name: string;
  code: string;
  display_name: string;
  schedule_time: string;
  timezone: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

interface ResultItem {
  _id: string | null;
  game_id: string;
  name: string;
  display_name: string;
  code: string;
  schedule_time: string;
  is_active: boolean;
  result_number: string | null;
  status: 'announced' | 'pending';
  source: 'api' | 'manual';
}

interface FetchLog {
  _id: string;
  started_at: string;
  finished_at: string;
  game_code?: string;
  success: boolean;
  error_message?: string;
  response_data?: any;
}

interface UserItem {
  _id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  role: string;
  created_at: string;
}

export const AdminDashboard: React.FC = () => {
  const { admin } = useAppStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'results' | 'charts' | 'api' | 'logs' | 'users'>('overview');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Protect Admin Route
  useEffect(() => {
    if (!admin) {
      navigate('/admain-kuldeep-login');
    }
  }, [admin, navigate]);

  const clearMessages = () => {
    setSuccessMsg('');
    setErrorMsg('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-2 text-xs font-bold">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-black dark:border-white pb-3 mb-6 gap-3">
        <div>
          <h1 className="text-xl font-black tracking-widest">ADMIN PANEL</h1>
          <span className="text-gray-500 font-bold dark:text-zinc-400">
            Welcome back, {admin?.username.toUpperCase()} ({admin?.role.toUpperCase()})
          </span>
        </div>
        <div className="bg-red-600 text-white text-[10px] tracking-widest px-3 py-1 font-black">
          SECURE WORKSTATION
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 dark:bg-green-950/20 border-l-2 border-green-500 p-3 mb-4 text-green-700 dark:text-green-400">
          {successMsg.toUpperCase()}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-2 border-red-500 p-3 mb-4 text-red-700 dark:text-red-400">
          {errorMsg.toUpperCase()}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar Panel */}
        <div className="border border-black dark:border-white h-fit">
          <div className="p-4 border-b border-black dark:border-white bg-gray-50 dark:bg-zinc-900 font-black">
            NAVIGATION
          </div>
          <div className="flex flex-col divide-y divide-gray-200 dark:divide-zinc-800">
            {[
              { id: 'overview', label: 'OVERVIEW', icon: <Activity size={14} /> },
              { id: 'games', label: 'MARKET GAMES', icon: <List size={14} /> },
              { id: 'results', label: 'DAILY RESULTS', icon: <Calendar size={14} /> },
              { id: 'charts', label: 'RECORD CHARTS', icon: <Database size={14} /> },
              { id: 'api', label: 'EXTERNAL API CONFIG', icon: <Key size={14} /> },
              { id: 'logs', label: 'FETCH LOGS', icon: <FileText size={14} /> },
              { id: 'users', label: 'USER ACCOUNTS', icon: <Users size={14} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  clearMessages();
                }}
                className={`w-full p-3.5 text-left flex items-center gap-2.5 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-black text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-white'
                    : 'bg-transparent text-black dark:text-white'
                }`}
              >
                {tab.icon}
                <span className="font-black tracking-wider text-[11px]">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Console viewports */}
        <div className="md:col-span-3 border border-black dark:border-white p-6">
          {activeTab === 'overview' && <OverviewPanel setSuccess={setSuccessMsg} setError={setErrorMsg} />}
          {activeTab === 'games' && <GamesPanel setSuccess={setSuccessMsg} setError={setErrorMsg} />}
          {activeTab === 'results' && <ResultsPanel setSuccess={setSuccessMsg} setError={setErrorMsg} />}
          {activeTab === 'charts' && <ChartsPanel setSuccess={setSuccessMsg} setError={setErrorMsg} />}
          {activeTab === 'api' && <ApiConfigPanel setSuccess={setSuccessMsg} setError={setErrorMsg} />}
          {activeTab === 'logs' && <LogsPanel />}
          {activeTab === 'users' && <UsersPanel setSuccess={setSuccessMsg} setError={setErrorMsg} />}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 1. SUB-PANEL: OVERVIEW
// ============================================================================
const OverviewPanel: React.FC<{ setSuccess: (m: string) => void; setError: (m: string) => void }> = ({ setSuccess, setError }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleManualFetch = async () => {
    setTriggering(true);
    setSuccess('');
    setError('');
    try {
      const response = await api.post('/admin/settings/api/trigger-fetch');
      setSuccess(response.data.message);
      await loadStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Manual fetch request failed');
    } finally {
      setTriggering(false);
    }
  };

  if (loading || !stats) return <div>LOADING METRICS...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-black tracking-widest border-b border-black dark:border-white pb-2 mb-4">
        SYSTEM MONITOR
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'ACTIVE GAMES', value: stats.active_games },
          { label: 'TOTAL GAMES', value: stats.total_games },
          { label: 'ANNOUNCED TODAY', value: stats.announced_today },
          { label: 'USER MEMBERS', value: stats.total_users }
        ].map((item, idx) => (
          <div key={idx} className="border border-black dark:border-white p-4 text-center bg-gray-50 dark:bg-zinc-900">
            <div className="text-[10px] text-gray-500 font-bold mb-1">{item.label}</div>
            <div className="text-3xl font-black">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="border border-black dark:border-white p-4">
        <h3 className="text-xs font-black tracking-wider mb-2">QUICK CONTROLS</h3>
        <p className="text-[10px] text-gray-500 mb-4 font-bold">
          TRIGGER A MANUALLY FORCED RESULT CRAWL FOR THE DATE SETTINGS OF TODAY FOR ALL ACTIVE REGISTERED MARKETS.
        </p>
        <button
          onClick={handleManualFetch}
          disabled={triggering}
          className="px-4 py-2 border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <Play size={12} />
          {triggering ? 'FETCHING RESULT DATA...' : 'FORCE API CRAWL NOW'}
        </button>
      </div>

      <div>
        <h3 className="text-xs font-black tracking-wider mb-3">RECENT FETCH LOGS</h3>
        <div className="border border-black dark:border-white divide-y divide-black dark:divide-white">
          {stats.fetches.recent.map((log: FetchLog) => (
            <div key={log._id} className="p-3 flex justify-between items-center text-[10px]">
              <div>
                <span className="font-black text-gray-800 dark:text-zinc-200">
                  {log.game_code ? log.game_code.toUpperCase() : 'GLOBAL FETCH'}
                </span>
                <span className="text-gray-400 pl-2">
                  {new Date(log.started_at).toLocaleString()}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 font-black text-white ${
                  log.success ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                {log.success ? 'SUCCESS' : 'FAILED'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. SUB-PANEL: GAMES CRUD
// ============================================================================
const GamesPanel: React.FC<{ setSuccess: (m: string) => void; setError: (m: string) => void }> = ({ setSuccess, setError }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [scheduleTime, setScheduleTime] = useState('12:00 PM');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');

  const loadGames = async () => {
    try {
      const response = await api.get('/admin/games');
      setGames(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setDisplayName('');
    setScheduleTime('12:00 PM');
    setIsActive(true);
    setIsFeatured(false);
    setSortOrder('0');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    const payload = {
      name,
      code,
      display_name: displayName,
      schedule_time: scheduleTime,
      is_active: isActive,
      is_featured: isFeatured,
      sort_order: parseInt(sortOrder, 10) || 0
    };

    try {
      if (editingId) {
        await api.put(`/admin/games/${editingId}`, payload);
        setSuccess('Game updated successfully');
      } else {
        await api.post('/admin/games', payload);
        setSuccess('Game created successfully');
      }
      resetForm();
      await loadGames();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error processing request');
    }
  };

  const startEdit = (g: Game) => {
    setEditingId(g._id);
    setName(g.name);
    setCode(g.code);
    setDisplayName(g.display_name);
    setScheduleTime(g.schedule_time);
    setIsActive(g.is_active);
    setIsFeatured(g.is_featured || false);
    setSortOrder(String(g.sort_order));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete game? All historical charts and results will be disconnected.')) return;
    setSuccess('');
    setError('');
    try {
      await api.delete(`/admin/games/${id}`);
      setSuccess('Game deleted successfully');
      await loadGames();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete game');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-black dark:border-white pb-2">
        <h2 className="text-sm font-black tracking-widest">
          {editingId ? 'EDIT MARKET GAME' : 'ADD NEW MARKET GAME'}
        </h2>
        {editingId && (
          <button onClick={resetForm} className="text-red-500 font-bold border border-red-500 px-2 py-0.5">
            CANCEL EDIT
          </button>
        )}
      </div>

      {/* Creation form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-black dark:border-white p-4">
        <div>
          <label className="block text-[9px] mb-1">GAME IDENTIFIER (E.G. "GALI")</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            className="w-full p-2 border border-black dark:border-white bg-transparent"
          />
        </div>
        <div>
          <label className="block text-[9px] mb-1">SHORTCODE (E.G. "GALI")</label>
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toLowerCase())}
            className="w-full p-2 border border-black dark:border-white bg-transparent"
          />
        </div>
        <div>
          <label className="block text-[9px] mb-1">PUBLIC DISPLAY NAME (E.G. "GALI BAZAR")</label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full p-2 border border-black dark:border-white bg-transparent"
          />
        </div>
        <div>
          <label className="block text-[9px] mb-1">SCHEDULE TIME (E.G. "11:25 PM")</label>
          <input
            type="text"
            required
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            placeholder="11:25 PM"
            className="w-full p-2 border border-black dark:border-white bg-transparent"
          />
        </div>
        <div>
          <label className="block text-[9px] mb-1">SORT ORDER (ASCENDING)</label>
          <input
            type="number"
            required
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full p-2 border border-black dark:border-white bg-transparent"
          />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="is_active_chk"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="is_active_chk" className="text-[10px] font-bold">GAME IS ACTIVE</label>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="is_featured_chk"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="is_featured_chk" className="text-[10px] font-bold">HIGHLIGHT GAME (YELLOW ROW)</label>
        </div>
        <div className="sm:col-span-3 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            {editingId ? 'UPDATE GAME' : 'CREATE GAME'}
          </button>
        </div>
      </form>

      {/* Grid listing */}
      <div>
        <h3 className="text-xs font-black tracking-widest mb-3">CURRENT GAMES</h3>
        <div className="border border-black dark:border-white overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-black dark:border-white bg-gray-50 dark:bg-zinc-900">
                <th className="p-3">CODE</th>
                <th className="p-3">DISPLAY</th>
                <th className="p-3">TIME</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {games.map(g => (
                <tr key={g._id} className="border-b border-gray-200 dark:border-zinc-800 last:border-0">
                  <td className="p-3 font-black">{g.code.toUpperCase()}</td>
                  <td className="p-3">{g.display_name}</td>
                  <td className="p-3">{g.schedule_time}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-black text-white ${
                          g.is_active ? 'bg-green-600' : 'bg-red-600'
                        }`}
                      >
                        {g.is_active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                      {g.is_featured && (
                        <span className="px-1.5 py-0.5 text-[9px] font-black bg-yellow-500 text-gray-900">
                          FEATURED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => startEdit(g)}
                      className="px-2 py-1 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(g._id)}
                      className="px-2 py-1 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. SUB-PANEL: DAILY RESULTS
// ============================================================================
const ResultsPanel: React.FC<{ setSuccess: (m: string) => void; setError: (m: string) => void }> = ({ setSuccess, setError }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  // CSV bulk block
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const loadResults = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/results?date=${selectedDate}`);
      setResults(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [selectedDate]);

  const handleResultSave = async (gameId: string, value: string, status: string, source: string) => {
    setSuccess('');
    setError('');
    try {
      await api.post('/admin/results', {
        game_id: gameId,
        date: selectedDate,
        result_number: value,
        status,
        source
      });
      setSuccess('Result entry updated successfully');
      await loadResults();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update result');
    }
  };

  const handleMarkAllAnnounced = async () => {
    setSuccess('');
    setError('');
    try {
      const response = await api.post('/admin/results/mark-all-announced', { date: selectedDate });
      setSuccess(response.data.message);
      await loadResults();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleBulkUpload = async () => {
    setSuccess('');
    setError('');
    if (!bulkCsvText.trim()) return;

    // Parse CSV: date,game_code,result_number
    const lines = bulkCsvText.split('\n');
    const items: any[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(',');
      if (parts.length >= 3) {
        items.push({
          date: parts[0].trim(),
          game_code: parts[1].trim(),
          result_number: parts[2].trim()
        });
      }
    }

    try {
      const response = await api.post('/admin/results/bulk', { items });
      setSuccess(response.data.message);
      setBulkCsvText('');
      setShowBulkUpload(false);
      await loadResults();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Bulk upload failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-black dark:border-white pb-3 gap-3">
        <h2 className="text-sm font-black tracking-widest">RESULTS MANAGER</h2>
        
        {/* Date Selector */}
        <div className="flex items-center gap-2 border border-black dark:border-white px-2 py-1">
          <Calendar size={12} />
          <span className="text-[10px] mr-1">CHOOSE DATE:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-[10px] bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-between">
        <button
          onClick={handleMarkAllAnnounced}
          className="px-3 py-1.5 border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          APPROVE & ANNOUNCE ALL PENDING
        </button>

        <button
          onClick={() => setShowBulkUpload(!showBulkUpload)}
          className="px-3 py-1.5 border border-black dark:border-white font-black hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors flex items-center gap-1.5"
        >
          <Upload size={12} />
          {showBulkUpload ? 'CLOSE BULK UPLOAD' : 'BULK CSV IMPORT'}
        </button>
      </div>

      {showBulkUpload && (
        <div className="border border-black dark:border-white p-4 space-y-4">
          <label className="block text-[10px] font-black">BULK RESULTS CSV TEXT</label>
          <p className="text-[9px] text-gray-500 font-bold leading-normal">
            FORMAT: YYYY-MM-DD, game_code, result_number (ONE ROW PER ENTRY, E.G. "2026-06-29,gali,45")
          </p>
          <textarea
            rows={5}
            value={bulkCsvText}
            onChange={(e) => setBulkCsvText(e.target.value)}
            placeholder="2026-06-29,gali,45&#10;2026-06-29,disawar,12"
            className="w-full p-2 border border-black dark:border-white bg-transparent font-mono"
          />
          <button
            onClick={handleBulkUpload}
            className="px-4 py-2 border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            IMPORT CSV ITEMS
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">LOADING RESULTS GRID...</div>
      ) : (
        <div className="border border-black dark:border-white overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-black dark:border-white bg-gray-50 dark:bg-zinc-900">
                <th className="p-3">GAME</th>
                <th className="p-3">SCHEDULE</th>
                <th className="p-3">SOURCE</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">RESULT NUMBER</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <ResultRow
                  key={r.game_id}
                  row={r}
                  onSave={(value, status, source) => handleResultSave(r.game_id, value, status, source)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ResultRow: React.FC<{ row: ResultItem; onSave: (val: string, status: string, source: string) => void }> = ({ row, onSave }) => {
  const [val, setVal] = useState(row.result_number || '');
  const [status, setStatus] = useState(row.status);
  const [source, setSource] = useState(row.source);

  // Sync state if props change
  useEffect(() => {
    setVal(row.result_number || '');
    setStatus(row.status);
    setSource(row.source);
  }, [row]);

  return (
    <tr className="border-b border-gray-200 dark:border-zinc-800 last:border-0 text-[11px]">
      <td className="p-3 font-black">
        <div>{row.display_name.toUpperCase()}</div>
        <div className="text-[9px] text-gray-400">({row.code})</div>
      </td>
      <td className="p-3 text-gray-500">{row.schedule_time}</td>
      <td className="p-3">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as any)}
          className="border border-black dark:border-white bg-transparent p-1 focus:outline-none text-[10px]"
        >
          <option value="api" className="text-black">API (CRAWLER)</option>
          <option value="manual" className="text-black">MANUAL (OVERRIDE)</option>
        </select>
      </td>
      <td className="p-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="border border-black dark:border-white bg-transparent p-1 focus:outline-none text-[10px]"
        >
          <option value="pending" className="text-black">PENDING</option>
          <option value="announced" className="text-black">ANNOUNCED</option>
        </select>
      </td>
      <td className="p-3">
        <input
          type="text"
          maxLength={4}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="XX"
          disabled={status === 'pending'}
          className="w-16 p-1 border border-black dark:border-white bg-transparent text-center font-black focus:outline-none disabled:opacity-50"
        />
      </td>
      <td className="p-3 text-right">
        <button
          onClick={() => onSave(val, status, source)}
          className="px-3 py-1 border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          SAVE
        </button>
      </td>
    </tr>
  );
};

// ============================================================================
// 4. SUB-PANEL: CHARTS MANAGER
// ============================================================================
const ChartsPanel: React.FC<{ setSuccess: (m: string) => void; setError: (m: string) => void }> = ({ setSuccess, setError }) => {
  const { games, fetchGames } = useAppStore();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));
  
  const [chartGrid, setChartGrid] = useState<ChartDay[]>([]);
  const [loading, setLoading] = useState(false);

  const [showCsvInput, setShowCsvInput] = useState(false);
  const [csvText, setCsvText] = useState('');

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    if (games.length > 0 && !selectedGameId) {
      setSelectedGameId(games[0]._id);
    }
  }, [games, selectedGameId]);

  const loadChartData = async () => {
    if (!selectedGameId) return;
    setLoading(true);
    try {
      const response = await api.get(`/charts/${selectedGameId}/${selectedYear}/${selectedMonth}`);
      setChartGrid(response.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGameId) {
      loadChartData();
    }
  }, [selectedGameId, selectedYear, selectedMonth]);

  const handleGridChange = (day: number, val: string) => {
    setChartGrid(prev =>
      prev.map(item => (item.day === day ? { ...item, result: val } : item))
    );
  };

  const handleSaveGrid = async () => {
    setSuccess('');
    setError('');
    try {
      await api.post('/admin/charts', {
        game_id: selectedGameId,
        year: parseInt(selectedYear),
        month: parseInt(selectedMonth),
        data: chartGrid
      });
      setSuccess('Monthly chart saved and synchronized successfully');
      await loadChartData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save chart grid');
    }
  };

  const handleCsvUpload = async () => {
    setSuccess('');
    setError('');
    if (!csvText.trim()) return;

    try {
      await api.post('/admin/charts/upload', {
        game_id: selectedGameId,
        year: parseInt(selectedYear),
        month: parseInt(selectedMonth),
        csvText
      });
      setSuccess('CSV chart successfully imported and synchronized');
      setCsvText('');
      setShowCsvInput(false);
      await loadChartData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'CSV Import failed');
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-black tracking-widest border-b border-black dark:border-white pb-2 mb-4">
        MONTHLY RECORD CHARTS
      </h2>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[9px] mb-1">SELECT GAME</label>
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="w-full p-2 border border-black dark:border-white bg-transparent"
          >
            {games.map(g => (
              <option key={g._id} value={g._id} className="text-black">{g.display_name.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[9px] mb-1">YEAR</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full p-2 border border-black dark:border-white bg-transparent"
          >
            {years.map(y => (
              <option key={y} value={y} className="text-black">{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[9px] mb-1">MONTH</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full p-2 border border-black dark:border-white bg-transparent"
          >
            {months.map(m => (
              <option key={m} value={m} className="text-black">
                {new Date(2000, parseInt(m) - 1).toLocaleString('default', { month: 'long' }).toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowCsvInput(!showCsvInput)}
          className="px-3 py-1.5 border border-black dark:border-white font-black hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors flex items-center gap-1.5"
        >
          <Upload size={12} />
          {showCsvInput ? 'CLOSE CSV UPLOAD' : 'UPLOAD CSV DATA'}
        </button>
      </div>

      {showCsvInput && (
        <div className="border border-black dark:border-white p-4 space-y-4">
          <label className="block text-[10px] font-black">CHART DATA CSV TEXT</label>
          <p className="text-[9px] text-gray-500 font-bold leading-normal">
            FORMAT: day,result (E.G. "1,45&#10;2,77"). CHECKS THAT day IS 1-31.
          </p>
          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="1,45&#10;2,77&#10;3,12"
            className="w-full p-2 border border-black dark:border-white bg-transparent font-mono"
          />
          <button
            onClick={handleCsvUpload}
            className="px-4 py-2 border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            IMPORT CSV DATA
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">LOADING CHART MATRIX...</div>
      ) : (
        <div className="space-y-4">
          <div className="border border-black dark:border-white p-4 bg-gray-50 dark:bg-zinc-900">
            <h4 className="text-[10px] font-black tracking-widest text-gray-500 mb-4">EDITABLE CALENDAR MATRIX</h4>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {chartGrid.map(item => (
                <div key={item.day} className="flex flex-col border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1.5">
                  <span className="text-[9px] text-gray-400 font-bold mb-1">DAY {item.day}</span>
                  <input
                    type="text"
                    maxLength={4}
                    value={item.result}
                    onChange={(e) => handleGridChange(item.day, e.target.value)}
                    className="w-full text-center p-1 bg-transparent font-black focus:outline-none"
                    placeholder="--"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSaveGrid}
              className="px-6 py-2 border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              SAVE MATRIX & SYNC
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 5. SUB-PANEL: API CONFIGURATION
// ============================================================================
const ApiConfigPanel: React.FC<{ setSuccess: (m: string) => void; setError: (m: string) => void }> = ({ setSuccess, setError }) => {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [authType, setAuthType] = useState('none');
  const [authHeaderKey, setAuthHeaderKey] = useState('');
  const [authHeaderValue, setAuthHeaderValue] = useState('');
  
  // JSON Paths
  const [gameCodeField, setGameCodeField] = useState('');
  const [resultField, setResultField] = useState('');
  const [dateField, setDateField] = useState('');
  const [statusField, setStatusField] = useState('');
  const [arrayPath, setArrayPath] = useState('');

  // Headers and Body template states
  const [headersJson, setHeadersJson] = useState('{}');
  const [bodyTemplateJson, setBodyTemplateJson] = useState('{}');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const loadConfig = async () => {
    try {
      const response = await api.get('/admin/settings/api');
      const val = response.data;
      setUrl(val.url || '');
      setMethod(val.method || 'GET');
      setAuthType(val.auth_type || 'none');
      setAuthHeaderKey(val.auth_header_key || '');
      setAuthHeaderValue(val.auth_header_value || '');
      setGameCodeField(val.response_mapping?.game_code_field || 'game');
      setResultField(val.response_mapping?.result_field || 'result');
      setDateField(val.response_mapping?.date_field || 'date');
      setStatusField(val.response_mapping?.status_field || 'status');
      setArrayPath(val.response_mapping?.array_path || '');
      setHeadersJson(JSON.stringify(val.headers || {}, null, 2));
      setBodyTemplateJson(JSON.stringify(val.body_template || {}, null, 2));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const getPayload = () => {
    let parsedHeaders = {};
    let parsedBody = {};
    try {
      parsedHeaders = JSON.parse(headersJson);
    } catch (e) {}
    try {
      parsedBody = JSON.parse(bodyTemplateJson);
    } catch (e) {}

    return {
      url,
      method,
      auth_type: authType,
      auth_header_key: authHeaderKey,
      auth_header_value: authHeaderValue,
      headers: parsedHeaders,
      body_template: parsedBody,
      response_mapping: {
        game_code_field: gameCodeField,
        result_field: resultField,
        date_field: dateField,
        status_field: statusField,
        array_path: arrayPath
      }
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      await api.put('/admin/settings/api', getPayload());
      setSuccess('External API configuration saved successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save configuration');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setSuccess('');
    setError('');
    try {
      const response = await api.post('/admin/settings/api/test', getPayload());
      setTestResult(response.data);
    } catch (err: any) {
      setError(err.message || 'Connection test request failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-black tracking-widest border-b border-black dark:border-white pb-2 mb-4">
        EXTERNAL API INTEGRATION
      </h2>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[9px] mb-1">TARGET URL (PLACEHOLDERS: &#123;game_code&#125;, &#123;date&#125;)</label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. http://localhost:5000/api/mock-external-results?date={date}"
              className="w-full p-2 border border-black dark:border-white bg-transparent"
            />
          </div>

          <div>
            <label className="block text-[9px] mb-1">HEADERS (JSON CONFIG)</label>
            <textarea
              rows={4}
              value={headersJson}
              onChange={(e) => setHeadersJson(e.target.value)}
              placeholder='{ "Content-Type": "application/json" }'
              className="w-full p-2 border border-black dark:border-white bg-transparent font-mono text-[10px]"
            />
          </div>

          <div>
            <label className="block text-[9px] mb-1">BODY TEMPLATE (JSON CONFIG)</label>
            <textarea
              rows={4}
              value={bodyTemplateJson}
              onChange={(e) => setBodyTemplateJson(e.target.value)}
              placeholder='{ "api_key": "xxx", "domain": "xxx" }'
              className="w-full p-2 border border-black dark:border-white bg-transparent font-mono text-[10px]"
            />
          </div>

          <div>
            <label className="block text-[9px] mb-1">HTTP METHOD</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full p-2 border border-black dark:border-white bg-transparent text-black"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] mb-1">AUTHENTICATION FLOW</label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              className="w-full p-2 border border-black dark:border-white bg-transparent text-black"
            >
              <option value="none">NONE</option>
              <option value="bearer">BEARER TOKEN</option>
              <option value="api_key">API HEADER KEY</option>
            </select>
          </div>

          {authType === 'api_key' && (
            <div>
              <label className="block text-[9px] mb-1">API KEY HEADER KEY</label>
              <input
                type="text"
                value={authHeaderKey}
                onChange={(e) => setAuthHeaderKey(e.target.value)}
                placeholder="X-API-KEY"
                className="w-full p-2 border border-black dark:border-white bg-transparent"
              />
            </div>
          )}

          {authType !== 'none' && (
            <div>
              <label className="block text-[9px] mb-1">
                {authType === 'bearer' ? 'BEARER TOKEN VALUE' : 'API KEY HEADER VALUE'}
              </label>
              <input
                type="password"
                value={authHeaderValue}
                onChange={(e) => setAuthHeaderValue(e.target.value)}
                className="w-full p-2 border border-black dark:border-white bg-transparent"
              />
            </div>
          )}
        </div>

        {/* JSON Mapping Paths */}
        <div className="border border-black dark:border-white p-4 bg-gray-50 dark:bg-zinc-900 space-y-4">
          <h4 className="text-[10px] font-black tracking-widest text-gray-500 border-b border-gray-200 dark:border-zinc-800 pb-2">
            JSON RESPONSE MAPPING SCHEMAS
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] mb-1">GAME CODE FIELD PATH</label>
              <input
                type="text"
                required
                value={gameCodeField}
                onChange={(e) => setGameCodeField(e.target.value)}
                placeholder="e.g. game"
                className="w-full p-2 border border-black dark:border-white bg-white dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="block text-[9px] mb-1">RESULT NUMBER FIELD PATH</label>
              <input
                type="text"
                required
                value={resultField}
                onChange={(e) => setResultField(e.target.value)}
                placeholder="e.g. result"
                className="w-full p-2 border border-black dark:border-white bg-white dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="block text-[9px] mb-1">DATE FIELD PATH</label>
              <input
                type="text"
                required
                value={dateField}
                onChange={(e) => setDateField(e.target.value)}
                placeholder="e.g. date"
                className="w-full p-2 border border-black dark:border-white bg-white dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="block text-[9px] mb-1">STATUS FIELD PATH (OPTIONAL)</label>
              <input
                type="text"
                value={statusField}
                onChange={(e) => setStatusField(e.target.value)}
                placeholder="e.g. status"
                className="w-full p-2 border border-black dark:border-white bg-white dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="block text-[9px] mb-1">ARRAY JSON PATH (OPTIONAL)</label>
              <input
                type="text"
                value={arrayPath}
                onChange={(e) => setArrayPath(e.target.value)}
                placeholder="e.g. results.data"
                className="w-full p-2 border border-black dark:border-white bg-white dark:bg-zinc-950"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 border border-black dark:border-white font-black hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
          >
            {testing ? 'TESTING INTEGRATION...' : 'TEST CONNECTION'}
          </button>

          <button
            type="submit"
            className="px-6 py-2 border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            SAVE CONFIGURATION
          </button>
        </div>
      </form>

      {/* Connection Test Diagnostics */}
      {testResult && (
        <div className="border border-black dark:border-white p-4 space-y-4">
          <h4 className="text-[10px] font-black tracking-widest text-gray-500">DIAGNOSTIC TEST RESULTS</h4>
          
          <div className="text-[10px]">
            <span className="font-bold">STATUS: </span>
            <span className={`font-black ${testResult.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.status.toUpperCase()}
            </span>
          </div>

          {testResult.status === 'success' ? (
            <div className="space-y-3">
              <div className="border border-gray-200 dark:border-zinc-800 p-2 bg-gray-50 dark:bg-zinc-900">
                <div className="font-bold text-[9px] text-gray-400 mb-1">MAPPED JSON PARSING</div>
                <pre className="text-[10px] font-mono whitespace-pre-wrap">
                  {JSON.stringify(testResult.mapping_result, null, 2)}
                </pre>
              </div>
              <div className="border border-gray-200 dark:border-zinc-800 p-2 bg-gray-50 dark:bg-zinc-900">
                <div className="font-bold text-[9px] text-gray-400 mb-1">RAW API PAYLOAD ANSWER</div>
                <pre className="text-[9px] font-mono max-h-48 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                  {JSON.stringify(testResult.response.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/20 border-l-2 border-red-500 p-3 text-[10px] font-mono text-red-700 dark:text-red-400">
              ERROR MESSAGE: {testResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 6. SUB-PANEL: LOGS VIEWER
// ============================================================================
const LogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<FetchLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/logs?page=${page}&limit=20`);
      setLogs(response.data.logs);
      setTotalPages(response.data.pagination.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-black tracking-widest border-b border-black dark:border-white pb-2 mb-4">
        API INTEGRATION FETCH LOGS
      </h2>

      {loading ? (
        <div className="text-center py-12">LOADING HISTORY LOGS...</div>
      ) : (
        <div className="space-y-4">
          <div className="border border-black dark:border-white overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-black dark:border-white bg-gray-50 dark:bg-zinc-900">
                  <th className="p-3">DATE / TIME</th>
                  <th className="p-3">MARKET CODE</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">ERROR EXCEPTION DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id} className="border-b border-gray-200 dark:border-zinc-800 last:border-0 text-[10px]">
                    <td className="p-3 text-gray-500 font-bold">
                      {new Date(log.started_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-black">
                      {log.game_code ? log.game_code.toUpperCase() : 'GLOBAL FETCH'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-black text-white ${
                          log.success ? 'bg-green-600' : 'bg-red-600'
                        }`}
                      >
                        {log.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-red-600 dark:text-red-400 font-bold max-w-xs truncate" title={log.error_message}>
                      {log.error_message || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center text-xs">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50"
              >
                PREVIOUS
              </button>
              <span>PAGE {page} OF {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50"
              >
                NEXT
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 7. SUB-PANEL: USERS MANAGER
// ============================================================================
const UsersPanel: React.FC<{ setSuccess: (m: string) => void; setError: (m: string) => void }> = ({ setSuccess, setError }) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setSuccess('');
    setError('');
    try {
      const response = await api.put(`/admin/users/${id}/disable`, { is_active: !currentStatus });
      setSuccess(response.data.message);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle account status');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-black tracking-widest border-b border-black dark:border-white pb-2 mb-4">
        USER ACCOUNTS MANAGER
      </h2>

      {loading ? (
        <div className="text-center py-12">LOADING USER ACCOUNTS...</div>
      ) : (
        <div className="border border-black dark:border-white overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-black dark:border-white bg-gray-50 dark:bg-zinc-900">
                <th className="p-3">EMAIL ADDRESS</th>
                <th className="p-3">FULL NAME</th>
                <th className="p-3">REGISTERED AT</th>
                <th className="p-3">ACCOUNT STATUS</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b border-gray-200 dark:border-zinc-800 last:border-0 text-[10px]">
                  <td className="p-3 font-black text-gray-800 dark:text-zinc-200">{u.email}</td>
                  <td className="p-3">{u.full_name || '--'}</td>
                  <td className="p-3 text-gray-500 font-bold">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-black text-white ${
                        u.is_active ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(u._id, u.is_active)}
                      className={`px-3 py-1 border transition-colors ${
                        u.is_active
                          ? 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
                          : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                      }`}
                    >
                      {u.is_active ? 'DISABLE' : 'ENABLE'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
