/**
 * Komponen Kartu Label BMN (LabelCard)
 * Menampilkan label berstandar presisi dengan logo, teks instansi, kode satker,
 * data barang, serta QR Code SIMAN atau offline SVG generator.
 */
import { html } from '../utils/htm.js';
import { View, Text, Image } from './primitives/index.js';
import { generateQRCodeSVG } from '../utils/qrEngine.js';

const { useState, useMemo } = window.React;

export function LabelCard({ item, headerConfig, showBorder = false, onUpdate }) {
  const [imgError, setImgError] = useState(false);

  // Resolusi Satker & Tahun (Format Baku: [Kode Satker].[Tahun Perolehan])
  const satkerText = useMemo(() => {
    let rawCode = String(item.kode_satker || headerConfig.satkerCode || "138041000693242000KD").trim();
    
    // 1. Bersihkan suffix tahun jika sudah menempel di kode satker (contoh: .2024 atau .2000)
    let embeddedYear = "";
    const suffixMatch = rawCode.match(/\.(19\d{2}|20\d{2})$/);
    if (suffixMatch) {
      embeddedYear = suffixMatch[1];
      rawCode = rawCode.slice(0, suffixMatch.index).trim();
    }

    // 2. Cari tahun perolehan dari berbagai field (item.tahun, item.tgl_perolehan, embeddedYear)
    let resolvedYear = "";
    if (item.tahun !== undefined && item.tahun !== null && String(item.tahun).trim() !== "") {
      const my = String(item.tahun).match(/\b(19\d{2}|20\d{2})\b/);
      if (my) resolvedYear = my[1];
    }
    if (!resolvedYear && item.tgl_perolehan) {
      const mt = String(item.tgl_perolehan).match(/\b(19\d{2}|20\d{2})\b/);
      if (mt) resolvedYear = mt[1];
    }
    if (!resolvedYear && embeddedYear) {
      resolvedYear = embeddedYear;
    }

    // 3. Tampilkan Satker dengan bubuhan tahun baku
    if (resolvedYear) {
      return `${rawCode}.${resolvedYear}`;
    }
    return rawCode;
  }, [item.kode_satker, item.tahun, item.tgl_perolehan, headerConfig.satkerCode]);

  // Resolusi URL Gambar QR SIMAN atau SVG Fallback
  const qrRaw = String(item.custom_barcode || "").trim();

  const qrImageUrl = useMemo(() => {
    if (!qrRaw) return "";
    if (qrRaw.startsWith("http://") || qrRaw.startsWith("https://") || qrRaw.startsWith("data:")) {
      return qrRaw;
    }
    const cleanPath = qrRaw.replace(/^\/+/, "");
    return `https://app.bpmpjambi.my.id/siman/${cleanPath}`;
  }, [qrRaw]);

  // Fallback SVG QR jika gambar SIMAN kosong atau gagal dimuat
  const fallbackSvg = useMemo(() => {
    if (qrImageUrl && !imgError) return null;
    const qrPayload = qrRaw || `${item.kode_barang || "BMN"}-${item.nup || "1"}`;
    return generateQRCodeSVG(qrPayload, { size: 85, margin: 1 });
  }, [qrImageUrl, imgError, qrRaw, item.kode_barang, item.nup]);

  const borderClass = showBorder ? "show-border" : "";

  return html`
    <${View} className=${`item-label ${borderClass}`}>
      <!-- HEADER LABEL -->
      <${View} className="label-header">
        <${View} className="header-logo-box">
          <${Image}
            src=${headerConfig.logoUrl || "images.png"}
            alt="Logo Kemendikbud"
            className="w-full h-full object-contain"
          />
        <//>

        <${View} className="header-text-box">
          <${Text} className="instansi-line1">
            ${headerConfig.instansiLine1 || "KEMENTERIAN PENDIDIKAN DASAR DAN"}
          <//>
          <${Text} className="instansi-line2">
            ${headerConfig.instansiLine2 || "MENENGAH"}
          <//>
          <${Text} className="satker-code-line">
            ${satkerText}
          <//>
        <//>

        <${View} className="header-logo-box" style=${{ visibility: "hidden" }} aria-hidden="true" />
      <//>

      <!-- BODY LABEL -->
      <${View} className="label-body">
        <!-- DATA KIRI -->
        <${View} className="body-info-left">
          <${View}>
            <${View} className="info-top-row">
              <${Text} className="info-kode-barang font-mono">
                ${item.kode_barang || "-"}
              <//>
              <${Text} className="info-nup font-mono">
                NUP: ${item.nup || "1"}
              <//>
            <//>

            <${Text} className="info-nama-barang" title=${item.nama_barang}>
              ${item.nama_barang || "Barang BMN"}
            <//>
          <//>

          <${Text} className="info-merk-tipe" title=${item.merk_tipe}>
            ${item.merk_tipe || "-"}
          <//>
        <//>

        <!-- QR CODE KANAN -->
        <${View} className="body-qr-right">
          <${View} className="qr-box">
            ${qrImageUrl && !imgError
              ? html`
                  <${Image}
                    src=${qrImageUrl}
                    alt="QR SIMAN"
                    className="w-full h-full object-contain"
                    onError=${() => setImgError(true)}
                    loading="lazy"
                  />
                `
              : html`
                  <div
                    className="w-full h-full flex items-center justify-center"
                    dangerouslySetInnerHTML=${{ __html: fallbackSvg }}
                  />
                `}
          <//>
        <//>
      <//>
    <//>
  `;
}
