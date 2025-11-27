import PDFDocument from 'pdfkit';

interface InvoiceItem {
  description: string;
  sacCode?: string;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  firmName: string;
  firmAddress: string;
  firmGSTIN?: string;
  clientName: string;
  clientAddress: string;
  clientGSTIN?: string;
  clientPAN?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
}

export function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      // Collect PDF data
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Colors
      const primaryColor = '#1e40af'; // Blue
      const borderColor = '#e5e7eb'; // Light gray
      const textColor = '#1f2937'; // Dark gray

      // Page dimensions
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      const contentWidth = pageWidth - 2 * margin;

      // ========== HEADER SECTION ==========
      // Company header with logo area
      doc.rect(margin, margin, contentWidth, 80)
        .strokeColor(borderColor)
        .lineWidth(1)
        .stroke();

      // Logo area (placeholder)
      doc.rect(margin + 10, margin + 10, 60, 60)
        .fillColor(primaryColor)
        .fill()
        .fillColor(textColor);

      // Firm name
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('FinServe CA', margin + 80, margin + 15);

      // Firm address
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor(textColor)
        .text(invoiceData.firmAddress, margin + 80, margin + 40, {
          width: contentWidth - 90,
          align: 'left',
        });

      // GSTIN
      if (invoiceData.firmGSTIN) {
        doc.fontSize(9)
          .text(`GSTIN: ${invoiceData.firmGSTIN}`, margin + 80, margin + 60);
      }

      let currentY = margin + 100;

      // ========== TAX INVOICE TITLE ==========
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('TAX INVOICE', margin, currentY, {
          align: 'center',
        });

      currentY += 40;

      // ========== INVOICE DETAILS SECTION ==========
      doc.rect(margin, currentY, contentWidth / 2 - 5, 60)
        .strokeColor(borderColor)
        .lineWidth(1)
        .stroke();

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(textColor)
        .text('Invoice Details', margin + 10, currentY + 10);

      doc.fontSize(9)
        .font('Helvetica')
        .text(`Invoice No: ${invoiceData.invoiceNumber}`, margin + 10, currentY + 25);
      doc.text(`Date: ${invoiceData.invoiceDate}`, margin + 10, currentY + 38);
      doc.text(`Due Date: ${invoiceData.dueDate}`, margin + 10, currentY + 51);

      // ========== CLIENT DETAILS SECTION ==========
      doc.rect(margin + contentWidth / 2 + 5, currentY, contentWidth / 2 - 5, 60)
        .strokeColor(borderColor)
        .lineWidth(1)
        .stroke();

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('Bill To', margin + contentWidth / 2 + 15, currentY + 10);

      doc.fontSize(9)
        .font('Helvetica')
        .text(invoiceData.clientName, margin + contentWidth / 2 + 15, currentY + 25, {
          width: contentWidth / 2 - 25,
        });

      let clientTextY = currentY + 38;
      if (invoiceData.clientAddress) {
        doc.text(invoiceData.clientAddress, margin + contentWidth / 2 + 15, clientTextY, {
          width: contentWidth / 2 - 25,
        });
        clientTextY += 13;
      }

      if (invoiceData.clientGSTIN) {
        doc.text(`GSTIN: ${invoiceData.clientGSTIN}`, margin + contentWidth / 2 + 15, clientTextY);
        clientTextY += 13;
      }

      if (invoiceData.clientPAN) {
        doc.text(`PAN: ${invoiceData.clientPAN}`, margin + contentWidth / 2 + 15, clientTextY);
      }

      currentY += 80;

      // ========== ITEMS TABLE ==========
      const rowHeight = 25;
      const colWidths = {
        sno: 40,
        description: contentWidth - 40 - 80 - 100 - 80,
        sacCode: 80,
        amount: 100,
      };

      // Table header
      doc.rect(margin, currentY, contentWidth, rowHeight)
        .fillColor(primaryColor)
        .fill()
        .fillColor('#ffffff')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('S.No', margin + 5, currentY + 8)
        .text('Description', margin + colWidths.sno + 5, currentY + 8)
        .text('SAC Code', margin + colWidths.sno + colWidths.description + 5, currentY + 8)
        .text('Amount', margin + colWidths.sno + colWidths.description + colWidths.sacCode + 5, currentY + 8)
        .fillColor(textColor);

      currentY += rowHeight;

      // Table rows
      invoiceData.items.forEach((item, index) => {
        const rowY = currentY + index * rowHeight;

        // Row border
        doc.rect(margin, rowY, contentWidth, rowHeight)
          .strokeColor(borderColor)
          .lineWidth(0.5)
          .stroke();

        // Cell borders
        doc.moveTo(margin + colWidths.sno, rowY)
          .lineTo(margin + colWidths.sno, rowY + rowHeight)
          .strokeColor(borderColor)
          .lineWidth(0.5)
          .stroke();

        doc.moveTo(margin + colWidths.sno + colWidths.description, rowY)
          .lineTo(margin + colWidths.sno + colWidths.description, rowY + rowHeight)
          .strokeColor(borderColor)
          .lineWidth(0.5)
          .stroke();

        doc.moveTo(margin + colWidths.sno + colWidths.description + colWidths.sacCode, rowY)
          .lineTo(margin + colWidths.sno + colWidths.description + colWidths.sacCode, rowY + rowHeight)
          .strokeColor(borderColor)
          .lineWidth(0.5)
          .stroke();

        // Cell content
        doc.fontSize(9)
          .font('Helvetica')
          .text((index + 1).toString(), margin + 5, rowY + 8)
          .text(item.description, margin + colWidths.sno + 5, rowY + 8, {
            width: colWidths.description - 10,
          })
          .text(item.sacCode || '-', margin + colWidths.sno + colWidths.description + 5, rowY + 8)
          .text(`₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + colWidths.sno + colWidths.description + colWidths.sacCode + 5, rowY + 8, {
            align: 'right',
            width: colWidths.amount - 10,
          });
      });

      currentY += invoiceData.items.length * rowHeight + 20;

      // ========== TOTALS SECTION ==========
      const totalsX = margin + contentWidth - 200;

      // Subtotal
      doc.fontSize(10)
        .font('Helvetica')
        .text('Subtotal:', totalsX, currentY, { width: 100 })
        .text(`₹${invoiceData.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, totalsX + 100, currentY, {
          align: 'right',
          width: 100,
        });

      currentY += 20;

      // GST
      const gstAmount = invoiceData.taxAmount;
      const gstRate = invoiceData.items[0]?.sacCode ? 18 : 18; // Default 18%
      doc.text(`GST (${gstRate}%):`, totalsX, currentY, { width: 100 })
        .text(`₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, totalsX + 100, currentY, {
          align: 'right',
          width: 100,
        });

      currentY += 20;

      // Total
      const total = invoiceData.totalAmount;
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Total:', totalsX, currentY, { width: 100 })
        .text(`₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, totalsX + 100, currentY, {
          align: 'right',
          width: 100,
        });

      currentY += 40;

      // ========== PAYMENT TERMS SECTION ==========
      if (invoiceData.paymentTerms) {
        doc.rect(margin, currentY, contentWidth, 40)
          .strokeColor(borderColor)
          .lineWidth(1)
          .stroke();

        doc.fontSize(10)
          .font('Helvetica-Bold')
          .text('Payment Terms', margin + 10, currentY + 10);

        doc.fontSize(9)
          .font('Helvetica')
          .text(invoiceData.paymentTerms, margin + 10, currentY + 25, {
            width: contentWidth - 20,
          });

        currentY += 60;
      }

      // ========== BANK DETAILS SECTION ==========
      if (invoiceData.bankAccountName || invoiceData.bankAccountNumber) {
        doc.rect(margin, currentY, contentWidth / 2 - 5, 60)
          .strokeColor(borderColor)
          .lineWidth(1)
          .stroke();

        doc.fontSize(10)
          .font('Helvetica-Bold')
          .text('Bank Details', margin + 10, currentY + 10);

        doc.fontSize(9)
          .font('Helvetica');

        let bankY = currentY + 25;
        if (invoiceData.bankAccountName) {
          doc.text(`Account Name: ${invoiceData.bankAccountName}`, margin + 10, bankY);
          bankY += 13;
        }
        if (invoiceData.bankAccountNumber) {
          doc.text(`Account Number: ${invoiceData.bankAccountNumber}`, margin + 10, bankY);
          bankY += 13;
        }
        if (invoiceData.bankIFSC) {
          doc.text(`IFSC: ${invoiceData.bankIFSC}`, margin + 10, bankY);
          bankY += 13;
        }
        if (invoiceData.bankName) {
          doc.text(`Bank: ${invoiceData.bankName}`, margin + 10, bankY);
        }

        currentY += 80;
      }

      // ========== FOOTER SECTION ==========
      const footerY = pageHeight - margin - 60;
      doc.rect(margin, footerY, contentWidth, 60)
        .strokeColor(borderColor)
        .lineWidth(1)
        .stroke();

      // Signature area
      doc.fontSize(9)
        .font('Helvetica')
        .text('Authorized Signatory', margin + 10, footerY + 10);

      doc.rect(margin + 10, footerY + 30, 120, 20)
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .stroke();

      // Footer text
      doc.fontSize(8)
        .fillColor('#6b7280')
        .text('This is a computer-generated invoice.', margin + contentWidth / 2, footerY + 40, {
          align: 'center',
          width: contentWidth / 2,
        });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

