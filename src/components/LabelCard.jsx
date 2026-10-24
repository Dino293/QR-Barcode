import React, { useState, useMemo } from 'react';
import { View, Text, Image } from './primitives/index.jsx';
import { generateQRCodeSVG } from '../utils/qrEngine.js';
import { buildBmnQrPayload } from '../utils/bmnScanner.js';

/**
 * Komponen Kartu Label BMN (LabelCard)
 * Menampilkan label berstandar presisi dengan logo, teks instansi, kode satker,
 * data barang, serta QR Code BMN mandiri beresolusi tajam (Nama, Kode, NUP, Merk, Lokasi).
 */
export function LabelCard({ item, headerConfig = {}, showBorder = false, onUpdate }) {
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

  // Payload Lengkap BMN (Nama Barang, Kode Barang, NUP, Merek/Tipe, Lokasi Barang)
  const bmnPayload = useMemo(() => {
    return buildBmnQrPayload(item);
  }, [item]);

  // SVG QR Code tajam & offline berisikan 5 data BMN lengkap
  const bmnSvg = useMemo(() => {
    return generateQRCodeSVG(bmnPayload, { size: 85, margin: 1 });
  }, [bmnPayload]);

  // Resolusi URL Gambar QR SIMAN (jika user memilih mode legacy SIMAN)
  const qrRaw = String(item.custom_barcode || "").trim();
  const useSiman = headerConfig.qrMode === 'siman';

  const qrImageUrl = useMemo(() => {
    if (!useSiman || !qrRaw) return "";
    if (qrRaw.startsWith("http://") || qrRaw.startsWith("https://") || qrRaw.startsWith("data:")) {
      return qrRaw;
    }
    const cleanPath = qrRaw.replace(/^\/+/, "");
    return `https://app.bpmpjambi.my.id/siman/${cleanPath}`;
  }, [qrRaw, useSiman]);

  const borderClass = showBorder ? "show-border" : "";

  return (
    <View className={`item-label ${borderClass}`}>
      {/* HEADER LABEL */}
      <View className="label-header">
        <View className="header-logo-box">
          <Image
            src={headerConfig.logoUrl || "images.png"}
            alt="Logo Kemendikbud"
            className="w-full h-full object-contain"
          />
        </View>

        <View className="header-text-box">
          <Text className="instansi-line1">
            {headerConfig.instansiLine1 || "KEMENTERIAN PENDIDIKAN DASAR DAN"}
          </Text>
          <Text className="instansi-line2">
            {headerConfig.instansiLine2 || "MENENGAH"}
          </Text>
          <Text className="satker-code-line">
            {satkerText}
          </Text>
        </View>

        <View className="header-logo-box" style={{ visibility: "hidden" }} aria-hidden="true" />
      </View>

      {/* BODY LABEL */}
      <View className="label-body">
        {/* DATA KIRI */}
        <View className="body-info-left">
          <View>
            <View className="info-top-row">
              <Text className="info-kode-barang font-mono">
                {item.kode_barang || "-"}
              </Text>
              <Text className="info-nup font-mono">
                NUP: {item.nup || "1"}
              </Text>
            </View>

            <Text className="info-nama-barang" title={item.nama_barang}>
              {item.nama_barang || "Barang BMN"}
            </Text>
          </View>

          <Text className="info-merk-tipe" title={item.merk_tipe}>
            {item.merk_tipe || "-"}
          </Text>
        </View>

        {/* QR CODE KANAN */}
        <View className="body-qr-right">
          <View className="qr-box" title={bmnPayload}>
            {useSiman && qrImageUrl && !imgError ? (
              <Image
                src={qrImageUrl}
                alt="QR SIMAN"
                className="w-full h-full object-contain"
                onError={() => setImgError(true)}
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center cursor-pointer select-none"
                dangerouslySetInnerHTML={{ __html: bmnSvg }}
                title={`QR Barcode BMN:\n${bmnPayload}`}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
