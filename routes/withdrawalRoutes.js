/**
 * SMART FUND - Withdrawal Routes
 * 
 * User endpoints:  /api/withdrawals/*
 * Admin endpoints: /api/admin/withdrawals/*
 */
const express = require('express');
const router = express.Router();
const { authUser } = require('../middleware/auth');
const { authAdmin } = require('../middleware/auth');
const withdrawalController = require('../controllers/withdrawalController');

// ================== USER ENDPOINTS ==================
// POST   /api/withdrawals         - Create withdrawal request
// GET    /api/withdrawals/user    - Get current user's withdrawals
// GET    /api/withdrawals/:id     - Get single withdrawal detail
router.post('/',          authUser, withdrawalController.createWithdrawal);
router.get('/user',       authUser, withdrawalController.getUserWithdrawals);
router.get('/:id',        authUser, withdrawalController.getWithdrawal);

module.exports = router;

// ================== ADMIN ROUTER ==================
const adminRouter = express.Router();

// GET    /api/admin/withdrawals         - List all withdrawals (with search/filter)
// GET    /api/admin/withdrawals/:id     - Get single withdrawal detail
// PUT    /api/admin/withdrawals/:id/status - Update status
adminRouter.get('/',              authAdmin, withdrawalController.listWithdrawals);
adminRouter.get('/:id',           authAdmin, withdrawalController.getWithdrawal);
adminRouter.put('/:id/status',    authAdmin, withdrawalController.updateWithdrawalStatus);

module.exports.adminRouter = adminRouter;