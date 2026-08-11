/**
 * SMART FUND - Loan Controller
 * Pengajuan pinjaman, riwayat, simulasi
 */
const db = require('../config/db');
const { sendTelegram, buildLoanApplicationMessage } = require('../config/telegram');
const { sanitize } = require('../middleware/validate');
const { t, formatCurrency } = require('../config/i18n');

/**
 * Hitung cicilan dengan bunga flat tahunan
 */
function calculateLoan(principal, tenorMonths, annualRatePercent = 5) {
  const principalNum = Number(principal);
  const tenorNum = Number(tenorMonths);
  const monthlyRate = Number(annualRatePercent) / 100 / 12;
  const monthlyPayment = principalNum * (monthlyRate * Math.pow(1 + monthlyRate, tenorNum)) / (Math.pow(1 + monthlyRate, tenorNum) - 1);
  const totalPayment = monthlyPayment * tenorNum;
  const totalInterest = totalPayment - principalNum;
  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
  };
}

/**
 * POST /api/loans/simulate
 * Simulasi pinjaman (public)
 */
async function simulate(req, res) {
  const lang = req.lang || 'id';
  try {
    const amount = parseFloat(req.body.amount);
    const tenor = parseInt(req.body.tenor, 10);

    // Try to get rate from DB, fallback to 5% if DB unavailable
    let rate = 5;
    try {
      const [settings] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'interest_rate'");
      if (settings.length) rate = parseFloat(settings[0].setting_value);
    } catch (dbErr) {
      // DB not available, use default rate
    }

     if (!amount || amount < 1000 || amount > 500000) {
       return res.status(400).json({ success: false, message: t(lang, 'loan.amountRange') });
     }
    if (!tenor || tenor < 6 || tenor > 60) {
      return res.status(400).json({ success: false, message: t(lang, 'loan.tenorRange') });
    }

    const calc = calculateLoan(amount, tenor, rate);
    return res.json({ success: true, data: { amount, tenor, rate, ...calc } });
  } catch (err) {
    console.error('Simulate error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * POST /api/loans/apply
 * Ajukan pinjaman (auth user)
 * Step 1: Data Diri (nama, no telpon) - sudah ada di profil
 * Step 2: Data Pinjaman (amount, tenor, purpose)
 */
async function applyLoan(req, res) {
  const lang = req.lang || 'id';
  try {
    const userId = req.user.id;
    const amount = parseFloat(req.body.amount);
    const tenor = parseInt(req.body.tenor, 10);
    const purpose = sanitize(req.body.purpose);

    if (!amount || amount < 1000000 || amount > 500000000) {
      return res.status(400).json({ success: false, message: t(lang, 'loan.amountRange') });
    }
    if (!tenor || tenor < 6 || tenor > 60) {
      return res.status(400).json({ success: false, message: t(lang, 'loan.tenorRange') });
    }
    if (!purpose) {
      return res.status(400).json({ success: false, message: t(lang, 'loan.purposeRequired') });
    }

    const [userRows] = await db.query(
      `SELECT u.*, a.cs_code, a.full_name as cs_name
       FROM users u LEFT JOIN admins a ON u.cs_id = a.id WHERE u.id = ?`,
      [userId]
    );

    if (userRows.length === 0) return res.status(404).json({ success: false, message: t(lang, 'loan.userNotFound') });
    const user = userRows[0];

    if (user.status === 'frozen') {
      return res.status(403).json({ success: false, message: t(lang, 'loan.accountFrozen') });
    }
    if (amount > user.loan_limit) {
      return res.status(400).json({ success: false, message: t(lang, 'loan.exceedLimit', user.loan_limit) });
    }

    // Reject if user has no CS assigned
    if (!user.cs_id) {
      return res.status(403).json({ success: false, message: t(lang, 'cs.noCsCode') });
    }

    // Cek apakah ada pinjaman aktif yang belum lunas
    const [activeLoans] = await db.query(
      "SELECT COUNT(*) as cnt FROM loan_applications WHERE user_id = ? AND status IN ('pending','approved','disbursed')",
      [userId]
    );
    if (activeLoans[0].cnt > 0) {
      return res.status(400).json({ success: false, message: t(lang, 'loan.hasActiveLoan') });
    }

    const [settings] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'interest_rate'");
    const rate = settings.length ? parseFloat(settings[0].setting_value) : 5;
    const calc = calculateLoan(amount, tenor, rate);

    // Simpan pengajuan (cs_id & cs_code derived server-side)
    const [result] = await db.query(
      `INSERT INTO loan_applications (user_id, cs_id, cs_code, amount, purpose, tenor, monthly_payment, total_interest, total_payment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, user.cs_id, user.cs_code, amount, purpose, tenor, calc.monthlyPayment, calc.totalInterest, calc.totalPayment]
    );
    const loanId = result.insertId;

    // Buat notifikasi untuk user
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'info')`,
      [userId, t(lang, 'loan.notifTitle'), t(lang, 'loan.notifMsg', loanId, amount)]
    );

    // Kirim notifikasi Telegram ke admin (locale-aware)
    const tgData = await buildLoanApplicationMessage({
      fullName: user.full_name,
      phone: user.phone,
      email: user.email,
      amount,
      tenor,
      purpose,
      monthlyPayment: calc.monthlyPayment,
      totalInterest: calc.totalInterest,
      totalPayment: calc.totalPayment,
      applicationId: loanId,
      userId,
      lang,
      csCode: user.cs_code,
      csName: user.cs_name,
    });
    await sendTelegram(tgData.message, { inlineKeyboard: tgData.inlineKeyboard });

    return res.json({
      success: true,
      message: t(lang, 'loan.applySuccess'),
      data: {
        applicationId: loanId,
        amount,
        tenor,
        purpose,
        monthlyPayment: calc.monthlyPayment,
        totalInterest: calc.totalInterest,
        totalPayment: calc.totalPayment,
        cs_code: user.cs_code,
        status: 'pending',
      },
    });
  } catch (err) {
    console.error('Apply loan error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * GET /api/loans/my
 * Riwayat pengajuan user yang login
 */
async function myLoans(req, res) {
  const lang = req.lang || 'id';
  try {
    const [rows] = await db.query(
       `SELECT id, amount, purpose, tenor, monthly_payment, total_interest, total_payment, status, admin_note, created_at, approved_at, disbursed_at, cs_code FROM loan_applications WHERE user_id = ? ORDER BY created_at DESC`,
       [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('My loans error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * GET /api/loans/:id
 * Detail pinjaman user
 */
async function loanDetail(req, res) {
  const lang = req.lang || 'id';
  try {
    const [rows] = await db.query(
      `SELECT * FROM loan_applications WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: t(lang, 'loan.notFound') });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Loan detail error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

module.exports = { calculateLoan, simulate, applyLoan, myLoans, loanDetail };