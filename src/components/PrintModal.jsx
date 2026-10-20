import React, { useState } from 'react';
import { View, Text, Pressable } from './primitives/index.jsx';

/**
 * Komponen Modal Cetak Presisi (PrintModal)
 * Memungkinkan pemilihan rentang lembar cetak agar proses print preview browser instan
 * tanpa freeze / loading lama pada dataset besar.
 */
export function PrintModal({ isOpen, onClose, totalSheets, totalItems, activeRoom, onConfirmPrint }) {
  if (!isOpen) return null;

  const [scope, setScope] = useState("all"); // "all" | "range"
  const [startSheet, setStartSheet] = useState(1);
  const [endSheet, setEndSheet] = useState(() => Math.min(5, totalSheets || 1));

  const handlePrint = () => {
    let from = 1;
    let to = totalSheets;

    if (scope === "range") {
      from = Math.max(1, parseInt(startSheet, 10) || 1);
      to = Math.min(totalSheets, parseInt(endSheet, 10) || totalSheets);
      if (from > to) {
        const tmp = from;
        from = to;
        to = tmp;
      }
    }

    onConfirmPrint(from, to);
    onClose();
  };

  return (
    <View className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in no-print">
      <View className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <View className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <View className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Cetak Dokumen Label BMN</h2>
              <p className="text-[11px] text-slate-400">Pengaturan lembar cetak presisi A4</p>
            </div>
          </View>
          <Pressable
            onPress={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg font-bold"
          >
            &times;
          </Pressable>
        </View>

        {/* BODY */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          {/* INFO RUANGAN & LEMBAR */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ruangan Terpilih</span>
              <span className="text-white font-bold text-xs truncate max-w-[200px] block">{activeRoom}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Lembar</span>
              <span className="text-blue-400 font-mono font-bold text-sm">{totalSheets} Lembar ({totalItems} Label)</span>
            </div>
          </div>

          {/* OPSI SCOPE CETAK */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-2">Pilihan Lembar yang Dicetak:</label>
            <div className="space-y-2">
              {/* OPSI 1: SELURUH LEMBAR */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  scope === "all"
                    ? "bg-blue-600/10 border-blue-500/50 text-white"
                    : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-950/70"
                }`}
              >
                <input
                  type="radio"
                  name="printScope"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                  className="mt-0.5 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-xs block text-slate-200">Cetak Seluruh Lembar ({totalSheets} Lembar)</span>
                  <span className="text-[11px] text-slate-400 block">Mencetak seluruh label yang sedang aktif pada filter saat ini.</span>
                </div>
              </label>

              {/* OPSI 2: RENTANG LEMBAR (OPTIMASI ANTI-LAG) */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  scope === "range"
                    ? "bg-blue-600/10 border-blue-500/50 text-white"
                    : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-950/70"
                }`}
              >
                <input
                  type="radio"
                  name="printScope"
                  checked={scope === "range"}
                  onChange={() => setScope("range")}
                  className="mt-0.5 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="font-bold text-xs block text-emerald-400">
                    Cetak Rentang Lembar Tertentu (Sangat Cepat &amp; Bebas Loading)
                  </span>
                  <span className="text-[11px] text-slate-400 block mb-2">
                    Membatasi lembar cetak agar print preview Chrome terbuka instan dalam hitungan detik.
                  </span>

                  {scope === "range" && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-300 font-semibold">Dari Lembar:</span>
                      <input
                        type="number"
                        min="1"
                        max={totalSheets}
                        value={startSheet}
                        onChange={(e) => setStartSheet(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-white text-xs"
                      />
                      <span className="text-[11px] text-slate-300 font-semibold">s/d Lembar:</span>
                      <input
                        type="number"
                        min="1"
                        max={totalSheets}
                        value={endSheet}
                        onChange={(e) => setEndSheet(Math.min(totalSheets, parseInt(e.target.value, 10) || totalSheets))}
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-white text-xs"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] text-blue-300 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Memilih rentang lembar mencegah browser mengalami freeze saat memuat ribuan label sekaligus.</span>
          </div>
        </div>

        {/* FOOTER */}
        <View className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2.5">
          <Pressable
            onPress={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white font-semibold cursor-pointer"
          >
            Batal
          </Pressable>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Buka Print Preview
          </button>
        </View>
      </View>
    </View>
  );
}
