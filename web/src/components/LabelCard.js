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

  // Resolusi Satker & Tahun
  const satkerText = useMemo(() => {
    const code = String(item.kode_satker || headerConfig.satkerCode || "138041000693242000KD").trim();
    let year = String(item.tahun || "").trim();
    if (!year && item.tgl_perolehan) {
      const my = String(item.tgl_perolehan).match(/\b(19\d{2}|20\d{2})\b/);
      if (my) year = my[1];
    }
    if (year) {
      if (code.endsWith(`.${year}`) || code.includes(`.${year}`)) {
        return code;
      }
      return `${code}.${year}`;
    }
    return code;
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
