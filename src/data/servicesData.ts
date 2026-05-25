import { Category, SmmService } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'instagram', name: 'Instagram Engagement', icon: 'Instagram' },
  { id: 'tiktok', name: 'TikTok Growth Booster', icon: 'Video' },
  { id: 'facebook', name: 'Facebook Fans & Likes', icon: 'Facebook' },
  { id: 'youtube', name: 'YouTube Views & Hours', icon: 'Youtube' },
  { id: 'telegram', name: 'Telegram Core Channels', icon: 'Send' }
];

export const SERVICES: SmmService[] = [
  {
    id: 1,
    categoryId: 'instagram',
    name: 'Instagram Real Followers [Speed 10K/Day] - Non-Drop 30D Refill',
    ratePer1000: 1.85,
    minOrder: 100,
    maxOrder: 50000,
    description: 'High quality and active real followers worldwide. Safe delivery speed of up to 10k/day. Supported by a 30-day auto refill warranty in case of fluctuations.',
    provider: 'Auto API Integration',
    providerServiceId: 1042
  },
  {
    id: 2,
    categoryId: 'instagram',
    name: 'Instagram Organic Targeted Likes [Speed 50K/Day] - Instant Delivery',
    ratePer1000: 0.45,
    minOrder: 50,
    maxOrder: 100000,
    description: 'Provide instant, premium quality organic likes on any Instagram post URL. Undetectable by security algorithms, promoting search discovery.',
    provider: 'Auto API Integration',
    providerServiceId: 331
  },
  {
    id: 3,
    categoryId: 'instagram',
    name: 'Instagram Custom Comments [Emoji + Text Customization] - High Ref',
    ratePer1000: 4.20,
    minOrder: 10,
    maxOrder: 1000,
    description: 'Deliver custom comments that you write yourself. Promotes real and engaging user interactions. Max 1000 comments per link.',
    provider: 'Manual Admin Desk',
    providerServiceId: 0
  },
  {
    id: 4,
    categoryId: 'tiktok',
    name: 'TikTok High Quality Views [Start: Instant] [Super Fast 5M/Day]',
    ratePer1000: 0.08,
    minOrder: 500,
    maxOrder: 1000000,
    description: 'Extremely cost-effective views to boost algorithms, improve search metrics, and trigger viral trends. Delivers up to 5 Million video views per day.',
    provider: 'Auto API Integration',
    providerServiceId: 982
  },
  {
    id: 5,
    categoryId: 'tiktok',
    name: 'TikTok Stable Likes [Guaranteed 100%] [Instant Refill]',
    ratePer1000: 0.95,
    minOrder: 100,
    maxOrder: 20000,
    description: 'Stable real likes from high quality profiles. Guaranteed 100% and supported by unlimited manual or system auto refills.',
    provider: 'Auto API Integration',
    providerServiceId: 1109
  },
  {
    id: 6,
    categoryId: 'facebook',
    name: 'Facebook Page Likes + Followers [Super High Quality Profile Assets]',
    ratePer1000: 2.40,
    minOrder: 100,
    maxOrder: 25000,
    description: 'Combined page followers and likes to build brand authorization. Safe for monetization rules and compliant with professional dashboards.',
    provider: 'Manual Admin Desk',
    providerServiceId: 0
  },
  {
    id: 7,
    categoryId: 'facebook',
    name: 'Facebook Post Love/Haha/Wow Reactions [Instant Trigger / Stable]',
    ratePer1000: 0.75,
    minOrder: 100,
    maxOrder: 10000,
    description: 'Give positive custom emoji reactions of your choice (Love, Haha, Wow) to increase relative organic scores on news feed algorithms.',
    provider: 'Auto API Integration',
    providerServiceId: 442
  },
  {
    id: 8,
    categoryId: 'youtube',
    name: 'YouTube Monetizable Search-Engine Views [Organic Traffic / Non-Drop]',
    ratePer1000: 3.80,
    minOrder: 500,
    maxOrder: 50000,
    description: 'High retention monetizable organic views. Delivered via search algorithms and recommended suggested feeds. Safe for Adsense networks.',
    provider: 'Auto API Integration',
    providerServiceId: 1450
  },
  {
    id: 9,
    categoryId: 'youtube',
    name: 'YouTube Watch Hours [Organic Session Sync] [4000 Hours Package Limit]',
    ratePer1000: 9.50,
    minOrder: 100,
    maxOrder: 5000,
    description: 'Special watch hours boost utilizing multi-minute videos. Build watch time metrics to quickly pass monetization eligibility checklists.',
    provider: 'Manual Admin Desk',
    providerServiceId: 0
  },
  {
    id: 10,
    categoryId: 'telegram',
    name: 'Telegram Real Member Channels & Groups [Zero Drop / 30D Refill]',
    ratePer1000: 1.20,
    minOrder: 100,
    maxOrder: 10000,
    description: 'Real English and international members. Suitable for both public and private channels/groups. Drop rate typically less than 3%.',
    provider: 'Auto API Integration',
    providerServiceId: 673
  },
  {
    id: 11,
    categoryId: 'telegram',
    name: 'Telegram Post Views [Autofeed Last 5 Posts] - Non-Drop Unlimited',
    ratePer1000: 0.15,
    minOrder: 500,
    maxOrder: 100000,
    description: 'Spread high volume views to the last 5 posts in your public Telegram channel. Perfect for maintaining clean statistics.',
    provider: 'Auto API Integration',
    providerServiceId: 189
  }
];
