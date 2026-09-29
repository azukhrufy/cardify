import { NICHES } from './niches';
import { CONTENT_TYPES } from './contentTypes';
import {
  calculateRate,
  finalizeRate,
  formatFloor,
  DEFAULT_ER_BENCHMARK,
} from './formulas';

/**
 * Metrik reach mana yang dipakai per content type. Fallback ke `metrics.avgViews`.
 */
const IMPRESSION_METRICS = {
  instagram: {
    story: 'avgStoryReach',
    feedPost: 'avgFeedReach',
    reels: 'avgReelsViews',
  },
};

/**
 * Format acuan per platform untuk menskalakan floor. Format ini memakai
 * `MINIMUM_RATE` apa adanya; format lain diskalakan dari rasio CPM-nya.
 */
const FLOOR_REFERENCE_FORMAT = {
  instagram: 'feedPost',
  tiktok: 'video',
  youtube: 'integration',
};

/**
 * Susun kartu output harga per content type.
 *
 * Model yang dipakai sama dengan halaman TikTok: **CPM per format adalah acuan
 * tunggal** (`platformCPMs[platform][format]` lewat `contentTypes[].cpmRef`),
 * dan `finalizeRate()` menerapkan floor + pembulatan per deliverable. Floor-nya
 * diskalakan per format lewat `formatFloor()` supaya di volume rendah harga
 * antar format tidak menempel jadi satu angka.
 *
 * Belum dipakai halaman mana pun — Instagram/YouTube masih stub.
 */
export function buildOutputCards({ platform, nicheId, metrics }) {
  const nicheConfig = NICHES.find((n) => n.id === nicheId);
  if (!nicheConfig) return [];
  const platformConfig = nicheConfig.platformCPMs[platform];
  if (!platformConfig) return [];

  const contentTypes = CONTENT_TYPES[platform];
  if (!contentTypes) return [];

  const rateFor = (impressions, cpm, durationMultiplier = 1) =>
    calculateRate({
      impressions,
      cpm,
      engagementRate: metrics.engagementRate,
      nicheERBenchmark: DEFAULT_ER_BENCHMARK,
      nicheMultiplier: nicheConfig.engagementMultiplier,
      durationMultiplier,
    });

  const referenceCpm =
    platformConfig[FLOOR_REFERENCE_FORMAT[platform]] ??
    Object.values(platformConfig)[0];

  return contentTypes.flatMap((ct) => {
    const cpm = platformConfig[ct.cpmRef];
    if (!cpm) return [];

    const impressions = metrics[IMPRESSION_METRICS[platform]?.[ct.id]] || metrics.avgViews;

    // Tanpa reach positif, base rate jadi 0 atau NaN dan finalizeRate
    // menaikkannya ke floor — kartu akan menampilkan harga masuk akal yang
    // tidak berasal dari data apa pun. Lebih baik kartunya tidak muncul.
    // Cek `> 0`, bukan `Number.isFinite`: null dan "" sama-sama koersi ke 0.
    if (!(Number(impressions) > 0)) return [];

    const floor = formatFloor(cpm, referenceCpm);

    // Format tanpa breakdown durasi jadi satu kartu.
    if (!ct.durationOptions) {
      return [
        {
          contentType: ct.id,
          title: ct.label,
          rate: finalizeRate(rateFor(impressions, cpm), floor),
          note: ct.description,
        },
      ];
    }

    return ct.durationOptions.map((dur) => ({
      contentType: ct.id,
      title: `${ct.label} (${dur.label})`,
      rate: finalizeRate(rateFor(impressions, cpm, dur.multiplierExtra), floor),
      note: dur.label,
    }));
  });
}
