// ============================================
// SHARED CATEGORIES FOR INFLUENCERS & PROMOTERS
// ============================================

export const CATEGORIES = [
  'Fashion & Apparel',
  'Technology',
  'Food & Beverage',
  'Health & Wellness',
  'Beauty & Cosmetics',
  'Travel & Tourism',
  'Entertainment',
  'Education',
  'Finance',
  'Automotive',
  'Sports & Fitness',
  'Home & Living',
  'E-commerce',
  'Gaming',
  'Other'
] as const;

export type Category = typeof CATEGORIES[number];
