import { jsPDF } from 'jspdf';
import { Transaction } from '../types';
import { formatWATDate } from '../lib/formatters';

export function generateReceiptPdf(txn: Transaction): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background subtle card border
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(6, 6, pageWidth - 12, pageHeight - 12, 3, 3, 'FD');

  // Top Brand Header Banner
  doc.setFillColor(4, 120, 87); // emerald-700
  doc.rect(6, 6, pageWidth - 12, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SAYYADA DATASUB', 12, 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('VTU, BILL PAYMENTS & FINTECH PLATFORM', 12, 22);

  // Status Badge in header
  doc.setFillColor(209, 250, 229); // emerald-100
  doc.roundedRect(pageWidth - 36, 12, 24, 7, 1.5, 1.5, 'F');
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SUCCESS', pageWidth - 24, 16.5, { align: 'center' });

  // Receipt Title & Date
  let y = 36;
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Official Transaction Receipt', 12, y);

  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Issued: ${formatWATDate(txn.completed_at || txn.created_at)}`, pageWidth - 12, y, { align: 'right' });

  // Divider
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(12, y, pageWidth - 12, y);

  // Amount Highlight Box
  y += 6;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(12, y, pageWidth - 24, 18, 2, 2, 'F');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('AMOUNT PAID', 16, y + 6);

  const amountNgn = `NGN ${(txn.amount / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  doc.setTextColor(4, 120, 87);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(amountNgn, 16, y + 14);

  // Detail Items
  y += 24;
  const details: [string, string][] = [
    ['Transaction Reference', txn.reference],
    ['Service Category', txn.service.toUpperCase()],
    ['Provider / Network', txn.provider],
    [
      'Recipient / Destination',
      txn.recipient_details.phone ||
        txn.recipient_details.meterNo ||
        txn.recipient_details.smartcardNo ||
        txn.recipient_details.accountNumber ||
        txn.recipient_details.plateNumber ||
        'Account Credit',
    ],
  ];

  if (txn.recipient_details.customerName) {
    details.push(['Customer Name', txn.recipient_details.customerName]);
  }
  if (txn.recipient_details.planName) {
    details.push(['Product / Plan', txn.recipient_details.planName]);
  }
  if (txn.recipient_details.token) {
    details.push(['Prepaid Meter Token', txn.recipient_details.token]);
  }
  if (txn.recipient_details.units) {
    details.push(['Meter Units', txn.recipient_details.units]);
  }
  if (txn.recipient_details.pins && txn.recipient_details.pins.length > 0) {
    details.push([
      'Exam Serial & PIN',
      txn.recipient_details.pins.map((p) => `${p.serial}: ${p.pin}`).join(' | '),
    ]);
  }
  if (txn.provider_tran_id) {
    details.push(['Gateway Transaction ID', txn.provider_tran_id]);
  }

  details.forEach(([label, value]) => {
    doc.setFillColor(248, 250, 252);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 14, y);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(value, pageWidth - 14, y, { align: 'right' });

    y += 2.5;
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y, pageWidth - 14, y);
    y += 5.5;
  });

  // Footer notes & Support
  y = pageHeight - 24;
  doc.setDrawColor(226, 232, 240);
  doc.line(12, y, pageWidth - 12, y);

  y += 5;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'This is an authentic computer-generated receipt issued by Sayyada Datasub Integrated Technologies.',
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  y += 4;
  doc.text(
    'For inquiries or operator reversals, email: support@sayyadadatasub.com | Hotline: +234 814 523 9871',
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  y += 4;
  doc.setTextColor(4, 120, 87);
  doc.setFont('helvetica', 'bold');
  doc.text('https://sayyadadatasub.com · Ring Road Commercial Complex, Kano', pageWidth / 2, y, {
    align: 'center',
  });

  // Trigger download
  doc.save(`SayyadaDatasub-Receipt-${txn.reference}.pdf`);
}
