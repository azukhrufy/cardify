import { NICHES } from './niches';
import { calculateRate } from './formulas';

export function buildOutputCards({ platform, nicheId, metrics }) {
  const nicheConfig = NICHES.find(n => n.id === nicheId);
  if (!nicheConfig) return [];
  const platformConfig = nicheConfig.platformCPMs[platform];
  if (!platformConfig) return [];

  const cards = [];

  if (platform === 'instagram') {
    // Story
    cards.push({
      contentType: 'story',
      title: 'Instagram Story',
      rate: calculateRate({
        impressions: metrics.avgStoryReach || metrics.avgViews,
        cpm: platformConfig.story,
        engagementRate: metrics.engagementRate,
        nicheERBenchmark: 3.0,
        contentTypeMultiplier: 0.6,
      }),
      note: 'Per slide (24 jam)'
    });
    // Feed Post
    cards.push({
      contentType: 'feedPost',
      title: 'Instagram Feed Post',
      rate: calculateRate({
        impressions: metrics.avgFeedReach || metrics.avgViews,
        cpm: platformConfig.feedPost,
        engagementRate: metrics.engagementRate,
        nicheERBenchmark: 3.0,
        contentTypeMultiplier: 1.0,
      }),
      note: 'Static post / foto'
    });
    // Reels duration options
    const reelDurations = [
      { label: '<15s', mult: 0.8 },
      { label: '15-30s', mult: 1.0 },
      { label: '30-60s', mult: 1.2 },
    ];
    reelDurations.forEach(d => {
      cards.push({
        contentType: 'reels',
        title: `Instagram Reels (${d.label})`,
        rate: calculateRate({
          impressions: metrics.avgReelsViews || metrics.avgViews,
          cpm: platformConfig.reels,
          engagementRate: metrics.engagementRate,
          nicheERBenchmark: 3.0,
          contentTypeMultiplier: 1.2,
          durationMultiplier: d.mult,
        }),
        note: d.label,
      });
    });
  }

  if (platform === 'tiktok') {
    const tiktokDurations = [
      { label: '<15s', mult: 0.8 },
      { label: '15-30s', mult: 1.0 },
      { label: '30-60s', mult: 1.2 },
      { label: '>60s', mult: 1.4 },
    ];
    tiktokDurations.forEach(d => {
      cards.push({
        contentType: 'shortVideo',
        title: `TikTok Video (${d.label})`,
        rate: calculateRate({
          impressions: metrics.avgViews,
          cpm: platformConfig.video,
          engagementRate: metrics.engagementRate,
          nicheERBenchmark: 5.0,
          contentTypeMultiplier: 1.0,
          durationMultiplier: d.mult,
        }),
        note: d.label,
      });
    });
  }

  if (platform === 'youtube') {
    // Integration
    cards.push({
      contentType: 'integration',
      title: 'YouTube Integration / Shoutout',
      rate: calculateRate({
        impressions: metrics.avgViews,
        cpm: platformConfig.integration,
        engagementRate: metrics.engagementRate,
        nicheERBenchmark: 2.5,
        contentTypeMultiplier: 1.0,
      }),
      note: '30-60s dalam video yang ada',
    });
    // Dedicated video durations
    const ytDurations = [
      { label: '5-10m', mult: 1.0 },
      { label: '10-20m', mult: 1.3 },
      { label: '>20m', mult: 1.6 },
    ];
    ytDurations.forEach(d => {
      cards.push({
        contentType: 'dedicatedVideo',
        title: `YouTube Dedicated Video (${d.label})`,
        rate: calculateRate({
          impressions: metrics.avgViews,
          cpm: platformConfig.dedicatedVideo,
          engagementRate: metrics.engagementRate,
          nicheERBenchmark: 2.5,
          contentTypeMultiplier: 1.5,
          durationMultiplier: d.mult,
        }),
        note: d.label,
      });
    });
  }

  return cards;
}
