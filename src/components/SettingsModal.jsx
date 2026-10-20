import React from 'react';
import { View, Text, Pressable } from './primitives/index.jsx';

/**
 * Komponen Modal Pengaturan Presisi Kertas & Label (SettingsModal)
 * Menyediakan konfigurasi parameter fisik milimeter dan tipografi
 */
export function SettingsModal({ isOpen, onClose, config, onConfigChange, onResetConfig }) {
  if (!isOpen) return null;

  const handleChange = (key, val) => {
    const num = parseFloat(val);
    onConfigChange({ [key]: isNaN(num) ? val : num });
  };

  return (
    <View className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <View className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <View className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <View className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Pengaturan Presisi Fisik A4 & Label</h2>
              <p className="text-[11px] text-slate-400">Parameter dalam milimeter (mm) dan poin tipografi (pt)</p>
            </div>
          </View>
          <Pressable
            onPress={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg font-bold"
          >
            &times;
          </Pressable>
        </View>

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* MARGIN KERTAS A4 */}
          <div>
            <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-1.5">
              <span>Margin Lembar A4 (mm)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Atas:</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.marginTop}
                  onChange={(e) => handleChange("marginTop", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Bawah:</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.marginBottom}
                  onChange={(e) => handleChange("marginBottom", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Kiri:</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.marginLeft}
                  onChange={(e) => handleChange("marginLeft", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Kanan:</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.marginRight}
                  onChange={(e) => handleChange("marginRight", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* JARAK & DIMENSI LABEL */}
          <div>
            <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-1.5">
              <span>Dimensi & Jarak Label (mm)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Lebar Label:</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.labelWidth}
                  onChange={(e) => handleChange("labelWidth", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tinggi Label:</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.labelHeight}
                  onChange={(e) => handleChange("labelHeight", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Jarak Kolom:</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.colGap}
                  onChange={(e) => handleChange("colGap", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Jarak Baris:</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.rowGap}
                  onChange={(e) => handleChange("rowGap", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* UKURAN GAMBAR & QR */}
          <div>
            <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-1.5">
              <span>Ukuran Gambar & QR (mm)</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Ukuran QR Code:</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.qrSize}
                  onChange={(e) => handleChange("qrSize", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Ukuran Logo Kemendikbud:</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.logoSize}
                  onChange={(e) => handleChange("logoSize", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* TIPOGRAFI */}
          <div>
            <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-1.5">
              <span>Ukuran Font Tipografi (pt)</span>
            </h3>
            <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Instansi:</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.fontSizeInstansi}
                  onChange={(e) => handleChange("fontSizeInstansi", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Satker:</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.fontSizeSatker}
                  onChange={(e) => handleChange("fontSizeSatker", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Body Text:</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.fontSizeBody}
                  onChange={(e) => handleChange("fontSizeBody", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <View className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <Pressable
            onPress={onResetConfig}
            className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
          >
            Reset Standar
          </Pressable>
          <Pressable
            onPress={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
          >
            Simpan &amp; Terapkan
          </Pressable>
        </View>
      </View>
    </View>
  );
}
