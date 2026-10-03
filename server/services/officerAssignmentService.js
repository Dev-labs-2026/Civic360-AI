import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { departmentQueryValues } from '../utils/departments.js';

const ACTIVE_STATUSES = ['Pending', 'Assigned', 'In Progress'];

/**
 * Selects an active officer in the routed department. A matching stored ward
 * is preferred, then the lowest active workload; ties are stable by user ID.
 */
export const selectOfficerForComplaint = async ({ department, ward, UserModel = User, ComplaintModel = Complaint }) => {
  const officers = await UserModel.find({
    role: 'officer',
    department: { $in: departmentQueryValues(department) },
    isActive: { $ne: false },
  }).select('_id name department ward createdAt').lean();

  if (!officers.length) {
    return {
      officer: null,
      workload: null,
      explanation: 'No active officer is available in this department; the complaint remains in the department pool.',
    };
  }

  const counts = await ComplaintModel.aggregate([
    { $match: { assignedOfficer: { $in: officers.map((officer) => officer._id) }, status: { $in: ACTIVE_STATUSES } } },
    { $group: { _id: '$assignedOfficer', workload: { $sum: 1 } } },
  ]);
  const workloadByOfficer = new Map(counts.map((item) => [String(item._id), item.workload]));
  const normalizedWard = typeof ward === 'string' ? ward.trim().toLocaleLowerCase() : '';
  const matchingWard = normalizedWard
    ? officers.filter((officer) => typeof officer.ward === 'string' && officer.ward.trim().toLocaleLowerCase() === normalizedWard)
    : [];
  const candidates = matchingWard.length ? matchingWard : officers;
  candidates.sort((left, right) => {
    const workloadDifference = (workloadByOfficer.get(String(left._id)) || 0) - (workloadByOfficer.get(String(right._id)) || 0);
    return workloadDifference || String(left._id).localeCompare(String(right._id));
  });
  const selected = candidates[0];

  let explanation;
  if (matchingWard.length) explanation = 'Matched department and ward; selected the eligible officer with the lowest active workload.';
  else if (normalizedWard) explanation = 'Matched department; no ward-specific officer was available, so the lowest-workload eligible officer was selected.';
  else explanation = 'Matched department; ward was not provided, so the lowest-workload eligible officer was selected.';

  return { officer: selected, workload: workloadByOfficer.get(String(selected._id)) || 0, explanation };
};

export default selectOfficerForComplaint;
