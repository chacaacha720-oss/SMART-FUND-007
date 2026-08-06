/**
 * SMART FUND - Withdrawal Routes
 */
const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { authAdmin } = require('../middleware/auth');
const { authUser } = require('../middleware/auth');

// Public - user endpoints (require auth)
router.post('/', authUser, withdrawalController.createWithdrawal);
router.get('/user', authUser, withdrawalController.getUserWithdrawals);
router.get('/:id', authUser, withdrawalController.getWithdrawal);

// Admin endpoints (require admin auth)
router.get('/', authAdmin, withdrawalController.listWithdrawals);
router.put('/:id/status', authAdmin, withdrawalController.updateWithdrawalStatus);

module.exports = router;