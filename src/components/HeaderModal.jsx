import React, { useState } from 'react';
import { View, Text, Pressable } from './primitives/index.jsx';

/**
 * Komponen Modal Konfigurasi Instansi & Satker (HeaderModal)
 * Mengatur teks kop instansi dan kode satker pada setiap label
 */
export function HeaderModal({ isOpen, onClose, headerConfig, onSaveHeaderConfig }) {
  if (!isOpen) return null;

  const [form, setForm] = useState({ ...headerConfig });

  const handleSave = (e) => {
    e.preventDefault();
    onSaveHeaderConfig(form);
    onClose();
  };

  // Aksesibilitas: Tutup modal dengan tombol Escape
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <View
      role="dialog"
      aria-modal="true"
      aria-labelledby="header-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <View className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* HEADER */}
        <View className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <View className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            <div>
              <h2 id="header-modal-title" className="text-xs sm:text-sm font-bold text-white">Konfigurasi Instansi &amp; Satker</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">Pengaturan kop teks pada header label</p>
            </div>
          </View>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal konfigurasi kop"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            &times;
          </button>
        </View>

        {/* FORM BODY */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs text-slate-300">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Nama Instansi Baris 1:</label>
            <input
              type="text"
              value={form.instansiLine1}
              onChange={(e) => setForm({ ...form, instansiLine1: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Nama Instansi Baris 2:</label>
            <input
              type="text"
              value={form.instansiLine2}
              onChange={(e) => setForm({ ...form, instansiLine2: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Kode Satker Default:</label>
            <input
              type="text"
              value={form.satkerCode}
              onChange={(e) => setForm({ ...form, satkerCode: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">URL / Path Logo:</label>
            <input
              type="text"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
            />
          </div>

          <View className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <Pressable
              onPress={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-semibold cursor-pointer"
            >
              Batal
            </Pressable>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
            >
              Simpan Perubahan
            </button>
          </View>
        </form>
      </View>
    </View>
  );
}
