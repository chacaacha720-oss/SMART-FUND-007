/**
 * SMART FUND - Loan Routes
 */
const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { authUser, optionalAuth } = require('../middleware/auth');
const { validateLoanApplication } = require('../middleware/validate');

// Public
router.post('/simulate', loanController.simulate);

// Auth user
router.post('/apply', authUser, validateLoanApplication, loanController.applyLoan);
router.get('/my', authUser, loanController.myLoans);
router.get('/:id', authUser, loanController.loanDetail);

module.exports = router;