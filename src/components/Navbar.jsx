import React, { useState } from 'react';
import { View, Text, Image, Pressable } from './primitives/index.jsx';

/**
 * Komponen Navigasi Utama (Navbar)
 * Responsif penuh untuk semua perangkat (Mobile, Tablet, Desktop)
 * Memenuhi standar aksesibilitas WCAG (ARIA, keyboard nav, touch-target 44px+)
 */
export function Navbar({
  totalItems,
  headerConfig,
  activeLayout,
  onOpenHeaderModal,
  onOpenDataModal,
  onOpenSequenceModal,
  onOpenUploadModal,
  onResetData,
  onPrint
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileAction = (action) => {
    setIsMobileMenuOpen(false);
    action();
  };

  return (
    <header
      role="banner"
      className="no-print sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-xl transition-all"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* BRAND & STATUS */}
        <View className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <View className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center p-1.5 shadow-inner shrink-0">
            <Image
              src={headerConfig.logoUrl || "images.png"}
              alt="Logo Resmi Kemendikbudristek"
              className="w-full h-full object-contain"
            />
          </View>

          <View className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5 sm:gap-2 truncate">
              <span>CETAK LABEL BMN</span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                Standar A4 (2 Kolom)
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              <span className="font-mono text-blue-300 font-bold">{activeLayout} Label</span> / Lembar (2&times;{activeLayout / 2}) &bull; BPMP Jambi
            </p>
          </View>
        </View>

        {/* DESKTOP ACTION BUTTONS (Layar Besar >= 1024px) */}
        <nav
          role="navigation"
          aria-label="Navigasi Aksi Utama Desktop"
          className="hidden lg:flex items-center gap-2 flex-wrap"
        >
          <Pressable
            onPress={onOpenHeaderModal}
            aria-haspopup="dialog"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            <Text>Instansi &amp; Satker</Text>
          </Pressable>

          <Pressable
            onPress={onOpenDataModal}
            aria-haspopup="dialog"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 transition flex items-center gap-1.5 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            <Text>Kelola Data (<span className="font-mono font-bold">{totalItems}</span>)</Text>
          </Pressable>

          <Pressable
            onPress={onOpenSequenceModal}
            aria-haspopup="dialog"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>
            <Text>Auto Urut NUP</Text>
          </Pressable>

          <Pressable
            onPress={onOpenUploadModal}
            aria-haspopup="dialog"
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-emerald-500/20 focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            <Text>Upload File</Text>
          </Pressable>

          <Pressable
            onPress={onResetData}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Kembalikan dataset ke contoh awal"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <Text>Reset Contoh</Text>
          </Pressable>

          <Pressable
            onPress={onPrint}
            aria-haspopup="dialog"
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-blue-500/25 focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            <Text>Cetak Label A4</Text>
          </Pressable>
        </nav>

        {/* MOBILE CONTROLS (Layar < 1024px) */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Quick Print Button on Mobile */}
          <button
            type="button"
            onClick={onPrint}
            aria-label="Buka dialog cetak dokumen"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            <span>Cetak</span>
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Tutup menu aksi" : "Buka menu aksi"}
            aria-controls="mobile-action-menu"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isMobileMenuOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN DRAWER */}
      {isMobileMenuOpen && (
        <nav
          id="mobile-action-menu"
          role="navigation"
          aria-label="Menu Aksi Mobile"
          className="lg:hidden border-t border-slate-800 bg-slate-900/98 px-3 py-3 animate-fade-in shadow-2xl"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleMobileAction(onOpenDataModal)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 font-semibold text-xs active:bg-blue-600/30 text-left cursor-pointer min-h-[44px]"
            >
              <svg className="w-4 h-4 shrink-0 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
              <span className="truncate">Kelola Data ({totalItems})</span>
            </button>

            <button
              type="button"
              onClick={() => handleMobileAction(onOpenUploadModal)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs active:bg-emerald-600/30 text-left cursor-pointer min-h-[44px]"
            >
              <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              <span>Upload File</span>
            </button>

            <button
              type="button"
              onClick={() => handleMobileAction(onOpenHeaderModal)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-xs active:bg-slate-700 text-left cursor-pointer min-h-[44px]"
            >
              <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              <span>Kop Instansi</span>
            </button>

            <button
              type="button"
              onClick={() => handleMobileAction(onOpenSequenceModal)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-xs active:bg-slate-700 text-left cursor-pointer min-h-[44px]"
            >
              <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>
              <span>Auto Urut NUP</span>
            </button>

            <button
              type="button"
              onClick={() => handleMobileAction(onResetData)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 font-semibold text-xs active:bg-slate-700 text-left cursor-pointer min-h-[44px]"
            >
              <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              <span>Reset Contoh</span>
            </button>

            <button
              type="button"
              onClick={() => handleMobileAction(onPrint)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs active:bg-blue-700 text-left cursor-pointer min-h-[44px] shadow"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
              <span>Cetak Dokumen</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
