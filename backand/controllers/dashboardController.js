const { Order, Product, Supplier, User } = require('../models');

exports.getDashboard = async (req, res, next) => {
  try {
    const [ordersCount, productsCount, suppliersCount, usersCount, lowStock, recentOrders] =
      await Promise.all([
        Order.countDocuments(),
        Product.countDocuments({ isActive: true }),
        Supplier.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: true }),
        Product.find({
          isActive: true,
          $expr: { $lte: ['$quantity', '$minThreshold'] }
        }).limit(10),
        Order.find()
          .populate('supplier', 'name designation')
          .sort({ createdAt: -1 })
          .limit(5)
      ]);

    res.json({
      success: true,
      data: {
        summary: { ordersCount, productsCount, suppliersCount, usersCount },
        lowStock,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const byStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: { ordersByStatus: byStatus }
    });
  } catch (error) {
    next(error);
  }
};
