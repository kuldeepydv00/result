import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ResultsGrid } from '../components/ResultsGrid';
import { NextSection } from '../components/NextSection';
import { InstallPwaPrompt } from '../components/InstallPwaPrompt';
import { SearchBar } from '../components/SearchBar';
import { MonthlyCombinedChart } from '../components/MonthlyCombinedChart';
import { Calendar, Bell, BellOff } from 'lucide-react';
import { parseISO, subDays, format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

// Helper function to map VAPID public key base64 to UInt8Array
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const Home: React.FC = () => {
  const { results, fetchResults, starredGames, pushEnabled, setPushEnabled } = useAppStore();
  const { t } = useTranslation();

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  const [yesterdayResults, setYesterdayResults] = useState<any[]>([]);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Push Subscription Status variables
  const [pushSupported, setPushSupported] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState('');
  const [submittingPush, setSubmittingPush] = useState(false);

  // Check browser push notification support on load
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
    }
  }, []);

  // Update last-updated time string on client load
  useEffect(() => {
    const formatted = format(new Date(), "MMMM d, yyyy, HH:mm:ss 'IST'");
    setCurrentTimeStr(formatted);
  }, [results]);

  useEffect(() => {
    const loadResultsComparison = async () => {
      await fetchResults(selectedDate);
      
      try {
        const selected = parseISO(selectedDate);
        const yesterdayDateStr = format(subDays(selected, 1), 'yyyy-MM-dd');
        const response = await api.get(`/results/date/${yesterdayDateStr}`);
        setYesterdayResults(response.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadResultsComparison();
  }, [selectedDate, fetchResults]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const getYesterdayDateStr = () => {
    try {
      const selected = parseISO(selectedDate);
      return format(subDays(selected, 1), 'yyyy-MM-dd');
    } catch (e) {
      return '';
    }
  };

  const formatDayHeaderLabel = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      return format(d, 'EEE. do');
    } catch (e) {
      return dateStr;
    }
  };

  const formatBannerDateLabel = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      return format(d, 'MMMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  // Toggle Push alert subscription anonymously
  const handlePushToggle = async () => {
    setPushStatusMessage('');
    if (!pushSupported) return;
    setSubmittingPush(true);

    if (pushEnabled) {
      // Unsubscribe locally
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Service Worker connection timeout')), 5000))
        ]);
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
        setPushEnabled(false);
        setPushStatusMessage('Notifications disabled successfully.');
      } catch (err: any) {
        console.error(err);
        setPushStatusMessage('Error disabling notifications: ' + err.message);
      } finally {
        setSubmittingPush(false);
      }
      return;
    }

    // Subscribe
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatusMessage('Notification permission was denied.');
        setSubmittingPush(false);
        return;
      }

      // Fetch VAPID public key
      const keyResponse = await api.get('/notifications/subscribe');
      const publicKey = keyResponse.data.publicKey;

      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Service Worker connection timeout')), 5000))
      ]);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Submit subscription details linked with guest's starred games
      await api.post('/notifications/subscribe', {
        subscription,
        favorites: starredGames
      });

      setPushEnabled(true);
      setPushStatusMessage('Successfully subscribed to instant draw alerts!');
    } catch (error: any) {
      console.error('Failed to subscribe for push notifications: ', error);
      setPushStatusMessage('Failed to enable push alerts: ' + error.message);
    } finally {
      setSubmittingPush(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2">
      {/* PWA Install Alert */}
      <InstallPwaPrompt />

      {/* Centered Result King Fast Header Logo */}
      <div className="flex flex-col items-center justify-center my-6 gap-2 text-center select-none">
        <div className="flex items-center gap-2">
          {/* Flat Crown SVG Logo */}
          <svg className="w-10 h-10 text-gray-900 dark:text-zinc-100 fill-current" viewBox="0 0 24 24">
            <path d="M2 4l3 7 7-9 7 9 3-7-1 16H3L2 4z" />
          </svg>
          <span className="text-3xl font-black tracking-[0.25em] uppercase text-gray-900 dark:text-zinc-100">
            {t('site_title')}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold max-w-xl mt-2 leading-relaxed">
          Daily Superfast Result King of {formatBannerDateLabel(selectedDate)} And Leak Numbers for Gali, Desawar, Ghaziabad and Faridabad With Complete Old Draw Charts.
        </p>
      </div>

      {/* Red Editorial Disclaimer Panel */}
      <div className="border-l-4 border-red-600 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-4 text-left text-[10px] sm:text-xs font-semibold leading-normal mb-6">
        <span className="font-black uppercase mr-1 text-red-800 dark:text-red-300">Disclaimer:</span> This website is an independent media portal for informational and journalistic purposes only. As a non-transactional service, we are not affiliated with any gambling entities. Users are solely responsible for complying with all applicable laws in their jurisdiction.
      </div>

      {/* Sleek Last Sync Time */}
      <div className="text-center text-gray-500 dark:text-zinc-400 font-extrabold text-[10px] tracking-widest uppercase mb-6">
        Last Sync: {currentTimeStr}
      </div>

      {/* Hero Search, Star Hint & Push Switch Panel */}
      <div className="flex flex-col items-center mb-8 gap-4 w-full max-w-md mx-auto">
        <SearchBar />
        
        {/* Star Hint */}
        {starredGames.length === 0 && (
          <p className="text-[10px] text-gray-400 font-bold dark:text-zinc-500 text-center">
            * {t('star_hint')}
          </p>
        )}

        {/* Guest Push Notifications Alert Manager */}
        {pushSupported && (
          <div className="w-full border border-black dark:border-white p-3.5 bg-gray-50 dark:bg-zinc-900/50 flex flex-col gap-2 items-center text-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                {pushEnabled ? <Bell size={12} className="text-green-600" /> : <BellOff size={12} className="text-gray-400" />}
                DRAW ALERTS {pushEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            
            <button
              onClick={handlePushToggle}
              disabled={submittingPush}
              className={`w-full py-1.5 text-[9px] font-black uppercase tracking-widest border transition-colors ${
                pushEnabled 
                  ? 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white' 
                  : 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200'
              }`}
            >
              {submittingPush 
                ? 'LOADING...' 
                : pushEnabled 
                  ? 'DISABLE ALERTS' 
                  : 'SUBSCRIBE FOR PUSH ALERTS'}
            </button>

            {pushStatusMessage && (
              <p className="text-[8px] font-black uppercase text-gray-500 dark:text-zinc-400 mt-1 select-none">
                {pushStatusMessage}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Next Upcoming Section */}
      <NextSection results={results} />

      {/* Main Results Table Block */}
      <div className="border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 mb-8">
        
        {/* Table Banner (Premium Crimson Red Gradient) */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white text-center py-4 px-4 text-xs sm:text-sm font-black uppercase tracking-widest shadow-sm">
          Result King: {formatBannerDateLabel(selectedDate)} & {formatBannerDateLabel(getYesterdayDateStr())}
        </div>
 
        {/* Date Selector Row */}
        <div className="bg-gray-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-600 dark:text-zinc-400" />
            <span className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-widest">
              {t('select_date')}
            </span>
          </div>
          <div className="relative w-full sm:w-auto flex justify-center">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              max={getTodayStr()}
              className="w-full max-w-[280px] sm:w-auto p-2 text-xs font-black border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-md uppercase text-center"
            />
          </div>
        </div>

        {/* Sub-Header (Grid Layout for Perfect Column Alignment) */}
        <div className="bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 py-2.5 px-4 grid grid-cols-12 items-center text-[10px] sm:text-xs font-black uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
          <span className="col-span-6 sm:col-span-8">Draw Markets Comparison</span>
          <span className="col-span-3 sm:col-span-2 text-center">{formatDayHeaderLabel(getYesterdayDateStr())}</span>
          <span className="col-span-3 sm:col-span-2 text-center">{formatDayHeaderLabel(selectedDate)}</span>
        </div>
 
        {/* Results Grid Listing partitioned into LIVE/NEXT */}
        <ResultsGrid todayResults={results} yesterdayResults={yesterdayResults} />
      </div>

      {/* Monthly Combined Chart Container */}
      <MonthlyCombinedChart />
    </div>
  );
};
export default Home;
