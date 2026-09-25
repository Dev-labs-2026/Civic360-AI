import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const seedDatabase = async () => {
  try {
    console.log(' Seeding demo users, complaints, and notifications for Civic360 AI...');

    // Clear existing collections
    await User.deleteMany({});
    await Complaint.deleteMany({});
    await Notification.deleteMany({});

    // 1. Create Demo Users
    const citizenUser = await User.create({
      name: 'Aarav Sharma',
      email: 'citizen@civic360.in',
      password: 'citizen123',
      phone: '9876543210',
      role: 'citizen',
      ward: 'Ward 12 - Indiranagar',
    });

    const citizen2 = await User.create({
      name: 'Meera Iyer',
      email: 'meera@civic360.in',
      password: 'citizen123',
      phone: '9876543211',
      role: 'citizen',
      ward: 'Ward 4 - Koramangala',
    });

    const roadsOfficer = await User.create({
      name: 'Rajesh Kumar',
      email: 'officer.roads@civic360.in',
      password: 'officer123',
      phone: '9876500001',
      role: 'officer',
      department: 'Roads/PWD',
      ward: 'Ward 12 - Indiranagar',
    });

    const sanitationOfficer = await User.create({
      name: 'Sunita Patel',
      email: 'officer.sanitation@civic360.in',
      password: 'officer123',
      phone: '9876500002',
      role: 'officer',
      department: 'Sanitation',
      ward: 'Ward 4 - Koramangala',
    });

    const electricalOfficer = await User.create({
      name: 'Vikram Malhotra',
      email: 'officer.electrical@civic360.in',
      password: 'officer123',
      phone: '9876500003',
      role: 'officer',
      department: 'Electrical',
      ward: 'Ward 8 - Whitefield',
    });

    const waterOfficer = await User.create({
      name: 'Ananya Rao',
      email: 'officer.water@civic360.in',
      password: 'officer123',
      phone: '9876500004',
      role: 'officer',
      department: 'Water Supply',
      ward: 'Ward 15 - Malleshwaram',
    });

    const drainageOfficer = await User.create({
      name: 'Mohammad Farooq',
      email: 'officer.drainage@civic360.in',
      password: 'officer123',
      phone: '9876500005',
      role: 'officer',
      department: 'Drainage & Sewage',
      ward: 'Ward 3 - Jayanagar',
    });

    const adminUser = await User.create({
      name: 'Dr. Priya Deshmukh',
      email: 'admin@civic360.in',
      password: 'admin123',
      phone: '9876599999',
      role: 'admin',
      department: 'General',
      ward: 'Ward 1 - Central',
    });

    console.log(' Demo users created successfully.');

    // 2. Create Sample Complaints
    const complaintsData = [
      {
        title: 'Deep crater-sized pothole causing bike skids on 100 Feet Road',
        description: 'Severe pothole roughly 2 feet wide and 8 inches deep right near 100 Feet Road signal. Two two-wheelers skidded during evening peak hours. High risk of serious accidents.',
        category: 'Pothole',
        image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
        latitude: 12.9784,
        longitude: 77.6408,
        address: '100 Feet Road, near 12th Main Junction, Indiranagar, Bengaluru',
        ward: 'Ward 12 - Indiranagar',
        priority: 'Critical',
        status: 'In Progress',
        citizen: citizenUser._id,
        assignedOfficer: roadsOfficer._id,
        department: 'Roads/PWD',
        aiMetadata: {
          confidenceScore: 0.96,
          detectedKeywords: ['crater', 'pothole', 'accident', 'skid'],
          suggestedPriority: 'Critical',
          suggestedDepartment: 'Roads/PWD',
          autoRouted: true,
        },
        timeline: [
          { status: 'Pending', note: 'Issue submitted with geo-location metadata', updatedBy: citizenUser._id, timestamp: new Date(Date.now() - 3600000 * 24 * 2) },
          { status: 'Assigned', note: 'AI routed and assigned to Rajesh Kumar (PWD)', updatedBy: adminUser._id, timestamp: new Date(Date.now() - 3600000 * 24 * 1.5) },
          { status: 'In Progress', note: 'Maintenance crew dispatched with cold mix asphalt truck.', updatedBy: roadsOfficer._id, timestamp: new Date(Date.now() - 3600000 * 5) },
        ],
      },
      {
        title: 'Overflowing municipal garbage bin near Koramangala Market',
        description: 'Solid waste overflowing onto the pedestrian pathway and street for the past 3 days. Cattle and dogs are littering waste, creating severe stench and hygiene hazard near eateries.',
        category: 'Garbage',
        image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=60',
        latitude: 12.9352,
        longitude: 77.6245,
        address: '80 Feet Road, 5th Block, Koramangala, Bengaluru',
        ward: 'Ward 4 - Koramangala',
        priority: 'High',
        status: 'Assigned',
        citizen: citizen2._id,
        assignedOfficer: sanitationOfficer._id,
        department: 'Sanitation',
        aiMetadata: {
          confidenceScore: 0.94,
          detectedKeywords: ['garbage', 'waste', 'stench', 'overflowing'],
          suggestedPriority: 'High',
          suggestedDepartment: 'Sanitation',
          autoRouted: true,
        },
        timeline: [
          { status: 'Pending', note: 'Reported by citizen', updatedBy: citizen2._id, timestamp: new Date(Date.now() - 3600000 * 18) },
          { status: 'Assigned', note: 'Assigned to Sunita Patel (Sanitation)', updatedBy: adminUser._id, timestamp: new Date(Date.now() - 3600000 * 10) },
        ],
      },
      {
        title: 'Dark pedestrian path: 4 consecutive broken streetlights with hanging wire',
        description: 'Streetlights from Pole #24 to #27 have failed. One exposed hanging live wire poses acute electrocution danger to evening commuters and schoolchildren.',
        category: 'Broken Streetlight',
        image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=60',
        latitude: 12.9698,
        longitude: 77.7499,
        address: 'ITPL Main Road, Near Hope Farm Junction, Whitefield, Bengaluru',
        ward: 'Ward 8 - Whitefield',
        priority: 'Critical',
        status: 'Pending',
        citizen: citizenUser._id,
        assignedOfficer: electricalOfficer._id,
        department: 'Electrical',
        aiMetadata: {
          confidenceScore: 0.98,
          detectedKeywords: ['streetlight', 'broken', 'wire', 'danger'],
          suggestedPriority: 'Critical',
          suggestedDepartment: 'Electrical',
          autoRouted: true,
        },
        timeline: [
          { status: 'Pending', note: 'AI detected critical priority: wire hazard', updatedBy: citizenUser._id, timestamp: new Date(Date.now() - 3600000 * 4) },
        ],
      },
      {
        title: 'High-pressure water pipeline burst flooding Margosa Road',
        description: 'Main potable water pipeline ruptured underneath the sidewalk. Clean drinking water has been gushing out for 3 hours, causing water shortage in local households and sub-base road erosion.',
        category: 'Water Leakage',
        image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=60',
        latitude: 13.0031,
        longitude: 77.5701,
        address: '8th Cross, Margosa Road, Malleshwaram, Bengaluru',
        ward: 'Ward 15 - Malleshwaram',
        priority: 'Critical',
        status: 'In Progress',
        citizen: citizen2._id,
        assignedOfficer: waterOfficer._id,
        department: 'Water Supply',
        aiMetadata: {
          confidenceScore: 0.95,
          detectedKeywords: ['pipe', 'burst', 'water leakage', 'pipeline'],
          suggestedPriority: 'Critical',
          suggestedDepartment: 'Water Supply',
          autoRouted: true,
        },
        timeline: [
          { status: 'Pending', note: 'Reported by local resident', updatedBy: citizen2._id, timestamp: new Date(Date.now() - 3600000 * 8) },
          { status: 'Assigned', note: 'Routed to BWSSB Water supply division', updatedBy: adminUser._id, timestamp: new Date(Date.now() - 3600000 * 6) },
          { status: 'In Progress', note: 'Emergency pipeline repair clamp being installed by technicians.', updatedBy: waterOfficer._id, timestamp: new Date(Date.now() - 3600000 * 2) },
        ],
      },
      {
        title: 'Clogged stormwater drain cleared and silt removed',
        description: 'Major drain siltation caused street inundation during the last cloudburst. Plastic bottles and construction debris had blocked the culvert intake.',
        category: 'Drainage',
        image: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=60',
        beforeImage: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=60',
        afterImage: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=60',
        resolutionNote: 'Suction tanker deployed. 1.2 metric tons of silt removed. Replaced broken iron grating and water is flowing smoothly.',
        latitude: 12.9250,
        longitude: 77.5938,
        address: '9th Main, 4th Block, Jayanagar, Bengaluru',
        ward: 'Ward 3 - Jayanagar',
        priority: 'Medium',
        status: 'Resolved',
        citizen: citizenUser._id,
        assignedOfficer: drainageOfficer._id,
        department: 'Drainage & Sewage',
        aiMetadata: {
          confidenceScore: 0.93,
          detectedKeywords: ['drainage', 'gutter', 'clogged'],
          suggestedPriority: 'Medium',
          suggestedDepartment: 'Drainage & Sewage',
          autoRouted: true,
        },
        timeline: [
          { status: 'Pending', note: 'Issue logged', updatedBy: citizenUser._id, timestamp: new Date(Date.now() - 3600000 * 24 * 4) },
          { status: 'Assigned', note: 'Assigned to drainage field engineer', updatedBy: adminUser._id, timestamp: new Date(Date.now() - 3600000 * 24 * 3) },
          { status: 'In Progress', note: 'De-silting equipment on site', updatedBy: drainageOfficer._id, timestamp: new Date(Date.now() - 3600000 * 24 * 2) },
          { status: 'Resolved', note: 'Completed. Silt removed and grates secured.', updatedBy: drainageOfficer._id, timestamp: new Date(Date.now() - 3600000 * 12) },
        ],
      },
      {
        title: 'Damaged concrete road divider repaired and repainted',
        description: 'Median divider broken after heavy vehicle collided. Concrete debris scattered on fast lane.',
        category: 'Road Damage',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=60',
        beforeImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=60',
        afterImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=60',
        resolutionNote: 'Precast curb units installed and coated with retro-reflective yellow-black paint.',
        latitude: 12.9756,
        longitude: 77.6066,
        address: 'MG Road near Trinity Circle, Bengaluru',
        ward: 'Ward 1 - Central',
        priority: 'High',
        status: 'Resolved',
        citizen: citizen2._id,
        assignedOfficer: roadsOfficer._id,
        department: 'Roads/PWD',
        aiMetadata: {
          confidenceScore: 0.91,
          detectedKeywords: ['road damage', 'divider'],
          suggestedPriority: 'High',
          suggestedDepartment: 'Roads/PWD',
          autoRouted: true,
        },
        timeline: [
          { status: 'Pending', note: 'Reported', updatedBy: citizen2._id, timestamp: new Date(Date.now() - 3600000 * 24 * 5) },
          { status: 'Assigned', note: 'Assigned', updatedBy: adminUser._id, timestamp: new Date(Date.now() - 3600000 * 24 * 4) },
          { status: 'Resolved', note: 'Reconstruction completed', updatedBy: roadsOfficer._id, timestamp: new Date(Date.now() - 3600000 * 24 * 1) },
        ],
      },
      {
        title: 'Cluster of multiple potholes near Indiranagar BDA Complex',
        description: 'Post-monsoon water collection created 4 potholes within 30 meters. Vehicles are braking abruptly.',
        category: 'Pothole',
        image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
        latitude: 12.9719,
        longitude: 77.6412,
        address: 'Double Road, near BDA Complex, Indiranagar, Bengaluru',
        ward: 'Ward 12 - Indiranagar',
        priority: 'Medium',
        status: 'Pending',
        citizen: citizenUser._id,
        assignedOfficer: roadsOfficer._id,
        department: 'Roads/PWD',
        aiMetadata: {
          confidenceScore: 0.89,
          detectedKeywords: ['pothole', 'road'],
          suggestedPriority: 'Medium',
          suggestedDepartment: 'Roads/PWD',
          autoRouted: true,
        },
        timeline: [
          { status: 'Pending', note: 'Reported via mobile interface', updatedBy: citizenUser._id, timestamp: new Date(Date.now() - 3600000 * 3) },
        ],
      },
      {
        title: 'Commercial food debris dumped alongside EcoSpace outer ring road',
        description: 'Illegal midnight dumping of wet hotel waste and plastic sacks creating foul smell and mosquito breeding ground.',
        category: 'Garbage',
        image: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=60',
        latitude: 12.9304,
        longitude: 77.6784,
        address: 'Bellandur Main Road, Near EcoSpace, Bengaluru',
        ward: 'Ward 9 - Bellandur',
        priority: 'Medium',
        status: 'Pending',
        citizen: citizen2._id,
        assignedOfficer: sanitationOfficer._id,
        department: 'Sanitation',
        aiMetadata: {
          confidenceScore: 0.92,
          detectedKeywords: ['garbage', 'dumping', 'waste'],
          suggestedPriority: 'Medium',
          suggestedDepartment: 'Sanitation',
          autoRouted: true,
        },
        timeline: [
          { status: 'Pending', note: 'Reported by local tech park employee', updatedBy: citizen2._id, timestamp: new Date(Date.now() - 3600000 * 2) },
        ],
      },
    ];

    const createdComplaints = await Complaint.insertMany(complaintsData);
    console.log(` Created ${createdComplaints.length} realistic civic complaints.`);

    // 3. Create Sample Notifications
    await Notification.create([
      {
        user: citizenUser._id,
        title: 'Status Update: In Progress',
        message: 'Your complaint regarding the pothole on 100 Feet Road has been moved to In Progress by PWD Officer Rajesh Kumar.',
        complaintId: createdComplaints[0]._id,
        type: 'status_update',
        read: false,
      },
      {
        user: citizenUser._id,
        title: 'Complaint Resolved 🎉',
        message: 'Your reported stormwater drain issue in Jayanagar has been successfully resolved!',
        complaintId: createdComplaints[4]._id,
        type: 'status_update',
        read: true,
      },
      {
        user: roadsOfficer._id,
        title: 'Critical Issue Assigned',
        message: 'A Critical pothole complaint on 100 Feet Road requires immediate inspection.',
        complaintId: createdComplaints[0]._id,
        type: 'assignment',
        read: false,
      },
      {
        user: adminUser._id,
        title: 'System Alert: High Urgency Complaint',
        message: 'Broken streetlight with live hanging wire reported in Ward 8 - Whitefield.',
        complaintId: createdComplaints[2]._id,
        type: 'system',
        read: false,
      },
    ]);

    console.log(' Demo notifications created.');
    console.log(' Database seed completed successfully!');
    return true;
  } catch (error) {
    console.error(' Database seeding failed:', error);
    return false;
  }
};

// If run directly via CLI (e.g. node utils/seedData.js)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civic360';
  mongoose
    .connect(uri)
    .then(async () => {
      console.log(' Connected to MongoDB for seeding.');
      await seedDatabase();
      process.exit(0);
    })
    .catch((err) => {
      console.error(' Direct seed connection error:', err.message);
      process.exit(1);
    });
}

export default seedDatabase;
