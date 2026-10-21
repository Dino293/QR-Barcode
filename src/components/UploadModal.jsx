import React, { useState, useRef } from 'react';
import { View, Text, Pressable } from './primitives/index.jsx';
import { parseExcelFile } from '../utils/excelParser.js';

/**
 * Komponen Modal Unggah Dataset (UploadModal)
 * Mendukung drag-and-drop file Excel BMN (.xlsx), muat database cloud Supabase, atau muat lokal
 */
export function UploadModal({ isOpen, onClose, onLoadDataset, onLoadFromCloud, cloudStatus }) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const { items } = await parseExcelFile(file);
      onLoadDataset(items);
      onClose();
    } catch (err) {
      setErrorMsg(`Gagal membaca berkas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadDefaultProjectData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/data/data.xlsx");
      if (!res.ok) {
        const res2 = await fetch("../data/data.xlsx");
        if (!res2.ok) throw new Error("Tidak dapat membaca data/data.xlsx via HTTP.");
        const blob = await res2.blob();
        const file = new File([blob], "data.xlsx");
        await handleFile(file);
        return;
      }
      const blob = await res.blob();
      const file = new File([blob], "data.xlsx");
      await handleFile(file);
    } catch (err) {
      setErrorMsg(`Muat lokal gagal: ${err.message}. Silakan gunakan tombol Cloud Supabase.`);
      setLoading(false);
    }
  };

  const handleCloudLoad = async () => {
    if (!onLoadFromCloud) return;
    setErrorMsg("");
    try {
      await onLoadFromCloud();
      onClose();
    } catch (err) {
      setErrorMsg(`Gagal memuat dari Cloud: ${err.message}`);
    }
  };

  // Aksesibilitas: Tutup modal dengan tombol Escape
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isBusy = loading || cloudStatus?.isLoading;

  return (
    <View
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
      }}
    >
      <View className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* HEADER */}
        <View className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <View className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            </div>
            <div>
              <h2 id="upload-modal-title" className="text-xs sm:text-sm font-bold text-white">Unggah / Muat Dataset BMN</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">Mendukung Cloud Supabase PostgreSQL &amp; Berkas Excel (.xlsx)</p>
            </div>
          </View>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Tutup modal unggah berkas"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
          >
            &times;
          </button>
        </View>

        {/* BODY */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* OPSI 1: CLOUD SUPABASE REKOMENDASI UTAMA */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-white text-xs">Cloud Database Supabase</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Resmi</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {cloudStatus?.totalCloudItems
                  ? `${cloudStatus.totalCloudItems.toLocaleString('id-ID')} data barang tersimpan di cloud`
                  : "Database terpusat aktif untuk seluruh operator"}
              </p>
            </div>

            <Pressable
              onPress={handleCloudLoad}
              disabled={isBusy}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-1.5 shrink-0"
            >
              {cloudStatus?.isLoading ? (
                <span>{cloudStatus.progressText || "Memuat..."}</span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  <span>Muat dari Cloud ({cloudStatus?.totalCloudItems || 14359})</span>
                </>
              )}
            </Pressable>
          </div>

          <div className="flex items-center gap-2 my-2 text-slate-500">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-[10px] uppercase font-bold tracking-wider">Atau Unggah Mandiri</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          {/* DROPZONE */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFile(e.target.files[0])}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            </div>
            <p className="font-bold text-white text-xs mb-1 text-center">
              {loading ? "Sedang Memproses Berkas..." : "Klik atau Seret Berkas Excel ke Sini"}
            </p>
            <p className="text-slate-400 text-[10px] text-center">
              Membaca otomatis kolom Satker, Kode, NUP, Nama, Merk, Ruangan, &amp; Barcode
            </p>
          </div>

          {/* OPSI MUAT DARI FILE DATA LOKAL */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Atau muat cadangan lokal:</span>
            <Pressable
              onPress={handleLoadDefaultProjectData}
              disabled={isBusy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-semibold text-xs cursor-pointer transition"
            >
              Muat data/data.xlsx
            </Pressable>
          </div>
        </div>
      </View>
    </View>
  );
}
