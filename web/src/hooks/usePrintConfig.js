/**
 * Hook untuk Manajemen Konfigurasi Cetak Presisi (MM & PT)
 * Otomatis menyinkronkan variabel CSS ke elemen root dokumen
 */
import { DEFAULT_PRINT_CONFIG, LAYOUT_PRESETS } from '../utils/defaultData.js';

const { useState, useEffect, useCallback } = window.React;

export function usePrintConfig() {
  const [config, setConfig] = useState(() => {
    // Muat dari localStorage jika ada konfigurasi yang disimpan
    try {
      const saved = localStorage.getItem("bmn_print_config");
      return saved ? { ...DEFAULT_PRINT_CONFIG, ...JSON.parse(saved) } : DEFAULT_PRINT_CONFIG;
    } catch {
      return DEFAULT_PRINT_CONFIG;
    }
  });

  const [activeLayout, setActiveLayout] = useState(12);

  // Perbarui CSS variables di dokumen ketika konfigurasi berubah
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--page-width", `${config.pageWidth}mm`);
    root.style.setProperty("--page-height", `${config.pageHeight}mm`);
    root.style.setProperty("--page-margin-top", `${config.marginTop}mm`);
    root.style.setProperty("--page-margin-bottom", `${config.marginBottom}mm`);
    root.style.setProperty("--page-margin-left", `${config.marginLeft}mm`);
    root.style.setProperty("--page-margin-right", `${config.marginRight}mm`);

    root.style.setProperty("--label-width", `${config.labelWidth}mm`);
    root.style.setProperty("--label-height", `${config.labelHeight}mm`);
    root.style.setProperty("--label-col-gap", `${config.colGap}mm`);
    root.style.setProperty("--label-row-gap", `${config.rowGap}mm`);
    root.style.setProperty("--grid-cols", String(config.colsPerPage || 2));

    root.style.setProperty("--qr-size", `${config.qrSize}mm`);
    root.style.setProperty("--logo-size", `${config.logoSize}mm`);

    root.style.setProperty("--instansi-font-size", `${config.fontSizeInstansi}pt`);
    root.style.setProperty("--satker-font-size", `${config.fontSizeSatker}pt`);
    root.style.setProperty("--body-font-size", `${config.fontSizeBody}pt`);

    // Simpan ke localStorage
    try {
      localStorage.setItem("bmn_print_config", JSON.stringify(config));
    } catch (_) {}
  }, [config]);

  const updateConfig = useCallback((updates) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const changeLayout = useCallback((presetKey) => {
    const preset = LAYOUT_PRESETS[presetKey];
    if (preset) {
      setActiveLayout(Number(presetKey));
      setConfig((prev) => ({
        ...prev,
        rowsPerPage: preset.rowsPerPage,
        labelHeight: preset.labelHeight,
        marginTop: preset.marginTop,
        marginBottom: preset.marginBottom,
        rowGap: preset.rowGap
      }));
    }
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_PRINT_CONFIG);
    setActiveLayout(12);
  }, []);

  return {
    config,
    activeLayout,
    updateConfig,
    changeLayout,
    resetConfig
  };
}
