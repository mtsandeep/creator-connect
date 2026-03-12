// ============================================
// DEMO TOUR HOOK - Driver.js integration
// ============================================

import { useCallback } from 'react';
import { driver } from 'driver.js';
import type { DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

// Custom styles for the tour
const customStyles = `
  /* Highlighted element styling - cyan border glow */
  .driver-active-element {
  }

  /* Popover container */
  .driver-popover {
    background: #1a1a1a !important;
    border: none !important;
    border-radius: 16px !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
  }
  .driver-popover-title {
    color: #fff !important;
    font-size: 16px !important;
    font-weight: 700 !important;
  }
  .driver-popover-description {
    color: #9ca3af !important;
    font-size: 14px !important;
    line-height: 1.5 !important;
  }
  .driver-popover-description ul {
    margin: 0 !important;
    padding-left: 18px !important;
    list-style-type: disc !important;
  }
  .driver-popover-description li {
    margin-bottom: 6px !important;
    line-height: 1.6 !important;
    color: #9ca3af !important;
  }
  .driver-popover-description li::marker {
    color: #00D9FF !important;
  }
  .driver-popover-progress-text {
    color: #00D9FF !important;
    font-weight: 600 !important;
  }
  .driver-popover-navigation-btns {
    gap: 8px !important;
  }
  .driver-popover-next-btn {
    background: linear-gradient(135deg, #00D9FF, #B8FF00) !important;
    color: #000 !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 8px 16px !important;
    font-weight: 600 !important;
    text-shadow: none !important;
  }
  .driver-popover-prev-btn {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #fff !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px !important;
    padding: 8px 16px !important;
    font-weight: 600 !important;
    text-shadow: none !important;
  }
  .driver-popover-close-btn {
    color: #9ca3af !important;
  }

  /* Arrow/pointer styling - ALL sides visible with popover background color */
  div.driver-popover-arrow {
    border: 8px solid #1a1a1a !important;
  }

  /* Hide unused arrow sides based on popover position */
  div.driver-popover-arrow-side-left {
    border-right-color: transparent !important;
    border-bottom-color: transparent !important;
    border-top-color: transparent !important;
    /* border-left-color stays #1a1a1a - visible arrow pointing left */
  }

  div.driver-popover-arrow-side-right {
    border-left-color: transparent !important;
    border-bottom-color: transparent !important;
    border-top-color: transparent !important;
    /* border-right-color stays #1a1a1a - visible arrow pointing right */
  }

  div.driver-popover-arrow-side-top {
    border-right-color: transparent !important;
    border-bottom-color: transparent !important;
    border-left-color: transparent !important;
    /* border-top-color stays #1a1a1a - visible arrow pointing up */
  }

  div.driver-popover-arrow-side-bottom {
    border-left-color: transparent !important;
    border-top-color: transparent !important;
    border-right-color: transparent !important;
    /* border-bottom-color stays #1a1a1a - visible arrow pointing down */
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}

// Tour steps for Instagram page
export const instagramTourSteps: DriveStep[] = [
  {
    element: '[data-tour="link-in-bio"]',
    popover: {
      title: 'Your Link-in-Bio',
      description: 'This is your ColLoved link! Brands click this to see your professional profile with pricing, terms, and contact options. Click it to continue!',
      side: 'right',
      align: 'start',
    },
  },
];

// Tour steps for Profile page
export const profileTourSteps: DriveStep[] = [
  {
    element: '[data-tour="profile-card"]',
    popover: {
      title: 'Your Professional Profile',
      description: 'This is what brands see when they click your link-in-bio! A complete showcase of your reach, terms, pricing, and contact options.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="profile-header"]',
    popover: {
      title: 'First Impressions',
      description: 'Your photo, name, and verification badges build trust instantly. Categories help brands understand your niche.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="social-stats"]',
    popover: {
      title: 'Your Reach',
      description: 'Follower counts across platforms. Brands see your influence at a glance.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="terms"]',
    popover: {
      title: 'Your Terms',
      description: 'Clear expectations upfront - what you accept and what you don\'t.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="pricing"]',
    popover: {
      title: 'Transparent Pricing',
      description: '<ul><li>Starting price and advance requirements</li><li>No awkward negotiations</li><li>Show pricing publicly or keep it private</li><li>Fully configurable from dashboard</li></ul>',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="personal-links"]',
    popover: {
      title: 'Your Links',
      description: 'Your store, digital products, courses - all your business links in one place.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="action-buttons"]',
    popover: {
      title: 'Contact Options',
      description: 'Brands can send a proposal or start a chat - both lead to collaborations!',
      side: 'top',
      align: 'center',
    },
  },
];

// Tour steps for Chat page
export const chatTourSteps: DriveStep[] = [
  {
    element: '[data-tour="chat-header"]',
    popover: {
      title: 'Chat Header',
      description: 'Shows who you\'re chatting with. Click to view their full profile anytime.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="brand-message"]',
    popover: {
      title: 'Brand\'s Message',
      description: 'Brands introduce themselves and their campaign. You can discuss details before committing.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="influencer-reply"]',
    popover: {
      title: 'Your Response',
      description: 'Reply when you\'re ready. Negotiate terms, ask questions, and clarify expectations.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="message-input"]',
    popover: {
      title: 'Chat Anytime',
      description: 'Messages are saved, so you can reply when convenient. No pressure to respond instantly!',
      side: 'top',
      align: 'center',
    },
  },
];

// Tour steps for Proposal page
export const proposalTourSteps: DriveStep[] = [
  {
    element: '[data-tour="proposal-header"]',
    popover: {
      title: 'Formal Proposal',
      description: 'When terms are agreed, brands send a formal proposal. This creates a clear agreement.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="deliverables"]',
    popover: {
      title: 'Clear Deliverables',
      description: 'Exactly what you need to create. No surprises - everything is documented upfront.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="payment-terms"]',
    popover: {
      title: 'Payment Terms',
      description: 'Budget, advance percentage, and payment schedule. You know exactly when you\'ll get paid.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="deadline"]',
    popover: {
      title: 'Deadline',
      description: 'Clear timeline for content delivery. Plan your schedule accordingly.',
      side: 'top',
      align: 'center',
    },
  },
];

// Store driver instance to allow stopping
let driverInstance: ReturnType<typeof driver> | null = null;

// Tour options interface
interface TourOptions {
  overlayColor?: string;
  overlayOpacity?: number;
}

// Default tour options
const defaultTourOptions: TourOptions = {
  overlayColor: '#fff',
  overlayOpacity: 0.5,
};

// Hook to use the demo tour
export function useDemoTour(steps: DriveStep[], options?: TourOptions) {
  const startTour = useCallback(() => {
    const tourOptions = { ...defaultTourOptions, ...options };

    driverInstance = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      popoverClass: 'demo-tour-popover',
      stagePadding: 12,
      stageRadius: 8,
      popoverOffset: 16,
      smoothScroll: true,
      overlayColor: tourOptions.overlayColor!,
      overlayOpacity: tourOptions.overlayOpacity!,
      steps,
      // Refresh popover position after element is highlighted and scrolled to
      onHighlighted: () => {
        setTimeout(() => driverInstance?.refresh(), 0);
      },
    });

    driverInstance.drive();
  }, [steps, options]);

  const stopTour = useCallback(() => {
    if (driverInstance) {
      driverInstance.destroy();
      driverInstance = null;
    }
    // Also remove any remaining driver.js elements from DOM
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.driver-overlay, .driver-popover, .driver-active-element').forEach((el) => {
        el.remove();
      });
      // Remove body classes
      document.body.classList.remove('driver-active');
    }
  }, []);

  // Refresh driver position on scroll - call this when you know scrolling happens
  const refreshPosition = useCallback(() => {
    if (driverInstance) {
      driverInstance.refresh();
    }
  }, []);

  return { startTour, stopTour, refreshPosition };
}
