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

  // Calculate simulated AI confidence
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
  switch (category) {
    case 'Pothole':
    case 'Road Damage':
      return 'Roads/PWD';
    case 'Garbage':
      return 'Sanitation';
    case 'Broken Streetlight':
      return 'Electrical';
    case 'Water Leakage':
      return 'Water Supply';
    case 'Drainage':
      return 'Drainage & Sewage';
    default:
      return 'General';
  }
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
 * Detect if a similar complaint already exists in close proximity (< 150m)
 * @param {Object} param0 - { category, latitude, longitude, ComplaintModel, excludeId }
 * @returns {Promise<Object>} - { duplicateDetected, duplicateComplaint, distanceMeters }
 */
export const detectDuplicateComplaint = async ({
  category,
  latitude,
  longitude,
  ComplaintModel,
  excludeId = null,
}) => {
  if (!ComplaintModel || !latitude || !longitude) {
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

    if (category && category !== 'Other') {
      query.category = category;
    }

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const nearbyCandidates = await ComplaintModel.find(query)
      .select('title category status address latitude longitude createdAt')
      .lean();

    const PROXIMITY_THRESHOLD_METERS = 150; // 150 meters threshold

    for (const candidate of nearbyCandidates) {
      if (candidate.latitude && candidate.longitude) {
        const dist = calculateDistanceInMeters(
          latitude,
          longitude,
          candidate.latitude,
          candidate.longitude
        );

        if (dist <= PROXIMITY_THRESHOLD_METERS) {
          return {
            duplicateDetected: true,
            duplicateComplaint: candidate,
            distanceMeters: Math.round(dist),
          };
        }
      }
    }

    return { duplicateDetected: false, duplicateComplaint: null, distanceMeters: null };
  } catch (error) {
    console.warn('AI duplicate detection check failed gracefully:', error.message);
    return { duplicateDetected: false, duplicateComplaint: null, distanceMeters: null };
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
  let duplicateInfo = { duplicateDetected: false, duplicateComplaint: null };
  if (latitude && longitude && ComplaintModel) {
    duplicateInfo = await detectDuplicateComplaint({
      category: finalCategory,
      latitude,
      longitude,
      ComplaintModel,
    });
  }

  return {
    suggestedCategory: classification.category,
    confidenceScore: classification.confidence,
    detectedKeywords: classification.detectedKeywords,
    suggestedPriority: priority,
    recommendedDepartment: department,
    ...duplicateInfo,
  };
};

export default {
  classifyComplaint,
  detectPriority,
  recommendDepartment,
  detectDuplicateComplaint,
  analyzeComplaint,
};
