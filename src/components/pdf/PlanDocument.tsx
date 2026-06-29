import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register a font that supports Turkish characters
Font.register({
  family: 'NotoSans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.0/files/noto-sans-latin-400-normal.woff', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.0/files/noto-sans-latin-700-normal.woff', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSans',
    fontSize: 10,
    padding: 40,
    color: '#1c1917',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#2d8f6a',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#2d8f6a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#57534e',
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 30,
  },
  infoItem: {
    fontSize: 10,
  },
  infoLabel: {
    color: '#78716c',
    marginBottom: 2,
  },
  infoValue: {
    fontWeight: 700,
    color: '#1c1917',
  },
  daySection: {
    marginTop: 16,
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1c1917',
    backgroundColor: '#f5f5f4',
    padding: '6 10',
    borderRadius: 4,
    marginBottom: 8,
  },
  slotSection: {
    marginBottom: 10,
    marginLeft: 8,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  slotBadge: {
    fontSize: 8,
    fontWeight: 700,
    color: '#ffffff',
    backgroundColor: '#2d8f6a',
    padding: '2 6',
    borderRadius: 3,
  },
  slotBadgeSnack: {
    backgroundColor: '#f59e0b',
    color: '#1c1917',
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#44403c',
  },
  table: {
    marginLeft: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
    paddingBottom: 3,
    marginBottom: 3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f5f5f4',
  },
  colFood: { width: '40%' },
  colQty: { width: '15%', textAlign: 'center' as const },
  colCal: { width: '12%', textAlign: 'right' as const },
  colP: { width: '11%', textAlign: 'right' as const },
  colC: { width: '11%', textAlign: 'right' as const },
  colF: { width: '11%', textAlign: 'right' as const },
  headerCell: {
    fontSize: 8,
    fontWeight: 700,
    color: '#78716c',
    textTransform: 'uppercase' as const,
  },
  cell: {
    fontSize: 9,
    color: '#44403c',
  },
  totalRow: {
    flexDirection: 'row',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#d6d3d1',
    marginTop: 2,
  },
  totalCell: {
    fontSize: 9,
    fontWeight: 700,
    color: '#1c1917',
  },
  notes: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#fafaf9',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#2d8f6a',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#44403c',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#57534e',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#a8a29e',
    borderTopWidth: 0.5,
    borderTopColor: '#e7e5e4',
    paddingTop: 6,
  },
});

interface PlanDocumentProps {
  data: {
    plan: { title: string; notes?: string | null };
    dietitian: { display_name: string; clinic_name?: string | null } | null;
    client: { name: string; goal?: string | null } | null;
    days: {
      day_number: number;
      label?: string | null;
      slots: {
        slot_type: string;
        label: string;
        items: {
          quantity: number;
          unit: string;
          food?: {
            name: string;
            calories: number;
            protein: number;
            carbohydrate: number;
            fat: number;
            serving_size: number;
          } | null;
        }[];
      }[];
    }[];
  };
}

export function PlanDocument({ data }: PlanDocumentProps) {
  const { plan, dietitian, client, days } = data;
  const date = new Date().toLocaleDateString('tr-TR');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {dietitian?.clinic_name || dietitian?.display_name || 'Dieter'}
          </Text>
          <Text style={styles.headerSubtitle}>{plan.title}</Text>
          <View style={styles.infoRow}>
            {client && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Danışan</Text>
                <Text style={styles.infoValue}>{client.name}</Text>
              </View>
            )}
            {dietitian && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Hazırlayan</Text>
                <Text style={styles.infoValue}>{dietitian.display_name}</Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tarih</Text>
              <Text style={styles.infoValue}>{date}</Text>
            </View>
          </View>
        </View>

        {/* Days */}
        {days.map((day) => (
          <View key={day.day_number} style={styles.daySection} wrap={false}>
            <Text style={styles.dayTitle}>
              {day.label || `Gün ${day.day_number}`}
            </Text>

            {day.slots.map((slot, slotIdx) => {
              let slotCalories = 0;
              let slotProtein = 0;
              let slotCarbs = 0;
              let slotFat = 0;

              return (
                <View key={slotIdx} style={styles.slotSection}>
                  <View style={styles.slotHeader}>
                    <Text
                      style={[
                        styles.slotBadge,
                        slot.slot_type === 'snack' ? styles.slotBadgeSnack : {},
                      ]}
                    >
                      {slot.slot_type === 'main' ? 'ANA' : 'ARA'}
                    </Text>
                    <Text style={styles.slotLabel}>{slot.label}</Text>
                  </View>

                  <View style={styles.table}>
                    {/* Table header */}
                    <View style={styles.tableHeader}>
                      <Text style={[styles.headerCell, styles.colFood]}>Yiyecek</Text>
                      <Text style={[styles.headerCell, styles.colQty]}>Miktar</Text>
                      <Text style={[styles.headerCell, styles.colCal]}>kcal</Text>
                      <Text style={[styles.headerCell, styles.colP]}>P (g)</Text>
                      <Text style={[styles.headerCell, styles.colC]}>K (g)</Text>
                      <Text style={[styles.headerCell, styles.colF]}>Y (g)</Text>
                    </View>

                    {/* Items */}
                    {slot.items.map((item, itemIdx) => {
                      const scale = item.food
                        ? item.quantity / item.food.serving_size
                        : 0;
                      const cal = Math.round((item.food?.calories ?? 0) * scale);
                      const p = Math.round(((item.food?.protein ?? 0) * scale) * 10) / 10;
                      const c = Math.round(((item.food?.carbohydrate ?? 0) * scale) * 10) / 10;
                      const f = Math.round(((item.food?.fat ?? 0) * scale) * 10) / 10;

                      slotCalories += cal;
                      slotProtein += p;
                      slotCarbs += c;
                      slotFat += f;

                      return (
                        <View key={itemIdx} style={styles.tableRow}>
                          <Text style={[styles.cell, styles.colFood]}>
                            {item.food?.name || '-'}
                          </Text>
                          <Text style={[styles.cell, styles.colQty]}>
                            {item.quantity} {item.unit}
                          </Text>
                          <Text style={[styles.cell, styles.colCal]}>{cal}</Text>
                          <Text style={[styles.cell, styles.colP]}>{p}</Text>
                          <Text style={[styles.cell, styles.colC]}>{c}</Text>
                          <Text style={[styles.cell, styles.colF]}>{f}</Text>
                        </View>
                      );
                    })}

                    {/* Slot total */}
                    {slot.items.length > 0 && (
                      <View style={styles.totalRow}>
                        <Text style={[styles.totalCell, styles.colFood]}>Toplam</Text>
                        <Text style={[styles.totalCell, styles.colQty]}></Text>
                        <Text style={[styles.totalCell, styles.colCal]}>{slotCalories}</Text>
                        <Text style={[styles.totalCell, styles.colP]}>{Math.round(slotProtein * 10) / 10}</Text>
                        <Text style={[styles.totalCell, styles.colC]}>{Math.round(slotCarbs * 10) / 10}</Text>
                        <Text style={[styles.totalCell, styles.colF]}>{Math.round(slotFat * 10) / 10}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* Notes */}
        {plan.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notlar</Text>
            <Text style={styles.notesText}>{plan.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Dieter ile oluşturuldu</Text>
          <Text render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
