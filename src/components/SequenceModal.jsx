import React, { useState } from 'react';
import { View, Text, Pressable } from './primitives/index.jsx';

/**
 * Komponen Modal Auto-Urut NUP (SequenceModal)
 * Membantu pembuatan batch item dengan NUP berurutan otomatis
 */
export function SequenceModal({ isOpen, onClose, onAddBatchItems, defaultSatker }) {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    nama_barang: "Kursi Kerja Pejabat",
    kode_barang: "3050102001",
    merk_tipe: "CHITOSE INDAH",
    ruangan: "[02] Ruang Kepala",
    tahun: "2024",
    start_nup: 1,
    count: 10,
    digit_format: "none"
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!form.nama_barang || !form.kode_barang) {
      alert("Harap lengkapi Nama Barang dan Kode Barang!");
      return;
    }

    const newBatch = [];
    for (let i = 0; i < form.count; i++) {
      const num = form.start_nup + i;
      let nupStr = String(num);
      if (form.digit_format === "2") nupStr = String(num).padStart(2, "0");
      if (form.digit_format === "3") nupStr = String(num).padStart(3, "0");

      newBatch.push({
        kode_satker: defaultSatker || "138041000693242000KD",
        tahun: form.tahun,
        kode_barang: form.kode_barang,
        nama_barang: form.nama_barang,
        merk_tipe: form.merk_tipe,
        ruangan: form.ruangan,
        nup: nupStr,
        custom_barcode: ""
      });
    }

    onAddBatchItems(newBatch);
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
      aria-labelledby="sequence-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <View className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* HEADER */}
        <View className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <View className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/20 text-teal-400 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>
            </div>
            <div>
              <h2 id="sequence-modal-title" className="text-xs sm:text-sm font-bold text-white">Auto Urut Nomor NUP (Batch)</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">Generate serial barang dengan NUP berurutan otomatis</p>
            </div>
          </View>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal auto urut NUP"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            &times;
          </button>
        </View>

        {/* FORM BODY */}
        <form onSubmit={handleGenerate} className="p-5 space-y-3.5 text-xs text-slate-300">
          <div>
            <label className="block text-[11px] text-slate-400 font-bold mb-1">Nama Barang:</label>
            <input
              type="text"
              value={form.nama_barang}
              onChange={(e) => setForm({ ...form, nama_barang: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">Kode Barang:</label>
              <input
                type="text"
                value={form.kode_barang}
                onChange={(e) => setForm({ ...form, kode_barang: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">Merk / Tipe:</label>
              <input
                type="text"
                value={form.merk_tipe}
                onChange={(e) => setForm({ ...form, merk_tipe: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">Ruangan:</label>
              <input
                type="text"
                value={form.ruangan}
                onChange={(e) => setForm({ ...form, ruangan: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">Tahun Perolehan:</label>
              <input
                type="text"
                value={form.tahun}
                onChange={(e) => setForm({ ...form, tahun: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">Mulai NUP:</label>
              <input
                type="number"
                min="1"
                value={form.start_nup}
                onChange={(e) => setForm({ ...form, start_nup: parseInt(e.target.value, 10) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">Jumlah Unit:</label>
              <input
                type="number"
                min="1"
                max="500"
                value={form.count}
                onChange={(e) => setForm({ ...form, count: parseInt(e.target.value, 10) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">Format Digit:</label>
              <select
                value={form.digit_format}
                onChange={(e) => setForm({ ...form, digit_format: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs cursor-pointer"
              >
                <option value="none">Normal (1, 2, ...)</option>
                <option value="2">2 Digit (01, 02, ...)</option>
                <option value="3">3 Digit (001, 002, ...)</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-teal-400 bg-teal-500/10 p-2.5 rounded-lg border border-teal-500/20">
            Akan dibuat <strong>{form.count} label</strong> dengan rentang NUP <strong>{form.start_nup}</strong> s/d <strong>{form.start_nup + form.count - 1}</strong>.
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
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
            >
              Tambahkan ke Dataset
            </button>
          </View>
        </form>
      </View>
    </View>
  );
}
