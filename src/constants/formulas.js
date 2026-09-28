/**
 * Hitung Base Rate dari impressions & CPM
 * @param {number} impressions - Jumlah tayangan (reach/impressions)
 * @param {number} cpm - Cost per mille (IDR per 1000 impressions)
 */
export function calculateBaseRate(impressions, cpm) {
  return (impressions / 1000) * cpm;
}

/**
 * Hitung engagement multiplier
 * @param {number} engagementRate - ER dalam persen (misal 4.8)
 * @param {number} nicheERBenchmark - ER benchmark untuk niche tsb
 */
export function calculateEngagementMultiplier(engagementRate, nicheERBenchmark = 3.5) {
  const ratio = engagementRate / nicheERBenchmark;
  if (ratio < 0.5) return 0.7;
  if (ratio < 0.8) return 0.9;
  if (ratio < 1.0) return 1.0;
  if (ratio < 1.5) return 1.15;
  if (ratio < 2.0) return 1.3;
  return 1.45;
}

/**
 * Durasi multiplier untuk konten video
 */
export function getDurationMultiplier(durationRange) {
  const map = {
    '<15s': 0.8,
    '15-30s': 1.0,
    '30-60s': 1.2,
    '>60s': 1.4,
    '5-10m': 1.0,
    '10-20m': 1.3,
    '>20m': 1.6,
  };
  return map[durationRange] || 1.0;
}

/**
 * Formula akhir: combined rate
 */
export function calculateRate({
  impressions,
  cpm,
  engagementRate,
  nicheERBenchmark,
  contentTypeMultiplier,
  durationMultiplier,
}) {
  const base = calculateBaseRate(impressions, cpm);
  const engagementMult = calculateEngagementMultiplier(engagementRate, nicheERBenchmark);
  const totalMultiplier = contentTypeMultiplier * (durationMultiplier || 1.0) * engagementMult;
  return base * totalMultiplier;
}
