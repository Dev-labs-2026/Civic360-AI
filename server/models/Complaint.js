import mongoose from 'mongoose';
import { DEPARTMENT_NAMES, normalizeDepartment } from '../utils/departments.js';

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
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    address: {
      type: String,
      default: 'Location unspecified',
    },
    ward: {
      type: String,
      default: 'Kolkata • Ward 12',
    },
    isDemo: {
      type: Boolean,
      default: false,
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
      enum: DEPARTMENT_NAMES,
      default: 'General Civic Department',
    },
    routingExplanation: {
      type: String,
      default: '',
      maxlength: 240,
    },
    // SLA duration is in hours; dates are stored as UTC instants by MongoDB.
    slaDuration: { type: Number, min: 0 },
    slaDeadline: { type: Date, index: true },
    slaDueSoonNotifiedAt: { type: Date, default: null },
    escalationLevel: { type: Number, min: 0, default: 0 },
    escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    escalationHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        previousStatus: { type: String, required: true },
        newStatus: { type: String, required: true },
        previousAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        newAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        escalationLevel: { type: Number, required: true },
        reason: { type: String, required: true },
      },
    ],
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
      suggestedDepartment: { type: String, default: 'General Civic Department' },
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

// Normalize historical department labels when existing MongoDB records are loaded.
complaintSchema.post('init', function (complaint) {
  const department = normalizeDepartment(complaint.department);
  if (department !== complaint.department) complaint.department = department;
});

complaintSchema.pre('validate', function () {
  const department = normalizeDepartment(this.department);
  if (department !== this.department) this.department = department;
});

// Index for geo/ward queries and recent sorting
complaintSchema.index({ latitude: 1, longitude: 1 });
complaintSchema.index({ status: 1, category: 1, priority: 1 });
complaintSchema.index({ assignedOfficer: 1, status: 1 });
complaintSchema.index({ createdAt: -1 });

export default mongoose.model('Complaint', complaintSchema);
