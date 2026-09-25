import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
    },
    type: {
      type: String,
      enum: ['status_update', 'assignment', 'new_complaint', 'system'],
      default: 'status_update',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Notification', notificationSchema);
