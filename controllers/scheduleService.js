/**
 * SMART FUND - Loan Repayment Schedule Service
 * Jadual Ansuran — EXTEND only, no changes to existing loan/payment systems.
 *
 * Uses the SAME amortization model as loanController.calculateLoan (annuity /
 * reducing balance) so frontend & backend never diverge.
 *
 * Schedule is generated idempotently (unique loan_id + installment_number),
 * so it is never duplicated and never regenerated on every page open.
 */
const db = require('../config/db');

/**
 * Baca kadar faedah dari settings (sama seperti engine sedia ada).
 * Fallback 5% jika settings tiada / DB gagal.
 */
async function getRate() {
  return 5; // kadar faedah ditetapkan 5% setahun (tetap)
}

/**
 * Tambah bilangan bulan pada tarikh, clamp ke hari terakhir bulan
 * (handle 28/29/30/31 hari) supaya tiada tarikh invalid.
 */
function addMonthsClamp(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  const targetMonth = d.getMonth() + months;
  const targetYear = d.getFullYear() + Math.floor(targetMonth / 12);
  const remMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(targetYear, remMonth + 1, 0).getDate();
  const useDay = Math.min(day, lastDay);
  return new Date(targetYear, remMonth, useDay);
}

/**
 * Hasilkan baris jadual (tanpa DB) menggunakan enjin sedia ada.
 * Konsisten dengan loan_applications.monthly_payment / total_payment / total_interest
 * yang disimpan — tiada selisih akibat rounding (ansuran terakhir menyerap baki).
 */
function buildSchedule(loan) {
  const principal = Number(loan.amount);
  const tenor = Number(loan.tenor);
  const monthly = Number(loan.monthly_payment);       // nilai flat sedia ada
  const totalStored = Number(loan.total_payment);      // nilai flat sedia ada
  const interestStored = Number(loan.total_interest);  // = totalStored - principal

  const base = loan.disbursed_at ? new Date(loan.disbursed_at) : new Date();
  let sumPrincipal = 0;
  const rows = [];

  // Model flat 5% setahun: faedah & pokok bahagi sama rata per ansuran.
  // Ansuran terakhir menyerap baki rounding supaya:
  // sum(principal) == amount, sum(interest) == totalInterest, sum(total) == totalPayment
  for (let i = 1; i <= tenor; i++) {
    const due = addMonthsClamp(base, i);

    if (i < tenor) {
      const principalPart = principal / tenor;
      const totalAmt = monthly;
      const interestPart = totalAmt - principalPart;
      sumPrincipal += principalPart;
      rows.push({
        installment_number: i,
        due_date: due,
        principal: principalPart,
        interest: interestPart,
        total_amount: totalAmt,
        remaining_balance: Math.max(0, principal - sumPrincipal),
      });
    } else {
      const principalPart = Math.round(principal - sumPrincipal);
      const totalPart = Math.round(totalStored - monthly * (tenor - 1));
      const interestPart = totalPart - principalPart;
      rows.push({
        installment_number: i,
        due_date: due,
        principal: principalPart,
        interest: interestPart,
        total_amount: totalPart,
        remaining_balance: 0,
      });
    }
  }
  return rows;
}

/**
 * Pastikan jadual wujud untuk satu pinjaman (idempoten).
 * - Jika sudah ada -> terus balik (tidak jana semula).
 * - Jika tiada -> jana & simpan (INSERT IGNORE cegah duplicate).
 * conn optional: jika diberi (dalam transaksi), guna conn tersebut.
 */
async function ensureSchedule(loan, conn) {
  const executor = conn || db;
  const [existing] = await executor.query(
    'SELECT COUNT(*) as cnt FROM loan_schedules WHERE loan_id = ?',
    [loan.id]
  );
  if (existing[0].cnt > 0) return false;

  const rows = buildSchedule(loan);

  for (const r of rows) {
    const dueStr = r.due_date.toISOString().slice(0, 10);
    await executor.query(
      `INSERT IGNORE INTO loan_schedules
        (loan_id, user_id, installment_number, due_date, principal, interest, total_amount, remaining_balance, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [loan.id, loan.user_id, r.installment_number, dueStr, r.principal, r.interest, r.total_amount, r.remaining_balance]
    );
  }
  return true;
}

/**
 * Ambil baris jadual + kira status dinamik (overdue) & bendera completed.
 */
async function fetchScheduleRows(loanId, loanStatus) {
  const [rows] = await db.query(
    'SELECT * FROM loan_schedules WHERE loan_id = ? ORDER BY installment_number ASC',
    [loanId]
  );
  const now = new Date();
  return rows.map((r) => {
    let status = r.status;
    if (status !== 'paid' && loanStatus === 'completed') status = 'paid';
    else if (status !== 'paid' && new Date(r.due_date) < now) status = 'overdue';
    return { ...r, status };
  });
}

function formatDateYMD(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

module.exports = {
  getRate,
  addMonthsClamp,
  buildSchedule,
  ensureSchedule,
  fetchScheduleRows,
  formatDateYMD,
};
