"use client"

import { Page, Text, View, Document, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11 },
  header: { marginBottom: 20, textAlign: "center" },
  logo: { fontSize: 20, fontWeight: "bold", marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 4 },
  colLeft: { width: "70%" },
  colRight: { width: "30%", textAlign: "right" },
  total: { marginTop: 12, fontWeight: "bold" },
})

export default function ReceiptPDF({
  id,
  customer,
  services,
  date,
  amount,
}: {
  id: string
  customer: { name: string; email: string }
  services: { name: string; qty: number; price: number }[]
  date: string
  amount: number
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Pat Pro Cleaning</Text>
          <Text>Invoice #{id}</Text>
          <Text>Date: {new Date(date).toLocaleDateString()}</Text>
        </View>

        {/* Customer */}
        <View style={{ marginBottom: 12 }}>
          <Text>Bill to:</Text>
          <Text>{customer.name}</Text>
          <Text>{customer.email}</Text>
        </View>

        {/* Table header */}
        <View style={[styles.row, { fontWeight: "bold" }]}>
          <Text style={styles.colLeft}>Service</Text>
          <Text style={styles.colRight}>Qty</Text>
          <Text style={styles.colRight}>Price</Text>
        </View>

        {/* Services */}
        {services.map((s, i) => (
          <View style={styles.row} key={i}>
            <Text style={styles.colLeft}>{s.name}</Text>
            <Text style={styles.colRight}>{s.qty}</Text>
            <Text style={styles.colRight}>${(s.price / 100).toFixed(2)}</Text>
          </View>
        ))}

        {/* Total */}
        <View style={[styles.row, styles.total]}>
          <Text style={styles.colLeft}>Total</Text>
          <Text style={styles.colRight}>${(amount / 100).toFixed(2)}</Text>
        </View>

        <Text style={{ marginTop: 20 }}>Thank you for your business!</Text>
      </Page>
    </Document>
  )
}