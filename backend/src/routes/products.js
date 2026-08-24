const express = require('express');
const router = express.Router();

const { listProducts, listBrands, getProductById, createProduct, updateProduct, softDeleteProduct, addProductReview } = require('../controllers/productController');
const { optionalAuth, authenticate, adminOnly } = require('../middleware/auth');

// Public endpoints (optional auth to allow admin-specific queries like includeInactive)
router.get('/', optionalAuth, listProducts);
// Must be registered before '/:id' or Express would match "brands" as an id
router.get('/brands', listBrands);
router.get('/:id', optionalAuth, getProductById);

// Registered users (not admin - see controller): leave a review
router.post('/:id/reviews', authenticate, addProductReview);

// Admin-only endpoints
router.post('/', authenticate, adminOnly, createProduct);
router.put('/:id', authenticate, adminOnly, updateProduct);
router.delete('/:id', authenticate, adminOnly, softDeleteProduct);

module.exports = router;
