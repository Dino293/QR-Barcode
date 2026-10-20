/**
 * Komponen Navigasi Utama (Navbar)
 * Menampilkan identitas sistem, status data, dan tombol aksi utama
 */
import { html } from '../utils/htm.js';
import { View, Text, Image, Pressable } from './primitives/index.js';

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
  return html`
    <header className="no-print sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <!-- BRAND & STATUS -->
        <${View} className="flex items-center gap-3">
          <${View} className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center p-1.5 shadow-inner">
            <${Image}
              src=${headerConfig.logoUrl || "images.png"}
              alt="Logo Kemendikbud"
              className="w-full h-full object-contain"
            />
          <//>

          <${View}>
            <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              CETAK LABEL BMN
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                Standar A4 (2 Kolom)
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              <span className="font-mono text-blue-300 font-bold">${activeLayout} Label</span> / Lembar (2 Kolom &times; ${activeLayout / 2} Baris) &bull; BPMP Provinsi Jambi
            </p>
          <//>
        <//>

        <!-- ACTION BUTTONS -->
        <${View} className="flex items-center gap-2 flex-wrap">
          <${Pressable}
            onPress=${onOpenHeaderModal}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            <${Text}>Instansi & Satker<//>
          <//>

          <${Pressable}
            onPress=${onOpenDataModal}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 transition flex items-center gap-1.5 cursor-pointer shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            <${Text}>Kelola Data (<span className="font-mono font-bold">${totalItems}</span>)<//>
          <//>

          <${Pressable}
            onPress=${onOpenSequenceModal}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>
            <${Text}>Auto Urut NUP<//>
          <//>

          <${Pressable}
            onPress=${onOpenUploadModal}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-emerald-500/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            <${Text}>Upload File<//>
          <//>

          <${Pressable}
            onPress=${onResetData}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Kembalikan dataset ke contoh awal"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <${Text}>Reset Contoh<//>
          <//>

          <${Pressable}
            onPress=${onPrint}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-blue-500/25"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            <${Text}>Cetak Dokumen (Ctrl+P)<//>
          <//>
        <//>
      </div>
    </header>
  `;
}
