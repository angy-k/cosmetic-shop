const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  // Store product details at time of order (for historical accuracy)
  productSnapshot: {
    name: { type: String, required: true },
    sku: { type: String, required: true },
    brand: { type: String, required: true },
    image: {
      url: String,
      alt: String
    }
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  items: [orderItemSchema],
  
  // Pricing
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Tax amount cannot be negative']
    },
    rate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [1, 'Tax rate cannot exceed 100%']
    }
  },
  shipping: {
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost cannot be negative']
    },
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'pickup'],
      default: 'standard'
    },
    estimatedDelivery: {
      type: Date,
      default: null
    }
  },
  discount: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative']
    },
    code: {
      type: String,
      default: null,
      trim: true,
      uppercase: true
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'free-shipping'],
      default: null
    }
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  
  // Customer Information
  customer: {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    }
  },
  
  // Addresses
  billingAddress: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true }
  },
  shippingAddress: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true }
  },
  
  // Order Status
  status: {
    type: String,
    enum: {
      values: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
        'returned'
      ],
      message: 'Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled, refunded, returned'
    },
    default: 'pending'
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['credit-card', 'debit-card', 'paypal', 'stripe', 'cash-on-delivery'],
      required: [true, 'Payment method is required']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      default: null,
      trim: true
    },
    paidAt: {
      type: Date,
      default: null
    },
    refundedAt: {
      type: Date,
      default: null
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refund amount cannot be negative']
    }
  },
  
  // Tracking Information
  tracking: {
    carrier: {
      type: String,
      default: null,
      trim: true
    },
    trackingNumber: {
      type: String,
      default: null,
      trim: true
    },
    trackingUrl: {
      type: String,
      default: null,
      trim: true
    },
    shippedAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    }
  },
  
  // Notes and Communication
  notes: {
    customer: {
      type: String,
      default: null,
      trim: true,
      maxlength: [500, 'Customer notes cannot exceed 500 characters']
    },
    internal: {
      type: String,
      default: null,
      trim: true,
      maxlength: [1000, 'Internal notes cannot exceed 1000 characters']
    }
  },
  
  // Timestamps for status changes
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  }],
  
  // Email notifications sent
  notifications: [{
    type: {
      type: String,
      enum: ['order-confirmation', 'payment-received', 'shipped', 'delivered', 'cancelled'],
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    success: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'tracking.trackingNumber': 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for formatted order number
orderSchema.virtual('formattedOrderNumber').get(function() {
  return `#${this.orderNumber}`;
});

// Virtual for full billing address
orderSchema.virtual('fullBillingAddress').get(function() {
  const addr = this.billingAddress;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for full shipping address
orderSchema.virtual('fullShippingAddress').get(function() {
  const addr = this.shippingAddress;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for current status info
orderSchema.virtual('currentStatusInfo').get(function() {
  const latest = this.statusHistory[this.statusHistory.length - 1];
  return latest || { status: this.status, timestamp: this.createdAt };
});

// Virtual for estimated delivery date
orderSchema.virtual('estimatedDeliveryDate').get(function() {
  if (this.shipping.estimatedDelivery) {
    return this.shipping.estimatedDelivery;
  }
  
  // Calculate based on shipping method
  const daysToAdd = {
    'standard': 7,
    'express': 3,
    'overnight': 1,
    'pickup': 0
  };
  
  const days = daysToAdd[this.shipping.method] || 7;
  const deliveryDate = new Date(this.createdAt);
  deliveryDate.setDate(deliveryDate.getDate() + days);
  
  return deliveryDate;
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find the last order of today
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const lastOrder = await this.constructor.findOne({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    }).sort({ createdAt: -1 });
    
    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Pre-save middleware to add status history
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

// Pre-save middleware to calculate totals
orderSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate total
  this.total = this.subtotal + this.tax.amount + this.shipping.cost - this.discount.amount;
  
  // Ensure total is not negative
  if (this.total < 0) this.total = 0;
  
  next();
});

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, note = null, updatedBy = null) {
  this.status = newStatus;
  
  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy
  });
  
  // Update specific timestamps
  if (newStatus === 'shipped' && !this.tracking.shippedAt) {
    this.tracking.shippedAt = new Date();
  }
  
  if (newStatus === 'delivered' && !this.tracking.deliveredAt) {
    this.tracking.deliveredAt = new Date();
  }
  
  return this.save();
};

// Method to add tracking information
orderSchema.methods.addTracking = function(carrier, trackingNumber, trackingUrl = null) {
  this.tracking.carrier = carrier;
  this.tracking.trackingNumber = trackingNumber;
  this.tracking.trackingUrl = trackingUrl;
  
  if (this.status === 'processing') {
    this.updateStatus('shipped');
  }
  
  return this.save();
};

// Method to process payment
orderSchema.methods.processPayment = function(transactionId, method = null) {
  this.payment.status = 'completed';
  this.payment.transactionId = transactionId;
  this.payment.paidAt = new Date();
  
  if (method) {
    this.payment.method = method;
  }
  
  if (this.status === 'pending') {
    this.updateStatus('confirmed');
  }
  
  return this.save();
};

// Method to add notification record
orderSchema.methods.addNotification = function(type, success = true) {
  this.notifications.push({
    type,
    sentAt: new Date(),
    success
  });
  
  return this.save();
};

// Static method to find orders by user
orderSchema.statics.findByUser = function(userId, options = {}) {
  return this.find({ user: userId }, null, options).populate('items.product');
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status, options = {}) {
  return this.find({ status }, null, options).populate('user', 'name email');
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = async function(startDate, endDate) {
  const match = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        statusBreakdown: {
          $push: '$status'
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
