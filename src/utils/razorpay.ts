// ============================================
// RAZORPAY LAZY LOADING UTILITY
// ============================================

declare global {
  interface Window {
    Razorpay?: any;
  }
}

let razorpayLoadPromise: Promise<void> | null = null;

/**
 * Lazy loads the Razorpay checkout script.
 * Returns a promise that resolves when Razorpay is ready to use.
 * Caches the promise to avoid multiple script injections.
 */
export function loadRazorpay(): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (razorpayLoadPromise) {
    return razorpayLoadPromise;
  }

  razorpayLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        resolve();
      } else {
        reject(new Error('Razorpay script loaded but window.Razorpay is not available'));
      }
    };
    script.onerror = () => {
      razorpayLoadPromise = null;
      reject(new Error('Failed to load Razorpay script'));
    };
    document.head.appendChild(script);
  });

  return razorpayLoadPromise;
}
