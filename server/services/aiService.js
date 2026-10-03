import { CATEGORY_DEPARTMENTS } from '../utils/departments.js';

/**
 * Civic360 AI - Modular AI Service Engine
 * 
 * Provides modular NLP classification, rule-based priority engine,
 * geo-spatial duplicate detection, and smart municipal department routing.
 * Designed with a clean interface to easily plug into OpenAI / Google Gemini APIs later.
 */

// Category keyword mappings for zero-dependency NLP classification
const CATEGORY_KEYWORDS = {
  Pothole: [
    'pothole', 'hole', 'crater', 'sinkhole', 'broken road surface', 'pit', 
    'depression', 'cavity', 'bump', 'tarmac hole'
  ],
  Garbage: [
    'garbage', 'trash', 'waste', 'dump', 'dustbin', 'litter', 'plastic waste', 
    'smell', 'debris', 'filth', 'rubbish', 'heap', 'stench', 'refuse'
  ],
  'Broken Streetlight': [
    'streetlight', 'street light', 'lamp', 'bulb', 'light pole', 'darkness', 
    'sparking', 'exposed wire', 'pole broken', 'flickering', 'no light'
  ],
  'Water Leakage': [
    'water leak', 'leakage', 'pipe burst', 'pipeline', 'drinking water wasted', 
    'overflowing tap', 'valve broken', 'gushing water', 'water supply'
  ],
  Drainage: [
    'drainage', 'gutter', 'sewer', 'sewage', 'clogged drain', 'overflowing drain', 
    'manhole', 'stagnant water', 'waterlogging', 'flooding', 'black water'
  ],
  'Road Damage': [
    'road damage', 'cracked road', 'cave in', 'tar worn off', 'divider broken', 
    'footpath', 'pavement broken', 'uneven surface', 'speed breaker damaged'
  ],
};

// Priority keywords for safety & urgency determination
const CRITICAL_KEYWORDS = [
  'accident', 'hospital', 'school', 'emergency', 'fatal', 'sparking wire', 
  'electrocution', 'collapse', 'grave danger', 'fire', 'ambulance stuck', 'death'
];

const HIGH_PRIORITY_KEYWORDS = [
  'main road', 'highway', 'traffic jam', 'flooding', 'heavy rain', 'overflowing', 
  'deep hole', 'blind spot', 'bus stop', 'junction', 'senior citizen', 'children'
];

const LOW_PRIORITY_KEYWORDS = [
  'minor', 'small', 'cosmetic', 'paint', 'notice board', 'faded line', 'aesthetic'
];

/**
 * Classify complaint category based on textual description and title
 * @param {string} text - Title and description text
 * @returns {Object} - Detected category, confidence score, and matched keywords
 */
export const classifyComplaint = (text = '') => {
  const normalized = text.toLowerCase();
  let bestMatch = 'Other';
  let highestScore = 0;
  let matchedKeywords = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    const currentMatches = [];

    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        score += keyword.length >= 6 ? 2 : 1;
        currentMatches.push(keyword);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = category;
      matchedKeywords = currentMatches;
    }
  }

  // Preserve the legacy confidenceScore field with a deterministic rule score.
  const confidence = highestScore > 0 
    ? Math.min(0.98, 0.65 + (highestScore * 0.08)) 
    : 0.50;

  return {
    category: bestMatch,
    confidence: Number(confidence.toFixed(2)),
    detectedKeywords: matchedKeywords,
  };
};

/**
 * Detect priority level based on civic impact and urgency indicators
 * @param {Object} param0 - { category, description, title, ward }
 * @returns {string} - 'Low' | 'Medium' | 'High' | 'Critical'
 */
export const detectPriority = ({ category, description = '', title = '', ward = '' }) => {
  const fullText = `${title} ${description} ${ward}`.toLowerCase();

  // 1. Check for Critical indicators (life hazards, hospitals, live wires)
  for (const word of CRITICAL_KEYWORDS) {
    if (fullText.includes(word)) {
      return 'Critical';
    }
  }

  // 2. Specific high danger combinations
  if (category === 'Broken Streetlight' && (fullText.includes('wire') || fullText.includes('spark'))) {
    return 'Critical';
  }
  if (category === 'Drainage' && (fullText.includes('open manhole') || fullText.includes('manhole lid missing'))) {
    return 'Critical';
  }

  // 3. Check for High priority indicators
  for (const word of HIGH_PRIORITY_KEYWORDS) {
    if (fullText.includes(word)) {
      return 'High';
    }
  }

  if (category === 'Water Leakage' && fullText.includes('burst')) {
    return 'High';
  }
  if (category === 'Pothole' && (fullText.includes('deep') || fullText.includes('huge'))) {
    return 'High';
  }

  // 4. Check for Low priority indicators
  for (const word of LOW_PRIORITY_KEYWORDS) {
    if (fullText.includes(word)) {
      return 'Low';
    }
  }

  // Default priority based on category baseline
  if (category === 'Drainage' || category === 'Broken Streetlight') {
    return 'Medium';
  }
  return 'Medium';
};

/**
 * Smart Municipal Department routing matrix
 * @param {string} category 
 * @returns {string} Department name
 */
export const recommendDepartment = (category) => {
  return CATEGORY_DEPARTMENTS[category] || CATEGORY_DEPARTMENTS.Other;
};

/**
 * Calculate distance in meters between two lat/lon coordinates using Haversine formula
 */
const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Detect the closest active, recent complaint in the same category and close proximity.
 * @param {Object} param0 - { category, latitude, longitude, ComplaintModel, excludeId }
 * @returns {Promise<Object>} - explainable duplicate match and rule details
 */
export const detectDuplicateComplaint = async ({
  category,
  latitude,
  longitude,
  ComplaintModel,
  excludeId = null,
}) => {
  if (!ComplaintModel || latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return { duplicateDetected: false, duplicateComplaint: null, distanceMeters: null };
  }

  try {
    // Look for active complaints in the same or related category created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query = {
      status: { $in: ['Pending', 'Assigned', 'In Progress'] },
      createdAt: { $gte: thirtyDaysAgo },
    };

    // Category is part of the match rule, including the explicit Other category.
    if (category) query.category = category;

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const nearbyCandidates = await ComplaintModel.find(query)
      .select('title category status address latitude longitude createdAt')
      .lean();

    const PROXIMITY_THRESHOLD_METERS = 150; // 150 meters threshold

    const matches = [];
    for (const candidate of nearbyCandidates) {
      if (candidate.latitude !== null && candidate.latitude !== undefined
        && candidate.longitude !== null && candidate.longitude !== undefined) {
        const dist = calculateDistanceInMeters(
          latitude,
          longitude,
          candidate.latitude,
          candidate.longitude
        );

        if (dist <= PROXIMITY_THRESHOLD_METERS) {
          matches.push({ candidate, distanceMeters: Math.round(dist) });
        }
      }
    }

    matches.sort((left, right) => left.distanceMeters - right.distanceMeters);
    const match = matches[0];
    if (match) {
      const ageDays = Math.max(0, (Date.now() - new Date(match.candidate.createdAt).getTime()) / (24 * 60 * 60 * 1000));
      const matchLevel = match.distanceMeters <= 50 && ageDays <= 7 ? 'High Match'
        : match.distanceMeters <= 100 && ageDays <= 14 ? 'Medium Match' : 'Possible Match';
      const similarityReason = `Same category (${match.candidate.category}), ${match.distanceMeters}m away, reported ${Math.floor(ageDays)} day(s) ago.`;
      return {
        duplicateDetected: true,
        duplicateComplaint: match.candidate,
        distanceMeters: match.distanceMeters,
        matchLevel,
        similarityReason,
        recencyDays: Math.floor(ageDays),
      };
    }

    return { duplicateDetected: false, duplicateComplaint: null, distanceMeters: null };
  } catch (error) {
    console.error('Duplicate complaint lookup failed:', error.message);
    throw new Error('Duplicate complaint lookup failed.');
  }
};

/**
 * Full AI Analysis for complaint pre-submission or auto-tagging
 */
export const analyzeComplaint = async ({
  title = '',
  description = '',
  category = '',
  latitude = null,
  longitude = null,
  ward = '',
  ComplaintModel = null,
}) => {
  const combinedText = `${title} ${description}`;
  
  // 1. Classification
  const classification = classifyComplaint(combinedText);
  const finalCategory = category && category !== 'Other' ? category : classification.category;

  // 2. Priority
  const priority = detectPriority({
    category: finalCategory,
    description,
    title,
    ward,
  });

  // 3. Recommended Department
  const department = recommendDepartment(finalCategory);

  // 4. Duplicate Check
  let duplicateInfo = { duplicateDetected: false, duplicateComplaint: null, distanceMeters: null, matchLevel: null, similarityReason: null, recencyDays: null };
  if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined && ComplaintModel) {
    duplicateInfo = await detectDuplicateComplaint({
      category: finalCategory,
      latitude,
      longitude,
      ComplaintModel,
    });
  }

  const duplicateComplaint = duplicateInfo.duplicateComplaint;
  const publicDuplicate = duplicateComplaint ? {
    _id: duplicateComplaint._id,
    reference: `CIV-${String(duplicateComplaint._id).slice(-6).toUpperCase()}`,
    category: duplicateComplaint.category,
    status: duplicateComplaint.status,
    title: duplicateComplaint.title,
    createdAt: duplicateComplaint.createdAt,
    distanceMeters: duplicateInfo.distanceMeters,
  } : null;

  return {
    suggestedCategory: classification.category,
    confidenceScore: classification.confidence,
    detectedKeywords: classification.detectedKeywords,
    suggestedPriority: priority,
    recommendedDepartment: department,
    duplicateDetected: duplicateInfo.duplicateDetected,
    duplicateComplaint: publicDuplicate,
    distanceMeters: duplicateInfo.distanceMeters,
    matchLevel: duplicateInfo.matchLevel,
    similarityReason: duplicateInfo.similarityReason,
    recencyDays: duplicateInfo.recencyDays,
  };
};

export default {
  classifyComplaint,
  detectPriority,
  recommendDepartment,
  detectDuplicateComplaint,
  analyzeComplaint,
};
