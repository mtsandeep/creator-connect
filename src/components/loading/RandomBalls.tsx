import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Ball {
  id: number;
  size: number;
  color: string;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
  initialX: number;
  initialY: number;
  moveX: number;
  moveY: number;
  scale: number;
}

interface RandomBallsProps {
  count?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  minDuration?: number;
  maxDuration?: number;
  className?: string;
}

export default function RandomBalls({ 
  count = 24,
  colors = ['#f58529', '#dd2a7b', '#8134af'],
  minSize = 6,
  maxSize = 20,
  minDuration = 3,
  maxDuration = 6,
  className = ''
}: RandomBallsProps) {
  const [balls, setBalls] = useState<Ball[]>([]);

  useEffect(() => {
    const generateRandomBalls = (): Ball[] => {
      const newBalls: Ball[] = [];
      
      for (let i = 0; i < count; i++) {
        // Create a grid-like distribution for more predictable appearance
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        // Calculate position with some randomness but structured
        const xStep = 100 / cols;
        const yStep = 100 / rows;
        const initialX = (col + 0.5) * xStep + (Math.random() - 0.5) * 10; // Add small randomness
        const initialY = (row + 0.5) * yStep + (Math.random() - 0.5) * 10; // Add small randomness
        
        newBalls.push({
          id: i,
          size: Math.random() * (maxSize - minSize) + minSize,
          color: colors[Math.floor(Math.random() * colors.length)],
          x: initialX,
          y: initialY,
          duration: Math.random() * (maxDuration - minDuration) + minDuration,
          delay: (i * 0.05) + Math.random() * 0.2, // Faster staggered appearance
          opacity: Math.random() * 0.4 + 0.6,
          initialX,
          initialY,
          moveX: (Math.random() - 0.5) * 60, // -30 to 30px movement
          moveY: (Math.random() - 0.5) * 60, // -30 to 30px movement
          scale: 0.8 + Math.random() * 0.4, // 0.8-1.2 scale
        });
      }
      
      return newBalls;
    };

    setBalls(generateRandomBalls());
  }, [count, colors, minSize, maxSize, minDuration, maxDuration]);

  return (
    <motion.div 
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ left: 0, top: 0, right: 0, bottom: 0 }}
    >
      {balls.map((ball) => (
        <motion.div
          key={ball.id}
          className="rounded-full absolute"
          style={{
            width: `${ball.size}px`,
            height: `${ball.size}px`,
            backgroundColor: ball.color,
            left: `${ball.initialX}%`,
            top: `${ball.initialY}%`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ scale: 1, opacity: 1 }}
          animate={{
            x: [0, ball.moveX, -ball.moveX, 0],
            y: [0, ball.moveY, -ball.moveY, 0],
            scale: [1, ball.scale, ball.scale, 1],
            opacity: [ball.opacity, ball.opacity * 0.5, ball.opacity * 0.8, ball.opacity],
          }}
          transition={{
            duration: ball.duration,
            repeat: Infinity,
            delay: ball.delay,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 1.1 }}
        />
      ))}
    </motion.div>
  );
}
