// ============================================
// PRICING SETTINGS COMPONENT
// ============================================

import type { ReactNode } from 'react';

const RATE_TYPES = [
  { id: 'story', label: 'Instagram Story', platform: 'instagram' },
  { id: 'post', label: 'Instagram Post', platform: 'instagram' },
  { id: 'reel', label: 'Instagram Reel', platform: 'instagram' },
  { id: 'status', label: 'Instagram Status', platform: 'instagram' },
  { id: 'facebook_post', label: 'Facebook Post', platform: 'facebook' },
  { id: 'facebook_status', label: 'Facebook Status', platform: 'facebook' },
  { id: 'video', label: 'YouTube Video', platform: 'youtube' },
  { id: 'shorts', label: 'YouTube Shorts', platform: 'youtube' },
];

interface PricingSettingsProps {
  advancePercentage: number;
  rates: { type: string; price: number }[];
  userPlatforms?: string[];
  onAdvanceChange: (value: number) => void;
  onRateChange: (index: number, price: number) => void;
  showMediaKit?: boolean;
  mediaKit?: File | null;
  onMediaKitChange?: (file: File | null) => void;
  children?: ReactNode;
  title?: string;
  description?: string;
  advancePercentageMax?: number;
  advancePercentageDescription?: string;
}

export default function PricingSettings({
  advancePercentage,
  rates,
  userPlatforms = [],
  onAdvanceChange,
  onRateChange,
  showMediaKit = false,
  mediaKit = null,
  onMediaKitChange,
  children,
  title = "Pricing Settings",
  description = "Configure your advance payment percentage and rates. These are discussed privately with brands.",
  advancePercentageMax = 100,
  advancePercentageDescription = `Maximum ${advancePercentageMax}% - This percentage will be paid upfront when the project starts`
}: PricingSettingsProps) {
  
  // Filter rate types based on user's connected platforms
  const filteredRateTypes = RATE_TYPES.filter(rateType => 
    userPlatforms.length === 0 || userPlatforms.includes(rateType.platform)
  );

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
      <p className="text-gray-400 text-sm mb-6">{description}</p>

      {/* Advance Percentage */}
      <div className="mb-8">
        <label className="block text-sm text-gray-400 mb-2">
          Advance Payment: <span className="text-[#00D9FF] font-semibold">{advancePercentage}%</span>
        </label>
        <p className="text-gray-500 text-xs mb-4">{advancePercentageDescription}</p>
        <div className="relative">
          <input
            type="range"
            min="0"
            max={advancePercentageMax}
            value={advancePercentage}
            onChange={(e) => onAdvanceChange(parseInt(e.target.value))}
            className="w-full h-3 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00D9FF]
              [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,217,255,0.8)] [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
              [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-[#00D9FF] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
              [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(0,217,255,0.8)] [&::-moz-range-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #00D9FF 0%, #00D9FF ${(advancePercentage / advancePercentageMax) * 100}%, #374151 ${(advancePercentage / advancePercentageMax) * 100}%, #374151 100%)`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>0%</span>
          <span>{advancePercentageMax / 2}%</span>
          <span>{advancePercentageMax}%</span>
        </div>
      </div>

      {/* Rates */}
      <div className="space-y-6 mb-6">
        <h3 className="text-sm font-medium text-white">Your Rates (INR)</h3>
        
        {/* Group by platform */}
        {(['instagram', 'facebook', 'youtube'] as const).map(platform => {
          const platformRateTypes = filteredRateTypes.filter(rt => rt.platform === platform);
          if (platformRateTypes.length === 0) return null;

          const platformNames = {
            instagram: 'Instagram',
            facebook: 'Facebook', 
            youtube: 'YouTube'
          };

          const platformColors = {
            instagram: 'text-pink-500',
            facebook: 'text-blue-500',
            youtube: 'text-red-500'
          };

          return (
            <div key={platform} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className={`text-sm font-semibold mb-4 ${platformColors[platform]}`}>
                {platformNames[platform]}
              </h4>
              <div className="space-y-3">
                {platformRateTypes.map((rateType) => {
                  const rateIndex = rates.findIndex(r => r.type === rateType.id);
                  return (
                    <div key={rateType.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-1">{rateType.label}</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                          <input
                            type="number"
                            value={rates[rateIndex]?.price || ''}
                            onChange={(e) => onRateChange(rateIndex, parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {filteredRateTypes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Connect social media accounts to set rates for those platforms.</p>
          </div>
        )}
      </div>

      {/* Media Kit */}
      {showMediaKit && (
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Previous Work Samples (Optional)</label>
          <p className="text-gray-500 text-xs mb-3">
            Showcase your best work, performance data, case studies, or audience insights. 
            A strong portfolio helps brands understand your value and collaborate more effectively.
          </p>
          <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-[#00D9FF]/50 transition-colors">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => onMediaKitChange?.(e.target.files?.[0] || null)}
              className="hidden"
              id="mediaKit"
            />
            <label htmlFor="mediaKit" className="cursor-pointer">
              {mediaKit ? (
                <p className="text-white">{mediaKit.name}</p>
              ) : (
                <p className="text-gray-500 text-sm">Upload PDF with work samples, case studies, or performance data (max 10MB)</p>
              )}
            </label>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

export { RATE_TYPES };
