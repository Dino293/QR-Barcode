import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * Komponen Dropdown Autocomplete Lokasi / Ruangan (LocationCombobox)
 * Memungkinkan pengguna mencari lokasi/ruangan dengan mengetik (autocomplete),
 * menampilkan daftar pilihan interaktif (dropdown / "panah kebawah"),
 * dan langsung mengarahkan tampilan ke ruangan yang dituju tanpa mencampur aduk barcode.
 */
export function LocationCombobox({
  availableRooms = [],
  activeRoomFilter = "ALL",
  onSelectRoom,
  totalItems = 0
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Ambil nama ruangan yang sedang aktif untuk label display
  const activeLabel = useMemo(() => {
    if (activeRoomFilter === "ALL") return `Semua Ruangan (${totalItems})`;
    const found = availableRooms.find((r) => r.name === activeRoomFilter);
    return found ? `${found.name} (${found.count})` : activeRoomFilter;
  }, [activeRoomFilter, availableRooms, totalItems]);

  // Filter daftar ruangan berdasarkan apa yang diketik pengguna
  const filteredRooms = useMemo(() => {
    if (!query.trim()) return availableRooms;
    const q = query.toLowerCase();
    return availableRooms.filter((r) => r.name.toLowerCase().includes(q));
  }, [availableRooms, query]);

  // Tutup dropdown jika pengguna mengklik di luar area komponen
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelect = (roomName) => {
    onSelectRoom(roomName);
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelectRoom("ALL");
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block text-xs">
      <div className="flex items-center gap-1.5 bg-slate-900/95 border border-indigo-500/40 hover:border-indigo-400/70 rounded-xl px-2.5 py-1.5 shadow-sm transition">
        {/* Label Ikon Lokasi */}
        <span className="text-indigo-400 font-bold flex items-center gap-1 shrink-0">
          <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="hidden sm:inline">Lokasi:</span>
        </span>

        {/* Kolom Teks Pencarian / Pemilihan Lokasi */}
        <div className="relative min-w-[160px] sm:min-w-[210px] md:min-w-[240px]">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? query : (activeRoomFilter === "ALL" ? "" : activeRoomFilter)}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              setQuery("");
            }}
            placeholder={activeRoomFilter === "ALL" ? "Cari lokasi / Semua Ruangan..." : activeLabel}
            className="w-full bg-slate-950 text-indigo-100 placeholder:text-slate-400 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-400 pr-12 truncate"
          />

          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {/* Tombol Reset / Clear */}
            {activeRoomFilter !== "ALL" && (
              <button
                type="button"
                onClick={handleClear}
                title="Reset ke Semua Ruangan"
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                &times;
              </button>
            )}

            {/* Tombol Panah Kebawah (Chevron Down) */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                if (!isOpen) {
                  inputRef.current?.focus();
                  setQuery("");
                }
              }}
              title="Buka daftar pilihan ruangan"
              className="text-indigo-400 hover:text-indigo-300 p-1 cursor-pointer transition transform"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* DROPDOWN MENU PILIHAN LOKASI */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-[280px] sm:w-[340px] md:w-[380px] bg-slate-900 border-2 border-indigo-500/50 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          {/* Header Panduan Pencarian */}
          <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Pilih Lokasi Tujuan Cetak:</span>
            <span className="text-[10px] text-indigo-400 font-semibold font-mono">
              {filteredRooms.length} Ruangan
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 p-1">
            {/* Opsi 1: Semua Ruangan */}
            <button
              type="button"
              onClick={() => handleSelect("ALL")}
              className={`w-full px-3 py-2 text-left rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                activeRoomFilter === "ALL"
                  ? "bg-indigo-600/30 text-white font-bold border border-indigo-500/40"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-base">🏢</span>
                <div className="truncate">
                  <div className="font-bold text-xs truncate">Tampilkan Semua Ruangan</div>
                  <div className="text-[10px] text-slate-400 font-normal">Cetak barcode gabungan seluruh satker</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 shrink-0">
                {totalItems} item
              </span>
            </button>

            {/* Daftar Ruangan Hasil Filter */}
            {filteredRooms.length > 0 ? (
              filteredRooms.map((r) => {
                const isSelected = activeRoomFilter === r.name;
                return (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => handleSelect(r.name)}
                    className={`w-full px-3 py-2 text-left rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-950"
                        : "text-slate-200 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <svg className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white" : "text-indigo-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-xs truncate font-medium" title={r.name}>
                        {r.name}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-indigo-300"
                    }`}>
                      {r.count} item
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs">
                Tidak ada ruangan yang cocok dengan kata kunci &quot;{query}&quot;.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
