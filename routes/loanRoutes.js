/**
 * SMART FUND - Loan Routes
 */
const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const scheduleController = require('../controllers/scheduleController');
const { authUser, optionalAuth } = require('../middleware/auth');
const { validateLoanApplication } = require('../middleware/validate');

// Public
router.post('/simulate', loanController.simulate);

// Auth user
router.post('/apply', authUser, validateLoanApplication, loanController.applyLoan);
router.get('/my', authUser, loanController.myLoans);
router.get('/schedule/active', authUser, scheduleController.getActiveSchedule);
router.get('/:id/schedule', authUser, scheduleController.getSchedule);
router.get('/:id/schedule/pdf', authUser, scheduleController.downloadPdf);
router.get('/:id/schedule/excel', authUser, scheduleController.downloadExcel);
router.get('/:id', authUser, loanController.loanDetail);

module.exports = router;