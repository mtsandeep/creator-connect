// ============================================
// INSTAGRAM CARD COMPONENT
// Main wrapper that combines all Instagram components
// ============================================

import type { InstagramAnalytics, InstagramAnalyticsAlt } from '../../types';
import InstagramProfile from './InstagramProfile';
import InstagramEngagement from './InstagramEngagement';
import InstagramAdvancedReport from './InstagramAdvancedReport';

interface InstagramCardProps {
  analytics: InstagramAnalytics | InstagramAnalyticsAlt;
  fromCache?: boolean;
}

export default function InstagramCard({ analytics, fromCache }: InstagramCardProps) {
  const isAlt = 'dataSource' in analytics && analytics.dataSource === 'alt';

  return (
    <div className="space-y-6">
      {/* 1. Basic Profile Section */}
      <InstagramProfile analytics={analytics} fromCache={fromCache} />

      {/* 2. Engagement Section */}
      <InstagramEngagement analytics={analytics as InstagramAnalytics} />

      {/* 3. Advanced Insights Section (only for primary analytics) */}
      {!isAlt && (
        <InstagramAdvancedReport analytics={analytics as InstagramAnalytics} />
      )}
    </div>
  );
}
