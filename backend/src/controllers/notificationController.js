const { ProductNotification, Product, User } = require('../models');
const emailService = require('../services/emailService');

/**
 * Request notification when product becomes available
 * @route POST /api/notifications/product-availability
 * @access Private
 */
const requestProductNotification = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is already in stock
    if (product.inventory && product.inventory.quantity > 0) {
      return res.status(400).json({
        success: false,
        message: 'Product is currently in stock'
      });
    }

    // Create or update notification request
    const notification = await ProductNotification.createOrUpdateNotification(
      user._id,
      productId,
      user.email
    );

    res.status(201).json({
      success: true,
      message: 'You will be notified when this product becomes available',
      data: { notification }
    });

  } catch (error) {
    console.error('Error requesting product notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up notification'
    });
  }
};

/**
 * Cancel product availability notification
 * @route DELETE /api/notifications/product-availability/:productId
 * @access Private
 */
const cancelProductNotification = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = req.user;

    const notification = await ProductNotification.findOneAndUpdate(
      { user: user._id, product: productId },
      { isActive: false },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling product notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling notification'
    });
  }
};

/**
 * Get user's active notifications
 * @route GET /api/notifications/my-notifications
 * @access Private
 */
const getMyNotifications = async (req, res) => {
  try {
    const user = req.user;

    const notifications = await ProductNotification.find({
      user: user._id,
      isActive: true
    }).populate('product', 'name brand price images inventory');

    res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: { notifications }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
};

/**
 * Admin: Trigger product availability notifications
 * @route POST /api/notifications/trigger-availability/:productId
 * @access Private (Admin only)
 */
const triggerProductAvailabilityNotifications = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get active notifications for this product
    const notifications = await ProductNotification.getActiveNotificationsForProduct(productId);

    if (notifications.length === 0) {
      return res.json({
        success: true,
        message: 'No active notifications found for this product',
        data: { notificationsSent: 0 }
      });
    }

    // Send notifications
    const users = notifications.map(notification => notification.user);
    
    try {
      await emailService.sendProductAvailabilityNotification(product, users);
      
      // Mark notifications as sent
      await Promise.all(
        notifications.map(notification => notification.markAsNotified())
      );

      console.log(`Product availability notifications sent for ${product.name} to ${users.length} users`);

      res.json({
        success: true,
        message: `Notifications sent to ${users.length} users`,
        data: { 
          notificationsSent: users.length,
          product: {
            id: product._id,
            name: product.name,
            brand: product.brand
          }
        }
      });

    } catch (emailError) {
      console.error('Error sending product availability notifications:', emailError);
      res.status(500).json({
        success: false,
        message: 'Error sending notifications'
      });
    }

  } catch (error) {
    console.error('Error triggering product availability notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering notifications'
    });
  }
};

/**
 * Admin: Get all notifications for a product
 * @route GET /api/notifications/product/:productId
 * @access Private (Admin only)
 */
const getProductNotifications = async (req, res) => {
  try {
    const { productId } = req.params;
    const { includeInactive = false } = req.query;

    const filter = { product: productId };
    if (!includeInactive) {
      filter.isActive = true;
    }

    const notifications = await ProductNotification.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name brand')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Product notifications retrieved successfully',
      data: { notifications }
    });

  } catch (error) {
    console.error('Error fetching product notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product notifications'
    });
  }
};

module.exports = {
  requestProductNotification,
  cancelProductNotification,
  getMyNotifications,
  triggerProductAvailabilityNotifications,
  getProductNotifications
};
