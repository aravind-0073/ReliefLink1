const SKILL_MAP = {
  health: ["medical", "first-aid", "nursing", "doctor", "paramedic"],
  food: ["food-distribution", "logistics", "cooking", "catering"],
  education: ["teaching", "education", "tutoring", "training"],
  disaster: ["disaster-relief", "construction", "rescue", "logistics"],
  other: ["general-help", "logistics", "driving", "communication"],
};

const URGENCY_WEIGHTS = {
  low: 20,
  medium: 50,
  high: 100,
  critical: 150
};

// 1. Convert urgency into a numeric factor
const URGENCY_FACTORS = {
  low: 0.2,
  medium: 0.5,
  high: 0.8,
  critical: 1
};

function haversineDistance(loc1, loc2) {
  const R = 6371;
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((loc1.lat * Math.PI) / 180) *
    Math.cos((loc2.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matchVolunteersToNeed(need, volunteers, existingAssignments = []) {
  const assignedVolIds = existingAssignments
    .filter((a) => a.needId === need.id && a.status === "in-progress")
    .map((a) => a.volunteerId);

  const relevantSkills = SKILL_MAP[need.category] || [];

  // --- 2. IMPACT SCORE (Urgency + Scale) ---
  const urgencyLevel = need.urgency ? need.urgency.toLowerCase() : "medium";
  const urgencyWeight = URGENCY_WEIGHTS[urgencyLevel] || URGENCY_WEIGHTS.medium;
  const peopleCount = need.peopleAffected || 0;
  
  const peopleFactor = Math.log10(peopleCount + 1);
  const impactScore = Math.min(100, urgencyWeight * (1 + peopleFactor));

  // --- 3. DYNAMIC WEIGHTS ---
  // Defaults to medium (0.5) if urgency is undefined
  const urgencyFactor = URGENCY_FACTORS[urgencyLevel] || URGENCY_FACTORS.medium;
  
  // Distance weight increases with urgency
  const distW = 0.2 + 0.3 * urgencyFactor;
  // Skill weight decreases with urgency
  const skillW = 0.4 - 0.2 * urgencyFactor;
  // Impact weight fills the remaining portion (always guarantees distW + skillW + impactW = 1)
  const impactW = 1 - (distW + skillW);

  return volunteers
    .filter((v) => v.availability && !assignedVolIds.includes(v.id) && v.location && v.location.lat)
    .map((v) => {
      // --- 4. SKILL SCORE ---
      const matchedSkills = (v.skills || []).filter((s) => relevantSkills.includes(s));
      const skillScore = Math.min(100, matchedSkills.length * 30);

      // --- 5. DISTANCE SCORE ---
      // If need has no real geocoded location (e.g. bulk upload), use neutral score
      const hasLocation = need.location && need.location.lat && need.location.lng;
      const distance = hasLocation ? haversineDistance(v.location, need.location) : 0;
      const distScore = hasLocation ? Math.max(0, 100 - distance * 10) : 50;
      
      // --- 6. FINAL SCORE ---
      const totalScore = Math.round(
        skillScore * skillW + 
        distScore * distW + 
        impactScore * impactW
      );

      return {
        ...v,
        matchScore: totalScore,
        distance: Math.round(distance * 10) / 10,
        matchedSkills,
        // Detailed breakdown for debugging and demo purposes
        scores: {
          skillScore,
          distScore: Math.round(distScore * 10) / 10,
          impactScore: Math.round(impactScore * 10) / 10,
          weights: {
            skillW: Math.round(skillW * 100) / 100,
            distW: Math.round(distW * 100) / 100,
            impactW: Math.round(impactW * 100) / 100
          }
        }
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { matchVolunteersToNeed, haversineDistance };
