import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Order } from '@/lib/users';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #1a3a5f',
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logo: {
    width: 120,
    height: 'auto',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a3a5f',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a3a5f',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#666',
  },
  value: {
    fontSize: 10,
    color: '#000',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a3a5f',
    padding: 8,
    marginBottom: 5,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #ddd',
  },
  tableCell: {
    fontSize: 9,
    color: '#000',
  },
  currencyCell: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  pesoSymbol: {
    fontSize: 9,
    color: '#000',
    marginRight: 5,
  },
  col1: { width: '35%' },
  col2: { width: '15%' },
  col3: { width: '15%' },
  col4: { width: '15%' },
  col5: { width: '20%' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 10,
    borderTop: '2 solid #1a3a5f',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a3a5f',
    marginRight: 15,
  },
  totalValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
    justifyContent: 'flex-end',
  },
  totalPesoSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a3a5f',
    marginRight: 6,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a3a5f',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #ddd',
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
});

interface InvoicePDFProps {
  order: Order;
  logoBase64?: string;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ order, logoBase64 }) => {
  const invoiceDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoBase64 && (
              <Image
                src={logoBase64}
                style={styles.logo}
                alt="Logo"
              />
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.subtitle}>Invoice Date: {invoiceDate}</Text>
            <Text style={styles.subtitle}>Invoice #: {order.id}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <Text style={styles.value}>{order.store?.name || 'N/A'}</Text>
          {order.store?.email && <Text style={styles.label}>{order.store.email}</Text>}
          {order.store?.phone && <Text style={styles.label}>{order.store.phone}</Text>}
          {order.shipping_address && <Text style={styles.label}>{order.shipping_address}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supplier:</Text>
          <Text style={styles.value}>{order.supplier?.name || 'N/A'}</Text>
          {order.supplier?.email && <Text style={styles.label}>{order.supplier.email}</Text>}
          {order.supplier?.phone && <Text style={styles.label}>{order.supplier.phone}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Product</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>SKU</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Quantity</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.col5]}>Subtotal</Text>
          </View>
          {order.order_items?.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>{item.product?.name || 'N/A'}</Text>
              <Text style={[styles.tableCell, styles.col2]}>{item.product?.sku || '-'}</Text>
              <Text style={[styles.tableCell, styles.col3]}>{item.quantity}</Text>
              <View style={[styles.currencyCell, styles.col4]}>
                <Text style={styles.pesoSymbol}>₱</Text>
                <Text style={styles.tableCell}>
                  {item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={[styles.currencyCell, styles.col5]}>
                <Text style={styles.pesoSymbol}>₱</Text>
                <Text style={styles.tableCell}>
                  {item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <View style={styles.totalValueContainer}>
            <Text style={styles.totalPesoSymbol}>₱</Text>
            <Text style={styles.totalValue}>
              {order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes:</Text>
            <Text style={styles.value}>{order.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>Siargao Trading Road</Text>
        </View>
      </Page>
    </Document>
  );
};

