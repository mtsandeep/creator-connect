// ============================================
// INSTAGRAM PROFILE MOCK COMPONENT
// Simulates an Instagram profile page for demo
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { demoInfluencer } from '../../data/demoData';

interface InstagramMockProps {
  linkPath?: string;
  onLinkClick?: () => void;
}

export default function InstagramMock({ linkPath = '/demo/linkbio/profile', onLinkClick }: InstagramMockProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'tagged'>('posts');

  const profile = demoInfluencer;

  // Mock post images
  const mockPosts = [
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=400&fit=crop',
  ];

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
    // Small delay to ensure tour is destroyed before navigation
    setTimeout(() => {
      navigate(linkPath);
    }, 100);
  };

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white min-h-[600px] rounded-2xl overflow-hidden shadow-2xl">
      {/* Instagram Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span className="font-semibold text-gray-900">{profile.username}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex items-center gap-4">
          <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-6">
          {/* Profile Image */}
          <div className="relative">
            <img
              src={profile.profileImage}
              alt={profile.displayName}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1">
            <div className="flex justify-around text-center">
              <div>
                <div className="font-semibold text-gray-900">284</div>
                <div className="text-xs text-gray-500">posts</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">125K</div>
                <div className="text-xs text-gray-500">followers</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">892</div>
                <div className="text-xs text-gray-500">following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          <h2 className="font-semibold text-gray-900">{profile.displayName}</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line mt-1">{profile.bio}</p>

          {/* Link-in-Bio - Normal Instagram link style */}
          <div className="mt-2" data-tour="link-in-bio">
            <span className="text-sm text-gray-700 whitespace-pre-line mt-1">Promotions/Collabs: </span>
            <button
              onClick={handleLinkClick}
              className="text-sm font-medium text-blue-500 hover:text-blue-700 transition-colors px-2 py-1 rounded running-border-btn cursor-pointer"
            >
              colloved.com/link/{profile.username}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
            Following
          </button>
          <button className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
            Message
          </button>
          <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200 mt-4 -mx-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 flex justify-center ${
              activeTab === 'posts' ? 'border-t-2 border-gray-900' : ''
            }`}
          >
            <svg className={`w-6 h-6 ${activeTab === 'posts' ? 'text-gray-900' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`flex-1 py-3 flex justify-center ${
              activeTab === 'reels' ? 'border-t-2 border-gray-900' : ''
            }`}
          >
            <svg className={`w-6 h-6 ${activeTab === 'reels' ? 'text-gray-900' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setActiveTab('tagged')}
            className={`flex-1 py-3 flex justify-center ${
              activeTab === 'tagged' ? 'border-t-2 border-gray-900' : ''
            }`}
          >
            <svg className={`w-6 h-6 ${activeTab === 'tagged' ? 'text-gray-900' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-3 gap-[1px] -mx-4 mt-0.5">
          {mockPosts.map((post, index) => (
            <div key={index} className="aspect-square">
              <img
                src={post}
                alt={`Post ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
  );
}
