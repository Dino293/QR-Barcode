import React, { useState, useMemo } from 'react';
import { View, Text, Pressable } from './primitives/index.jsx';

/**
 * Komponen Modal Kelola Dataset (DataModal)
 * Mendukung pencarian, pratinjau tabel, hapus item, serta INPUT DATA BARANG BARU untuk dijadikan QR Barcode
 */
export function DataModal({ isOpen, onClose, items, onAddItem, onDeleteItem, defaultSatker = "138041000693242000KD" }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState("table"); // "table" | "input"
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Form State untuk Input Data Baru
  const [form, setForm] = useState({
    nama_barang: "",
    kode_barang: "",
    nup: "1",
    merk_tipe: "",
    ruangan: "",
    tahun: new Date().getFullYear().toString(),
    custom_barcode: ""
  });
  const [successMsg, setSuccessMsg] = useState("");

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(
      (it) =>
        String(it.nama_barang || "").toLowerCase().includes(q) ||
        String(it.kode_barang || "").toLowerCase().includes(q) ||
        String(it.nup || "").toLowerCase().includes(q) ||
        String(it.ruangan || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!form.nama_barang.trim() || !form.kode_barang.trim()) {
      alert("Harap lengkapi Nama Barang dan Kode Barang!");
      return;
    }

    const newItem = {
      kode_satker: defaultSatker,
      tahun: form.tahun.trim(),
      kode_barang: form.kode_barang.trim(),
      nup: form.nup.trim() || "1",
      nama_barang: form.nama_barang.trim(),
      merk_tipe: form.merk_tipe.trim() || "-",
      ruangan: form.ruangan.trim() || "Tanpa Ruangan",
      custom_barcode: form.custom_barcode.trim()
    };

    if (onAddItem) {
      onAddItem(newItem);
    }

    setSuccessMsg(`Barang "${newItem.nama_barang}" berhasil ditambahkan dan QR Barcode telah digenerate!`);
    setForm({
      nama_barang: "",
      kode_barang: "",
      nup: String(parseInt(newItem.nup, 10) + 1 || 1),
      merk_tipe: "",
      ruangan: newItem.ruangan,
      tahun: newItem.tahun,
      custom_barcode: ""
    });

    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
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
      aria-labelledby="data-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <View className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* HEADER */}
        <View className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 flex-wrap gap-2">
          <View className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            </div>
            <div>
              <h2 id="data-modal-title" className="text-xs sm:text-sm font-bold text-white">Kelola &amp; Input Data BMN ({items.length} Barang)</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">Pratinjau data, pencarian, dan input data barang baru untuk dibuatkan QR Barcode</p>
            </div>
          </View>

          {/* TAB SWITCHER */}
          <View className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("table")}
                className={`px-2.5 sm:px-3 py-1 rounded-md font-semibold transition cursor-pointer text-xs ${
                  activeTab === "table"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Daftar Data ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("input")}
                className={`px-2.5 sm:px-3 py-1 rounded-md font-semibold transition flex items-center gap-1 cursor-pointer text-xs ${
                  activeTab === "input"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-emerald-400 hover:text-emerald-300"
                }`}
              >
                <span>+</span> Input Data Baru
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal kelola data"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg font-bold ml-1 sm:ml-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              &times;
            </button>
          </View>
        </View>

        {/* NOTIFIKASI SUKSES */}
        {successMsg && (
          <div className="px-5 py-2.5 bg-emerald-600/20 border-b border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <span>✓ {successMsg}</span>
            <button
              type="button"
              onClick={() => setActiveTab("table")}
              className="underline text-emerald-200 hover:text-white cursor-pointer ml-3"
            >
              Lihat di Tabel &rarr;
            </button>
          </div>
        )}

        {/* TAB 1: INPUT DATA BARU UNTUK DIJADIKAN QR BARCODE */}
        {activeTab === "input" && (
          <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 flex-1">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <h3 className="text-sm font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Input Data Barang untuk Dijadikan QR Barcode
              </h3>
              <p className="text-[11px] text-slate-400 mb-4">
                Setiap data yang Anda masukkan langsung diproses dan dibuatkan QR Code berpresisi tinggi siap cetak pada lembar A4.
              </p>

              <form onSubmit={handleInputSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nama Barang <span className="text-rose-400">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Laptop Core i7 / Kursi Kerja"
                      value={form.nama_barang}
                      onChange={(e) => setForm({ ...form, nama_barang: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-white text-xs font-medium outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Kode Barang BMN <span className="text-rose-400">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 3050201002"
                      value={form.kode_barang}
                      onChange={(e) => setForm({ ...form, kode_barang: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-white font-mono text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Nomor Urut (NUP):</label>
                    <input
                      type="text"
                      placeholder="Contoh: 1 / 01 / 001"
                      value={form.nup}
                      onChange={(e) => setForm({ ...form, nup: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-white font-mono text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Merk / Tipe:</label>
                    <input
                      type="text"
                      placeholder="Contoh: ASUS EXPERTBOOK B1400"
                      value={form.merk_tipe}
                      onChange={(e) => setForm({ ...form, merk_tipe: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-white text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Tahun Perolehan:</label>
                    <input
                      type="text"
                      placeholder="Contoh: 2024"
                      value={form.tahun}
                      onChange={(e) => setForm({ ...form, tahun: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-white font-mono text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Ruangan Penempatan:</label>
                    <input
                      type="text"
                      placeholder="Contoh: [02] Ruang Kepala / Aula Mayang"
                      value={form.ruangan}
                      onChange={(e) => setForm({ ...form, ruangan: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-white text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Link / Payload QR Barcode (Opsional):
                    </label>
                    <input
                      type="text"
                      placeholder="Kosongkan untuk otomatis generate QR dari Kode Barang & NUP"
                      value={form.custom_barcode}
                      onChange={(e) => setForm({ ...form, custom_barcode: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-white font-mono text-xs outline-none"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Jika kosong, sistem akan otomatis menghasilkan SVG QR Code tajam.
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("table")}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Simpan &amp; Jadikan QR Barcode
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: DAFTAR DATA TABEL */}
        {activeTab === "table" && (
          <>
            <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Cari kode, nama barang, NUP, atau ruangan..."
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white placeholder-slate-500 w-full max-w-sm outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setActiveTab("input")}
                className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
              >
                + Input Barang Baru
              </button>
            </div>

            <div className="p-4 overflow-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2 px-2">No</th>
                    <th className="py-2 px-2">Kode Barang</th>
                    <th className="py-2 px-2">NUP</th>
                    <th className="py-2 px-2">Nama Barang</th>
                    <th className="py-2 px-2">Merk / Tipe</th>
                    <th className="py-2 px-2">Ruangan</th>
                    <th className="py-2 px-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        Tidak ada data yang cocok dengan pencarian "{query}"
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 text-slate-200">
                        <td className="py-2 px-2 text-slate-500 font-mono">{(page - 1) * pageSize + idx + 1}</td>
                        <td className="py-2 px-2 font-mono text-blue-300 font-semibold">{it.kode_barang}</td>
                        <td className="py-2 px-2 font-mono font-bold text-emerald-400">{it.nup}</td>
                        <td className="py-2 px-2 font-medium max-w-[200px] truncate" title={it.nama_barang}>
                          {it.nama_barang}
                        </td>
                        <td className="py-2 px-2 text-slate-400 max-w-[150px] truncate" title={it.merk_tipe}>
                          {it.merk_tipe || "-"}
                        </td>
                        <td className="py-2 px-2 text-slate-400 text-[11px] max-w-[200px] truncate" title={it.ruangan}>
                          {it.ruangan || "-"}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus barang "${it.nama_barang}" (NUP: ${it.nup})?`)) {
                                onDeleteItem && onDeleteItem((page - 1) * pageSize + idx);
                              }
                            }}
                            className="text-rose-400 hover:text-rose-300 font-bold p-1 cursor-pointer text-sm"
                            title="Hapus baris ini"
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION & FOOTER */}
            <View className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <span>Menampilkan {pageItems.length} dari {filtered.length} barang</span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-200 cursor-pointer"
                >
                  &larr; Prev
                </button>
                <span className="font-mono text-white font-bold">{page} / {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-200 cursor-pointer"
                >
                  Next &rarr;
                </button>
              </div>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
