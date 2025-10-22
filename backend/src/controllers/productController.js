const { Product } = require('../models');
const { optionalAuth, authenticate, adminOnly } = require('../middleware/auth');

const parseBoolean = (val) => {
  if (val === undefined) return undefined;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return ['true', '1', 'yes', 'on'].includes(val.toLowerCase());
  return undefined;
};

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
    if (brand) filter.brand = brand;

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

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  softDeleteProduct
};
