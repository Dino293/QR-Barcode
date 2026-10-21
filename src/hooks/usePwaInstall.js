import { useState, useEffect } from 'react';

/**
 * Hook untuk Mendeteksi & Menampilkan Dialog Install PWA Asli (Android, Windows, Chrome, iOS)
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Cek apakah aplikasi sudah berjalan dalam mode standalone (sudah diinstall)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsStandalone(true);
      setDeferredPrompt(null);
      console.log("PWA BMN BPMP berhasil diinstall!");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      // Fallback untuk browser yang tidak mendukung prompt otomatis (misal iOS Safari)
      alert("Untuk menginstal di perangkat Anda:\n- Android Chrome: Klik menu titik tiga ⋮ lalu pilih 'Install App' / 'Tambahkan ke Layar Utama'.\n- iPhone Safari: Klik tombol Share ⎋ lalu pilih 'Add to Home Screen'.");
      return;
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('Pengguna menyetujui instalasi PWA');
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (err) {
      console.error('Error saat instalasi PWA:', err);
    }
  };

  return {
    isInstallable,
    isStandalone,
    installApp
  };
}
