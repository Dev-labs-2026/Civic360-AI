import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the complaint'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Pothole',
        'Garbage',
        'Broken Streetlight',
        'Water Leakage',
        'Drainage',
        'Road Damage',
        'Other',
      ],
      default: 'Other',
    },
    image: {
      type: String,
      default: '',
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    address: {
      type: String,
      default: 'Location unspecified',
    },
    ward: {
      type: String,
      default: 'Ward 12 - Indiranagar',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    department: {
      type: String,
      enum: [
        'Roads/PWD',
        'Sanitation',
        'Electrical',
        'Water Supply',
        'Drainage & Sewage',
        'General',
      ],
      default: 'General',
    },
    resolutionNote: {
      type: String,
      default: '',
    },
    beforeImage: {
      type: String,
      default: '',
    },
    afterImage: {
      type: String,
      default: '',
    },
    aiMetadata: {
      confidenceScore: { type: Number, default: 0.92 },
      detectedKeywords: [{ type: String }],
      duplicateDetected: { type: Boolean, default: false },
      duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
      suggestedPriority: { type: String, default: 'Medium' },
      suggestedDepartment: { type: String, default: 'General' },
      autoRouted: { type: Boolean, default: true },
    },
    timeline: [
      {
        status: { type: String, required: true },
        note: { type: String, default: '' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for geo/ward queries and recent sorting
complaintSchema.index({ latitude: 1, longitude: 1 });
complaintSchema.index({ status: 1, category: 1, priority: 1 });
complaintSchema.index({ createdAt: -1 });

export default mongoose.model('Complaint', complaintSchema);
