const { Order, Product, Supplier, User } = require('../models');

exports.getOrderReport = async (req, res, next) => {
  try {
    const { status, from, to } = req.query;
    const query = {};
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const orders = await Order.find(query)
      .populate('supplier', 'name designation reference')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.json({
      success: true,
      count: orders.length,
      totalAmount,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

exports.getStockReport = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .populate('supplier', 'name designation reference')
      .sort({ quantity: 1 });

    const lowStock = products.filter((p) => p.quantity <= p.minThreshold);

    res.json({
      success: true,
      count: products.length,
      lowStockCount: lowStock.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

exports.getSupplierReport = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find().sort({ designation: 1 });
    const withOrders = await Promise.all(
      suppliers.map(async (s) => {
        const orderCount = await Order.countDocuments({ supplier: s._id });
        return { ...s.toObject(), orderCount };
      })
    );

    res.json({ success: true, count: withOrders.length, data: withOrders });
  } catch (error) {
    next(error);
  }
};

exports.getUserReport = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      count: users.length,
      byRole,
      data: users
    });
  } catch (error) {
    next(error);
  }
};
