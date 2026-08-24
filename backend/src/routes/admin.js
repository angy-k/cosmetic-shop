const express = require('express');
const router = express.Router();

const { getStats, listUsers, updateUserRole, toggleUserActive } = require('../controllers/adminController');
const { authenticate, adminOnly } = require('../middleware/auth');

router.get('/stats', authenticate, adminOnly, getStats);

router.get('/users', authenticate, adminOnly, listUsers);
router.put('/users/:id/role', authenticate, adminOnly, updateUserRole);
router.put('/users/:id/status', authenticate, adminOnly, toggleUserActive);

module.exports = router;
