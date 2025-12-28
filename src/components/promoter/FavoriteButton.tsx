// ============================================
// FAVORITE BUTTON COMPONENT
// ============================================

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'icon' | 'button';
}

const SIZE_STYLES = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const ICON_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export default function FavoriteButton({
  isFavorite,
  onToggle,
  size = 'md',
  showLabel = false,
  variant = 'icon',
}: FavoriteButtonProps) {
  if (variant === 'button') {
    return (
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
          isFavorite
            ? 'bg-red-500/10 border border-red-500/30 text-red-400'
            : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
        }`}
      >
        <svg
          className={`${ICON_SIZES[size]} ${isFavorite ? 'fill-red-400' : ''}`}
          fill={isFavorite ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {showLabel && (
          <span className="text-sm font-medium">
            {isFavorite ? 'Saved' : 'Save'}
          </span>
        )}
      </button>
    );
  }

  // Icon variant
  return (
    <button
      onClick={onToggle}
      className={`${SIZE_STYLES[size]} rounded-full flex items-center justify-center transition-all ${
        isFavorite
          ? 'bg-red-500/10 text-red-400'
          : 'bg-[#0a0a0a]/80 text-gray-400 hover:text-red-400'
      }`}
    >
      <svg
        className={ICON_SIZES[size]}
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
