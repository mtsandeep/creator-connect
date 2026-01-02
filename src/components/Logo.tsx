// ============================================
// LOGO COMPONENT
// ============================================

import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

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
      text: 'text-2xl',
    },
    lg: {
      image: 'h-10',
      text: 'text-5xl',
    },
  };

  const config = sizeConfig[size];

  const logoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={logo} alt="ColLoved" className={config.image} />
      {showText && (
        <span className={`${config.text} font-bold tracking-tighter`}>
          <span className="text-white">Col</span>
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
