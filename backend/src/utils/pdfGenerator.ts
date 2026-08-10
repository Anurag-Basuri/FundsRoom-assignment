import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface InvoiceItem {
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
}

interface InvoiceData {
  challan_number: string;
  created_at: Date;
  confirmed_at: Date | null;
  customer_name: string;
  customer_mobile: string;
  customer_email: string | null;
  customer_business_name: string | null;
  customer_gst_number: string | null;
  customer_address: string | null;
  items: InvoiceItem[];
  total_quantity: number;
  total_amount: number;
  created_by_name: string;
}

export const generateInvoicePDF = (res: Response, data: InvoiceData): void => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Invoice-${data.challan_number}.pdf`);

  doc.pipe(res);

  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').text('Mini ERP + CRM Operations Portal', { align: 'center' });
  doc.moveDown(0.3);

  // Challan info
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
  doc.moveDown(0.5);

  doc.fontSize(10).font('Helvetica-Bold');
  doc.text(`Challan Number: ${data.challan_number}`, 50);
  doc.text(`Date: ${new Date(data.created_at).toLocaleDateString('en-IN')}`, 50);
  if (data.confirmed_at) {
    doc.text(`Confirmed: ${new Date(data.confirmed_at).toLocaleDateString('en-IN')}`, 50);
  }
  doc.text(`Created By: ${data.created_by_name}`, 50);
  doc.moveDown(1);

  // Customer info
  doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50);
  doc.fontSize(10).font('Helvetica');
  doc.text(data.customer_name, 50);
  if (data.customer_business_name) doc.text(data.customer_business_name, 50);
  doc.text(`Mobile: ${data.customer_mobile}`, 50);
  if (data.customer_email) doc.text(`Email: ${data.customer_email}`, 50);
  if (data.customer_gst_number) doc.text(`GST: ${data.customer_gst_number}`, 50);
  if (data.customer_address) doc.text(`Address: ${data.customer_address}`, 50);
  doc.moveDown(1);

  // Table header
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
  doc.moveDown(0.3);

  const tableTop = doc.y;
  const colX = { idx: 50, product: 80, sku: 230, price: 330, qty: 420, total: 480 };

  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('#', colX.idx, tableTop, { width: 25 });
  doc.text('Product', colX.product, tableTop, { width: 140 });
  doc.text('SKU', colX.sku, tableTop, { width: 90 });
  doc.text('Unit Price', colX.price, tableTop, { width: 80 });
  doc.text('Qty', colX.qty, tableTop, { width: 50 });
  doc.text('Amount', colX.total, tableTop, { width: 65 });

  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
  doc.moveDown(0.3);

  // Table rows
  doc.font('Helvetica').fontSize(9);
  data.items.forEach((item, i) => {
    const y = doc.y;
    const lineTotal = item.unit_price_snapshot * item.quantity;

    doc.text(String(i + 1), colX.idx, y, { width: 25 });
    doc.text(item.product_name_snapshot, colX.product, y, { width: 140 });
    doc.text(item.sku_snapshot, colX.sku, y, { width: 90 });
    doc.text(`₹${item.unit_price_snapshot.toFixed(2)}`, colX.price, y, { width: 80 });
    doc.text(String(item.quantity), colX.qty, y, { width: 50 });
    doc.text(`₹${lineTotal.toFixed(2)}`, colX.total, y, { width: 65 });

    doc.moveDown(0.8);
  });

  // Totals
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(`Total Quantity: ${data.total_quantity}`, 330);
  doc.text(`Total Amount: ₹${data.total_amount.toFixed(2)}`, 330);

  doc.moveDown(3);
  doc.fontSize(8).font('Helvetica').fillColor('#888888');
  doc.text('This is a computer-generated invoice. No signature required.', 50, doc.y, { align: 'center' });

  doc.end();
};
