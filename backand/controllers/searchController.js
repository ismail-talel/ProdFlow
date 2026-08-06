const { Order, Product, Supplier, User } = require('../models');

exports.globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche trop court (min. 2 caractères)'
      });
    }

    const regex = { $regex: q.trim(), $options: 'i' };

    const [products, suppliers, orders, users] = await Promise.all([
      Product.find({
        isActive: true,
        $or: [
          { designation: regex },
          { reference: regex },
          { barcode: regex }
        ]
      }).limit(10),
      Supplier.find({
        isActive: true,
        $or: [
          { name: regex },
          { designation: regex },
          { reference: regex },
          { email: regex },
          { matricule: regex }
        ]
      }).limit(10),
      Order.find({ orderNumber: regex }).limit(10).populate('supplier', 'name designation'),
      User.find({
        isActive: true,
        $or: [{ firstName: regex }, { lastName: regex }, { email: regex }]
      }).limit(10)
    ]);

    res.json({
      success: true,
      data: { products, suppliers, orders, users }
    });
  } catch (error) {
    next(error);
  }
};
