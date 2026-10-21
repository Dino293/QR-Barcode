import React, { useState, useEffect, useMemo } from 'react';
import { View, Text } from './components/primitives/index.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Toolbar } from './components/Toolbar.jsx';
import { A4Sheet } from './components/A4Sheet.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { HeaderModal } from './components/HeaderModal.jsx';
import { UploadModal } from './components/UploadModal.jsx';
import { DataModal } from './components/DataModal.jsx';
import { SequenceModal } from './components/SequenceModal.jsx';
import { PrintModal } from './components/PrintModal.jsx';
import { ScannerModal } from './components/ScannerModal.jsx';

import { usePrintConfig } from './hooks/usePrintConfig.js';
import { useLabelData } from './hooks/useLabelData.js';
import { usePwaInstall } from './hooks/usePwaInstall.js';

/**
 * Komponen Utama Aplikasi (App.jsx)
 * Mengatur orkestrasi seluruh komponen berarsitektur React Native & Tailwind CSS
 * Dioptimalkan dengan Workspace Pagination & Direct Print Range (Anti-Lag, Bebas Freeze)
 */
export function App() {
  const { config, activeLayout, updateConfig, changeLayout, resetConfig } = usePrintConfig();
  const { installApp, isStandalone } = usePwaInstall();
  const {
    items,
    headerConfig,
    activeRoomFilter,
    setActiveRoomFilter,
    searchQuery,
    setSearchQuery,
    availableRooms,
    filteredItems,
    sheets,
    cloudStatus,
    loadFromSupabase,
    addItem,
    updateItem,
    deleteItem,
    loadDataset,
    resetToDummy,
    updateHeaderConfig
  } = useLabelData(config.rowsPerPage);

  // Status Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [isSequenceOpen, setIsSequenceOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Workspace Pagination (Untuk performa ultra-lancar saat dataset memiliki ribuan baris)
  const [workspacePage, setWorkspacePage] = useState(1);
  const [sheetsPerView, setSheetsPerView] = useState(12);

  // Print Range State (Saat sesi dialog print Chrome aktif)
  const [printScope, setPrintScope] = useState(null); // null atau { from: number, to: number, isPrinting: boolean }

  // Keyboard shortcut Ctrl+P
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPrintOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset pagination saat filter ruangan atau pencarian berubah
  useEffect(() => {
    setWorkspacePage(1);
  }, [activeRoomFilter, searchQuery, activeLayout]);

  const totalWorkspacePages = useMemo(() => {
    if (sheetsPerView === "ALL") return 1;
    return Math.ceil(sheets.length / sheetsPerView) || 1;
  }, [sheets.length, sheetsPerView]);

  // Lembar yang aktif dirender ke layar atau ke printer
  const displaySheets = useMemo(() => {
    // Jika sedang dalam proses print
    if (printScope && printScope.isPrinting) {
      return sheets; // seluruh sheet di-render, yang di luar rentang diberi isPrintHidden
    }

    // Jika mode tampilan layar normal
    if (sheetsPerView === "ALL" || sheets.length <= 12) {
      return sheets;
    }

    const startIdx = (workspacePage - 1) * sheetsPerView;
    return sheets.slice(startIdx, startIdx + sheetsPerView);
  }, [sheets, sheetsPerView, workspacePage, printScope]);

  // Responsif: Atur zoom otomatis saat pertama kali dibuka di layar mobile (< 820px)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 820) {
      const calculatedZoom = Math.min(100, Math.max(30, Math.floor(((window.innerWidth - 28) / 794) * 100)));
      updateConfig({ zoomLevel: calculatedZoom });
    }
  }, []);

  // Eksekusi Cetak Cepat
  const handleExecutePrint = (fromSheet, toSheet) => {
    setPrintScope({ from: fromSheet, to: toSheet, isPrinting: true });

    // Beri jeda 150ms agar DOM reflow selesai sebelum dialog print Chromium terbuka
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error("Gagal membuka dialog cetak:", err);
      } finally {
        setTimeout(() => {
          setPrintScope(null);
        }, 500);
      }
    }, 150);
  };

  const handleAddBatch = (newItems) => {
    loadDataset([...newItems, ...items]);
  };

  return (
    <View className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* HEADER NAVBAR */}
      <Navbar
        totalItems={items.length}
        headerConfig={headerConfig}
        activeLayout={activeLayout}
        cloudStatus={cloudStatus}
        onLoadFromCloud={loadFromSupabase}
        onOpenHeaderModal={() => setIsHeaderOpen(true)}
        onOpenDataModal={() => setIsDataOpen(true)}
        onOpenSequenceModal={() => setIsSequenceOpen(true)}
        onOpenUploadModal={() => setIsUploadOpen(true)}
        onOpenScannerModal={() => setIsScannerOpen(true)}
        onResetData={resetToDummy}
        onPrint={() => setIsPrintOpen(true)}
        onInstallApp={installApp}
        isStandalone={isStandalone}
      />

      {/* SUB-TOOLBAR */}
      <Toolbar
        totalPages={sheets.length}
        totalItems={filteredItems.length}
        activeLayout={activeLayout}
        config={config}
        availableRooms={availableRooms}
        activeRoomFilter={activeRoomFilter}
        searchQuery={searchQuery}
        onRoomChange={setActiveRoomFilter}
        onSearchChange={setSearchQuery}
        onLayoutChange={changeLayout}
        onConfigChange={updateConfig}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
      />

      {/* WORKSPACE LEMBAR A4 */}
      <main role="main" className="flex-1 py-4 sm:py-6 px-2 sm:px-4 overflow-auto flex flex-col items-center w-full">
        {/* NAVIGATOR LEMBAR KERJA DI LAYAR (Mencegah Lag / Browser Freeze) */}
        {sheets.length > 12 && !printScope && (
          <div className="no-print mb-4 sm:mb-6 bg-slate-800/90 border border-slate-700/80 px-3 sm:px-4 py-2 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs shadow-lg max-w-3xl w-full">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-slate-400 font-semibold">Tampilkan di Layar:</span>
              <select
                aria-label="Pilih jumlah lembar yang dimuat di layar"
                value={sheetsPerView}
                onChange={(e) => {
                  const val = e.target.value === "ALL" ? "ALL" : parseInt(e.target.value, 10);
                  setSheetsPerView(val);
                  setWorkspacePage(1);
                }}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-semibold cursor-pointer text-xs focus-visible:ring-1 focus-visible:ring-blue-400"
              >
                <option value={8}>8 Lembar / Halaman Layar</option>
                <option value={12}>12 Lembar / Halaman Layar</option>
                <option value={24}>24 Lembar / Halaman Layar</option>
                <option value="ALL">Tampilkan Seluruh Lembar ({sheets.length})</option>
              </select>
            </div>

            {sheetsPerView !== "ALL" && (
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <button
                  type="button"
                  aria-label="Halaman lembar sebelumnya"
                  disabled={workspacePage <= 1}
                  onClick={() => setWorkspacePage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded text-slate-200 cursor-pointer font-bold focus-visible:ring-1 focus-visible:ring-blue-400"
                >
                  &larr; Prev
                </button>
                <span className="text-slate-300 font-mono font-bold text-center">
                  {workspacePage} / {totalWorkspacePages}
                </span>
                <button
                  type="button"
                  aria-label="Halaman lembar berikutnya"
                  disabled={workspacePage >= totalWorkspacePages}
                  onClick={() => setWorkspacePage((p) => Math.min(totalWorkspacePages, p + 1))}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded text-slate-200 cursor-pointer font-bold focus-visible:ring-1 focus-visible:ring-blue-400"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        <View
          className="workspace-wrapper flex flex-col items-center transition-transform origin-top"
          style={{
            transform: `scale(${config.zoomLevel / 100})`,
            transformOrigin: "top center"
          }}
        >
          {sheets.length === 0 ? (
            <View className="p-12 text-center bg-slate-800/60 rounded-3xl border border-slate-700 max-w-md my-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/50 flex items-center justify-center text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="font-bold text-white text-base mb-1">Tidak Ada Data Ditemukan</h3>
              <p className="text-xs text-slate-400 mb-5">
                Tidak ada barang yang cocok dengan kata kunci atau filter ruangan aktif saat ini.
              </p>
              <button
                type="button"
                onClick={() => { setActiveRoomFilter("ALL"); setSearchQuery(""); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
              >
                Reset Filter
              </button>
            </View>
          ) : (
            displaySheets.map((sheet, sIdx) => {
              const isPrintHidden = printScope?.isPrinting && (
                sheet.pageNumber < printScope.from || sheet.pageNumber > printScope.to
              );

              return (
                <A4Sheet
                  key={`${sheet.roomName}-${sheet.pageNumber}-${sIdx}`}
                  sheet={sheet}
                  headerConfig={headerConfig}
                  isPrintHidden={isPrintHidden}
                  onUpdateItem={updateItem}
                />
              );
            })
          )}
        </View>
      </main>

      {/* MODALS */}
      <PrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        totalSheets={sheets.length}
        totalItems={filteredItems.length}
        activeRoom={activeRoomFilter === "ALL" ? "Semua Ruangan" : activeRoomFilter}
        onConfirmPrint={handleExecutePrint}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onConfigChange={updateConfig}
        onResetConfig={resetConfig}
      />

      <HeaderModal
        isOpen={isHeaderOpen}
        onClose={() => setIsHeaderOpen(false)}
        headerConfig={headerConfig}
        onSaveHeaderConfig={updateHeaderConfig}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onLoadDataset={loadDataset}
        onLoadFromCloud={loadFromSupabase}
        cloudStatus={cloudStatus}
      />

      <DataModal
        isOpen={isDataOpen}
        onClose={() => setIsDataOpen(false)}
        items={items}
        onAddItem={addItem}
        onDeleteItem={deleteItem}
        defaultSatker={headerConfig.satkerCode}
      />

      <SequenceModal
        isOpen={isSequenceOpen}
        onClose={() => setIsSequenceOpen(false)}
        onAddBatchItems={handleAddBatch}
        defaultSatker={headerConfig.satkerCode}
      />

      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        items={items}
        onSelectItem={(item) => {
          if (item?.fromPayload) {
            const exists = items.some(
              (it) =>
                String(it.kode_barang) === String(item.kode_barang) &&
                String(it.nup) === String(item.nup)
            );
            if (!exists) {
              addItem(item);
            }
          }
          setActiveRoomFilter("ALL");
          setSearchQuery(item.kode_barang || item.nama_barang || "");
        }}
      />
    </View>
  );
}

export default App;
