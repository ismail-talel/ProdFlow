const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const sanitizeUser = (user) => {
  const data = user.toObject ? user.toObject() : { ...user };
  delete data.password;
  return data;
};

class UserService {
  
  static async create(data) {
    const user = new User(data);
    await user.save();
    return sanitizeUser(user);
  }


  static async findById(id) {
    return await User.findById(id);
  }

  static async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }

  static async findAll(filters = {}) {
    const query = { isActive: true };
    if (filters.role) query.role = filters.role;
    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }
    return await User.find(query).sort({ createdAt: -1 });
  }


  static async update(id, data) {
    delete data.password;
    return await User.findByIdAndUpdate(id, { $set: data }, { new: true });
  }


  static async delete(id) {
    return await User.findByIdAndDelete(id);
  }

 
  static async login(email, password) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) throw createError('Email ou mot de passe incorrect', 401);
    if (!user.isActive) throw createError('Compte désactivé', 403);
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw createError('Email ou mot de passe incorrect', 401);
    
    user.lastLogin = new Date();
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    return { user: sanitizeUser(user), token };
  }
}

module.exports = UserService;
