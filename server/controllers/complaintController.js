import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import aiService from '../services/aiService.js';
import { DEPARTMENT_NAMES, departmentQueryValues } from '../utils/departments.js';
import { WARDS } from '../../shared/wards.mjs';
import { selectOfficerForComplaint } from '../services/officerAssignmentService.js';
import { calculateSlaStatus, createSla } from '../services/slaService.js';
import { ACTIVE_SLA_STATUSES, SLA_DUE_SOON_WINDOW_HOURS, SLA_STATUSES } from '../config/slaConfig.js';

const CATEGORIES = ['Pothole', 'Garbage', 'Broken Streetlight', 'Water Leakage', 'Drainage', 'Road Damage', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
const SORT_FIELDS = ['createdAt', 'updatedAt', 'priority', 'status'];
const validId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const validCoordinate = (value, min, max) => value !== '' && !(typeof value === 'string' && !value.trim()) && value !== null && value !== undefined
  && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const reject = (res, status, message) => res.status(status).json({ success: false, message });
const present = (complaint, user) => {
  const value = complaint.toObject ? complaint.toObject() : { ...complaint };
  value.slaStatus = calculateSlaStatus(value);
  if (user?.role === 'citizen') {
    delete value.escalationHistory;
    delete value.escalationLevel;
    delete value.escalatedTo;
    delete value.slaDueSoonNotifiedAt;
  }
  return value;
};

const populateComplaint = (query) => query
  .populate('citizen', 'name')
  .populate('assignedOfficer', 'name department')
  .populate('timeline.updatedBy', 'name role')
  .populate('escalatedTo', 'name role')
  .populate('escalationHistory.previousAssignee', 'name role')
  .populate('escalationHistory.newAssignee', 'name role')
  .populate('aiMetadata.duplicateOf', 'title status createdAt');

const canReadComplaint = (complaint, user) => {
  if (!user) return true; // public tracking projection only
  if (user.role === 'admin') return true;
  if (user.role === 'citizen') return complaint.citizen?._id?.toString() === user._id.toString()
    || complaint.citizen?.toString() === user._id.toString();
  if (user.role === 'officer') {
    const assigned = complaint.assignedOfficer?._id?.toString() === user._id.toString()
      || complaint.assignedOfficer?.toString() === user._id.toString();
    return assigned || departmentQueryValues(user.department).includes(complaint.department);
  }
  return false;
};

const toPublicComplaint = (complaint) => {
  const source = present(complaint);
  const value = Object.fromEntries(['_id', 'title', 'category', 'priority', 'status', 'department', 'routingExplanation', 'latitude', 'longitude', 'address', 'ward', 'resolutionNote', 'beforeImage', 'afterImage', 'createdAt', 'updatedAt', 'slaDuration', 'slaDeadline']
    .filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
  value.slaStatus = calculateSlaStatus(source);
  if (source.assignedOfficer && typeof source.assignedOfficer === 'object') {
    value.assignedOfficer = { name: source.assignedOfficer.name, department: source.assignedOfficer.department };
  }
  if (Array.isArray(source.timeline)) {
    value.timeline = source.timeline.map(({ status, note, timestamp }) => ({
      status, note, timestamp,
    }));
  }
  return value;
};

export const analyzeComplaintDraft = async (req, res) => {
  try {
    const { title = '', description = '', category, latitude, longitude, ward } = req.body;
    if (category !== undefined && !CATEGORIES.includes(category)) return reject(res, 400, 'Invalid complaint category.');
    const hasLat = latitude !== undefined && latitude !== null && latitude !== '';
    const hasLng = longitude !== undefined && longitude !== null && longitude !== '';
    if (hasLat !== hasLng || (hasLat && (!validCoordinate(latitude, -90, 90) || !validCoordinate(longitude, -180, 180)))) {
      return reject(res, 400, 'Latitude and longitude must both be valid coordinates.');
    }
    const analysis = await aiService.analyzeComplaint({
      title: String(title).slice(0, 120), description: String(description).slice(0, 3000), category,
      latitude: hasLat ? Number(latitude) : null, longitude: hasLng ? Number(longitude) : null,
      ward: typeof ward === 'string' ? ward.slice(0, 100) : '', ComplaintModel: Complaint,
    });
    return res.json({ success: true, analysis });
  } catch (error) {
    console.error('Draft analysis failed:', error.message);
    return reject(res, 500, 'Unable to analyze complaint right now.');
  }
};

export const getComplaints = async (req, res) => {
  try {
    const allowed = new Set(['status', 'category', 'priority', 'department', 'ward', 'search', 'my', 'assignedToMe', 'page', 'limit', 'sortBy', 'order', 'slaStatus']);
    if (Object.keys(req.query).some((key) => !allowed.has(key))) return reject(res, 400, 'Unsupported query parameter.');
    const { status, category, priority, department, ward, search, my, assignedToMe, slaStatus, page = '1', limit = '50', sortBy = 'createdAt', order = 'desc' } = req.query;
    if (status && !STATUSES.includes(status)) return reject(res, 400, 'Invalid complaint status.');
    if (slaStatus && !SLA_STATUSES.includes(slaStatus)) return reject(res, 400, 'Invalid SLA status.');
    if (category && !CATEGORIES.includes(category)) return reject(res, 400, 'Invalid complaint category.');
    if (priority && !PRIORITIES.includes(priority)) return reject(res, 400, 'Invalid complaint priority.');
    if (department && !DEPARTMENT_NAMES.includes(department)) return reject(res, 400, 'Invalid department.');
    if (ward !== undefined && (typeof ward !== 'string' || ward.length > 100)) return reject(res, 400, 'Ward filter is invalid.');
    if (search !== undefined && (typeof search !== 'string' || search.length > 100)) return reject(res, 400, 'Search text must be 100 characters or fewer.');
    if (my && !['true', 'false'].includes(my) || assignedToMe && !['true', 'false'].includes(assignedToMe)) return reject(res, 400, 'Invalid boolean filter.');
    if (!/^\d+$/.test(String(page)) || Number(page) < 1 || Number(page) > 100000) return reject(res, 400, 'Invalid page number.');
    if (!/^\d+$/.test(String(limit)) || Number(limit) < 1 || Number(limit) > 100) return reject(res, 400, 'Limit must be between 1 and 100.');
    if (!SORT_FIELDS.includes(sortBy) || !['asc', 'desc'].includes(order)) return reject(res, 400, 'Invalid sorting options.');

    const query = {};
    if (req.user?.role === 'citizen') query.citizen = req.user._id;
    if (req.user?.role === 'officer') {
      if (assignedToMe === 'true') query.assignedOfficer = req.user._id;
      else if (department) query.department = { $in: departmentQueryValues(req.user.department) };
      else query.$or = [
        { assignedOfficer: req.user._id },
        { department: { $in: departmentQueryValues(req.user.department) } },
      ];
    }
    if (req.user?.role === 'admin') {
      if (my === 'true') query.citizen = req.user._id;
      if (assignedToMe === 'true') query.assignedOfficer = req.user._id;
    }
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (department && req.user?.role !== 'officer') query.department = { $in: departmentQueryValues(department) };
    if (ward) query.ward = ward;
    if (search) {
      const safeSearch = new RegExp(escapeRegex(search), 'i');
      const searchFields = [{ title: safeSearch }, { address: safeSearch }, { ward: safeSearch }];
      query.$and = [...(query.$and || []), { $or: searchFields }];
    }
    if (slaStatus) {
      const now = new Date();
      const soon = new Date(now.getTime() + SLA_DUE_SOON_WINDOW_HOURS * 60 * 60 * 1000);
      const add = (condition) => { query.$and = [...(query.$and || []), condition]; };
      if (slaStatus === 'Resolved') add({ status: 'Resolved', slaDeadline: { $exists: true } });
      else if (slaStatus === 'Escalated') add({ status: { $in: ACTIVE_SLA_STATUSES }, escalationLevel: { $gt: 0 } });
      else {
        const deadline = slaStatus === 'On Track' ? { $gt: soon } : slaStatus === 'Due Soon' ? { $gt: now, $lte: soon } : { $lte: now };
        add({ status: { $in: ACTIVE_SLA_STATUSES }, slaDeadline: deadline, $or: [{ escalationLevel: { $lt: 1 } }, { escalationLevel: { $exists: false } }] });
      }
    }
    const pageNum = Number(page); const limitNum = Number(limit);
    const [total, complaints] = await Promise.all([
      Complaint.countDocuments(query),
      populateComplaint(Complaint.find(query)).sort({ [sortBy]: order === 'desc' ? -1 : 1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    ]);
    const data = complaints.map((item) => req.user ? present(item, req.user) : toPublicComplaint(item));
    return res.json({ success: true, count: data.length, total, totalPages: Math.ceil(total / limitNum), currentPage: pageNum, complaints: data });
  } catch (error) {
    console.error('Get complaints failed:', error.message);
    return reject(res, 500, 'Unable to fetch complaints right now.');
  }
};

export const getComplaintById = async (req, res) => {
  if (!validId(req.params.id)) return reject(res, 400, 'Invalid complaint ID.');
  try {
    const complaint = await populateComplaint(Complaint.findById(req.params.id));
    if (!complaint) return reject(res, 404, 'Complaint not found.');
    if (req.user && !canReadComplaint(complaint, req.user)) return reject(res, 403, 'You are not authorized to view this complaint.');
    return res.json({ success: true, complaint: req.user ? present(complaint, req.user) : toPublicComplaint(complaint) });
  } catch (error) {
    console.error('Get complaint failed:', error.message);
    return reject(res, 500, 'Unable to fetch complaint right now.');
  }
};

export const createComplaint = async (req, res) => {
  if (req.user.role !== 'citizen') return reject(res, 403, 'Only citizens may submit complaints.');
  const createFields = ['title', 'description', 'category', 'image', 'latitude', 'longitude', 'address', 'ward', 'priority', 'confirmDifferentIssue'];
  if (Object.keys(req.body).some((key) => !createFields.includes(key))) return reject(res, 400, 'Unsupported complaint field.');
  const { title, description, category, image, latitude, longitude, address, ward, priority, confirmDifferentIssue = false } = req.body;
  if (typeof confirmDifferentIssue !== 'boolean') return reject(res, 400, 'Duplicate confirmation must be a boolean.');
  if (typeof title !== 'string' || !title.trim() || title.length > 120 || typeof description !== 'string' || !description.trim() || description.length > 3000) {
    return reject(res, 400, 'A title (up to 120 characters) and description (up to 3000 characters) are required.');
  }
  if (!validCoordinate(latitude, -90, 90) || !validCoordinate(longitude, -180, 180)) return reject(res, 400, 'Latitude or longitude is outside the valid range.');
  if (category !== undefined && !CATEGORIES.includes(category)) return reject(res, 400, 'Invalid complaint category.');
  if (priority !== undefined && !PRIORITIES.includes(priority)) return reject(res, 400, 'Invalid complaint priority.');
  if (ward !== undefined && (typeof ward !== 'string' || !WARDS.includes(ward.trim()))) return reject(res, 400, 'Select a configured demo ward or zone.');
  if (image !== undefined && (typeof image !== 'string' || image.length > 2_000_000)) return reject(res, 400, 'Image reference is invalid or too large. Upload the image separately.');
  try {
    const aiAnalysis = await aiService.analyzeComplaint({ title, description, category, latitude: Number(latitude), longitude: Number(longitude), ward, ComplaintModel: Complaint });
    if (aiAnalysis.duplicateDetected && !confirmDifferentIssue) {
      return res.status(409).json({
        success: false,
        code: 'POSSIBLE_DUPLICATE',
        message: 'A recent nearby complaint in the same category already exists. Review it or confirm that this is a different issue.',
        duplicate: { ...aiAnalysis.duplicateComplaint, distanceMeters: aiAnalysis.distanceMeters, matchLevel: aiAnalysis.matchLevel, similarityReason: aiAnalysis.similarityReason },
      });
    }
    const determinedCategory = category && category !== 'Other' ? category : (aiAnalysis.suggestedCategory || 'Other');
    const determinedPriority = priority || aiAnalysis.suggestedPriority || 'Medium';
    const determinedDepartment = aiService.recommendDepartment(determinedCategory);
    const assignment = await selectOfficerForComplaint({ department: determinedDepartment, ward });
    const assignedOfficerId = assignment.officer?._id || null;
    const sla = createSla(determinedPriority);
    const complaint = await Complaint.create({
      title: title.trim(), description: description.trim(), category: determinedCategory, image: image || '',
      latitude: Number(latitude), longitude: Number(longitude), address: typeof address === 'string' ? address.slice(0, 300) : 'Location unspecified',
      ward: typeof ward === 'string' ? ward.trim().slice(0, 100) : '', priority: determinedPriority,
      status: assignedOfficerId ? 'Assigned' : 'Pending', citizen: req.user._id, assignedOfficer: assignedOfficerId,
      department: determinedDepartment, routingExplanation: assignment.explanation,
      ...sla, escalationLevel: 0, escalationHistory: [],
      aiMetadata: { confidenceScore: aiAnalysis.confidenceScore, detectedKeywords: aiAnalysis.detectedKeywords || [], duplicateDetected: Boolean(aiAnalysis.duplicateDetected && confirmDifferentIssue), duplicateOf: aiAnalysis.duplicateDetected && confirmDifferentIssue ? aiAnalysis.duplicateComplaint?._id : null, suggestedPriority: aiAnalysis.suggestedPriority, suggestedDepartment: determinedDepartment, autoRouted: Boolean(assignedOfficerId) },
      timeline: [{ status: 'Pending', note: `Complaint registered. Configured ${determinedPriority} priority SLA deadline: ${sla.slaDeadline.toISOString()}.`, updatedBy: req.user._id }, ...(assignedOfficerId ? [{ status: 'Assigned', note: `${assignment.explanation} Assigned to ${assignment.officer.name} (${determinedDepartment}).`, updatedBy: req.user._id }] : [])],
    });
    await Notification.create({ user: req.user._id, title: 'Complaint Registered', message: `Your complaint "${complaint.title}" has been registered (ID: #${complaint._id.toString().slice(-6).toUpperCase()}).`, complaintId: complaint._id, type: 'new_complaint' });
    if (assignedOfficerId) await Notification.create({ user: assignedOfficerId, title: 'New Complaint Assigned', message: `New ${complaint.priority} priority complaint in ${complaint.ward}: "${complaint.title}".`, complaintId: complaint._id, type: 'assignment' });
    const created = await populateComplaint(Complaint.findById(complaint._id));
    return res.status(201).json({ success: true, message: 'Complaint submitted successfully', complaint: present(created, req.user) });
  } catch (error) {
    console.error('Create complaint failed:', error.message);
    if (error.name === 'ValidationError') return reject(res, 400, 'Complaint details are invalid.');
    return reject(res, 500, 'Unable to submit complaint right now.');
  }
};

export const updateComplaint = async (req, res) => {
  if (!validId(req.params.id)) return reject(res, 400, 'Invalid complaint ID.');
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return reject(res, 404, 'Complaint not found.');
    const body = req.body;
    const originalStatus = complaint.status;
    const keys = Object.keys(body);
    const isAdmin = req.user.role === 'admin';
    const isCitizenOwner = req.user.role === 'citizen' && complaint.citizen.toString() === req.user._id.toString();
    const isOfficer = req.user.role === 'officer';
    const isOfficerAuthorized = isOfficer && (complaint.assignedOfficer?.toString() === req.user._id.toString()
      || departmentQueryValues(req.user.department).includes(complaint.department));
    if (!isAdmin && !isCitizenOwner && !isOfficerAuthorized) return reject(res, 403, 'You are not authorized to modify this complaint.');

    if (isCitizenOwner) {
      if (complaint.status !== 'Pending') return reject(res, 403, 'Only pending complaints can be edited by their owner.');
      if (keys.some((key) => !['title', 'description'].includes(key))) return reject(res, 403, 'Citizens may only edit the title and description of a pending complaint.');
    }
    if (isOfficer) {
      if (keys.some((key) => !['status', 'resolutionNote', 'afterImage', 'beforeImage'].includes(key))) return reject(res, 403, 'Officers may only update complaint progress and resolution evidence.');
    }
    const adminFields = ['status', 'resolutionNote', 'afterImage', 'beforeImage', 'department', 'assignedOfficer', 'priority', 'category', 'title', 'description'];
    if (isAdmin && keys.some((key) => !adminFields.includes(key))) return reject(res, 400, 'Unsupported complaint field.');
    if (body.status !== undefined && !STATUSES.includes(body.status)) return reject(res, 400, 'Invalid complaint status.');
    if (body.category !== undefined && !CATEGORIES.includes(body.category)) return reject(res, 400, 'Invalid complaint category.');
    if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) return reject(res, 400, 'Invalid complaint priority.');
    if (body.department !== undefined && !DEPARTMENT_NAMES.includes(body.department)) return reject(res, 400, 'Invalid department.');
    if (body.assignedOfficer && !validId(body.assignedOfficer)) return reject(res, 400, 'Invalid officer ID.');
    for (const field of ['title', 'description', 'resolutionNote']) {
      if (body[field] !== undefined && (typeof body[field] !== 'string' || body[field].length > (field === 'description' ? 3000 : field === 'title' ? 120 : 2000))) return reject(res, 400, `Invalid ${field}.`);
    }
    for (const field of ['afterImage', 'beforeImage']) if (body[field] !== undefined && (typeof body[field] !== 'string' || body[field].length > 2_000_000)) return reject(res, 400, `Invalid ${field}.`);
    if (body.assignedOfficer) {
      const targetDepartment = body.department || complaint.department;
      const target = await User.findOne({
        _id: body.assignedOfficer,
        role: 'officer',
        isActive: { $ne: false },
        department: { $in: departmentQueryValues(targetDepartment) },
      });
      if (!target) return reject(res, 400, 'Assigned user must be an active officer in the complaint department.');
    } else if (isAdmin && body.department && complaint.assignedOfficer) {
      const existingOfficer = await User.findById(complaint.assignedOfficer);
      if (existingOfficer && (existingOfficer.isActive === false
        || !departmentQueryValues(body.department).includes(existingOfficer.department))) {
        return reject(res, 400, 'Assign an officer from the new department or clear the current assignment.');
      }
    }

    if (body.status !== undefined && body.status !== complaint.status) {
      if (isCitizenOwner) return reject(res, 403, 'Citizens cannot change complaint status.');
      const transitions = isAdmin
        ? { Pending: ['Assigned', 'In Progress', 'Resolved', 'Rejected'], Assigned: ['In Progress', 'Resolved', 'Rejected', 'Pending'], 'In Progress': ['Resolved', 'Rejected', 'Assigned'], Resolved: ['In Progress'], Rejected: ['Pending', 'Assigned'] }
        : { Pending: ['Assigned', 'In Progress'], Assigned: ['In Progress'], 'In Progress': ['Resolved'] };
      if (!transitions[complaint.status]?.includes(body.status)) return reject(res, 409, 'This complaint status transition is not allowed.');
      complaint.status = body.status;
    }
    if (body.resolutionNote !== undefined) complaint.resolutionNote = body.resolutionNote;
    if (body.beforeImage !== undefined) complaint.beforeImage = body.beforeImage;
    if (body.afterImage !== undefined) complaint.afterImage = body.afterImage;
    if (isCitizenOwner) {
      if (body.title !== undefined) complaint.title = body.title;
      if (body.description !== undefined) complaint.description = body.description;
    }
    if (isAdmin) {
      for (const field of ['department', 'priority', 'category', 'title', 'description']) if (body[field] !== undefined) complaint[field] = body[field];
      if (body.assignedOfficer !== undefined) complaint.assignedOfficer = body.assignedOfficer || null;
      if (body.assignedOfficer !== undefined) complaint.routingExplanation = body.assignedOfficer
        ? 'Manually assigned by an authorized administrator.'
        : 'Unassigned by an authorized administrator; complaint remains in the department pool.';
    }
    const statusChanged = complaint.status !== originalStatus;
    const meaningfulUpdate = keys.some((key) => key !== 'status') || statusChanged;
    if (!meaningfulUpdate) return reject(res, 400, 'No complaint changes were submitted.');
    complaint.timeline.push({ status: complaint.status, note: body.resolutionNote || (statusChanged ? `Status updated to ${complaint.status}.` : 'Complaint details updated.'), updatedBy: req.user._id, timestamp: new Date() });
    await complaint.save();
    if (statusChanged || body.resolutionNote) await Notification.create({ user: complaint.citizen, title: `Complaint Status: ${complaint.status}`, message: `Your complaint "${complaint.title}" has been updated.`, complaintId: complaint._id, type: 'status_update' });
    const updated = await populateComplaint(Complaint.findById(complaint._id));
    return res.json({ success: true, message: 'Complaint updated successfully', complaint: present(updated, req.user) });
  } catch (error) {
    console.error('Update complaint failed:', error.message);
    if (error.name === 'ValidationError') return reject(res, 400, 'Complaint details are invalid.');
    return reject(res, 500, 'Unable to update complaint right now.');
  }
};

export const deleteComplaint = async (req, res) => {
  if (!validId(req.params.id)) return reject(res, 400, 'Invalid complaint ID.');
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return reject(res, 404, 'Complaint not found.');
    const isOwner = req.user.role === 'citizen' && complaint.citizen.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !(isOwner && complaint.status === 'Pending')) return reject(res, 403, 'You may delete only your own pending complaint.');
    await Complaint.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Complaint deleted successfully.' });
  } catch (error) {
    console.error('Delete complaint failed:', error.message);
    return reject(res, 500, 'Unable to delete complaint right now.');
  }
};
