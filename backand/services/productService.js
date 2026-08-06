const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');

if (!Product || typeof Product.find !== 'function') {
  throw new Error('Le modèle Product n’est pas chargé correctement');
}

const mapProductPayload = (data = {}) => {
  const payload = { ...data };

  if (payload.name && !payload.designation) {
    payload.designation = payload.name;
  }
  if (payload.designation && !payload.name) {
    payload.name = payload.designation;
  }
  if (payload.unitPrice != null && payload.priceHT == null) {
    payload.priceHT = payload.unitPrice;
  }
  if (payload.priceHT != null && payload.unitPrice == null) {
    payload.unitPrice = payload.priceHT;
  }

  // Évite les CastError ObjectId avec chaînes vides du front
  if (payload.category === '' || payload.category === null) {
    delete payload.category;
  }
  if (payload.supplier === '' || payload.supplier === null) {
    delete payload.supplier;
  }

  // Nettoyage des champs purement UI
  delete payload._id;

  return payload;
};

class ProductService {
  static async create(data) {
    const product = new Product(mapProductPayload(data));
    await product.save();
    return product;
  }

  static async findAll(filters = {}) {
    const query = {};
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    } else {
      query.isActive = true;
    }
    if (filters.category) query.category = filters.category;
    if (filters.supplier) query.supplier = filters.supplier;
    if (filters.compositionType) query.compositionType = filters.compositionType;
    if (filters.originType) query.originType = filters.originType;
    if (filters.search) {
      query.$or = [
        { designation: { $regex: filters.search, $options: 'i' } },
        { name: { $regex: filters.search, $options: 'i' } },
        { reference: { $regex: filters.search, $options: 'i' } },
        { barcode: { $regex: filters.search, $options: 'i' } },
        { supplierReference: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }
    return await Product.find(query)
      .populate('category', 'name')
      .populate('supplier', 'name designation reference')
      .sort({ designation: 1 });
  }

  static async findById(id) {
    return await Product.findById(id)
      .populate('category', 'name')
      .populate('supplier', 'name designation reference');
  }

  static async search(q) {
    const normalizedQuery = typeof q === 'string' ? q.trim() : '';

    if (!normalizedQuery) {
      return [];
    }

    return await Product.find({
      isActive: true,
      $or: [
        { designation: { $regex: normalizedQuery, $options: 'i' } },
        { name: { $regex: normalizedQuery, $options: 'i' } },
        { reference: { $regex: normalizedQuery, $options: 'i' } },
        { barcode: { $regex: normalizedQuery, $options: 'i' } },
        { description: { $regex: normalizedQuery, $options: 'i' } }
      ]
    })
      .populate('category', 'name')
      .populate('supplier', 'name designation reference')
      .limit(20);
  }

  static async getLowStock() {
    return await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$minThreshold'] }
    }).populate('supplier', 'name designation reference');
  }

  static async update(id, data) {
    return await Product.findByIdAndUpdate(
      id,
      { $set: mapProductPayload(data) },
      { new: true, runValidators: true }
    );
  }

  static async updateStock(id, quantity, operation = 'set') {
    const normalizedOperation = typeof operation === 'string' ? operation.toLowerCase() : 'set';
    const numericQuantity = Number(quantity);

    if (quantity === undefined || quantity === null || Number.isNaN(numericQuantity) || numericQuantity < 0) {
      throw new Error('Quantité invalide');
    }

    if (!['increment', 'decrement', 'set'].includes(normalizedOperation)) {
      throw new Error('Opération de stock invalide');
    }

    const product = await Product.findById(id);
    if (!product) return null;

    if (normalizedOperation === 'increment') {
      product.quantity += numericQuantity;
    } else if (normalizedOperation === 'decrement') {
      product.quantity = Math.max(0, product.quantity - numericQuantity);
    } else {
      product.quantity = numericQuantity;
    }

    await product.save();
    return product;
  }

  static async delete(id) {
    return await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}

module.exports = ProductService;
