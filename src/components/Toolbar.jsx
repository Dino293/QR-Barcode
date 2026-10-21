import React from 'react';
import { View, Text, Pressable } from './primitives/index.jsx';
import { LocationCombobox } from './LocationCombobox.jsx';

/**
 * Komponen Sub-Toolbar (Toolbar)
 * Responsif dan Adaptif di Semua Ukuran Layar
 * Kontrol filter ruangan autocomplete, pencarian barang, preset format, dimensi P&T mm, dan tombol pintar "Fit Layar"
 */
export function Toolbar({
  totalPages,
  totalItems,
  activeLayout,
  config,
  availableRooms,
  activeRoomFilter,
  searchQuery,
  onRoomChange,
  onSearchChange,
  onLayoutChange,
  onConfigChange,
  onOpenSettingsModal
}) {
  const handleFitToScreen = () => {
    // Kertas A4 fisik memiliki lebar 210mm (~794px).
    // Hitung persentase zoom agar pas dengan lebar viewport perangkat pengguna
    const availableWidth = window.innerWidth - 32;
    const calculatedZoom = Math.min(100, Math.max(30, Math.floor((availableWidth / 794) * 100)));
    onConfigChange({ zoomLevel: calculatedZoom });
  };

  return (
    <aside
      role="region"
      aria-label="Bilah Alat Kontrol dan Filter"
      className="no-print sticky top-[53px] sm:top-[57px] z-30 bg-slate-800/95 backdrop-blur border-b border-slate-700 text-slate-300 text-xs shadow-md transition-all"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
        {/* INFO STATUS */}
        <View className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-300 flex-wrap">
          <span className="bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/60">
            Format: <strong className="text-white font-mono">A4 (210&times;297mm)</strong>
          </span>
          <span className="bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/60">
            Susunan: <strong className="text-white">2&times;{activeLayout / 2} ({activeLayout} Label)</strong>
          </span>
          <span className="bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30 text-blue-300">
            Total: <strong className="text-white font-mono">{totalPages} Lembar</strong> (<span className="text-blue-200 font-bold">{totalItems} Label</span>)
          </span>
        </View>

        {/* KONTROL PENGATURAN */}
        <View className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-start md:justify-end">
          {/* FITUR AUTOCOMPLETE LOKASI / RUANGAN DENGAN DROPDOWN PANAH KEBAWAH */}
          <LocationCombobox
            availableRooms={availableRooms}
            activeRoomFilter={activeRoomFilter}
            onSelectRoom={onRoomChange}
            totalItems={totalItems}
          />

          {/* PENCARIAN BARANG / KODE / NUP */}
          <div className="relative flex items-center bg-slate-900/90 border border-slate-700 rounded-xl px-2 py-1">
            <svg className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              aria-label="Cari barang atau kode barang"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari Barang / Kode..."
              className="bg-transparent text-slate-100 placeholder:text-slate-400 text-xs w-24 sm:w-28 md:w-36 focus:w-44 transition-all focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Hapus kata kunci pencarian"
                onClick={() => onSearchChange("")}
                className="text-slate-400 hover:text-white font-bold text-xs cursor-pointer p-0.5"
              >
                &times;
              </button>
            )}
          </div>

          {/* FORMAT SUSUNAN 12 VS 14 */}
          <div className="flex items-center gap-1 text-[11px] bg-slate-900/90 px-2 py-1 rounded-lg border border-blue-500/30">
            <label htmlFor="layout-select" className="text-blue-400 font-bold shrink-0">
              Format:
            </label>
            <select
              id="layout-select"
              aria-label="Pilih format jumlah label per lembar"
              value={activeLayout}
              onChange={(e) => onLayoutChange(e.target.value)}
              className="bg-slate-950 text-blue-200 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-bold cursor-pointer focus-visible:ring-1 focus-visible:ring-blue-400"
            >
              <option value="12">12 Label (6 Baris)</option>
              <option value="14">14 Label (7 Baris)</option>
            </select>
          </div>

          {/* DIMENSI BEBAS P & T (MM) */}
          <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-700">
            <label className="flex items-center gap-1 text-[11px]" title="Panjang / Lebar Label mm">
              <span className="text-blue-400 font-bold">P:</span>
              <input
                type="number"
                aria-label="Lebar label dalam milimeter"
                min="10"
                max="500"
                step="0.5"
                value={config.labelWidth}
                onChange={(e) => onConfigChange({ labelWidth: parseFloat(e.target.value) || 98 })}
                className="w-11 bg-slate-950 text-blue-200 border border-slate-700 rounded px-1 text-xs font-mono font-bold text-center"
              />
            </label>
            <span className="text-slate-500 font-bold">&times;</span>
            <label className="flex items-center gap-1 text-[11px]" title="Tinggi Label mm">
              <span className="text-blue-400 font-bold">T:</span>
              <input
                type="number"
                aria-label="Tinggi label dalam milimeter"
                min="10"
                max="500"
                step="0.5"
                value={config.labelHeight}
                onChange={(e) => onConfigChange({ labelHeight: parseFloat(e.target.value) || 44 })}
                className="w-11 bg-slate-950 text-blue-200 border border-slate-700 rounded px-1 text-xs font-mono font-bold text-center"
              />
              <span className="text-slate-400 text-[10px]">mm</span>
            </label>
          </div>

          {/* ZOOM CONTROL & FIT LAYAR PINTAR */}
          <div className="flex items-center gap-1.5 text-[11px] bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={handleFitToScreen}
              aria-label="Sesuaikan tampilan pas dengan lebar layar perangkat"
              className="px-1.5 py-0.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-bold text-[10px] rounded border border-blue-500/40 cursor-pointer transition active:scale-95 flex items-center gap-1"
              title="Pas-kan ukuran lembar ke lebar layar device Anda"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
              <span>Fit</span>
            </button>

            <input
              type="range"
              aria-label="Tingkat zoom lembar kerja"
              min="30"
              max="150"
              step="5"
              value={config.zoomLevel}
              onChange={(e) => onConfigChange({ zoomLevel: parseInt(e.target.value, 10) || 100 })}
              className="w-14 sm:w-16 h-1.5 bg-slate-700 rounded cursor-pointer accent-blue-500"
            />
            <span className="text-blue-400 font-mono text-[10px] w-7 text-right">{config.zoomLevel}%</span>
          </div>

          {/* TOMBOL PENGATURAN PRESISI MM */}
          <button
            type="button"
            onClick={onOpenSettingsModal}
            aria-haspopup="dialog"
            aria-label="Buka dialog pengaturan presisi milimeter"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
            title="Buka pengaturan parameter fisik milimeter"
          >
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span className="hidden sm:inline">Presisi MM</span>
          </button>
        </View>
      </div>
    </aside>
  );
}
