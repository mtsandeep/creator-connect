// ============================================
// INSTAGRAM ADVANCED REPORT COMPONENT
// Audience insights from primary analytics (datadoping/fake-followers-checker)
// ============================================

import type { InstagramAnalytics } from '../../types';
import { IoIosPeople, IoMdFemale, IoMdMale } from "react-icons/io";
import { Shield, Users, TrendingUp } from 'lucide-react';

interface InstagramAdvancedReportProps {
  analytics: InstagramAnalytics;
}

export default function InstagramAdvancedReport({ analytics }: InstagramAdvancedReportProps) {
  const {
    fakeFollowers,
    audienceCredibility,
    audienceTypes,
    audienceCountries,
    audienceCities,
    genderSplit,
  } = analytics;

  // Convert decimal to percentage
  const toPercent = (value: number) => (value * 100).toFixed(2);

  // Get credibility color (score is 0-1, convert to 0-100)
  const getCredibilityColor = (score: number) => {
    const percentage = score * 100;
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get credibility label (score is 0-1, convert to 0-100)
  const getCredibilityLabel = (score: number) => {
    const percentage = score * 100;
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Average';
    return 'Poor';
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-md md:text-lg font-bold text-white">Audience Credibility</h3>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl md:text-3xl font-black ${getCredibilityColor(audienceCredibility)}`}>
              {toPercent(audienceCredibility)}%
            </div>
            <span className={`text-sm font-semibold ${getCredibilityColor(audienceCredibility)}`}>
              {getCredibilityLabel(audienceCredibility)}
            </span>
          </div>
        </div>
      </div>

      {/* Audience Quality Breakdown */}
      <div className="space-y-3">
        <h4 className="text-white font-semibold flex items-center gap-2">
          <IoIosPeople className="w-5 h-5 text-yellow-500" />
          Audience Quality
        </h4>
        <ProgressBar
          label="Fake/Suspicious Followers"
          value={fakeFollowers * 100}
          color="bg-red-500"
        />
        <ProgressBar
          label="Real People"
          value={audienceTypes.realPeople * 100}
          color="bg-green-500"
        />
        <ProgressBar
          label="Influencers"
          value={audienceTypes.influencers * 100}
          color="bg-blue-500"
        />
        <ProgressBar
          label="Mass Followers"
          value={audienceTypes.massFollowers * 100}
          color="bg-yellow-500"
        />
        <ProgressBar
          label="Bots"
          value={audienceTypes.bots * 100}
          color="bg-gray-500"
        />
      </div>

      {/* Gender Split */}
      {genderSplit.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            Gender Distribution
          </h4>
          <div className="flex gap-4">
            {genderSplit.map((item) => (
              <div key={item.label} className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 capitalize flex items-center gap-1">
                    {item.label === 'male' ? (
                      <IoMdMale className="w-3 h-3" />
                    ) : (
                      <IoMdFemale className="w-3 h-3" />
                    )}
                    {item.label}
                  </span>
                  <span className="text-white font-semibold">{toPercent(item.value)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: `${item.value * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Countries */}
      {audienceCountries.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Top Audience Countries
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {audienceCountries.slice(0, 5).map((country) => (
              <div key={country.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{country.name}</span>
                <span className="text-white font-semibold">{toPercent(country.weight)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Cities */}
      {audienceCities.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Top Audience Cities
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {audienceCities.slice(0, 5).map((city) => (
              <div key={city.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{city.name}</span>
                <span className="text-white font-semibold">{toPercent(city.weight)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ProgressBarProps {
  label: string;
  value: number;
  color: string;
}

function ProgressBar({ label, value, color }: ProgressBarProps) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={`font-semibold px-2 py-1 rounded-sm ${color}`}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
