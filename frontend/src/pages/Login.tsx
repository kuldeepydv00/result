import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/admin/login', { email, password });
      const { token, admin } = response.data;
      
      // Save credentials in Zustand global store
      adminLogin(token, admin);
      
      // Direct admin to panel
      navigate('/admin', { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid administrative credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[450px] py-12">
      <div className="w-full max-w-md border border-black dark:border-white p-8 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
        <div className="mb-8 text-center select-none">
          <div className="flex items-center justify-center gap-2 mb-2">
            {/* Flat Crown SVG Logo */}
            <svg className="w-8 h-8 text-gray-900 dark:text-zinc-100 fill-current" viewBox="0 0 24 24">
              <path d="M2 4l3 7 7-9 7 9 3-7-1 16H3L2 4z" />
            </svg>
            <span className="text-xl font-black uppercase tracking-widest">
              ADMIN ACCESS
            </span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
            RESULT KING CONSOLE LOG IN
          </p>
        </div>

        {error && (
          <div className="border-l-4 border-red-600 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-3 text-[10px] font-black uppercase tracking-wide mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@resultsking.in"
              className="w-full p-2.5 text-xs border border-black dark:border-white bg-transparent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5">
              SECRET PASSWORD
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 text-xs border border-black dark:border-white bg-transparent focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-black uppercase text-xs tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'SECURE LOG IN'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
