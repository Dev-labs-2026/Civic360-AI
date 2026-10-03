import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { DEPARTMENT_NAMES, departmentQueryValues, normalizeDepartment } from '../utils/departments.js';
import { ACTIVE_SLA_STATUSES, SLA_DUE_SOON_WINDOW_HOURS } from '../config/slaConfig.js';
import { calculateSlaStatus } from '../services/slaService.js';

const ROLES = ['citizen', 'officer', 'admin'];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @desc    Get Admin Dashboard comprehensive analytics & metrics
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
export const getAdminDashboard = async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });
    const assignedComplaints = await Complaint.countDocuments({ status: 'Assigned' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'In Progress' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
    const rejectedComplaints = await Complaint.countDocuments({ status: 'Rejected' });
    const criticalComplaints = await Complaint.countDocuments({ priority: 'Critical', status: { $ne: 'Resolved' } });
    const highComplaints = await Complaint.countDocuments({ priority: 'High', status: { $ne: 'Resolved' } });
    const duplicateRelatedComplaints = await Complaint.countDocuments({ 'aiMetadata.duplicateOf': { $ne: null } });
    const duplicateByWard = await Complaint.aggregate([
      { $match: { 'aiMetadata.duplicateOf': { $ne: null } } },
      { $group: { _id: '$ward', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const duplicateComplaints = await Complaint.find({ 'aiMetadata.duplicateOf': { $ne: null } })
      .populate('aiMetadata.duplicateOf', 'title category status createdAt')
      .populate('assignedOfficer', 'name department')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const now = new Date();
    const soon = new Date(now.getTime() + SLA_DUE_SOON_WINDOW_HOURS * 60 * 60 * 1000);
    const activeSla = { status: { $in: ACTIVE_SLA_STATUSES }, slaDeadline: { $exists: true } };
    const notEscalated = { $or: [{ escalationLevel: { $lt: 1 } }, { escalationLevel: { $exists: false } }] };
    const [slaOverdue, slaDueSoon, slaEscalated, slaOnTrack, slaResolved, resolvedWithDeadline, overdueComplaints, escalatedComplaints] = await Promise.all([
      Complaint.countDocuments({ ...activeSla, ...notEscalated, slaDeadline: { $lte: now } }),
      Complaint.countDocuments({ ...activeSla, ...notEscalated, slaDeadline: { $gt: now, $lte: soon } }),
      Complaint.countDocuments({ ...activeSla, escalationLevel: { $gt: 0 } }),
      Complaint.countDocuments({ ...activeSla, ...notEscalated, slaDeadline: { $gt: soon } }),
      Complaint.countDocuments({ status: 'Resolved', slaDeadline: { $exists: true } }),
      Complaint.find({ status: 'Resolved', slaDeadline: { $exists: true } }).select('slaDeadline timeline').lean(),
      Complaint.find({ ...activeSla, ...notEscalated, slaDeadline: { $lte: now } }).populate('citizen', 'name').populate('assignedOfficer', 'name department').sort({ slaDeadline: 1 }).limit(10).lean(),
      Complaint.find({ ...activeSla, escalationLevel: { $gt: 0 } }).populate('citizen', 'name').populate('assignedOfficer', 'name department').populate('escalatedTo', 'name').sort({ slaDeadline: 1 }).limit(10).lean(),
    ]);
    const onTimeResolved = resolvedWithDeadline.filter((complaint) => {
      const resolutions = (complaint.timeline || []).filter((entry) => entry.status === 'Resolved');
      const lastResolution = resolutions.reduce((latest, entry) => !latest || entry.timestamp > latest ? entry.timestamp : latest, null);
      return lastResolution && new Date(lastResolution) <= new Date(complaint.slaDeadline);
    }).length;
    const slaStats = {
      onTrack: slaOnTrack, dueSoon: slaDueSoon, overdue: slaOverdue, escalated: slaEscalated,
      resolved: slaResolved,
      onTimeResolutionRate: resolvedWithDeadline.length ? Math.round((onTimeResolved / resolvedWithDeadline.length) * 100) : 0,
    };

    const totalOfficers = await User.countDocuments({ role: 'officer', isActive: { $ne: false } });
    const totalCitizens = await User.countDocuments({ role: 'citizen' });

    // Resolution rate calculation
    const resolutionRate = totalComplaints > 0 
      ? Math.round((resolvedComplaints / totalComplaints) * 100) 
      : 0;

    // Complaints by Category
    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Complaints by Department
    const rawDepartmentStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] },
          },
          pending: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Pending', 'Assigned', 'In Progress']] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);
    const departmentTotals = new Map();
    for (const stat of rawDepartmentStats) {
      const departmentName = normalizeDepartment(stat._id) || 'General Civic Department';
      const current = departmentTotals.get(departmentName) || {
        total: 0,
        resolved: 0,
        pending: 0,
      };
      current.total += stat.total;
      current.resolved += stat.resolved;
      current.pending += stat.pending;
      departmentTotals.set(departmentName, current);
    }
    const departmentStats = [...departmentTotals.entries()]
      .map(([name, stats]) => ({ _id: name, ...stats }))
      .sort((left, right) => right.total - left.total);

    // Ward-wise statistics
    const wardStats = await Complaint.aggregate([
      { $group: { _id: '$ward', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Priority distribution
    const priorityStats = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const trendStart = new Date();
    trendStart.setMonth(trendStart.getMonth() - 5, 1);
    trendStart.setHours(0, 0, 0, 0);
    const resolutionTrend = await Complaint.aggregate([
      { $match: { status: 'Resolved' } },
      { $project: { resolvedEvents: { $filter: { input: { $ifNull: ['$timeline', []] }, as: 'event', cond: { $eq: ['$$event.status', 'Resolved'] } } } } },
      { $addFields: { resolvedAt: { $max: { $map: { input: '$resolvedEvents', as: 'event', in: '$$event.timestamp' } } } } },
      { $match: { resolvedAt: { $gte: trendStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$resolvedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Recent 10 critical / urgent complaints
    const urgentComplaints = await Complaint.find({
      priority: { $in: ['Critical', 'High'] },
      status: { $ne: 'Resolved' },
    })
      .populate('citizen', 'name phone')
      .populate('assignedOfficer', 'name department')
      .sort({ createdAt: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalComplaints,
          pendingComplaints,
          assignedComplaints,
          inProgressComplaints,
          resolvedComplaints,
          rejectedComplaints,
          criticalComplaints,
          highComplaints,
          duplicateRelatedComplaints,
          resolutionRate,
          totalOfficers,
          totalCitizens,
        },
        categoryStats,
        departmentStats,
        wardStats,
        priorityStats,
        resolutionTrend,
        urgentComplaints,
        duplicateByWard,
        duplicateComplaints,
        slaStats,
        overdueComplaints: overdueComplaints.map((complaint) => ({ ...complaint, slaStatus: calculateSlaStatus(complaint, now) })),
        escalatedComplaints: escalatedComplaints.map((complaint) => ({ ...complaint, slaStatus: calculateSlaStatus(complaint, now) })),
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard statistics',
    });
  }
};

/**
 * @desc    Get all users with role filtering (Admin only)
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, department, search } = req.query;
    if (Object.keys(req.query).some((key) => !['role', 'department', 'search'].includes(key))) {
      return res.status(400).json({ success: false, message: 'Unsupported query parameter.' });
    }
    if (role && !ROLES.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role.' });
    if (department && !DEPARTMENT_NAMES.includes(normalizeDepartment(department))) return res.status(400).json({ success: false, message: 'Invalid department.' });
    if (search !== undefined && (typeof search !== 'string' || search.length > 100)) return res.status(400).json({ success: false, message: 'Search text must be 100 characters or fewer.' });
    const query = {};

    if (role) query.role = role;
    if (department) query.department = { $in: departmentQueryValues(department) };
    if (search) {
      const safeSearch = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { name: safeSearch },
        { email: safeSearch },
        { phone: safeSearch },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Admin user list failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to fetch users right now.' });
  }
};

/**
 * @desc    Update user role or department
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin only)
 */
export const updateUserByAdmin = async (req, res) => {
  try {
    if (typeof req.params.id !== 'string' || !/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    const { role, department, ward, name, phone, isActive } = req.body;
    const allowed = ['role', 'department', 'ward', 'name', 'phone', 'isActive'];
    if (Object.keys(req.body).some((key) => !allowed.includes(key))) return res.status(400).json({ success: false, message: 'Unsupported user field.' });
    if (role !== undefined && !ROLES.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role.' });
    if (department !== undefined && !DEPARTMENT_NAMES.includes(normalizeDepartment(department))) return res.status(400).json({ success: false, message: 'Invalid department.' });
    if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.length > 60)) return res.status(400).json({ success: false, message: 'Invalid name.' });
    if (phone !== undefined && (typeof phone !== 'string' || phone.length > 30)) return res.status(400).json({ success: false, message: 'Invalid phone number.' });
    if (ward !== undefined && (typeof ward !== 'string' || ward.length > 100)) return res.status(400).json({ success: false, message: 'Invalid ward.' });
    if (isActive !== undefined && typeof isActive !== 'boolean') return res.status(400).json({ success: false, message: 'isActive must be a boolean.' });
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) user.role = role;
    if (department) user.department = department;
    if (ward) user.ward = ward;
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    console.error('Admin user update failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to update user right now.' });
  }
};
