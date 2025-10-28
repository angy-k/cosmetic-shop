const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters long'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value >= 0;
      },
      message: 'Price must be a valid positive number'
    }
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative'],
    validate: {
      validator: function(value) {
        return value === null || value === undefined || (Number.isFinite(value) && value >= 0);
      },
      message: 'Original price must be a valid positive number'
    }
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: [
        'skincare',
        'makeup',
        'haircare',
        'fragrance',
        'bodycare',
        'tools',
        'sets',
        'other'
      ],
      message: 'Category must be one of: skincare, makeup, haircare, fragrance, bodycare, tools, sets, other'
    }
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Subcategory cannot exceed 50 characters']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9-_]+$/, 'SKU can only contain uppercase letters, numbers, hyphens, and underscores']
  },
  images: [{
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(value) {
          // Accept both HTTP/HTTPS URLs and base64 data URLs
          const httpUrlPattern = /^https?:\/\/.+/;
          const dataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,.+/i;
          return httpUrlPattern.test(value) || dataUrlPattern.test(value);
        },
        message: 'Image URL must be a valid HTTP/HTTPS URL or base64 data URL'
      }
    },
    alt: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Alt text cannot exceed 100 characters']
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  inventory: {
    quantity: {
      type: Number,
      required: [true, 'Inventory quantity is required'],
      min: [0, 'Inventory quantity cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative']
    },
    trackInventory: {
      type: Boolean,
      default: true
    }
  },
  specifications: {
    weight: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ['g', 'kg', 'ml', 'l', 'oz', 'fl oz'], default: 'ml' }
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: { type: String, enum: ['cm', 'in'], default: 'cm' }
    },
    ingredients: [{
      type: String,
      trim: true
    }],
    skinType: [{
      type: String,
      enum: ['normal', 'dry', 'oily', 'combination', 'sensitive', 'all']
    }],
    concerns: [{
      type: String,
      enum: ['acne', 'aging', 'dryness', 'sensitivity', 'pigmentation', 'pores', 'other']
    }]
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  saleStartDate: {
    type: Date,
    default: null
  },
  saleEndDate: {
    type: Date,
    default: null
  },
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  seo: {
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ isOnSale: 1, isActive: 1 });
// sku index already created by unique: true
productSchema.index({ tags: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.originalPrice || !this.price || this.originalPrice <= this.price) {
    return 0;
  }
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (!this.inventory.trackInventory) return 'in-stock';
  
  const qty = this.inventory.quantity;
  const threshold = this.inventory.lowStockThreshold;
  
  if (qty === 0) return 'out-of-stock';
  if (qty <= threshold) return 'low-stock';
  return 'in-stock';
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Virtual for sale status
productSchema.virtual('isCurrentlyOnSale').get(function() {
  if (!this.isOnSale) return false;
  
  const now = new Date();
  const startDate = this.saleStartDate;
  const endDate = this.saleEndDate;
  
  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;
  
  return true;
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.seo.slug) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Pre-save middleware to ensure only one primary image
productSchema.pre('save', function(next) {
  if (this.isModified('images')) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    
    if (primaryImages.length > 1) {
      // Keep only the first primary image
      this.images.forEach((img, index) => {
        if (index > 0) img.isPrimary = false;
      });
    } else if (primaryImages.length === 0 && this.images.length > 0) {
      // Set first image as primary if none is set
      this.images[0].isPrimary = true;
    }
  }
  next();
});

// Method to add review
productSchema.methods.addReview = function(userId, rating, comment) {
  // Remove existing review from this user
  this.reviews = this.reviews.filter(review => !review.user.equals(userId));
  
  // Add new review
  this.reviews.push({
    user: userId,
    rating,
    comment: comment || ''
  });
  
  // Recalculate average rating
  this.calculateAverageRating();
  
  return this.save();
};

// Method to calculate average rating
productSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating.average = Math.round((sum / this.reviews.length) * 10) / 10;
    this.rating.count = this.reviews.length;
  }
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category, options = {}) {
  const query = { category, isActive: true };
  return this.find(query, null, options);
};

// Static method to find featured products
productSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ isFeatured: true, isActive: true })
    .limit(limit)
    .sort({ createdAt: -1 });
};

// Static method to find products on sale
productSchema.statics.findOnSale = function(limit = 10) {
  const now = new Date();
  return this.find({
    isOnSale: true,
    isActive: true,
    $or: [
      { saleStartDate: { $lte: now } },
      { saleStartDate: null }
    ],
    $or: [
      { saleEndDate: { $gte: now } },
      { saleEndDate: null }
    ]
  }).limit(limit).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Product', productSchema);
