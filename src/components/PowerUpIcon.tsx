import React from 'react';
import {
  RotateCw,
  RotateCcw,
  FlipVertical2,
  Zap,
  Shuffle,
  RefreshCw,
} from 'lucide-react';
import { PowerUpId } from '../types/game';

interface PowerUpIconProps {
  id: PowerUpId;
  className?: string;
}

export const PowerUpIcon: React.FC<PowerUpIconProps> = ({ id, className = 'w-5 h-5' }) => {
  switch (id) {
    case 'nudge_forward':
      return <RotateCw className={className} />;
    case 'nudge_backward':
      return <RotateCcw className={className} />;
    case 'invert':
      return <FlipVertical2 className={className} />;
    case 'double':
      return <Zap className={className} />;
    case 'shuffle':
      return <Shuffle className={className} />;
    case 'respin':
      return <RefreshCw className={className} />;
  }
};
