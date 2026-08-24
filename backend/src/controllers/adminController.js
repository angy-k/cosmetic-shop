const { User, Product, Order } = require('../models');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Admin dashboard summary stats
 * @route GET /api/admin/stats
 * @access Private (Admin only)
 */
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueAgg,
      ordersByStatusAgg,
      recentOrders,
      lowStockProducts
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({}),
      // Revenue = sum of orders whose payment actually completed
      Order.aggregate([
        { $match: { 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber status total createdAt customer.name customer.email'),
      Product.countDocuments({
        isActive: true,
        'inventory.trackInventory': true,
        $expr: { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] }
      })
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const ordersByStatus = ordersByStatusAgg.reduce((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Stats fetched successfully',
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        ordersByStatus,
        recentOrders,
        lowStockProducts
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin stats'
    });
  }
};

/**
 * Admin: List/search users
 * @route GET /api/admin/users
 * @access Private (Admin only)
 */
const listUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role && ['user', 'admin'].includes(role)) {
      filter.role = role;
    }
    if (search) {
      const term = escapeRegex(search);
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      User.find(filter)
        .select('name email role isActive lastLogin createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
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
    console.error('Error listing users:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

/**
 * Admin: Promote/demote a user between 'user' and 'admin'
 * @route PUT /api/admin/users/:id/role
 * @access Private (Admin only)
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be "user" or "admin"' });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Guard against locking everyone out of the admin panel
    if (target.role === 'admin' && role === 'user') {
      const otherAdmins = await User.countDocuments({
        role: 'admin',
        isActive: true,
        _id: { $ne: target._id }
      });
      if (otherAdmins === 0) {
        return res.status(400).json({ success: false, message: 'Cannot remove the last remaining admin' });
      }
    }

    target.role = role;
    await target.save();

    res.json({
      success: true,
      message: `${target.email} is now ${role === 'admin' ? 'an admin' : 'a regular user'}`,
      data: { user: target }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Error updating user role' });
  }
};

/**
 * Admin: Activate/deactivate a user account. A deactivated account is blocked
 * from authenticating at all (see middleware/auth.js's isActive check).
 * @route PUT /api/admin/users/:id/status
 * @access Private (Admin only)
 */
const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be true or false' });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (target.role === 'admin' && isActive === false) {
      const otherActiveAdmins = await User.countDocuments({
        role: 'admin',
        isActive: true,
        _id: { $ne: target._id }
      });
      if (otherActiveAdmins === 0) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate the last remaining admin' });
      }
    }

    target.isActive = isActive;
    await target.save();

    res.json({
      success: true,
      message: isActive ? `${target.email} reactivated` : `${target.email} deactivated`,
      data: { user: target }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, message: 'Error updating user status' });
  }
};

module.exports = {
  getStats,
  listUsers,
  updateUserRole,
  toggleUserActive
};
