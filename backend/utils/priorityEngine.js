const URGENCY_WEIGHTS = { critical: 4, high: 3, medium: 2, low: 1 };
const CATEGORY_WEIGHTS = { disaster: 1.5, health: 1.6, food: 1.2, education: 1.0, other: 1.0 };

// Controls scaling limits to guarantee mathematical triage
const MAX_PEOPLE_CONTRIBUTION = 20;
const MAX_SCORE = 90; 

function calcPriorityScore(need) {
  const urgencyVal = URGENCY_WEIGHTS[need.urgency] || 1;
  const categoryVal = CATEGORY_WEIGHTS[need.category] || 1.0;
  
  // Safe default for missing or invalid data
  let peopleAffected = Number(need.peopleAffected);
  if (isNaN(peopleAffected) || peopleAffected < 1) {
    peopleAffected = 1;
  }

  let rawScore = 0;

  if (need.urgency === "critical") {
    const urgencyScore = urgencyVal * 10;
    const categoryScore = categoryVal * 3;
    // Cap the massive scale growth
    const peopleScore = Math.min(Math.sqrt(peopleAffected), MAX_PEOPLE_CONTRIBUTION);
    const criticalBoost = 20;
    
    rawScore = urgencyScore + categoryScore + peopleScore + criticalBoost;
  } else {
    const urgencyScore = urgencyVal * 5;
    const categoryScore = categoryVal * 2;
    // Cap the massive scale growth
    const peopleScore = Math.min(Math.sqrt(peopleAffected) * 2, MAX_PEOPLE_CONTRIBUTION);
    
    rawScore = urgencyScore + categoryScore + peopleScore;
  }

  // Normalize securely to a 0-100 scale
  const normalizedScore = (rawScore / MAX_SCORE) * 100;
  
  // Hard cap only to prevent floating point edge cases > 100
  const finalScore = Math.min(normalizedScore, 100);

  return Math.round(finalScore * 10) / 10;
}

module.exports = { calcPriorityScore, URGENCY_WEIGHTS, CATEGORY_WEIGHTS };
