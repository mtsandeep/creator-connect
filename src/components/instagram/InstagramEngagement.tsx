// ============================================
// INSTAGRAM ENGAGEMENT COMPONENT
// Engagement metrics with popover details
// ============================================

import type { InstagramAnalytics } from '../../types';
import { Heart, MessageCircle, Eye, Film, ImageIcon, TrendingUp, Info, Zap, BarChart3, Lock, Database } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';

interface InstagramEngagementProps {
  analytics: InstagramAnalytics;
}

export default function InstagramEngagement({ analytics }: InstagramEngagementProps) {
  const [showPopover, setShowPopover] = useState(false);

  // Check if profile is private (only available in alt data)
  const isPrivate = 'dataSource' in analytics && analytics.dataSource === 'alt' && 
                   (analytics as any).isPrivate;

  // Check if there's limited data error
  const hasLimitedData = !!analytics.limitedDataError;

  // Use posts analytics if available, otherwise show -- for limited data
  const hasPostsAnalytics = !!analytics.postsAnalytics;
  const engagementData = hasLimitedData ? {
    avgLikes: '--',
    avgComments: '--', 
    avgViews: '--',
    generalEngagementRate: '--',
    typicalEngagementRate: '--',
    generalVideoEngagementRate: '--',
    typicalVideoEngagementRate: '--',
    postTypeBreakdown: null,
    viralPostsCount: 0,
    viralPostsAvgViews: 0,
    viralPostsAvgEngagement: 0,
    medianLikes: '--',
    medianComments: '--',
    medianViews: '--',
    medianEngagement: '--',
  } : hasPostsAnalytics ? analytics.postsAnalytics! : {
    avgLikes: analytics.averageLikes,
    avgComments: analytics.averageComments,
    avgViews: analytics.averageReelPlays,
    generalEngagementRate: analytics.engagementRate * 100, // Convert to percentage
    typicalEngagementRate: null, // Not available in basic analytics
    generalVideoEngagementRate: null,
    typicalVideoEngagementRate: null,
    postTypeBreakdown: null,
    viralPostsCount: 0,
    viralPostsAvgViews: 0,
    viralPostsAvgEngagement: 0,
    medianLikes: 0,
    medianComments: 0,
    medianViews: 0,
    medianEngagement: 0,
  };

  // Format numbers for display
  const formatNumber = (num: number | string) => {
    if (num === '--') return '--';
    const numVal = typeof num === 'number' ? num : parseFloat(num);
    if (numVal >= 1000000) return `${(numVal / 1000000).toFixed(0)}M`;
    if (numVal >= 1000) return `${(numVal / 1000).toFixed(0)}K`;
    return Math.round(numVal).toString();
  };

  // Format percentage for display
  const formatPercentage = (num: number | string) => {
    if (num === '--') return '--';
    const numVal = typeof num === 'number' ? num : parseFloat(num);
    return `${numVal.toFixed(2)}%`;
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#00D9FF]" />
          Engagement Metrics
        </h3>
        <button
          onClick={() => setShowPopover(true)}
          className="text-gray-400 hover:text-white transition-colors"
          title="View engagement details"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Main Engagement Rate */}
      <div className="bg-gradient-to-r from-[#00D9FF]/10 to-transparent rounded-xl p-4 border border-[#00D9FF]/20">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-white font-medium">Engagement Rate</span>
            {hasPostsAnalytics && (
              <span className="text-xs text-gray-400 ml-2">(Calculated from recent posts)</span>
            )}
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-[#00D9FF]">
              {formatPercentage(engagementData.generalEngagementRate)}
            </span>
            {engagementData.typicalEngagementRate && engagementData.typicalEngagementRate !== '--' && (
              <p className="text-xs text-gray-400 mt-1">
                Typical: {formatPercentage(engagementData.typicalEngagementRate)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Metrics Grid */}
      <div className={`grid gap-4 ${engagementData.avgViews !== '--' && typeof engagementData.avgViews === 'number' && engagementData.avgViews > 0 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
        {/* Avg Likes */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2 text-red-500">
            <Heart className="w-5 h-5" />
            <span className="text-sm text-gray-400">Avg Likes</span>
          </div>
          <p className="text-white font-black text-xl">
            {formatNumber(engagementData.avgLikes)}
          </p>
        </div>

        {/* Avg Comments */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2 text-blue-500">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm text-gray-400">Avg Comments</span>
          </div>
          <p className="text-white font-black text-xl">
            {formatNumber(engagementData.avgComments)}
          </p>
        </div>

        {/* Avg Views */}
        {engagementData.avgViews !== '--' && engagementData.avgViews > 0 && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2 text-purple-500">
              <Eye className="w-5 h-5" />
              <span className="text-sm text-gray-400">Avg Views</span>
            </div>
            <p className="text-white font-black text-xl">
              {formatNumber(engagementData.avgViews)}
            </p>
          </div>
        )}
      </div>

      {/* Engagement Details Popover - Using Headless UI Dialog with Portal */}
      <Transition show={showPopover} as={Fragment}>
        <Dialog className="relative z-50" onClose={setShowPopover}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-gray-900 border border-white/10 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                  {/* Header */}
                  <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm px-6 py-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <Dialog.Title className="text-lg font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#00D9FF]" />
                        Engagement Details
                      </Dialog.Title>
                      <button
                        onClick={() => setShowPopover(false)}
                        className="text-gray-400 hover:text-white transition-colors text-2xl"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Formula Explanation */}
                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                      <p className="text-white font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        Engagement Rate Formula
                      </p>
                      <p className="text-gray-300 text-sm mb-2">
                        <code className="bg-black/30 px-2 py-1 rounded">
                          Engagement Rate = (Likes + 2×Comments) / Followers × 100
                        </code>
                      </p>
                      <p className="text-gray-400 text-xs">
                        Comments are weighted 2× as they indicate higher engagement than likes
                      </p>
                    </div>

                    {/* General vs Typical Engagement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-white font-semibold mb-2 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-400" />
                          General Engagement Rate
                        </p>
                        <p className="text-3xl font-black text-[#00D9FF] mb-2">
                          {formatPercentage(engagementData.generalEngagementRate)}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Includes all posts and shows overall engagement
                        </p>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-white font-semibold mb-2 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-green-400" />
                          Typical Engagement Rate
                        </p>
                        {engagementData.typicalEngagementRate !== null && engagementData.typicalEngagementRate !== '--' ? (
                          <p className="text-3xl font-black text-green-400 mb-2">
                            {formatPercentage(engagementData.typicalEngagementRate)}
                          </p>
                        ) : (
                          <p className="text-xl font-bold text-gray-500 mb-2">N/A</p>
                        )}
                        <p className="text-gray-400 text-xs">
                          With viral posts capped at 3× the median for a more representative rate
                          {!hasPostsAnalytics && " (Requires posts analytics)"}
                        </p>
                      </div>
                    </div>

                    {/* Reel/Video Engagement */}
                    <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                      <p className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Film className="w-4 h-4 text-purple-400" />
                        Reel/Video Engagement
                      </p>
                      {hasPostsAnalytics && engagementData.generalVideoEngagementRate !== null && engagementData.generalVideoEngagementRate !== '--' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">General Rate</p>
                            <p className="text-2xl font-bold text-white">
                              {formatPercentage(engagementData.generalVideoEngagementRate)}
                            </p>
                          </div>
                          {engagementData.typicalVideoEngagementRate !== null && engagementData.typicalVideoEngagementRate !== '--' && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Typical Rate</p>
                              <p className="text-2xl font-bold text-white">
                                {formatPercentage(engagementData.typicalVideoEngagementRate)}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          {!hasPostsAnalytics
                            ? "Reel/Video engagement rates require detailed posts analytics data."
                            : "No video posts found to calculate reel engagement rates."}
                        </p>
                      )}
                    </div>

                    {/* Viral Posts Analysis */}
                    <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                      <p className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Viral Posts Analysis
                        {hasPostsAnalytics && (
                          <span className="text-xs bg-yellow-500/20 px-2 py-1 rounded-full">
                            {engagementData.viralPostsCount} viral posts
                          </span>
                        )}
                      </p>
                      {hasPostsAnalytics && engagementData.viralPostsCount > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Avg Views (Viral Posts)</p>
                            <p className="text-xl font-bold text-white">
                              {formatNumber(engagementData.viralPostsAvgViews)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Avg Engagement (Viral Posts)</p>
                            <p className="text-xl font-bold text-white">
                              {engagementData.viralPostsAvgEngagement.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          {!hasPostsAnalytics
                            ? "Viral posts analysis requires detailed posts analytics data."
                            : "No viral posts detected in the analyzed posts."}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs mt-2">
                        Viral posts are those with engagement &gt; 3× the median
                      </p>
                    </div>

                    {/* Post Type Breakdown */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-white font-semibold mb-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-green-400" />
                        Posts Analyzed
                      </p>
                      {hasPostsAnalytics && engagementData.postTypeBreakdown ? (
                        <>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Images</p>
                              <p className="text-xl font-bold text-white">
                                {engagementData.postTypeBreakdown.imageCount}
                              </p>
                            </div>
                            <div className="text-center p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Videos</p>
                              <p className="text-xl font-bold text-white">
                                {engagementData.postTypeBreakdown.videoCount}
                              </p>
                            </div>
                            <div className="text-center p-3 bg-white/5 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Total</p>
                              <p className="text-xl font-bold text-white">
                                {engagementData.postTypeBreakdown.totalCount}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-400 text-xs mt-3">
                            Posts less than a day old and older than 60 days are ignored for accurate analysis
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          Post type breakdown requires detailed posts analytics data.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-white/5 px-6 py-3 border-t border-white/10">
                    <p className="text-gray-400 text-xs text-center">
                      
                    </p>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Private Profile Overlay */}
      {isPrivate && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-lg rounded-2xl flex items-center justify-center z-10">
          <div className="text-center space-y-3">
            <div className="relative">
              <Lock className="w-10 h-10 text-yellow-500 mx-auto" />
              <div className="absolute inset-0 w-10 h-10 bg-yellow-500/20 blur-xl mx-auto"></div>
            </div>
            <div className="space-y-2">
              <p className="text-white font-bold text-xl tracking-wide">Profile is Private</p>
              <p className="text-gray-300 text-sm font-medium">Engagement metrics are not available</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-yellow-500/70">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="uppercase tracking-wider">Restricted Access</span>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Limited Posts Overlay */}
      {hasLimitedData && !isPrivate && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-lg rounded-2xl flex items-center justify-center z-10">
          <div className="text-center space-y-3">
            <div className="relative">
              <Database className="w-10 h-10 text-orange-500 mx-auto" />
              <div className="absolute inset-0 w-10 h-10 bg-orange-500/20 blur-xl mx-auto"></div>
            </div>
            <div className="space-y-2">
              <p className="text-white font-bold text-xl tracking-wide">Limited Posts</p>
              <p className="text-gray-300 text-sm font-medium">
                {analytics.limitedDataError?.reason === 'very_few_posts' 
                  ? `Only ${analytics.limitedDataError?.totalFetched} posts found`
                  : `${analytics.limitedDataError?.postsFound} posts available for analysis`
                }
              </p>
              <p className="text-gray-400 text-xs">Need at least {analytics.limitedDataError?.postsRequired} recent posts</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-orange-500/70">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="uppercase tracking-wider">Insufficient Data</span>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
