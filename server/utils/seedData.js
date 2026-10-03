import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import { normalizeDepartment } from './departments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DEMO_TITLE_PREFIX = 'DEMO SAMPLE: ';
const withDemoTitle = (title) => `${DEMO_TITLE_PREFIX}${title}`;
const withoutDemoTitle = (title) => title.replace(/^DEMO SAMPLE:\s*/i, '');

const documentToPlainObject = (document) => {
  const value = document.toObject({ depopulate: true });
  delete value.__v;
  return value;
};

export const seedDatabase = async ({ allowNonEmpty = false } = {}) => {
  const [userCount, complaintCount, notificationCount] = await Promise.all([
    User.countDocuments(),
    Complaint.countDocuments(),
    Notification.countDocuments(),
  ]);

  if (!allowNonEmpty && userCount + complaintCount + notificationCount > 0) {
    console.log(' Demo seeding skipped because the database already contains data.');
    return { seeded: false, skipped: true };
  }

  console.log(' Preparing West Bengal demo users, complaints, and notifications for Civic360 AI...');

  // All accounts and records below are fictional demo fixtures, not real civic reports.
  const userDefinitions = [
    {
      key: 'citizenUser',
      name: 'Soumyadas Barik',
      email: 'citizen.wb@civic360.in',
      phone: '9831012345',
      role: 'citizen',
      department: 'General Civic Department',
      ward: 'Kolkata • Ward 45',
    },
    {
      key: 'citizen2',
      name: 'Subha Ghosh',
      email: 'subha.wb@civic360.in',
      phone: '9831098765',
      role: 'citizen',
      department: 'General Civic Department',
      ward: 'Howrah • Ward 18',
    },
    {
      key: 'roadsOfficer',
      name: 'Souvik Baidya',
      email: 'officer.roads.wb@civic360.in',
      phone: '9800100001',
      role: 'officer',
      department: 'PWD / Roads',
      ward: 'Howrah • Ward 18',
    },
    {
      key: 'sanitationOfficer',
      name: 'Priya Sen',
      email: 'officer.sanitation.wb@civic360.in',
      phone: '9800100002',
      role: 'officer',
      department: 'Sanitation',
      ward: 'Kolkata • Ward 12',
    },
    {
      key: 'electricalOfficer',
      name: 'Debashis Mondal',
      email: 'officer.electrical.wb@civic360.in',
      phone: '9800100003',
      role: 'officer',
      department: 'Electrical',
      ward: 'Durgapur • Zone A',
    },
    {
      key: 'waterOfficer',
      name: 'Suparna Bose',
      email: 'officer.water.wb@civic360.in',
      phone: '9800100004',
      role: 'officer',
      department: 'Water Department',
      ward: 'Siliguri • Ward 22',
    },
    {
      key: 'drainageOfficer',
      name: 'Rakesh Pal',
      email: 'officer.drainage.wb@civic360.in',
      phone: '9800100005',
      role: 'officer',
      department: 'Drainage Department',
      ward: 'Kolkata • Ward 12',
    },
    {
      key: 'adminUser',
      name: 'Soumodeep Maiti',
      email: 'admin.wb@civic360.in',
      phone: '9800199999',
      role: 'admin',
      department: 'General Civic Department',
      ward: 'Kolkata • Ward 1',
    },
  ].map((user) => ({ ...user, password: randomBytes(32).toString('base64url'), state: 'West Bengal', country: 'India', isDemo: true }));

  const existingUsers = await User.find({
    email: { $in: userDefinitions.map((user) => user.email) },
  }).select('_id email').lean();
  const existingUserByEmail = new Map(existingUsers.map((user) => [user.email, user]));
  const userDocuments = userDefinitions.map((user) => {
    const existingUser = existingUserByEmail.get(user.email);
    return new User({
      ...user,
      _id: existingUser?._id || new mongoose.Types.ObjectId(),
    });
  });

  // Prepare complaint definitions after validation of every seed user.
  await Promise.all(userDocuments.map((user) => user.validate()));
  const userByKey = Object.fromEntries(
    userDefinitions.map((definition, index) => [
      definition.key,
      { _id: userDocuments[index]._id, name: definition.name, email: definition.email },
    ])
  );
  const {
    citizenUser,
    citizen2,
    roadsOfficer,
    sanitationOfficer,
    electricalOfficer,
    waterOfficer,
    drainageOfficer,
    adminUser,
  } = userByKey;

    // ─────────────────────────────────────────────────────────
    // 2. Create Sample Complaints — West Bengal
    // NOTE: All locations and complaints below are DEMO DATA
    //       for the Civic360 AI platform.
    //       They are NOT real government complaints or live
    //       municipal records.
    // Coordinates reference: WGS 84 / decimal degrees
    // ─────────────────────────────────────────────────────────
    const complaintDefinitions = [
      // ── Kolkata ──────────────────────────────────────────
      {
        title: 'Large pothole on Park Street causing vehicle damage',
        description:
          'A deep pothole approximately 2 feet wide and 10 inches deep has formed near the Park Street–Middleton Row crossing. Several two-wheelers have skidded during the morning peak hour, and one car suffered a damaged tyre.',
        category: 'Pothole',
        image:
          'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
        latitude: 22.5553,
        longitude: 88.3505,
        address: 'Park Street near Middleton Row, Kolkata',
        ward: 'Kolkata • Ward 67',
        priority: 'Critical',
        status: 'In Progress',
        citizen: citizenUser._id,
        assignedOfficer: roadsOfficer._id,
        department: 'PWD / Roads',
        aiMetadata: {
          confidenceScore: 0.96,
          detectedKeywords: ['pothole', 'deep', 'accident', 'skid'],
          suggestedPriority: 'Critical',
          suggestedDepartment: 'PWD / Roads',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Issue submitted with geo-location',
            updatedBy: citizenUser._id,
            timestamp: new Date(Date.now() - 3600000 * 24 * 2),
          },
          {
            status: 'Assigned',
            note: 'Rule-Based Smart Routing assigned to Souvik Baidya (PWD)',
            updatedBy: adminUser._id,
            timestamp: new Date(Date.now() - 3600000 * 24 * 1.5),
          },
          {
            status: 'In Progress',
            note: 'PWD maintenance crew dispatched with cold-mix asphalt truck',
            updatedBy: roadsOfficer._id,
            timestamp: new Date(Date.now() - 3600000 * 5),
          },
        ],
      },
      {
        title: 'Overflowing garbage bins near New Market, Kolkata',
        description:
          'Municipal garbage bins on Lindsay Street near New Market have been overflowing for 3 consecutive days. Solid waste is spilling onto the footpath, creating a severe hygiene hazard. Stray animals are scattering waste further.',
        category: 'Garbage',
        image:
          'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=60',
        latitude: 22.5636,
        longitude: 88.3503,
        address: 'Lindsay Street, New Market Area, Kolkata',
        ward: 'Kolkata • Ward 46',
        priority: 'High',
        status: 'Assigned',
        citizen: citizen2._id,
        assignedOfficer: sanitationOfficer._id,
        department: 'Sanitation',
        aiMetadata: {
          confidenceScore: 0.94,
          detectedKeywords: ['garbage', 'overflowing', 'waste', 'stench'],
          suggestedPriority: 'High',
          suggestedDepartment: 'Sanitation',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Reported by citizen',
            updatedBy: citizen2._id,
            timestamp: new Date(Date.now() - 3600000 * 18),
          },
          {
            status: 'Assigned',
            note: 'Assigned to Priya Sen (Sanitation)',
            updatedBy: adminUser._id,
            timestamp: new Date(Date.now() - 3600000 * 10),
          },
        ],
      },
      {
        title: 'Broken streetlight with exposed wire on AJC Bose Road',
        description:
          'Two consecutive streetlight poles (Pole #14 and #15) near AJC Bose Road flyover are non-functional. Pole #15 has an exposed hanging wire that poses an electrocution risk to pedestrians.',
        category: 'Broken Streetlight',
        image:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=60',
        latitude: 22.5418,
        longitude: 88.3558,
        address: 'AJC Bose Road near Flyover, Kolkata',
        ward: 'Kolkata • Ward 64',
        priority: 'Critical',
        status: 'Pending',
        citizen: citizenUser._id,
        assignedOfficer: electricalOfficer._id,
        department: 'Electrical',
        aiMetadata: {
          confidenceScore: 0.97,
          detectedKeywords: ['streetlight', 'wire', 'electrocution', 'broken'],
          suggestedPriority: 'Critical',
          suggestedDepartment: 'Electrical',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Rule-Based AI flagged Critical priority — wire hazard',
            updatedBy: citizenUser._id,
            timestamp: new Date(Date.now() - 3600000 * 6),
          },
        ],
      },
      {
        title: 'Clogged stormwater drain resolved — Kalighat area',
        description:
          'Major drain siltation on Kalighat Road caused street inundation during last monsoon spell. Construction debris had blocked the culvert.',
        category: 'Drainage',
        image:
          'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=60',
        beforeImage:
          'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=60',
        afterImage:
          'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=60',
        resolutionNote:
          'Suction tanker deployed. 1.4 metric tons of silt removed. Broken iron grate replaced. Water now flowing freely.',
        latitude: 22.5208,
        longitude: 88.3438,
        address: 'Kalighat Road, near Kalighat Temple, Kolkata',
        ward: 'Kolkata • Ward 83',
        priority: 'Medium',
        status: 'Resolved',
        citizen: citizenUser._id,
        assignedOfficer: drainageOfficer._id,
        department: 'Drainage Department',
        aiMetadata: {
          confidenceScore: 0.93,
          detectedKeywords: ['drainage', 'clogged', 'monsoon', 'waterlogging'],
          suggestedPriority: 'Medium',
          suggestedDepartment: 'Drainage Department',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Issue logged',
            updatedBy: citizenUser._id,
            timestamp: new Date(Date.now() - 3600000 * 24 * 5),
          },
          {
            status: 'Assigned',
            note: 'Assigned to drainage field engineer',
            updatedBy: adminUser._id,
            timestamp: new Date(Date.now() - 3600000 * 24 * 4),
          },
          {
            status: 'In Progress',
            note: 'De-silting equipment on site',
            updatedBy: drainageOfficer._id,
            timestamp: new Date(Date.now() - 3600000 * 24 * 3),
          },
          {
            status: 'Resolved',
            note: 'Completed. Silt removed and grates secured.',
            updatedBy: drainageOfficer._id,
            timestamp: new Date(Date.now() - 3600000 * 24),
          },
        ],
      },

      // ── Howrah ───────────────────────────────────────────
      {
        title: 'Water pipeline burst flooding GT Road, Howrah',
        description:
          'Main potable water pipeline ruptured beneath the footpath near Howrah Station Road. Clean drinking water has been gushing out for 5 hours, causing water shortage in local households and sub-base road erosion.',
        category: 'Water Leakage',
        image:
          'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=60',
        latitude: 22.5851,
        longitude: 88.3312,
        address: 'GT Road near Howrah Station, Howrah',
        ward: 'Howrah • Ward 18',
        priority: 'Critical',
        status: 'In Progress',
        citizen: citizen2._id,
        assignedOfficer: waterOfficer._id,
        department: 'Water Department',
        aiMetadata: {
          confidenceScore: 0.95,
          detectedKeywords: ['pipeline', 'burst', 'water leakage', 'gushing'],
          suggestedPriority: 'Critical',
          suggestedDepartment: 'Water Department',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Reported by local resident',
            updatedBy: citizen2._id,
            timestamp: new Date(Date.now() - 3600000 * 8),
          },
          {
            status: 'Assigned',
            note: 'Routed to Water Department',
            updatedBy: adminUser._id,
            timestamp: new Date(Date.now() - 3600000 * 6),
          },
          {
            status: 'In Progress',
            note: 'Emergency pipeline repair clamp being installed',
            updatedBy: waterOfficer._id,
            timestamp: new Date(Date.now() - 3600000 * 2),
          },
        ],
      },
      {
        title: 'Multiple potholes on Salkia Strand Road, Howrah',
        description:
          'Post-monsoon water accumulation has created 5 potholes within 40 metres near Salkia Market. Vehicles are braking abruptly, and a motorcycle fell into one of the holes last evening.',
        category: 'Pothole',
        image:
          'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
        latitude: 22.5972,
        longitude: 88.3225,
        address: 'Salkia Strand Road, Salkia Market, Howrah',
        ward: 'Howrah • Ward 12',
        priority: 'High',
        status: 'Pending',
        citizen: citizenUser._id,
        assignedOfficer: roadsOfficer._id,
        department: 'PWD / Roads',
        aiMetadata: {
          confidenceScore: 0.91,
          detectedKeywords: ['pothole', 'road', 'accident'],
          suggestedPriority: 'High',
          suggestedDepartment: 'PWD / Roads',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Reported via Civic360 mobile interface',
            updatedBy: citizenUser._id,
            timestamp: new Date(Date.now() - 3600000 * 3),
          },
        ],
      },

      // ── Durgapur ─────────────────────────────────────────
      {
        title: 'Illegal waste dumping near Durgapur City Centre',
        description:
          'Commercial food waste and hotel debris has been illegally dumped along the City Centre back road. Foul smell, mosquito breeding, and stray animals are creating a health hazard for nearby residents.',
        category: 'Garbage',
        image:
          'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=60',
        latitude: 23.5112,
        longitude: 87.3199,
        address: 'City Centre Back Road, Durgapur',
        ward: 'Durgapur • Zone B',
        priority: 'High',
        status: 'Pending',
        citizen: citizen2._id,
        assignedOfficer: sanitationOfficer._id,
        department: 'Sanitation',
        aiMetadata: {
          confidenceScore: 0.92,
          detectedKeywords: ['garbage', 'dumping', 'waste', 'smell'],
          suggestedPriority: 'High',
          suggestedDepartment: 'Sanitation',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Reported by local resident',
            updatedBy: citizen2._id,
            timestamp: new Date(Date.now() - 3600000 * 5),
          },
        ],
      },
      {
        title: 'Cracked road surface repaired on Benachity Main Road, Durgapur',
        description:
          'Major road surface cracks along Benachity Main Road near DSP Township were causing vehicle damage. Repaired with fresh bituminous overlay.',
        category: 'Road Damage',
        image:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=60',
        beforeImage:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=60',
        afterImage:
          'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=60',
        resolutionNote:
          'PWD resurfaced 120-metre stretch with hot bituminous mix. Road surface now smooth.',
        latitude: 23.5009,
        longitude: 87.3092,
        address: 'Benachity Main Road, DSP Township, Durgapur',
        ward: 'Durgapur • Zone A',
        priority: 'Medium',
        status: 'Resolved',
        citizen: citizenUser._id,
        assignedOfficer: roadsOfficer._id,
        department: 'PWD / Roads',
        aiMetadata: {
          confidenceScore: 0.90,
          detectedKeywords: ['road damage', 'cracked road'],
          suggestedPriority: 'Medium',
          suggestedDepartment: 'PWD / Roads',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Reported',
            updatedBy: citizenUser._id,
            timestamp: new Date(Date.now() - 3600000 * 24 * 6),
          },
          {
            status: 'Assigned',
            note: 'Assigned to PWD Durgapur',
            updatedBy: adminUser._id,
            timestamp: new Date(Date.now() - 3600000 * 24 * 5),
          },
          {
            status: 'In Progress',
            note: 'Resurfacing work started',
            updatedBy: roadsOfficer._id,
            timestamp: new Date(Date.now() - 3600000 * 24 * 3),
          },
          {
            status: 'Resolved',
            note: 'Repair complete. Surface smooth.',
            updatedBy: roadsOfficer._id,
            timestamp: new Date(Date.now() - 3600000 * 24),
          },
        ],
      },

      // ── Siliguri ──────────────────────────────────────────
      {
        title: 'Broken streetlights on Sevoke Road, Siliguri',
        description:
          'Streetlights from NH-10 junction to Mahananda Bridge on Sevoke Road are non-functional for 4 nights. The dark stretch has attracted anti-social activity and is unsafe for commuters.',
        category: 'Broken Streetlight',
        image:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=60',
        latitude: 26.7146,
        longitude: 88.4214,
        address: 'Sevoke Road near NH-10 Junction, Siliguri',
        ward: 'Siliguri • Ward 22',
        priority: 'High',
        status: 'Assigned',
        citizen: citizen2._id,
        assignedOfficer: electricalOfficer._id,
        department: 'Electrical',
        aiMetadata: {
          confidenceScore: 0.93,
          detectedKeywords: ['streetlight', 'dark', 'broken', 'no light'],
          suggestedPriority: 'High',
          suggestedDepartment: 'Electrical',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Reported by citizen',
            updatedBy: citizen2._id,
            timestamp: new Date(Date.now() - 3600000 * 24),
          },
          {
            status: 'Assigned',
            note: 'Assigned to Debashis Mondal (Electrical)',
            updatedBy: adminUser._id,
            timestamp: new Date(Date.now() - 3600000 * 12),
          },
        ],
      },
      {
        title: 'Waterlogging on Hill Cart Road during monsoon, Siliguri',
        description:
          'Severe waterlogging near Siliguri Court area on Hill Cart Road after every monsoon shower. Open manhole without cover poses serious danger. Water stands for 3–4 hours.',
        category: 'Drainage',
        image:
          'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=60',
        latitude: 26.7201,
        longitude: 88.3956,
        address: 'Hill Cart Road near Siliguri Court, Siliguri',
        ward: 'Siliguri • Ward 34',
        priority: 'High',
        status: 'Pending',
        citizen: citizenUser._id,
        assignedOfficer: drainageOfficer._id,
        department: 'Drainage Department',
        aiMetadata: {
          confidenceScore: 0.92,
          detectedKeywords: ['drainage', 'waterlogging', 'manhole', 'flooding'],
          suggestedPriority: 'High',
          suggestedDepartment: 'Drainage Department',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Rule-Based AI flagged Critical — open manhole',
            updatedBy: citizenUser._id,
            timestamp: new Date(Date.now() - 3600000 * 4),
          },
        ],
      },

      // ── Asansol ───────────────────────────────────────────
      {
        title: 'Water supply interrupted for 3 days in Burnpur, Asansol',
        description:
          'Municipal water supply to Burnpur area has been interrupted for 3 consecutive days following a pipe rupture near the IISCO Steel Plant junction. Residents are dependent on tanker supply.',
        category: 'Water Leakage',
        image:
          'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=60',
        latitude: 23.6726,
        longitude: 86.9710,
        address: 'IISCO Junction, Burnpur, Asansol',
        ward: 'Asansol • Ward 7',
        priority: 'Critical',
        status: 'In Progress',
        citizen: citizen2._id,
        assignedOfficer: waterOfficer._id,
        department: 'Water Department',
        aiMetadata: {
          confidenceScore: 0.95,
          detectedKeywords: ['water supply', 'pipe burst', 'pipeline', 'leakage'],
          suggestedPriority: 'Critical',
          suggestedDepartment: 'Water Department',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Reported',
            updatedBy: citizen2._id,
            timestamp: new Date(Date.now() - 3600000 * 72),
          },
          {
            status: 'Assigned',
            note: 'Assigned to Suparna Bose (Water Department)',
            updatedBy: adminUser._id,
            timestamp: new Date(Date.now() - 3600000 * 48),
          },
          {
            status: 'In Progress',
            note: 'Pipe replacement work in progress; tanker supply arranged',
            updatedBy: waterOfficer._id,
            timestamp: new Date(Date.now() - 3600000 * 6),
          },
        ],
      },

      // ── Kharagpur ─────────────────────────────────────────
      {
        title: 'Pothole near IIT Kharagpur main gate on NH-60',
        description:
          'A dangerous pothole near IIT Kharagpur main gate on NH-60 has caused damage to several vehicles. Located at a busy junction with heavy freight traffic.',
        category: 'Pothole',
        image:
          'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
        latitude: 22.3184,
        longitude: 87.3104,
        address: 'NH-60 near IIT Kharagpur Main Gate, Kharagpur',
        ward: 'Kharagpur • Ward 15',
        priority: 'High',
        status: 'Pending',
        citizen: citizenUser._id,
        assignedOfficer: roadsOfficer._id,
        department: 'PWD / Roads',
        aiMetadata: {
          confidenceScore: 0.90,
          detectedKeywords: ['pothole', 'highway', 'junction'],
          suggestedPriority: 'High',
          suggestedDepartment: 'PWD / Roads',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Reported by commuter',
            updatedBy: citizenUser._id,
            timestamp: new Date(Date.now() - 3600000 * 2),
          },
        ],
      },

      // ── Bardhaman ─────────────────────────────────────────
      {
        title: 'Open sewer near Bardhaman Town Station Road',
        description:
          'An uncovered sewer stretch of approximately 8 metres near Bardhaman Town Railway Station Road is causing severe stench and health hazard for daily commuters and station visitors.',
        category: 'Drainage',
        image:
          'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=60',
        latitude: 23.2350,
        longitude: 87.8642,
        address: 'Town Station Road, Bardhaman',
        ward: 'Bardhaman • Ward 3',
        priority: 'High',
        status: 'Assigned',
        citizen: citizen2._id,
        assignedOfficer: drainageOfficer._id,
        department: 'Drainage Department',
        aiMetadata: {
          confidenceScore: 0.91,
          detectedKeywords: ['sewer', 'sewage', 'drainage', 'manhole'],
          suggestedPriority: 'High',
          suggestedDepartment: 'Drainage Department',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Reported',
            updatedBy: citizen2._id,
            timestamp: new Date(Date.now() - 3600000 * 36),
          },
          {
            status: 'Assigned',
            note: 'Assigned to Rakesh Pal (Drainage)',
            updatedBy: adminUser._id,
            timestamp: new Date(Date.now() - 3600000 * 20),
          },
        ],
      },

      // ── Haldia ────────────────────────────────────────────
      {
        title: 'Garbage overflow near Haldia Dock Complex',
        description:
          'Municipal waste bins near the Haldia Dock Complex worker settlement have not been cleared for a week. Waste is overflowing across the pavement and is a hygiene hazard for dock workers.',
        category: 'Garbage',
        image:
          'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=60',
        latitude: 22.0621,
        longitude: 88.0590,
        address: 'Dock Complex Road, Haldia',
        ward: 'Haldia • Ward 8',
        priority: 'Medium',
        status: 'Pending',
        citizen: citizenUser._id,
        assignedOfficer: sanitationOfficer._id,
        department: 'Sanitation',
        aiMetadata: {
          confidenceScore: 0.89,
          detectedKeywords: ['garbage', 'waste', 'overflowing'],
          suggestedPriority: 'Medium',
          suggestedDepartment: 'Sanitation',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Reported via Civic360 app',
            updatedBy: citizenUser._id,
            timestamp: new Date(Date.now() - 3600000 * 10),
          },
        ],
      },

      // ── Tamluk ────────────────────────────────────────────
      {
        title: 'Road damage on Tamluk–Panskura Road after cyclone',
        description:
          'The Tamluk–Panskura district road has suffered severe cyclone damage — cracked surface, caved shoulders, and multiple potholes over a 300-metre stretch making it nearly impassable.',
        category: 'Road Damage',
        image:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=60',
        latitude: 22.2988,
        longitude: 87.9168,
        address: 'Tamluk–Panskura Road, near Tamluk Bus Stand',
        ward: 'Tamluk • Ward 6',
        priority: 'High',
        status: 'Pending',
        citizen: citizen2._id,
        assignedOfficer: roadsOfficer._id,
        department: 'PWD / Roads',
        aiMetadata: {
          confidenceScore: 0.88,
          detectedKeywords: ['road damage', 'cracked road', 'cave in'],
          suggestedPriority: 'High',
          suggestedDepartment: 'PWD / Roads',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Filed by local civic volunteer',
            updatedBy: citizen2._id,
            timestamp: new Date(Date.now() - 3600000 * 15),
          },
        ],
      },

      // ── Contai ────────────────────────────────────────────
      {
        title: 'Water leakage from municipal pipeline at Contai Bazar',
        description:
          'A municipal water pipeline near Contai Bazar market has been leaking for 2 days. Potable water is being wasted and the surrounding road has turned muddy, obstructing pedestrian movement.',
        category: 'Water Leakage',
        image:
          'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=60',
        latitude: 21.7843,
        longitude: 87.7498,
        address: 'Contai Bazar Market Road, Contai',
        ward: 'Contai • Ward 4',
        priority: 'Medium',
        status: 'Pending',
        citizen: citizenUser._id,
        assignedOfficer: waterOfficer._id,
        department: 'Water Department',
        aiMetadata: {
          confidenceScore: 0.87,
          detectedKeywords: ['water leak', 'pipeline', 'leakage'],
          suggestedPriority: 'Medium',
          suggestedDepartment: 'Water Department',
          autoRouted: true,
        },
        timeline: [
          {
            status: 'Pending',
            note: 'Reported by local shopkeeper',
            updatedBy: citizenUser._id,
            timestamp: new Date(Date.now() - 3600000 * 8),
          },
        ],
      },
    ];

    const complaintsData = complaintDefinitions.map((complaint) => ({
      ...complaint,
      title: withDemoTitle(complaint.title),
      department: normalizeDepartment(complaint.department),
      isDemo: true,
      aiMetadata: {
        ...complaint.aiMetadata,
        suggestedDepartment: normalizeDepartment(complaint.aiMetadata.suggestedDepartment),
      },
    }));

    const existingComplaints = await Complaint.find({
      $or: complaintDefinitions.map((complaint) => ({
        title: { $in: [complaint.title, withDemoTitle(complaint.title)] },
        citizen: complaint.citizen,
      })),
    }).select('_id title citizen').lean();
    const existingComplaintByKey = new Map(
      existingComplaints.map((complaint) => [
        `${complaint.citizen}:${withoutDemoTitle(complaint.title)}`,
        complaint,
      ])
    );
    const complaintDocuments = complaintsData.map((complaint, index) => {
      const definition = complaintDefinitions[index];
      const existingComplaint = existingComplaintByKey.get(
        `${complaint.citizen}:${definition.title}`
      );
      return new Complaint({
        ...complaint,
        _id: existingComplaint?._id || new mongoose.Types.ObjectId(),
      });
    });

    // ─────────────────────────────────────────────────────────
    // 3. Prepare Sample Notifications
    // ─────────────────────────────────────────────────────────
    const notificationDefinitions = [
      {
        user: citizenUser._id,
        title: 'Status Update: In Progress',
        message:
          'Your complaint about the pothole on Park Street, Kolkata is now In Progress. PWD Officer Souvik Baidya has dispatched a crew.',
        complaintId: complaintDocuments[0]._id,
        type: 'status_update',
        read: false,
      },
      {
        user: citizenUser._id,
        title: 'Complaint Resolved 🎉',
        message:
          'Your reported stormwater drain issue in Kalighat, Kolkata has been successfully resolved!',
        complaintId: complaintDocuments[3]._id,
        type: 'status_update',
        read: true,
      },
      {
        user: roadsOfficer._id,
        title: 'Critical Issue Assigned',
        message:
          'A Critical pothole complaint on Park Street, Kolkata requires immediate inspection.',
        complaintId: complaintDocuments[0]._id,
        type: 'assignment',
        read: false,
      },
      {
        user: adminUser._id,
        title: 'System Alert: Critical Priority Complaint',
        message:
          'Broken streetlight with exposed live wire reported on AJC Bose Road, Kolkata. Ward 64.',
        complaintId: complaintDocuments[2]._id,
        type: 'system',
        read: false,
      },
      {
        user: waterOfficer._id,
        title: 'Critical Water Emergency Assigned',
        message:
          'Pipeline burst reported near Howrah Station, Howrah. Immediate action required.',
        complaintId: complaintDocuments[4]._id,
        type: 'assignment',
        read: false,
      },
    ].map((notification) => ({
      ...notification,
      title: withDemoTitle(notification.title),
      message: `DEMO SAMPLE — ${notification.message}`,
      isDemo: true,
    }));

    const existingNotifications = await Notification.find({
      $or: notificationDefinitions.map((notification) => ({
        user: notification.user,
        complaintId: notification.complaintId,
        type: notification.type,
        title: {
          $in: [withoutDemoTitle(notification.title), notification.title],
        },
      })),
    }).select('_id user complaintId type title').lean();
    const existingNotificationByKey = new Map(
      existingNotifications.map((notification) => [
        `${notification.user}:${notification.complaintId}:${notification.type}:${withoutDemoTitle(notification.title)}`,
        notification,
      ])
    );
    const notificationDocuments = notificationDefinitions.map((notification) => {
      const existingNotification = existingNotificationByKey.get(
        `${notification.user}:${notification.complaintId}:${notification.type}:${withoutDemoTitle(notification.title)}`
      );
      return new Notification({
        ...notification,
        _id: existingNotification?._id || new mongoose.Types.ObjectId(),
      });
    });

    // Validate every prospective record before the first database write.
    await Promise.all([
      ...userDocuments.map((user) => user.validate()),
      ...complaintDocuments.map((complaint) => complaint.validate()),
      ...notificationDocuments.map((notification) => notification.validate()),
    ]);
    const userInsertDocuments = await Promise.all(
      userDocuments.map(async (userDocument, index) => ({
        ...documentToPlainObject(userDocument),
        password: await bcrypt.hash(userDefinitions[index].password, 10),
      }))
    );

    // Upsert known demo users. Existing account passwords and unrelated records remain untouched.
    for (let index = 0; index < userDefinitions.length; index += 1) {
      const definition = userDefinitions[index];
      const userDocument = userDocuments[index];
      const existingUser = existingUserByEmail.get(definition.email);

      if (existingUser) {
        await User.updateOne(
          { _id: existingUser._id },
          {
            $set: {
              name: definition.name,
              phone: definition.phone,
              role: definition.role,
              department: userDocument.department,
              ward: definition.ward,
              state: definition.state,
              country: definition.country,
              isDemo: true,
            },
          },
          { runValidators: true }
        );
        continue;
      }

      await User.updateOne(
        { email: definition.email },
        { $setOnInsert: userInsertDocuments[index] },
        { upsert: true, runValidators: true }
      );
    }

    // Match by exact fixture identity and only update the demo label/routing fields on old samples.
    for (let index = 0; index < complaintDocuments.length; index += 1) {
      const complaint = complaintDocuments[index];
      const existingComplaint = existingComplaintByKey.get(
        `${complaint.citizen}:${complaintDefinitions[index].title}`
      );

      if (existingComplaint) {
        await Complaint.updateOne(
          { _id: existingComplaint._id },
          {
            $set: {
              title: complaint.title,
              department: complaint.department,
              isDemo: true,
              'aiMetadata.suggestedDepartment': complaint.aiMetadata.suggestedDepartment,
            },
          },
          { runValidators: true }
        );
        continue;
      }

      await Complaint.updateOne(
        { _id: complaint._id },
        { $setOnInsert: documentToPlainObject(complaint) },
        { upsert: true, runValidators: true }
      );
    }

    for (let index = 0; index < notificationDocuments.length; index += 1) {
      const notification = notificationDocuments[index];
      const existingNotification = existingNotificationByKey.get(
        `${notification.user}:${notification.complaintId}:${notification.type}:${withoutDemoTitle(notification.title)}`
      );

      if (existingNotification) {
        await Notification.updateOne(
          { _id: existingNotification._id },
          {
            $set: {
              title: notification.title,
              message: notification.message,
              isDemo: true,
            },
          },
          { runValidators: true }
        );
        continue;
      }

      await Notification.updateOne(
        { _id: notification._id },
        { $setOnInsert: documentToPlainObject(notification) },
        { upsert: true, runValidators: true }
      );
    }

    console.log(` Ensured ${userDocuments.length} West Bengal demo accounts.`);
    console.log(` Ensured ${complaintDocuments.length} clearly labeled demo complaints.`);
    console.log(` Ensured ${notificationDocuments.length} clearly labeled demo notifications.`);
    console.log(' West Bengal demo data upsert completed successfully.');
    return { seeded: true, skipped: false };
};

// If run directly via CLI (e.g. node utils/seedData.js)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civic360';
  mongoose
    .connect(uri)
    .then(async () => {
      console.log(' Connected to MongoDB for seeding.');
      await seedDatabase({ allowNonEmpty: true });
      await mongoose.disconnect();
    })
    .catch((err) => {
      console.error(' Direct seed connection error:', err.message);
      process.exit(1);
    });
}

export default seedDatabase;
