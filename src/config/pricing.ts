/**
 * Centralized Pricing Configuration
 *
 * All pricing values are defined here for easy updates and discount management.
 * Import from this file instead of hardcoding prices.
 */

export const PRICING = {
  // Platform Fees
  platformFee: {
    base: 199,           // Strike-through price (for display)
    current: 149,        // Actual price
    discounted: 119,     // Price with credits (20% off ₹149)
    gstRate: 0.18,       // 18% GST
  },

  // Escrow Fees (starts at ₹249, percentage-based for larger amounts - not yet enabled)
  escrowFee: {
    base: 249,           // Starting escrow fee
    gstRate: 0.18,
    // Future: percentage tiers for larger transactions
  },

  // Verification Fee
  verificationFee: {
    base: 1000,          // Base amount
    gstRate: 0.18,       // 18% GST
  },

  // Discount Configuration
  discounts: {
    creditDiscount: 0.20,           // 20% off with credits
    verifiedInfluencerDiscount: 0.10, // 10% additional for verified (future)
  },
} as const;

/**
 * Calculate platform fee with GST breakdown
 */
export const getPlatformFeeWithGST = (amount: number) => ({
  base: amount,
  gst: Math.round(amount * PRICING.platformFee.gstRate * 100) / 100,
  total: Math.round(amount * (1 + PRICING.platformFee.gstRate) * 100) / 100,
});

/**
 * Calculate discounted fee based on discount percentage
 */
export const getDiscountedFee = (baseAmount: number, discountPercent: number) =>
  Math.round(baseAmount * (1 - discountPercent));

/**
 * Get effective platform fee based on payment method and user status
 */
export const getEffectivePlatformFee = (
  useCredits: boolean,
  isVerified: boolean = false
): number => {
  let fee: number = PRICING.platformFee.current;

  if (useCredits) {
    fee = PRICING.platformFee.discounted;
  }

  // Future: Apply verified discount (when isVerified is true and not using credits)
  if (isVerified && !useCredits) {
    fee = Math.round(fee * (1 - PRICING.discounts.verifiedInfluencerDiscount));
  }

  return fee;
};

/**
 * Get platform fee display info for UI
 */
export const getPlatformFeeDisplay = (useCredits: boolean = false) => {
  const fee = useCredits ? PRICING.platformFee.discounted : PRICING.platformFee.current;
  const strikeThrough = useCredits ? PRICING.platformFee.current : PRICING.platformFee.base;
  const withGST = getPlatformFeeWithGST(fee);

  return {
    base: fee,
    strikeThrough,
    gst: withGST.gst,
    total: withGST.total,
  };
};

/**
 * Get verification fee with GST
 */
export const getVerificationFeeWithGST = () => {
  const { base, gstRate } = PRICING.verificationFee;
  const gst = Math.round(base * gstRate * 100) / 100;
  const total = Math.round((base + gst) * 100) / 100;

  return { base, gst, total };
};

/**
 * Get escrow fee display (for future use)
 */
export const getEscrowFeeDisplay = () => {
  const { base, gstRate } = PRICING.escrowFee;
  const gst = Math.round(base * gstRate * 100) / 100;
  const total = Math.round((base + gst) * 100) / 100;

  return { base, gst, total };
};
