// ============================================
// LOGO COMPONENT
// ============================================

import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const Logo = ({ size = 'md', showText = true, className = '', onClick }: LogoProps) => {
  const sizeConfig = {
    sm: {
      image: 'h-6',
      text: 'text-xl',
    },
    md: {
      image: 'h-8',
      text: 'text-3xl',
    },
    lg: {
      image: 'h-9',
      text: 'text-4xl',
    },
  };

  const config = sizeConfig[size];

  const logoContent = (
    <div className={`flex items-end justify-center gap-2 ${className}`}>
      <img
        src={logo}
        alt="ColLoved"
        className={`${config.image} object-contain`}
        style={{ imageRendering: 'auto' }}
      />
      {showText && (
        <span
          className={`${config.text} tracking-tight flex items-center`}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <span className="text-white font-normal">Col</span>
          <span className="bg-gradient-to-r from-[#00D9FF] to-[#B8FF00] bg-clip-text text-transparent font-black">
            Loved
          </span>
        </span>
      )}
    </div>
  );

  if (onClick) {
    return <Link to="/" onClick={onClick}>{logoContent}</Link>;
  }

  return logoContent;
};

export default Logo;
