const { Product, Order } = require('../models');
const { optionalAuth, authenticate, adminOnly } = require('../middleware/auth');

const parseBoolean = (val) => {
  if (val === undefined) return undefined;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return ['true', '1', 'yes', 'on'].includes(val.toLowerCase());
  return undefined;
};

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      tags,
      isFeatured,
      isOnSale,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 12,
      includeInactive
    } = req.query;

    const filter = {};

    const incInactive = parseBoolean(includeInactive);
    if (!(req.user && req.user.role === 'admin' && incInactive)) {
      filter.isActive = true;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) filter.category = category;
    // Partial, case-insensitive match - brand is free text, so an exact match
    // would force the UI filter to reproduce the stored casing/spacing exactly.
    if (brand) filter.brand = { $regex: escapeRegex(brand), $options: 'i' };

    if (tags) {
      const tagArr = Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      if (tagArr.length) filter.tags = { $in: tagArr };
    }

    const featured = parseBoolean(isFeatured);
    if (featured !== undefined) filter.isFeatured = featured;

    const onSale = parseBoolean(isOnSale);
    if (onSale !== undefined) filter.isOnSale = onSale;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortSpec = { createdAt: -1 };
    if (sort) {
      const allowed = new Set(['price', '-price', 'createdAt', '-createdAt', 'rating', '-rating']);
      if (allowed.has(sort)) {
        if (sort === 'rating') sortSpec = { 'rating.average': 1 };
        else if (sort === '-rating') sortSpec = { 'rating.average': -1 };
        else if (sort.startsWith('-')) sortSpec = { [sort.slice(1)]: -1 };
        else sortSpec = { [sort]: 1 };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sortSpec).skip(skip).limit(limitNum),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Products fetched successfully',
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
};

// Distinct brand names, for populating a filter dropdown on the products page
const listBrands = async (req, res) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    res.json({ success: true, data: { brands: brands.filter(Boolean).sort() } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching brands' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const incInactive = parseBoolean(req.query.includeInactive);

    const filter = { _id: id };
    if (!(req.user && req.user.role === 'admin' && incInactive)) {
      filter.isActive = true;
    }

    const product = await Product.findOne(filter);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product fetched successfully', data: { product } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching product' });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    res.status(201).json({ success: true, message: 'Product created successfully', data: { product } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      if (error.errors && typeof error.errors === 'object') {
        const errors = Object.values(error.errors).map(err => ({ field: err.path, message: err.message }));
        return res.status(400).json({ success: false, message: 'Validation failed', errors });
      }
      return res.status(400).json({ success: false, message: error.message || 'Validation failed' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate key error', keyValue: error.keyValue });
    }
    res.status(500).json({ success: false, message: 'Error creating product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product updated successfully', data: { product } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      if (error.errors && typeof error.errors === 'object') {
        const errors = Object.values(error.errors).map(err => ({ field: err.path, message: err.message }));
        return res.status(400).json({ success: false, message: 'Validation failed', errors });
      }
      return res.status(400).json({ success: false, message: error.message || 'Validation failed' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate key error', keyValue: error.keyValue });
    }
    res.status(500).json({ success: false, message: 'Error updating product' });
  }
};

const softDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deactivated successfully', data: { product } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting product' });
  }
};

/**
 * Add (or update) the logged-in user's review for a product.
 * Admin accounts don't shop, so - same reasoning as hiding cart/orders for
 * them elsewhere in the app - they can't leave reviews either.
 * @route POST /api/products/:id/reviews
 * @access Private (registered user, not admin)
 */
const addProductReview = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot leave product reviews' });
    }

    const { id } = req.params;
    const { rating, comment } = req.body || {};

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5' });
    }
    if (comment && String(comment).length > 500) {
      return res.status(400).json({ success: false, message: 'Comment cannot exceed 500 characters' });
    }

    const product = await Product.findOne({ _id: id, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // "Verified Purchase" badge - true if this user has a paid order containing this product
    const hasPurchased = await Order.exists({
      user: req.user._id,
      'items.product': id,
      'payment.status': 'completed'
    });

    product.reviews = product.reviews.filter((review) => !review.user.equals(req.user._id));
    product.reviews.push({
      user: req.user._id,
      rating: numericRating,
      comment: comment ? String(comment).trim() : '',
      isVerified: !!hasPurchased
    });
    product.calculateAverageRating();
    await product.save();

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: { rating: product.rating, reviews: product.reviews }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message || 'Validation failed' });
    }
    console.error('Error adding product review:', error);
    res.status(500).json({ success: false, message: 'Error submitting review' });
  }
};

module.exports = {
  listProducts,
  listBrands,
  getProductById,
  createProduct,
  updateProduct,
  softDeleteProduct,
  addProductReview
};
