const express = require('express');
const router = express.Router();

const { listProducts, getProductById, createProduct, updateProduct, softDeleteProduct } = require('../controllers/productController');
const { optionalAuth, authenticate, adminOnly } = require('../middleware/auth');

// Public endpoints (optional auth to allow admin-specific queries like includeInactive)
router.get('/', optionalAuth, listProducts);
router.get('/:id', optionalAuth, getProductById);

// Admin-only endpoints
router.post('/', authenticate, adminOnly, createProduct);
router.put('/:id', authenticate, adminOnly, updateProduct);
router.delete('/:id', authenticate, adminOnly, softDeleteProduct);

module.exports = router;
