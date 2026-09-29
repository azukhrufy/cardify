export const CONTENT_TYPES = {
  instagram: [
    {
      id: 'story',
      label: 'Instagram Story',
      description: 'Story 24 jam, per slide',
      durationOptions: null,
      cpmRef: 'story',
    },
    {
      id: 'feedPost',
      label: 'Instagram Feed Post',
      description: 'Foto/static post di feed',
      durationOptions: null,
      cpmRef: 'feedPost',
    },
    {
      id: 'reels',
      label: 'Instagram Reels',
      description: 'Video reels, breakdown berdasarkan durasi',
      durationOptions: [
        { label: '< 15 detik', durationRange: '<15s', multiplierExtra: 0.8 },
        { label: '15 – 30 detik', durationRange: '15-30s', multiplierExtra: 1.0 },
        { label: '30 – 60 detik', durationRange: '30-60s', multiplierExtra: 1.2 },
      ],
      cpmRef: 'reels',
    },
  ],
  tiktok: [
    {
      id: 'shortVideo',
      label: 'TikTok Video',
      description: 'Video pendek biasa, breakdown berdasarkan durasi',
      durationOptions: [
        { label: '< 15 detik', durationRange: '<15s', multiplierExtra: 0.8 },
        { label: '15 – 30 detik', durationRange: '15-30s', multiplierExtra: 1.0 },
        { label: '30 – 60 detik', durationRange: '30-60s', multiplierExtra: 1.2 },
        { label: '> 60 detik', durationRange: '>60s', multiplierExtra: 1.4 },
      ],
      cpmRef: 'video',
    },
    {
      id: 'photoMode',
      label: 'TikTok Carousel / Photo Mode',
      description: 'Konten foto/karousel dalam satu unggahan',
      durationOptions: null,
      cpmRef: 'photoMode',
    },
    {
      id: 'integration',
      label: 'TikTok Integration / Brand Mention',
      description: 'Mention/integrasi merek dalam video yang ada (opsional add-on)',
      durationOptions: null,
      cpmRef: 'integration',
    },
    {
      id: 'dedicatedVideo',
      label: 'TikTok Dedicated Video / Sponsored',
      description: 'Video utuh berisi merek/konten sponsori',
      durationOptions: [
        { label: '15 – 30 detik', durationRange: '15-30s', multiplierExtra: 1.0 },
        { label: '30 – 60 detik', durationRange: '30-60s', multiplierExtra: 1.2 },
        { label: '> 60 detik', durationRange: '>60s', multiplierExtra: 1.4 },
      ],
      cpmRef: 'dedicatedVideo',
    },
  ],
  youtube: [
    {
      id: 'integration',
      label: 'YouTube Integration / Shoutout',
      description: 'Pengingat/integrasi merek dalam video yang ada (30-60 detik)',
      durationOptions: null,
      cpmRef: 'integration',
    },
    {
      id: 'dedicatedVideo',
      label: 'YouTube Dedicated Video',
      description: 'Video utuh berisi merek/konten sponsori',
      durationOptions: [
        { label: '5 – 10 menit', durationRange: '5-10m', multiplierExtra: 1.0 },
        { label: '10 – 20 menit', durationRange: '10-20m', multiplierExtra: 1.3 },
        { label: '> 20 menit', durationRange: '>20m', multiplierExtra: 1.6 },
      ],
      cpmRef: 'dedicatedVideo',
    },
  ],
};
