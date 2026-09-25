import Complaint from '../models/Complaint.js';
import User from '../models/User.js';

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

    const totalOfficers = await User.countDocuments({ role: 'officer' });
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
    const departmentStats = await Complaint.aggregate([
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
          resolutionRate,
          totalOfficers,
          totalCitizens,
        },
        categoryStats,
        departmentStats,
        wardStats,
        priorityStats,
        urgentComplaints,
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
    const query = {};

    if (role) query.role = role;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update user role or department
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin only)
 */
export const updateUserByAdmin = async (req, res) => {
  try {
    const { role, department, ward, name, phone } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) user.role = role;
    if (department) user.department = department;
    if (ward) user.ward = ward;
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
