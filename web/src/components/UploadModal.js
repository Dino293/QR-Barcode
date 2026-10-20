/**
 * Komponen Modal Unggah Dataset (UploadModal)
 * Mendukung drag-and-drop file Excel BMN (.xlsx) atau muat otomatis database lokal
 */
import { html } from '../utils/htm.js';
import { View, Text, Pressable } from './primitives/index.js';
import { parseExcelFile } from '../utils/excelParser.js';

const { useState, useRef } = window.React;

export function UploadModal({ isOpen, onClose, onLoadDataset }) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const { items, sheetName, totalRaw } = await parseExcelFile(file);
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

  // Muat langsung dari file data.xlsx lokal di project
  const handleLoadDefaultProjectData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("../data/data.xlsx");
      if (!res.ok) throw new Error("Tidak dapat membaca data/data.xlsx via HTTP.");
      const blob = await res.blob();
      const file = new File([blob], "data.xlsx");
      await handleFile(file);
    } catch (err) {
      setErrorMsg(`Muat lokal gagal: ${err.message}. Silakan unggah berkas secara manual.`);
      setLoading(false);
    }
  };

  return html`
    <${View} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <${View} className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <!-- HEADER -->
        <${View} className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <${View} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Unggah Dataset BMN</h2>
              <p className="text-[11px] text-slate-400">Mendukung berkas Excel (.xlsx / .xls)</p>
            </div>
          <//>
          <${Pressable}
            onPress=${onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg font-bold"
          >
            &times;
          <//>
        <//>

        <!-- BODY -->
        <div className="p-5 space-y-4 text-xs text-slate-300">
          ${errorMsg && html`
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              ${errorMsg}
            </div>
          `}

          <!-- DROPZONE -->
          <div
            onDragOver=${(e) => e.preventDefault()}
            onDrop=${handleDrop}
            onClick=${() => fileInputRef.current && fileInputRef.current.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition"
          >
            <input
              type="file"
              ref=${fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange=${(e) => handleFile(e.target.files[0])}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            </div>
            <p className="font-bold text-white text-sm mb-1 text-center">
              ${loading ? "Sedang Memproses Berkas..." : "Klik atau Seret Berkas Excel ke Sini"}
            </p>
            <p className="text-slate-400 text-[11px] text-center">
              Membaca otomatis kolom B (Satker), D (Kode), E (NUP), F (Nama), I (Merk), U & V (Ruangan), AB (QR)
            </p>
          </div>

          <!-- OPSI MUAT CEPAT DARI FOLDER DATA -->
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Atau muat database proyek aktif:</span>
            <${Pressable}
              onPress=${handleLoadDefaultProjectData}
              disabled=${loading}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 rounded-xl font-semibold text-xs cursor-pointer transition"
            >
              Muat data/data.xlsx
            <//>
          </div>
        </div>
      <//>
    <//>
  `;
}
