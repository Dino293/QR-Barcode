import React from 'react';
import { View, Text } from './primitives/index.jsx';
import { LabelCard } from './LabelCard.jsx';

/**
 * Komponen Lembar Kerja A4 (A4Sheet)
 * Merepresentasikan 1 lembar fisik kertas A4 (210 x 297 mm) dengan header mengambang
 * dan grid 2 kolom label berpresisi tinggi tanpa tumpah/terpotong ke lembar berikutnya.
 */
export function A4Sheet({ sheet, headerConfig, isPrintHidden = false, onUpdateItem }) {
  const { roomName, pageNumber, totalPages, totalRoomItems, items } = sheet;

  return (
    <View className={`sheet-wrapper ${isPrintHidden ? 'print-hidden-sheet' : ''}`}>
      {/* Indikator Layar (Tidak Dicetak) */}
      <View className="no-print w-full max-w-[210mm] mb-1.5 flex items-center justify-between text-xs text-slate-400 font-sans px-1">
        <Text className="font-semibold text-slate-300">
          Lembar #{pageNumber} <span className="text-slate-500">•</span> Ruangan: <span className="text-blue-400 font-bold uppercase">{roomName}</span>
        </Text>
        <Text className="text-slate-400 font-mono text-[11px]">
          {items.length} label di lembar ini <span className="text-slate-600">/</span> {totalRoomItems} total
        </Text>
      </View>

      <View className="a4-sheet" id={`sheet-${pageNumber}`}>
        {/* HEADER KERTAS FISIK A4 (Mengambang Absolut di Margin Atas Kertas Cetak) */}
        <View className="sheet-paper-header">
          <View className="sheet-paper-single-title">
            <Text className="sheet-room-tag">RUANGAN:</Text>
            <Text className="sheet-room-name">{roomName}</Text>
            <Text className="sheet-header-bullet">•</Text>
            <Text className="sheet-page-info">HALAMAN {pageNumber} / {totalPages}</Text>
            <Text className="sheet-header-bullet">•</Text>
            <Text className="sheet-count-info">{items.length} ITEM DI LEMBAR INI ({totalRoomItems} TOTAL)</Text>
          </View>
        </View>

        {/* GRID 2 KOLOM LABEL */}
        <View className="sheet-grid">
          {items.map((item, idx) => (
            <LabelCard
              key={`${item.kode_barang}-${item.nup}-${idx}`}
              item={item}
              headerConfig={headerConfig}
              onUpdate={(updated) => onUpdateItem && onUpdateItem(idx, updated)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

