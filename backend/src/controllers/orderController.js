const { Order, Product, User } = require('../models');
const emailService = require('../services/emailService');

const parseIntOrNull = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

const buildOrderNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const lastOrder = await Order.findOne({
    createdAt: { $gte: startOfDay, $lt: endOfDay }
  }).sort({ createdAt: -1 });

  let sequence = 1;
  if (lastOrder && lastOrder.orderNumber) {
    const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
    if (Number.isFinite(lastSequence)) sequence = lastSequence + 1;
  }

  return `${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
};

const createOrder = async (req, res) => {
  try {
    const user = req.user;
    const {
      items = [],
      tax = {},
      shipping = {},
      discount = {},
      customer = {},
      billingAddress = {},
      shippingAddress = {}
    } = req.body || {};
    const paymentMethod = req.body && req.body.payment && req.body.payment.method ? req.body.payment.method : undefined;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }

    // Enrich items with product snapshot and price if not provided
    const enrichedItems = [];
    for (const it of items) {
      const { product: productId, quantity, price } = it || {};
      if (!productId || !quantity) {
        return res.status(400).json({ success: false, message: 'Each item requires product and quantity' });
      }

      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: 'Product not available' });
      }

      const itemPrice = typeof price === 'number' ? price : product.price;
      enrichedItems.push({
        product: product._id,
        quantity: Math.max(1, Number(quantity)),
        price: Number(itemPrice),
        productSnapshot: {
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          image: product.primaryImage ? { url: product.primaryImage.url, alt: product.primaryImage.alt } : null
        }
      });
    }

    // Compute totals
    const subtotal = enrichedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const taxAmount = Number(tax.amount || 0);
    const shippingCost = Number(shipping.cost || 0);
    const discountAmount = Number(discount.amount || 0);
    const total = Math.max(0, subtotal + taxAmount + shippingCost - discountAmount);

    const orderNumber = await buildOrderNumber();

    const order = new Order({
      orderNumber,
      user: user._id,
      items: enrichedItems,
      subtotal,
      tax: {
        amount: taxAmount,
        rate: Number(tax.rate || 0)
      },
      shipping: {
        cost: shippingCost,
        method: shipping.method || 'standard',
        estimatedDelivery: shipping.estimatedDelivery || null
      },
      discount: {
        amount: discountAmount,
        code: discount.code ? String(discount.code).toUpperCase().trim() : null,
        type: discount.type || null
      },
      total,
      payment: paymentMethod ? { method: paymentMethod } : undefined,
      customer: {
        name: customer.name || user.name,
        email: customer.email || user.email,
        phone: customer.phone || user.phone || null
      },
      billingAddress,
      shippingAddress,
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: new Date(), updatedBy: user._id }]
    });

    await order.save();

    // Send order confirmation email
    try {
      await emailService.sendOrderConfirmation(order, user);
      console.log(`Order confirmation email sent for order ${order.orderNumber}`);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json({ success: true, message: 'Order created successfully', data: { order } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      if (error.errors && typeof error.errors === 'object') {
        const errors = Object.values(error.errors).map(err => ({ field: err.path, message: err.message }));
        return res.status(400).json({ success: false, message: 'Validation failed', errors });
      }
      return res.status(400).json({ success: false, message: error.message || 'Validation failed' });
    }
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
};

const listMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments({ user: req.user._id })
    ]);

    res.json({ success: true, message: 'Orders fetched', data: { items, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
};

const listOrdersAdmin = async (req, res) => {
  try {
    const { status, userId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.user = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(filter)
    ]);

    res.json({ success: true, message: 'Orders fetched', data: { items, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!req.user || (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, message: 'Order fetched', data: { order } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching order' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body || {};
    const order = await Order.findById(id).populate('user');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const oldStatus = order.status;
    await order.updateStatus(status, note || null, req.user._id);

    // Send status update email if status changed
    if (oldStatus !== status && order.user) {
      try {
        await emailService.sendOrderStatusUpdate(order, order.user, status);
        console.log(`Order status update email sent for order ${order.orderNumber}: ${oldStatus} -> ${status}`);
      } catch (emailError) {
        console.error('Failed to send order status update email:', emailError);
        // Don't fail the status update if email fails
      }
    }

    res.json({ success: true, message: 'Order status updated', data: { order } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating status' });
  }
};

const addTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const { carrier, trackingNumber, trackingUrl } = req.body || {};
    if (!carrier || !trackingNumber) {
      return res.status(400).json({ success: false, message: 'carrier and trackingNumber are required' });
    }
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    await order.addTracking(carrier, trackingNumber, trackingUrl || null);
    res.json({ success: true, message: 'Tracking added', data: { order } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding tracking' });
  }
};

const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, method } = req.body || {};
    if (!transactionId) {
      return res.status(400).json({ success: false, message: 'transactionId is required' });
    }
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    await order.processPayment(transactionId, method || null);
    res.json({ success: true, message: 'Payment processed', data: { order } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing payment' });
  }
};

const sendDeliveryInstructions = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('user');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if order is in a valid state for delivery instructions
    if (!['confirmed', 'processing', 'shipped'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Delivery instructions can only be sent for confirmed, processing, or shipped orders' 
      });
    }

    // Send delivery instructions email
    try {
      await emailService.sendDeliveryInstructions(order, order.user);
      console.log(`Delivery instructions sent for order ${order.orderNumber}`);
      
      res.json({ 
        success: true, 
        message: 'Delivery instructions sent successfully',
        data: { order }
      });
    } catch (emailError) {
      console.error('Failed to send delivery instructions email:', emailError);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send delivery instructions email' 
      });
    }
  } catch (error) {
    console.error('Error sending delivery instructions:', error);
    res.status(500).json({ success: false, message: 'Error sending delivery instructions' });
  }
};

module.exports = {
  createOrder,
  listMyOrders,
  listOrdersAdmin,
  getOrderById,
  updateStatus,
  addTracking,
  processPayment,
  sendDeliveryInstructions,
  createOrderForUser
};

async function createOrderForUser(req, res) {
  try {
    const { userId } = req.params;
    const targetUser = await User.findById(userId);
    if (!targetUser || !targetUser.isActive) {
      return res.status(400).json({ success: false, message: 'Target user not found or inactive' });
    }

    const {
      items = [],
      tax = {},
      shipping = {},
      discount = {},
      customer = {},
      billingAddress = {},
      shippingAddress = {}
    } = req.body || {};
    const paymentMethod = req.body && req.body.payment && req.body.payment.method ? req.body.payment.method : undefined;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }

    const enrichedItems = [];
    for (const it of items) {
      const { product: productId, quantity, price } = it || {};
      if (!productId || !quantity) {
        return res.status(400).json({ success: false, message: 'Each item requires product and quantity' });
      }

      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: 'Product not available' });
      }

      const itemPrice = typeof price === 'number' ? price : product.price;
      enrichedItems.push({
        product: product._id,
        quantity: Math.max(1, Number(quantity)),
        price: Number(itemPrice),
        productSnapshot: {
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          image: product.primaryImage ? { url: product.primaryImage.url, alt: product.primaryImage.alt } : null
        }
      });
    }

    const subtotal = enrichedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const taxAmount = Number(tax.amount || 0);
    const shippingCost = Number(shipping.cost || 0);
    const discountAmount = Number(discount.amount || 0);
    const total = Math.max(0, subtotal + taxAmount + shippingCost - discountAmount);

    const orderNumber = await buildOrderNumber();

    const order = new Order({
      orderNumber,
      user: targetUser._id,
      items: enrichedItems,
      subtotal,
      tax: {
        amount: taxAmount,
        rate: Number(tax.rate || 0)
      },
      shipping: {
        cost: shippingCost,
        method: shipping.method || 'standard',
        estimatedDelivery: shipping.estimatedDelivery || null
      },
      discount: {
        amount: discountAmount,
        code: discount.code ? String(discount.code).toUpperCase().trim() : null,
        type: discount.type || null
      },
      total,
      payment: paymentMethod ? { method: paymentMethod } : undefined,
      customer: {
        name: customer.name || targetUser.name,
        email: customer.email || targetUser.email,
        phone: customer.phone || targetUser.phone || null
      },
      billingAddress,
      shippingAddress,
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: new Date(), updatedBy: req.user._id }]
    });

    await order.save();

    res.status(201).json({ success: true, message: 'Order created for user successfully', data: { order } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      if (error.errors && typeof error.errors === 'object') {
        const errors = Object.values(error.errors).map(err => ({ field: err.path, message: err.message }));
        return res.status(400).json({ success: false, message: 'Validation failed', errors });
      }
      return res.status(400).json({ success: false, message: error.message || 'Validation failed' });
    }
    res.status(500).json({ success: false, message: 'Error creating order for user' });
  }
}
