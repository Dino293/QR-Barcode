import { DUMMY_ITEMS, DEFAULT_HEADER_CONFIG } from '../utils/defaultData.js';

const { useState, useMemo, useCallback } = window.React;

/**
 * Hook untuk Manajemen Dataset Label BMN (Standalone Live Server)
 * Mengatur filter ruangan, pencarian instan, dan paginasi lembar A4 secara sekuensial rapat
 */
export function useLabelData(rowsPerPage = 6) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("bmn_items_data");
      return saved ? JSON.parse(saved) : DUMMY_ITEMS;
    } catch {
      return DUMMY_ITEMS;
    }
  });

  const [headerConfig, setHeaderConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("bmn_header_config");
      return saved ? { ...DEFAULT_HEADER_CONFIG, ...JSON.parse(saved) } : DEFAULT_HEADER_CONFIG;
    } catch {
      return DEFAULT_HEADER_CONFIG;
    }
  });

  const [activeRoomFilter, setActiveRoomFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Daftar ruangan unik beserta jumlah barangnya
  const availableRooms = useMemo(() => {
    const counts = {};
    items.forEach((it) => {
      const r = (it.ruangan || "").trim() || "Tanpa Ruangan";
      counts[r] = (counts[r] || 0) + 1;
    });

    return Object.keys(counts)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((room) => ({
        name: room,
        count: counts[room]
      }));
  }, [items]);

  // Filter item berdasarkan ruangan aktif dan kata kunci pencarian
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const roomMatch = activeRoomFilter === "ALL" || (it.ruangan || "Tanpa Ruangan") === activeRoomFilter;
      if (!roomMatch) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const nama = String(it.nama_barang || "").toLowerCase();
      const kode = String(it.kode_barang || "").toLowerCase();
      const merk = String(it.merk_tipe || "").toLowerCase();
      const nup = String(it.nup || "").toLowerCase();
      const room = String(it.ruangan || "").toLowerCase();

      return nama.includes(q) || kode.includes(q) || merk.includes(q) || nup.includes(q) || room.includes(q);
    });
  }, [items, activeRoomFilter, searchQuery]);

  // Kelompokkan item ke dalam lembar A4 secara sekuensial rapat (2 kolom x rowsPerPage)
  const labelsPerSheet = rowsPerPage * 2;

  const sheets = useMemo(() => {
    const totalSheets = Math.ceil(filteredItems.length / labelsPerSheet) || 0;
    if (totalSheets === 0) return [];

    const resultSheets = [];
    for (let p = 0; p < totalSheets; p++) {
      const pageItems = filteredItems.slice(p * labelsPerSheet, (p + 1) * labelsPerSheet);

      let sheetRoomTitle = "SEMUA RUANGAN";
      if (activeRoomFilter !== "ALL") {
        sheetRoomTitle = activeRoomFilter;
      } else {
        const uniqueRooms = [...new Set(pageItems.map((it) => (it.ruangan || "").trim()).filter(Boolean))];
        if (uniqueRooms.length === 1) {
          sheetRoomTitle = uniqueRooms[0];
        } else if (uniqueRooms.length > 1) {
          sheetRoomTitle = uniqueRooms.slice(0, 2).join(" • ") + (uniqueRooms.length > 2 ? " dll." : "");
        }
      }

      resultSheets.push({
        roomName: sheetRoomTitle,
        pageNumber: p + 1,
        totalPages: totalSheets,
        totalRoomItems: filteredItems.length,
        items: pageItems
      });
    }

    return resultSheets;
  }, [filteredItems, labelsPerSheet, activeRoomFilter]);

  // Tambah 1 Item Baru
  const addItem = useCallback((newItem) => {
    setItems((prev) => {
      const next = [newItem, ...prev];
      try {
        if (next.length <= 1000) {
          localStorage.setItem("bmn_items_data", JSON.stringify(next));
        }
      } catch (_) {}
      return next;
    });
  }, []);

  // Update Item
  const updateItem = useCallback((index, updatedFields) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updatedFields };
      try {
        if (next.length <= 1000) {
          localStorage.setItem("bmn_items_data", JSON.stringify(next));
        }
      } catch (_) {}
      return next;
    });
  }, []);

  // Hapus 1 Item
  const deleteItem = useCallback((index) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      try {
        if (next.length <= 1000) {
          localStorage.setItem("bmn_items_data", JSON.stringify(next));
        }
      } catch (_) {}
      return next;
    });
  }, []);

  // Muat Dataset Baru
  const loadDataset = useCallback((newItems) => {
    setItems(newItems);
    setActiveRoomFilter("ALL");
    setSearchQuery("");
    try {
      if (newItems.length <= 1000) {
        localStorage.setItem("bmn_items_data", JSON.stringify(newItems));
      } else {
        localStorage.removeItem("bmn_items_data");
      }
    } catch (_) {}
  }, []);

  // Reset ke Contoh Default
  const resetToDummy = useCallback(() => {
    setItems(DUMMY_ITEMS);
    setActiveRoomFilter("ALL");
    setSearchQuery("");
    try {
      localStorage.removeItem("bmn_items_data");
    } catch (_) {}
  }, []);

  // Update Header Config
  const updateHeaderConfig = useCallback((updates) => {
    setHeaderConfig((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem("bmn_header_config", JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  }, []);

  return {
    items,
    headerConfig,
    activeRoomFilter,
    setActiveRoomFilter,
    searchQuery,
    setSearchQuery,
    availableRooms,
    filteredItems,
    sheets,
    addItem,
    updateItem,
    deleteItem,
    loadDataset,
    resetToDummy,
    updateHeaderConfig
  };
}
