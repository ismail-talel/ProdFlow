const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { UserRoles, RoleList } = require('./UserRoles');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, required: true },
  role: { type: String, enum: RoleList, required: true, default: UserRoles.EXPEDITION_MAGASIN },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = { User, UserRoles, RoleList };