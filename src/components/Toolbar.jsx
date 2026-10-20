import React from 'react';
import { View, Text, Pressable } from './primitives/index.jsx';

/**
 * Komponen Sub-Toolbar (Toolbar)
 * Menyediakan kontrol cepat untuk filter ruangan, tata letak preset,
 * dimensi bebas mm, zoom level, dan garis batas label.
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
  return (
    <aside className="no-print sticky top-[57px] z-30 bg-slate-800/90 backdrop-blur border-b border-slate-700 text-slate-300 text-xs shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* INFO STATUS */}
        <View className="flex items-center gap-3 sm:gap-4 text-[11px] text-slate-400 flex-wrap">
          <span>Format: <strong className="text-slate-200 font-mono">A4 Portrait (210 &times; 297 mm)</strong></span>
          <span>Susunan: <strong className="text-slate-200">2 Kolom &times; {activeLayout / 2} Baris ({activeLayout} Label)</strong></span>
          <span>Total: <strong className="text-blue-400 font-semibold font-mono">{totalPages} Lembar A4</strong> (<span className="text-slate-200">{totalItems} Label</span>)</span>
        </View>

        {/* KONTROL PENGATURAN */}
        <View className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* FILTER RUANGAN */}
          <View className="flex items-center gap-1.5 text-[11px] bg-slate-900/70 px-2.5 py-1 rounded-lg border border-indigo-500/30">
            <label className="text-indigo-400 font-bold flex items-center gap-1">Ruangan:</label>
            <select
              value={activeRoomFilter}
              onChange={(e) => onRoomChange(e.target.value)}
              className="bg-slate-900 text-indigo-200 border border-slate-700 rounded px-2 py-0.5 text-xs font-semibold cursor-pointer max-w-[160px]"
            >
              <option value="ALL">Semua Ruangan ({totalItems})</option>
              {availableRooms.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} ({r.count})
                </option>
              ))}
            </select>

            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari..."
                className="bg-slate-950 text-indigo-200 placeholder-indigo-400/50 border border-slate-700 rounded px-2 py-0.5 text-[11px] w-20 focus:w-32 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-1 text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>
          </View>

          {/* FORMAT SUSUNAN 12 VS 14 */}
          <label className="flex items-center gap-1.5 text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-blue-500/40">
            <span className="text-blue-400 font-bold">Format:</span>
            <select
              value={activeLayout}
              onChange={(e) => onLayoutChange(e.target.value)}
              className="bg-slate-950 text-blue-200 border border-slate-700 rounded px-2 py-0.5 text-xs font-bold cursor-pointer"
            >
              <option value="12">2 Kolom &times; 6 Baris (12 Label)</option>
              <option value="14">2 Kolom &times; 7 Baris (14 Label)</option>
            </select>
          </label>

          {/* DIMENSI BEBAS P & T (MM) */}
          <View className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-700">
            <label className="flex items-center gap-1 text-[11px]" title="Panjang / Lebar Label mm">
              <span className="text-blue-400 font-bold">P:</span>
              <input
                type="number"
                min="0"
                max="1000"
                step="0.5"
                value={config.labelWidth}
                onChange={(e) => onConfigChange({ labelWidth: parseFloat(e.target.value) || 98 })}
                className="w-12 bg-slate-950 text-blue-200 border border-slate-700 rounded px-1 text-xs font-mono font-bold text-center"
              />
            </label>
            <span className="text-slate-500 font-bold">&times;</span>
            <label className="flex items-center gap-1 text-[11px]" title="Tinggi Label mm">
              <span className="text-blue-400 font-bold">T:</span>
              <input
                type="number"
                min="0"
                max="1000"
                step="0.5"
                value={config.labelHeight}
                onChange={(e) => onConfigChange({ labelHeight: parseFloat(e.target.value) || 44 })}
                className="w-12 bg-slate-950 text-blue-200 border border-slate-700 rounded px-1 text-xs font-mono font-bold text-center"
              />
              <span className="text-slate-400 text-[10px]">mm</span>
            </label>
          </View>


          {/* ZOOM SLIDER */}
          <View className="hidden sm:flex items-center gap-1.5 text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
            <span className="text-slate-400 font-bold">Zoom:</span>
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={config.zoomLevel}
              onChange={(e) => onConfigChange({ zoomLevel: parseInt(e.target.value, 10) || 100 })}
              className="w-16 h-1.5 bg-slate-700 rounded cursor-pointer accent-blue-500"
            />
            <span className="text-blue-400 font-mono text-[10px] w-7">{config.zoomLevel}%</span>
          </View>

          {/* TOMBOL BUKA MODAL SETTINGS */}
          <Pressable
            onPress={onOpenSettingsModal}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition flex items-center gap-1 cursor-pointer"
            title="Buka pengaturan parameter fisik milimeter"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <Text>Presisi MM</Text>
          </Pressable>
        </View>
      </div>
    </aside>
  );
}
