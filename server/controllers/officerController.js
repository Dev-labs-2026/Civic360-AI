import Complaint from '../models/Complaint.js';
import { departmentQueryValues } from '../utils/departments.js';
import { ACTIVE_SLA_STATUSES } from '../config/slaConfig.js';

/**
 * @desc    Get Officer Dashboard analytics
 * @route   GET /api/officer/dashboard
 * @access  Private (Officer, Admin)
 */
export const getOfficerDashboard = async (req, res) => {
  try {
    const officerId = req.user._id;
    const department = req.user.department || 'General Civic Department';
    const departmentFilter = { department: { $in: departmentQueryValues(department) } };

    // Personal assigned complaints
    const assignedTotal = await Complaint.countDocuments({ assignedOfficer: officerId });
    const workload = await Complaint.countDocuments({ assignedOfficer: officerId, status: { $in: ['Pending', 'Assigned', 'In Progress'] } });
    const assignedPending = await Complaint.countDocuments({ assignedOfficer: officerId, status: 'Pending' });
    const assignedInProgress = await Complaint.countDocuments({ assignedOfficer: officerId, status: 'In Progress' });
    const assignedResolved = await Complaint.countDocuments({ assignedOfficer: officerId, status: 'Resolved' });
    const [assignedOverdue, assignedEscalated] = await Promise.all([
      Complaint.countDocuments({ assignedOfficer: officerId, status: { $in: ACTIVE_SLA_STATUSES }, slaDeadline: { $lte: new Date() }, $or: [{ escalationLevel: { $lt: 1 } }, { escalationLevel: { $exists: false } }] }),
      Complaint.countDocuments({ assignedOfficer: officerId, status: { $in: ACTIVE_SLA_STATUSES }, escalationLevel: { $gt: 0 } }),
    ]);

    // Departmental complaints
    const deptTotal = await Complaint.countDocuments(departmentFilter);
    const deptPending = await Complaint.countDocuments({ ...departmentFilter, status: 'Pending' });
    const deptUnassigned = await Complaint.countDocuments({ ...departmentFilter, status: 'Pending', assignedOfficer: null });
    const deptAssigned = await Complaint.countDocuments({ ...departmentFilter, status: 'Assigned' });
    const deptInProgress = await Complaint.countDocuments({ ...departmentFilter, status: 'In Progress' });
    const deptResolved = await Complaint.countDocuments({ ...departmentFilter, status: 'Resolved' });

    // Priority breakdown of assigned complaints
    const criticalCount = await Complaint.countDocuments({
      assignedOfficer: officerId,
      priority: 'Critical',
      status: { $in: ['Pending', 'Assigned', 'In Progress'] },
    });
    const highCount = await Complaint.countDocuments({
      assignedOfficer: officerId,
      priority: 'High',
      status: { $in: ['Pending', 'Assigned', 'In Progress'] },
    });

    // Recent 5 active assigned complaints
    const recentAssigned = await Complaint.find({
      assignedOfficer: officerId,
      status: { $in: ['Pending', 'Assigned', 'In Progress'] },
    })
      .populate('citizen', 'name phone')
      .sort({ priority: 1, createdAt: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      data: {
        personal: {
          total: assignedTotal,
          workload,
          pending: assignedPending,
          inProgress: assignedInProgress,
          resolved: assignedResolved,
          overdue: assignedOverdue,
          escalated: assignedEscalated,
          critical: criticalCount,
          high: highCount,
        },
        department: {
          name: department,
          total: deptTotal,
          pending: deptPending,
          unassigned: deptUnassigned,
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
