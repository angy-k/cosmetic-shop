const mongoose = require('mongoose');

const productNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate notifications for same user/product
productNotificationSchema.index({ user: 1, product: 1 }, { unique: true });

// Index for efficient queries
productNotificationSchema.index({ product: 1, isActive: 1 });
productNotificationSchema.index({ email: 1 });

// Instance method to mark as notified
productNotificationSchema.methods.markAsNotified = function() {
  this.notifiedAt = new Date();
  this.isActive = false;
  return this.save();
};

// Static method to get active notifications for a product
productNotificationSchema.statics.getActiveNotificationsForProduct = function(productId) {
  return this.find({
    product: productId,
    isActive: true,
    notifiedAt: null
  }).populate('user', 'firstName lastName email');
};

// Static method to create or update notification request
productNotificationSchema.statics.createOrUpdateNotification = async function(userId, productId, email) {
  try {
    const notification = await this.findOneAndUpdate(
      { user: userId, product: productId },
      { 
        email: email,
        isActive: true,
        notifiedAt: null
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
    return notification;
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      const notification = await this.findOne({ user: userId, product: productId });
      if (notification) {
        notification.isActive = true;
        notification.notifiedAt = null;
        notification.email = email;
        await notification.save();
        return notification;
      }
    }
    throw error;
  }
};

const ProductNotification = mongoose.model('ProductNotification', productNotificationSchema);

module.exports = ProductNotification;
