const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Order = require('../models/Order');

const mapSupplierPayload = (data = {}) => {
  const payload = { ...data };

  if (payload.code && !payload.reference) {
    payload.reference = payload.code;
  }
  if (payload.reference && !payload.code) {
    payload.code = payload.reference;
  }
  if (payload.phone && !payload.phone1) {
    payload.phone1 = payload.phone;
  }
  if (payload.phone1 && !payload.phone) {
    payload.phone = payload.phone1;
  }
  if (payload.mobile && !payload.phone2) {
    payload.phone2 = payload.mobile;
  }
  if (payload.description != null && payload.notes == null) {
    payload.notes = payload.description;
  }
  if (!payload.designation && payload.name) {
    payload.designation = payload.name;
  }
  if (!payload.name && payload.designation) {
    payload.name = payload.designation;
  }

  // Ancienne adresse objet → chaîne
  if (payload.address && typeof payload.address === 'object') {
    const parts = [
      payload.address.street,
      payload.address.city,
      payload.address.zipCode,
      payload.address.state,
      payload.address.country
    ].filter(Boolean);
    payload.address = parts.join(', ');
    if (!payload.country && data.address?.country) {
      payload.country = data.address.country;
    }
  }

  // Champs front-only (stockés autrement)
  delete payload.mobile;
  delete payload.description;
  delete payload._id;

  if (payload.email === '') {
    delete payload.email;
  }

  return payload;
};

class SupplierService {
  static async create(data) {
    const payload = mapSupplierPayload(data);

    if (!payload.reference && payload.designation) {
      const prefix = payload.designation.substring(0, 3).toUpperCase();
      const random = Math.floor(Math.random() * 1000);
      payload.reference = `${prefix}${String(random).padStart(3, '0')}`;
    }

    const supplier = new Supplier(payload);
    await supplier.save();
    return supplier;
  }

  static async findAll(filters = {}) {
    const query = {};

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { designation: { $regex: filters.search, $options: 'i' } },
        { reference: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { country: { $regex: filters.search, $options: 'i' } },
        { matricule: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return await Supplier.find(query).sort({ designation: 1 });
  }

  static async findById(id) {
    return await Supplier.findById(id);
  }

  static async findByCode(code) {
    return await Supplier.findOne({ reference: code.toUpperCase() });
  }

  static async update(id, data) {
    const payload = mapSupplierPayload(data);
    delete payload.reference;

    return await Supplier.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    );
  }

  static async delete(id) {
    const products = await Product.find({ supplier: id });
    if (products.length > 0) {
      throw new Error('Impossible de supprimer un fournisseur qui a des produits');
    }

    const orders = await Order.find({ supplier: id });
    if (orders.length > 0) {
      throw new Error('Impossible de supprimer un fournisseur qui a des commandes');
    }

    return await Supplier.findByIdAndDelete(id);
  }

  static async deactivate(id) {
    return await Supplier.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );
  }

  static async activate(id) {
    return await Supplier.findByIdAndUpdate(
      id,
      { $set: { isActive: true } },
      { new: true }
    );
  }

  static async search(query) {
    return await Supplier.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { designation: { $regex: query, $options: 'i' } },
        { reference: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone1: { $regex: query, $options: 'i' } },
        { phone2: { $regex: query, $options: 'i' } },
        { matricule: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    }).limit(20);
  }

  static async getStats() {
    const total = await Supplier.countDocuments();
    const active = await Supplier.countDocuments({ isActive: true });
    const inactive = await Supplier.countDocuments({ isActive: false });

    const topSuppliers = await Product.aggregate([
      {
        $group: {
          _id: '$supplier',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      { $unwind: '$supplier' },
      {
        $project: {
          name: '$supplier.name',
          designation: '$supplier.designation',
          reference: '$supplier.reference',
          productCount: '$count'
        }
      }
    ]);

    return {
      total,
      active,
      inactive,
      topSuppliers
    };
  }

  static async getProducts(supplierId) {
    return await Product.find({
      supplier: supplierId,
      isActive: true
    }).populate('category');
  }

  static async getOrders(supplierId) {
    return await Order.find({ supplier: supplierId })
      .populate('products.product')
      .sort({ createdAt: -1 })
      .limit(50);
  }

  static async exists(id) {
    const supplier = await Supplier.findById(id);
    return !!supplier;
  }

  static async hasProducts(id) {
    const count = await Product.countDocuments({ supplier: id });
    return count > 0;
  }
}

module.exports = SupplierService;
