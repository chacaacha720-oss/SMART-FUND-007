/**
 * SMART FUND - Loan Repayment Schedule Controller
 * Jadual Ansuran pada Baki Aktif.
 *
 * ENDPOINT (semua perlu auth user + authorization milikan pinjaman):
 *   GET  /api/loans/schedule/active        -> jadual pinjaman aktif user
 *   GET  /api/loans/:id/schedule           -> jadual pinjaman (milik user sahaja)
 *   GET  /api/loans/:id/schedule/pdf        -> muat turun PDF
 *   GET  /api/loans/:id/schedule/excel      -> muat turun Excel (CSV .xlsx)
 *
 * Tidak mengubah sistem pinjaman/pembayaran/Telegram/admin sedia ada.
 */
const db = require('../config/db');
const { t } = require('../config/i18n');
const scheduleService = require('./scheduleService');

const STATUS_LABEL = {
  pending: 'Belum Dibayar',
  paid: 'Sudah Dibayar',
  overdue: 'Lewat',
};

// Pilih pinjaman aktif (disbursed) milik user, atau pinjaman tertentu dgn cek milikan.
async function resolveLoan(req, res, loanId) {
  const userId = req.user.id;
  let loan;
  if (loanId) {
    const [rows] = await db.query(
      `SELECT la.id, la.user_id, la.amount, la.tenor, la.monthly_payment, la.total_interest, la.total_payment, la.status, la.disbursed_at, la.created_at, u.full_name as user_name
       FROM loan_applications la LEFT JOIN users u ON la.user_id = u.id
       WHERE la.id = ? AND la.user_id = ?`,
      [loanId, userId]
    );
    if (rows.length === 0) return null; // 404 / bukan milik user
    loan = rows[0];
  } else {
    const [rows] = await db.query(
      `SELECT la.id, la.user_id, la.amount, la.tenor, la.monthly_payment, la.total_interest, la.total_payment, la.status, la.disbursed_at, la.created_at, u.full_name as user_name
       FROM loan_applications la LEFT JOIN users u ON la.user_id = u.id
       WHERE la.user_id = ? AND la.status = 'disbursed' ORDER BY la.disbursed_at DESC LIMIT 1`,
      [userId]
    );
    if (rows.length === 0) return false; // tiada pinjaman aktif
    loan = rows[0];
  }
  return loan;
}

function buildResponse(loan, rows) {
  const next = rows.find((r) => r.status !== 'paid');
  return {
    hasActiveLoan: true,
    ready: true,
    loan: {
      id: loan.id,
      amount: Number(loan.amount),
      tenor: Number(loan.tenor),
      monthly_payment: Number(loan.monthly_payment),
      total_interest: Number(loan.total_interest),
      total_payment: Number(loan.total_payment),
      status: loan.status,
      disbursed_at: loan.disbursed_at,
    },
    next_payment_date: next ? next.due_date : null,
    schedule: rows.map((r) => ({
      installment_number: r.installment_number,
      due_date: r.due_date,
      principal: Number(r.principal),
      interest: Number(r.interest),
      total_amount: Number(r.total_amount),
      remaining_balance: Number(r.remaining_balance),
      status: r.status,
      paid_at: r.paid_at,
    })),
  };
}

// ===================== API =====================

async function getActiveSchedule(req, res) {
  const lang = req.lang || 'ms';
  try {
    const loan = await resolveLoan(req, res); // tanpa loanId -> aktif
    if (loan === false) {
      return res.json({ success: true, data: { hasActiveLoan: false, loan: null, schedule: null, ready: false } });
    }
    if (loan === null) {
      return res.status(404).json({ success: false, message: t(lang, 'loan.notFound') });
    }
    await scheduleService.ensureSchedule(loan);
    const rows = await scheduleService.fetchScheduleRows(loan.id, loan.status);
    return res.json({ success: true, data: buildResponse(loan, rows) });
  } catch (err) {
    console.error('Active schedule error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

async function getSchedule(req, res) {
  const lang = req.lang || 'ms';
  try {
    const loan = await resolveLoan(req, res, req.params.id);
    if (loan === null) {
      return res.status(404).json({ success: false, message: t(lang, 'loan.notFound') });
    }
    if (loan === false) {
      return res.json({ success: true, data: { hasActiveLoan: false, loan: null, schedule: null, ready: false } });
    }
    await scheduleService.ensureSchedule(loan);
    const rows = await scheduleService.fetchScheduleRows(loan.id, loan.status);
    return res.json({ success: true, data: buildResponse(loan, rows) });
  } catch (err) {
    console.error('Schedule error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

// ===================== PDF (tanpa dependency baru) =====================

function sanitizeAscii(str) {
  return String(str)
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function createPdf(lines) {
  const body = lines.map((l) => `(${sanitizeAscii(l)}) Tj\nT*`).join('');
  const stream = `BT\n/F1 11 Tf\n40 790 Td\n15 TL\n${body}ET`;
  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

async function downloadPdf(req, res) {
  const lang = req.lang || 'ms';
  try {
    const loan = await resolveLoan(req, res, req.params.id);
    if (loan === null || loan === false) {
      return res.status(404).json({ success: false, message: t(lang, 'loan.notFound') });
    }
    await scheduleService.ensureSchedule(loan);
    const rows = await scheduleService.fetchScheduleRows(loan.id, loan.status);

    const fmt = (n) => Number(n).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDate = (d) => scheduleService.formatDateYMD(d);
    const lines = [];
    lines.push('JADUAL ANSURAN PINJAMAN');
    lines.push('========================================');
    lines.push(`Nama Pengguna : ${loan.user_name || ('ID ' + loan.user_id)}`);
    lines.push(`No. Pinjaman  : LN-${loan.id}`);
    lines.push(`Jumlah Pinjaman: RM ${fmt(loan.amount)}`);
    lines.push(`Kadar Faedah  : ${await scheduleService.getRate()}% setahun`);
    lines.push(`Tempoh        : ${loan.tenor} bulan`);
    lines.push(`Ansuran Bulanan: RM ${fmt(loan.monthly_payment)}`);
    lines.push('========================================');
    lines.push('Bil  Tarikh      Pokok        Faedah       Jumlah       Baki         Status');
    rows.forEach((r) => {
      const bil = String(r.installment_number).padEnd(4);
      const tgl = fmtDate(r.due_date).padEnd(11);
      const pok = (`RM ${fmt(r.principal)}`).padEnd(12);
      const fad = (`RM ${fmt(r.interest)}`).padEnd(12);
      const jum = (`RM ${fmt(r.total_amount)}`).padEnd(12);
      const bak = (`RM ${fmt(r.remaining_balance)}`).padEnd(12);
      lines.push(`${bil}${tgl}${pok}${fad}${jum}${bak}${STATUS_LABEL[r.status] || r.status}`);
    });
    lines.push('========================================');
    lines.push('Dijana secara automatik oleh SMART FUND');

    const pdfBuffer = createPdf(lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="jadual-ansuran-LN-${loan.id}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Schedule PDF error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

// ===================== EXCEL (CSV .xlsx, tanpa dependency baru) =====================

async function downloadExcel(req, res) {
  const lang = req.lang || 'ms';
  try {
    const loan = await resolveLoan(req, res, req.params.id);
    if (loan === null || loan === false) {
      return res.status(404).json({ success: false, message: t(lang, 'loan.notFound') });
    }
    await scheduleService.ensureSchedule(loan);
    const rows = await scheduleService.fetchScheduleRows(loan.id, loan.status);

    const fmt = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDate = (d) => scheduleService.formatDateYMD(d);

    const csv = [];
    csv.push('Bil,Tarikh,Pokok,Faedah,Jumlah,Baki,Status');
    rows.forEach((r) => {
      csv.push([
        r.installment_number,
        fmtDate(r.due_date),
        fmt(r.principal),
        fmt(r.interest),
        fmt(r.total_amount),
        fmt(r.remaining_balance),
        STATUS_LABEL[r.status] || r.status,
      ].join(','));
    });
    const csvString = '﻿' + csv.join('\r\n'); // BOM -> Excel baca UTF-8

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="jadual-ansuran-LN-${loan.id}.xlsx"`);
    return res.send(csvString);
  } catch (err) {
    console.error('Schedule Excel error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

module.exports = {
  getActiveSchedule,
  getSchedule,
  downloadPdf,
  downloadExcel,
};
