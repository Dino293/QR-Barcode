import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://vipdzgwzxvctofcwityn.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcGR6Z3d6eHZjdG9mY3dpdHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MzY4OTksImV4cCI6MjEwODExMjg5OX0.qKVGkWEq56mpu5dc2jUVn_OQPI4FkKczbN8F24Ym_Nw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Format baris data dari PostgreSQL Supabase agar persis cocok dengan struktur tampilan label
 */
export function formatSupabaseItem(row) {
  let roomTitle = "Tanpa Ruangan";
  const kd = (row.kode_ruangan || "").trim();
  const nm = (row.nama_ruangan || "").trim();
  const bg = (row.nama_bangunan || "").trim();

  if (kd && nm) {
    roomTitle = bg ? `[${kd}] ${nm} - ${bg}` : `[${kd}] ${nm}`;
  } else if (nm) {
    roomTitle = bg ? `${nm} - ${bg}` : nm;
  } else if (kd) {
    roomTitle = `[${kd}] Ruangan ${kd}`;
  }

  let extractedYear = "";
  if (row.tahun) {
    const m = String(row.tahun).match(/\b(19\d{2}|20\d{2})\b/);
    if (m) extractedYear = m[1];
  }
  if (!extractedYear && row.tgl_perolehan) {
    const m = String(row.tgl_perolehan).match(/\b(19\d{2}|20\d{2})\b/);
    if (m) extractedYear = m[1];
  }
  if (!extractedYear && row.kode_satker) {
    const m = String(row.kode_satker).match(/\.(19\d{2}|20\d{2})\b/);
    if (m) extractedYear = m[1];
  }

  return {
    id: row.id,
    kode_satker: row.kode_satker || "138041000693242000KD",
    tahun: extractedYear || String(row.tahun || "").trim(),
    tgl_perolehan: row.tgl_perolehan || "",
    kode_barang: String(row.kode_barang || "").trim(),
    nup: String(row.nup || "1").trim(),
    nama_barang: String(row.nama_barang || "Barang BMN").trim(),
    merk_tipe: String(row.merk_tipe || "-").trim(),
    kode_ruangan: kd,
    nama_ruangan: nm,
    nama_bangunan: bg,
    ruangan: roomTitle,
    custom_barcode: row.custom_barcode || "",
    foto_barang_url: row.foto_barang_url || null,
    kondisi: row.kondisi || "",
    harga_barang: row.harga_barang || ""
  };
}

/**
 * Ambil seluruh data BMN dari Supabase secara bertahap (batch) untuk menghindari batas limit 1.000 baris REST API
 */
export async function fetchAllBmnFromSupabase(onProgress) {
  const PAGE_SIZE = 1000;
  let allRows = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + PAGE_SIZE - 1;
    const { data, error, count } = await supabase
      .from('bmn_items')
      .select('*', { count: 'exact' })
      .order('no_urut', { ascending: true })
      .range(from, to);

    if (error) throw error;

    if (data && data.length > 0) {
      allRows.push(...data);
      if (onProgress && count) {
        onProgress(allRows.length, count);
      }
      from += PAGE_SIZE;
      if (allRows.length >= count || data.length < PAGE_SIZE) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return allRows.map(formatSupabaseItem);
}

/**
 * Cek status kesehatan koneksi Supabase
 */
export async function testSupabaseConnection() {
  try {
    const { count, error } = await supabase
      .from('bmn_items')
      .select('id', { count: 'exact', head: true });

    if (error) return { connected: false, error: error.message, count: 0 };
    return { connected: true, count: count || 0 };
  } catch (err) {
    return { connected: false, error: err.message, count: 0 };
  }
}
