import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { View, Text, Pressable } from './primitives/index.jsx';
import { supabase, formatSupabaseItem } from '../utils/supabaseClient.js';
import { parseBmnPayload } from '../utils/bmnScanner.js';

/**
 * Komponen Modal Pemindai QR & Barcode (ScannerModal)
 * Mendukung 3 Mode Pemindaian:
 * 1. Kamera Smartphone / Webcam (Html5Qrcode)
 * 2. Handheld Barcode Scanner Gun ("Tembak Scan" USB / Bluetooth)
 * 3. Unggah Berkas Foto QR
 * 
 * Menampilkan 5 data utama BMN secara lengkap:
 * - Nama Barang
 * - Kode Barang
 * - NUP
 * - Merek / Tipe Barang
 * - Lokasi Barang (Ruangan & Gedung)
 */
export function ScannerModal({ isOpen, onClose, items = [], onSelectItem }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState("camera"); // "camera" | "gun"
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [foundItem, setFoundItem] = useState(null);
  const [searchingCloud, setSearchingCloud] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const html5QrCodeRef = useRef(null);
  const gunInputRef = useRef(null);
  const scannerContainerId = "qr-reader-container";

  // Buffer untuk menangkap tembakan Barcode Scanner Gun secara global
  const gunBufferRef = useRef("");
  const gunLastKeyTimeRef = useRef(0);

  // Web Audio API Synthesizer Beep (Suara "BEEP" sukses tembak scan)
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz (A5)
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (_) {}
  };

  // Hentikan Kamera Scanner
  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Error stopping camera scanner:", err);
      }
    }
    setScannerActive(false);
  };

  // Mulai Kamera Scanner
  const startScanner = async (cameraId = null) => {
    try {
      setErrorMessage("");
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const availableCams = await Html5Qrcode.getCameras();
      setCameras(availableCams);

      let targetCamId = cameraId;
      if (!targetCamId && availableCams.length > 0) {
        // Utamakan kamera belakang (back/environment)
        const backCam = availableCams.find((c) =>
          c.label.toLowerCase().includes("back") ||
          c.label.toLowerCase().includes("belakang") ||
          c.label.toLowerCase().includes("environment")
        );
        targetCamId = backCam ? backCam.id : availableCams[0].id;
      }
      setActiveCameraId(targetCamId);

      const config = {
        fps: 15,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      };

      await html5QrCodeRef.current.start(
        targetCamId ? targetCamId : { facingMode: "environment" },
        config,
        (decodedText) => handleDecodedText(decodedText),
        () => {} // Abaikan frame gagal deteksi
      );

      setScannerActive(true);
    } catch (err) {
      console.warn("Kamera tidak dapat dimulai:", err);
      setScannerActive(false);
      // Jika kamera gagal, arahkan otomatis ke mode Scanner Gun
      setActiveTab("gun");
    }
  };

  // Handler utama saat teks QR/Barcode terbaca (dari Kamera, Scanner Gun, atau File)
  const handleDecodedText = async (rawText) => {
    if (!rawText || !rawText.trim()) return;

    playBeep();
    const cleanText = rawText.trim();
    setScannedResult(cleanText);
    setErrorMessage("");
    stopScanner();

    // 1. Ekstraksi struktur data BMN (Nama, Kode, NUP, Merek, Lokasi)
    const parsed = parseBmnPayload(cleanText);

    const targetKodeClean = parsed?.kode_barang
      ? parsed.kode_barang.replace(/[^0-9]/g, "")
      : cleanText.replace(/[^0-9]/g, "");
    const targetNup = parsed?.nup ? String(parsed.nup).trim() : null;

    // 2. Cari di dataset memori lokal (items)
    let localMatch = null;

    if (targetKodeClean) {
      localMatch = items.find((it) => {
        const itKodeClean = String(it.kode_barang || "").replace(/[^0-9]/g, "");
        const itNup = String(it.nup || "").trim();
        if (targetNup) {
          return itKodeClean === targetKodeClean && itNup === targetNup;
        }
        return itKodeClean === targetKodeClean;
      });
    }

    if (!localMatch) {
      localMatch = items.find((it) => {
        const qr = (it.custom_barcode || "").trim();
        const nm = String(it.nama_barang || "").toLowerCase();
        return (
          (qr && (cleanText === qr || cleanText.includes(qr) || qr.includes(cleanText))) ||
          (parsed?.nama_barang && nm === parsed.nama_barang.toLowerCase())
        );
      });
    }

    if (localMatch) {
      setFoundItem(localMatch);
      return;
    }

    // 3. Jika parsed sudah memiliki Nama Barang langsung dari QR, buat item instan
    if (parsed && parsed.nama_barang) {
      const synthesizedItem = {
        kode_satker: "138041000693242000KD",
        tahun: parsed.tahun || "2024",
        kode_barang: parsed.kode_barang || cleanText,
        nup: parsed.nup || "1",
        nama_barang: parsed.nama_barang,
        merk_tipe: parsed.merk_tipe || "-",
        ruangan: parsed.ruangan || "Tanpa Ruangan",
        fromPayload: true
      };
      setFoundItem(synthesizedItem);

      // Sinkronisasi asinkron ke Supabase Cloud jika ada
      try {
        const { data } = await supabase
          .from('bmn_items')
          .select('*')
          .eq('kode_barang', targetKodeClean || parsed.kode_barang)
          .eq('nup', parseInt(parsed.nup, 10) || 1)
          .limit(1);

        if (data && data.length > 0) {
          setFoundItem(formatSupabaseItem(data[0]));
        }
      } catch (_) {}
      return;
    }

    // 4. Jika QR hanya berisi kode angka / SIMAN hash tanpa nama teks, cari ke Supabase
    setSearchingCloud(true);
    try {
      let query = supabase.from('bmn_items').select('*');
      if (targetKodeClean && targetNup) {
        query = query.eq('kode_barang', targetKodeClean).eq('nup', parseInt(targetNup, 10));
      } else if (targetKodeClean) {
        query = query.eq('kode_barang', targetKodeClean);
      } else {
        query = query.or(`custom_barcode.ilike.%${cleanText}%,kode_barang.eq.${cleanText}`);
      }

      const { data, error } = await query.limit(1);

      if (!error && data && data.length > 0) {
        setFoundItem(formatSupabaseItem(data[0]));
      } else {
        setFoundItem(null);
      }
    } catch (err) {
      console.error("Gagal cari di Supabase:", err);
      setFoundItem(null);
    } finally {
      setSearchingCloud(false);
    }
  };

  // Scan dari Berkas Gambar (Upload QR file)
  const handleScanFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }
      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      handleDecodedText(decodedText);
    } catch (err) {
      setErrorMessage("Tidak dapat membaca QR code dari gambar tersebut. Pastikan gambar jelas dan fokus.");
    }
  };

  // Submit dari Input Tembak Scanner Gun / Manual
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedText(manualInput);
    setManualInput("");
  };

  // Tangkap input Barcode Scanner Gun HID Keyboard secara global
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "Escape") {
        stopScanner();
        onClose();
        return;
      }

      // Jika user sedang mengetik di input manual, biarkan event input normal bekerja
      if (document.activeElement && document.activeElement.id === "gun-manual-input") {
        return;
      }

      const now = Date.now();
      const diff = now - gunLastKeyTimeRef.current;
      gunLastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const buffered = gunBufferRef.current.trim();
        gunBufferRef.current = "";
        if (buffered.length >= 2) {
          handleDecodedText(buffered);
        }
      } else if (e.key.length === 1) {
        // Scanner gun mengetik dalam burst sangat cepat (< 60ms antar karakter)
        if (diff > 150) {
          gunBufferRef.current = "";
        }
        gunBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [items, onClose]);

  // Inisialisasi kamera atau fokus input saat tab berubah
  useEffect(() => {
    if (activeTab === "camera" && !scannedResult) {
      let timer = setTimeout(() => {
        startScanner();
      }, 200);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else if (activeTab === "gun") {
      stopScanner();
      let timer = setTimeout(() => {
        gunInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, scannedResult]);

  const handleResetScan = () => {
    setScannedResult(null);
    setFoundItem(null);
    setErrorMessage("");
    setManualInput("");
    if (activeTab === "camera") {
      startScanner(activeCameraId);
    } else {
      setTimeout(() => gunInputRef.current?.focus(), 100);
    }
  };

  const handleApplyFilter = () => {
    if (foundItem && onSelectItem) {
      onSelectItem(foundItem);
      stopScanner();
      onClose();
    }
  };

  const handleCopyInfo = () => {
    if (!foundItem) return;
    const textToCopy = [
      `Nama Barang: ${foundItem.nama_barang}`,
      `Kode Barang: ${foundItem.kode_barang}`,
      `NUP: ${foundItem.nup}`,
      `Merek/Tipe: ${foundItem.merk_tipe || "-"}`,
      `Lokasi: ${foundItem.ruangan || "Tanpa Ruangan"}`
    ].join("\n");

    navigator.clipboard.writeText(textToCopy);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  return (
    <View
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopScanner();
          onClose();
        }
      }}
    >
      <View className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* HEADER */}
        <View className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <View className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            </div>
            <div>
              <h2 id="scanner-modal-title" className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>Pindai Barcode / QR BMN</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Data Lengkap
                </span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                Deteksi otomatis Nama Barang, Kode Barang, NUP, Merek, &amp; Lokasi
              </p>
            </div>
          </View>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            aria-label="Tutup pemindai"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg font-bold cursor-pointer"
          >
            &times;
          </button>
        </View>

        {/* TAB PILIHAN METODE SCAN */}
        {!scannedResult && (
          <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("camera")}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "camera"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span>Kamera HP / Webcam</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("gun")}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "gun"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              <span>Tembak Scanner Gun (USB)</span>
            </button>
          </div>
        )}

        {/* BODY */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "camera") startScanner(activeCameraId);
                }}
                className="underline text-[11px] font-bold hover:text-white cursor-pointer ml-2"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* VIEWPORT KAMERA SCANNER */}
          {!scannedResult && activeTab === "camera" && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-slate-700 aspect-square max-w-[280px] mx-auto flex items-center justify-center shadow-inner">
                <div id={scannerContainerId} className="w-full h-full"></div>

                {/* Garis Animasi Scan Laser */}
                {scannerActive && (
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse pointer-events-none"></div>
                )}
              </div>

              {/* KONTROL KAMERA & UPLOAD FOTO */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                {cameras.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Pilih Kamera:</span>
                    <select
                      value={activeCameraId || ""}
                      onChange={(e) => {
                        stopScanner();
                        startScanner(e.target.value);
                      }}
                      className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs"
                    >
                      {cameras.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label || `Kamera ${c.id.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ml-auto">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span>Pilih Foto QR</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScanFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* MODE TEMBAK SCANNER GUN / INPUT MANUAL */}
          {!scannedResult && activeTab === "gun" && (
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  Mode Siaga Scanner Gun Aktif
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Tembakkan barcode scanner gun fisik Anda langsung ke layar stiker barcode / cetakan label. Sistem akan langsung membunyikan <strong className="text-cyan-300">BEEP</strong> dan menampilkan data barang secara otomatis.
              </p>

              <form onSubmit={handleManualSubmit} className="space-y-3 pt-1">
                <div>
                  <label htmlFor="gun-manual-input" className="block text-[11px] font-bold text-slate-400 mb-1">
                    Kolom Tangkapan Scanner Gun / Input Manual:
                  </label>
                  <div className="relative">
                    <input
                      id="gun-manual-input"
                      ref={gunInputRef}
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Arahkan scanner gun / ketik Kode Barang atau NUP lalu Enter..."
                      className="w-full bg-slate-900 border-2 border-cyan-500/60 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500">
                    Otomatis membaca teks berformat BMN, JSON, atau kode angka
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-lg shadow-cyan-900/40"
                  >
                    Proses Scan
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* HASIL DETEKSI SCAN */}
          {scannedResult && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="overflow-hidden mr-2">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Kode / Teks Terbaca:</span>
                  <span className="font-mono text-cyan-400 font-bold text-xs break-all line-clamp-2">
                    {scannedResult}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-semibold cursor-pointer shrink-0"
                >
                  Scan Ulang
                </button>
              </div>

              {searchingCloud ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Mencari barang di database Cloud Supabase...
                </div>
              ) : foundItem ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/50 via-slate-900 to-slate-950 border-2 border-cyan-500/50 shadow-2xl space-y-3.5">
                  {/* HEADER HASIL: NAMA BARANG & NUP */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 uppercase tracking-wide">
                          ✓ BMN TERVERIFIKASI
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {foundItem.fromPayload ? "Langsung dari QR" : "Database BMN"}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                        {foundItem.nama_barang}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block text-xs font-mono font-extrabold text-amber-300 bg-amber-950/70 px-2.5 py-1 rounded-xl border border-amber-600/50 shadow">
                        NUP {foundItem.nup}
                      </span>
                    </div>
                  </div>

                  {/* 5 DATA UTAMA BMN DALAM GRID RAPI */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    {/* 1. KODE BARANG */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        1. Kode Barang:
                      </span>
                      <span className="font-mono text-cyan-300 font-bold text-xs mt-0.5 block">
                        {foundItem.kode_barang}
                      </span>
                    </div>

                    {/* 2. NUP */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        2. NUP (Nomor Urut):
                      </span>
                      <span className="font-mono text-amber-400 font-bold text-xs mt-0.5 block">
                        {foundItem.nup}
                      </span>
                    </div>

                    {/* 3. MEREK / TIPE BARANG */}
                    <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        3. Merek / Tipe Barang:
                      </span>
                      <span className="text-slate-100 font-semibold text-xs mt-0.5 block truncate" title={foundItem.merk_tipe}>
                        {foundItem.merk_tipe || "-"}
                      </span>
                    </div>

                    {/* 4. SATKER / TAHUN */}
                    <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        4. Tahun Perolehan:
                      </span>
                      <span className="text-slate-200 font-medium text-xs mt-0.5 block">
                        {foundItem.tahun || "-"}
                      </span>
                    </div>

                    {/* 5. LOKASI BARANG (RUANGAN & GEDUNG) */}
                    <div className="col-span-2 p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/50">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span>5. Lokasi Barang (Ruangan &amp; Gedung):</span>
                      </span>
                      <span className="text-white font-bold text-xs mt-1 block">
                        {foundItem.ruangan || "Tanpa Ruangan"}
                      </span>
                    </div>
                  </div>

                  {/* TOMBOL AKSI */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={handleCopyInfo}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-semibold cursor-pointer transition flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                      <span>{copiedSuccess ? "Tersalin!" : "Salin 5 Data"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetScan}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-semibold cursor-pointer transition"
                    >
                      Pindai Lain
                    </button>

                    <Pressable
                      onPress={handleApplyFilter}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-xl font-bold cursor-pointer shadow-lg shadow-cyan-900/40 transition flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      <span>Tampilkan di Lembar Cetak</span>
                    </Pressable>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <p className="text-xs text-rose-400 font-semibold">
                    Data BMN tidak ditemukan di database untuk kode tersebut.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Pastikan Anda telah memuat seluruh data dari Cloud Supabase atau Excel.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetScan}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-xl font-semibold cursor-pointer mt-1"
                  >
                    Scan Ulang
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </View>
    </View>
  );
}
