import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { DEPARTMENT_NAMES, normalizeDepartment } from '../utils/departments.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't expose password by default
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: 'West Bengal',
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['citizen', 'officer', 'admin'],
      default: 'citizen',
    },
    department: {
      type: String,
      default: 'General Civic Department',
      enum: DEPARTMENT_NAMES,
    },
    ward: {
      type: String,
      default: 'Kolkata • Ward 12',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1, department: 1, isActive: 1, ward: 1 });

// Normalize historical department labels when existing MongoDB records are loaded.
userSchema.post('init', function (user) {
  const department = normalizeDepartment(user.department);
  if (department !== user.department) user.department = department;
});

userSchema.pre('validate', function () {
  const department = normalizeDepartment(this.department);
  if (department !== this.department) this.department = department;
});

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
