import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import aiService from '../services/aiService.js';

/**
 * @desc    Analyze complaint text & location in real-time (AI Assistant)
 * @route   POST /api/complaints/analyze
 * @access  Private (or Public for pre-submit preview)
 */
export const analyzeComplaintDraft = async (req, res) => {
  try {
    const { title, description, category, latitude, longitude, ward } = req.body;

    const analysis = await aiService.analyzeComplaint({
      title,
      description,
      category,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      ward,
      ComplaintModel: Complaint,
    });

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('AI draft analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to run AI analysis',
    });
  }
};

/**
 * @desc    Get complaints with filtering, search, and pagination
 * @route   GET /api/complaints
 * @access  Public / Private
 */
export const getComplaints = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      department,
      ward,
      search,
      my,
      assignedToMe,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    // Filter by ownership or role context
    if (my === 'true' && req.user) {
      query.citizen = req.user._id;
    } else if (assignedToMe === 'true' && req.user) {
      query.assignedOfficer = req.user._id;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (department) query.department = department;
    if (ward) query.ward = ward;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { ward: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('citizen', 'name email phone')
      .populate('assignedOfficer', 'name email phone department')
      .populate('timeline.updatedBy', 'name role')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: complaints.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      complaints,
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
    });
  }
};

/**
 * @desc    Get single complaint by ID
 * @route   GET /api/complaints/:id
 * @access  Public / Private
 */
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'name email phone')
      .populate('assignedOfficer', 'name email phone department')
      .populate('timeline.updatedBy', 'name role')
      .populate('aiMetadata.duplicateOf', 'title status createdAt');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    return res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching complaint',
    });
  }
};

/**
 * @desc    Create a new complaint
 * @route   POST /api/complaints
 * @access  Private (Citizen, Officer, Admin)
 */
export const createComplaint = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      image,
      latitude,
      longitude,
      address,
      ward,
      priority,
    } = req.body;

    if (!title || !description || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, latitude, and longitude are required.',
      });
    }

    // 1. Run AI analysis
    const aiAnalysis = await aiService.analyzeComplaint({
      title,
      description,
      category,
      latitude: Number(latitude),
      longitude: Number(longitude),
      ward,
      ComplaintModel: Complaint,
    });

    const determinedCategory = category && category !== 'Other' 
      ? category 
      : (aiAnalysis.suggestedCategory || 'Other');

    const determinedPriority = priority || aiAnalysis.suggestedPriority || 'Medium';
    const determinedDepartment = aiService.recommendDepartment(determinedCategory);

    // 2. Auto-find a suitable officer in that department if possible
    let assignedOfficerId = null;
    let initialStatus = 'Pending';

    const departmentOfficer = await User.findOne({
      role: 'officer',
      department: determinedDepartment,
    });

    if (departmentOfficer) {
      assignedOfficerId = departmentOfficer._id;
      initialStatus = 'Assigned';
    }

    // 3. Create complaint document
    const complaint = await Complaint.create({
      title,
      description,
      category: determinedCategory,
      image: image || '',
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: address || 'Location in Bangalore',
      ward: ward || 'Ward 12 - Indiranagar',
      priority: determinedPriority,
      status: initialStatus,
      citizen: req.user._id,
      assignedOfficer: assignedOfficerId,
      department: determinedDepartment,
      aiMetadata: {
        confidenceScore: aiAnalysis.confidenceScore || 0.92,
        detectedKeywords: aiAnalysis.detectedKeywords || [],
        duplicateDetected: aiAnalysis.duplicateDetected || false,
        duplicateOf: aiAnalysis.duplicateComplaint?._id || null,
        suggestedPriority: aiAnalysis.suggestedPriority,
        suggestedDepartment: determinedDepartment,
        autoRouted: true,
      },
      timeline: [
        {
          status: 'Pending',
          note: 'Complaint registered by citizen with AI smart routing.',
          updatedBy: req.user._id,
          timestamp: new Date(),
        },
        ...(assignedOfficerId ? [{
          status: 'Assigned',
          note: `Automatically routed & assigned to ${departmentOfficer.name} (${determinedDepartment}).`,
          updatedBy: req.user._id,
          timestamp: new Date(),
        }] : []),
      ],
    });

    // 4. Create Notification for the Citizen
    await Notification.create({
      user: req.user._id,
      title: 'Complaint Registered',
      message: `Your complaint "${complaint.title}" has been registered (ID: #${complaint._id.toString().slice(-6).toUpperCase()}) and routed to the ${determinedDepartment} department.`,
      complaintId: complaint._id,
      type: 'new_complaint',
    });

    // 5. Create Notification for the Assigned Officer (if assigned)
    if (assignedOfficerId) {
      await Notification.create({
        user: assignedOfficerId,
        title: 'New Complaint Assigned',
        message: `New ${complaint.priority} priority complaint in ${complaint.ward}: "${complaint.title}".`,
        complaintId: complaint._id,
        type: 'assignment',
      });
    }

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('citizen', 'name email phone')
      .populate('assignedOfficer', 'name email phone department');

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: populatedComplaint,
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit complaint',
    });
  }
};

/**
 * @desc    Update complaint status, resolution note, officer assignment, etc.
 * @route   PUT /api/complaints/:id
 * @access  Private (Officer, Admin, or Citizen owner)
 */
export const updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    const {
      status,
      resolutionNote,
      beforeImage,
      afterImage,
      department,
      assignedOfficer,
      priority,
      category,
      title,
      description,
    } = req.body;

    const isOfficerOrAdmin = ['officer', 'admin'].includes(req.user.role);
    const isOwner = complaint.citizen.toString() === req.user._id.toString();

    if (!isOfficerOrAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this complaint',
      });
    }

    // Record timeline changes
    let timelineNote = '';
    const statusChanged = status && status !== complaint.status;

    if (statusChanged) {
      complaint.status = status;
      timelineNote = resolutionNote || `Status updated to ${status}.`;
    }

    if (resolutionNote !== undefined) {
      complaint.resolutionNote = resolutionNote;
    }

    if (beforeImage !== undefined) complaint.beforeImage = beforeImage;
    if (afterImage !== undefined) complaint.afterImage = afterImage;

    // Field updates for Officer/Admin
    if (isOfficerOrAdmin) {
      if (department) complaint.department = department;
      if (priority) complaint.priority = priority;
      if (category) complaint.category = category;
      if (assignedOfficer !== undefined) {
        complaint.assignedOfficer = assignedOfficer || null;
      }
    }

    // Citizen editing details if still pending
    if (isOwner && complaint.status === 'Pending') {
      if (title) complaint.title = title;
      if (description) complaint.description = description;
    }

    // Add to timeline if status changed or resolution note added
    if (statusChanged || resolutionNote) {
      complaint.timeline.push({
        status: complaint.status,
        note: timelineNote || 'Update recorded.',
        updatedBy: req.user._id,
        timestamp: new Date(),
      });

      // Notify citizen of the status progress
      await Notification.create({
        user: complaint.citizen,
        title: `Complaint Status: ${complaint.status}`,
        message: `Your complaint "${complaint.title}" is now marked as ${complaint.status}. ${resolutionNote ? `Note: "${resolutionNote}"` : ''}`,
        complaintId: complaint._id,
        type: 'status_update',
      });
    }

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('citizen', 'name email phone')
      .populate('assignedOfficer', 'name email phone department')
      .populate('timeline.updatedBy', 'name role');

    return res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update complaint',
    });
  }
};

/**
 * @desc    Delete a complaint
 * @route   DELETE /api/complaints/:id
 * @access  Private (Admin or Citizen owner when Pending)
 */
export const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = complaint.citizen.toString() === req.user._id.toString();

    if (!isAdmin && (!isOwner || complaint.status !== 'Pending')) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own pending complaints.',
      });
    }

    await Complaint.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete complaint',
    });
  }
};
