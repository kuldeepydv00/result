import React, { useEffect, useState } from 'react';

export const InstallPwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="bg-black text-white dark:bg-white dark:text-black p-4 flex flex-col sm:flex-row justify-between items-center gap-3 mb-6 text-xs font-bold border-l-4 border-green-500">
      <span>ADD TO HOME SCREEN FOR FASTER ACCESS & REAL-TIME RESULT ALERTS</span>
      <button
        onClick={handleInstallClick}
        className="px-4 py-2 border border-white dark:border-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
      >
        INSTALL PWA
      </button>
    </div>
  );
};
