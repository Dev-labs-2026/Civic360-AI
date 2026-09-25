import Complaint from '../models/Complaint.js';

/**
 * @desc    Get Officer Dashboard analytics
 * @route   GET /api/officer/dashboard
 * @access  Private (Officer, Admin)
 */
export const getOfficerDashboard = async (req, res) => {
  try {
    const officerId = req.user._id;
    const department = req.user.department || 'General';

    // Personal assigned complaints
    const assignedTotal = await Complaint.countDocuments({ assignedOfficer: officerId });
    const assignedPending = await Complaint.countDocuments({ assignedOfficer: officerId, status: 'Assigned' });
    const assignedInProgress = await Complaint.countDocuments({ assignedOfficer: officerId, status: 'In Progress' });
    const assignedResolved = await Complaint.countDocuments({ assignedOfficer: officerId, status: 'Resolved' });

    // Departmental complaints
    const deptTotal = await Complaint.countDocuments({ department });
    const deptPending = await Complaint.countDocuments({ department, status: 'Pending' });
    const deptAssigned = await Complaint.countDocuments({ department, status: 'Assigned' });
    const deptInProgress = await Complaint.countDocuments({ department, status: 'In Progress' });
    const deptResolved = await Complaint.countDocuments({ department, status: 'Resolved' });

    // Priority breakdown of assigned complaints
    const criticalCount = await Complaint.countDocuments({
      assignedOfficer: officerId,
      priority: 'Critical',
      status: { $ne: 'Resolved' },
    });
    const highCount = await Complaint.countDocuments({
      assignedOfficer: officerId,
      priority: 'High',
      status: { $ne: 'Resolved' },
    });

    // Recent 5 active assigned complaints
    const recentAssigned = await Complaint.find({
      assignedOfficer: officerId,
      status: { $ne: 'Resolved' },
    })
      .populate('citizen', 'name phone')
      .sort({ priority: 1, createdAt: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      data: {
        personal: {
          total: assignedTotal,
          pending: assignedPending,
          inProgress: assignedInProgress,
          resolved: assignedResolved,
          critical: criticalCount,
          high: highCount,
        },
        department: {
          name: department,
          total: deptTotal,
          pending: deptPending,
          assigned: deptAssigned,
          inProgress: deptInProgress,
          resolved: deptResolved,
        },
        recentAssigned,
      },
    });
  } catch (error) {
    console.error('Officer dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch officer dashboard statistics',
    });
  }
};
