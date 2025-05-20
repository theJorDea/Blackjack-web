import React from 'react';
import { Card } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../constants';

interface CardViewProps {
  card: Card | null;
  isAnimated?: boolean; // To apply deal animation
  animationDelay?: string; // Stagger animation
}

const CardView: React.FC<CardViewProps> = ({ card, isAnimated = false, animationDelay = '0s' }) => {
  const animationClass = isAnimated ? 'card-deal' : '';
  const style = isAnimated ? { animationDelay } : {};

  if (!card) {
    return (
      <div 
        className={`w-20 h-28 sm:w-24 sm:h-36 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center shadow-sm ${animationClass}`}
        style={style}
        aria-hidden="true"
      >
        {/* Placeholder for an empty card slot */}
      </div>
    );
  }

  if (card.hidden) {
    return (
      <div 
        className={`w-20 h-28 sm:w-24 sm:h-36 bg-slate-600 rounded-lg border-2 border-slate-500 flex items-center justify-center shadow-md p-2 ${animationClass}`}
        style={style}
      >
        <div className="w-full h-full border-2 border-slate-400 rounded-md flex items-center justify-center">
          <span className="text-slate-300 font-semibold text-xs tracking-wider">BLACKJACK</span>
        </div>
      </div>
    );
  }

  const suitColorClass = SUIT_COLORS[card.suit] || 'text-black';
  const suitSymbol = SUIT_SYMBOLS[card.suit] || '?';

  return (
    <div 
      className={`w-20 h-28 sm:w-24 sm:h-36 bg-white rounded-lg border border-slate-300 shadow-xl p-1.5 sm:p-2 flex flex-col justify-between items-center select-none ${animationClass}`}
      style={style}
      role="img"
      aria-label={`${card.rank} of ${card.suit}`}
    >
      <div className={`self-start font-bold text-lg sm:text-xl ${suitColorClass}`}>
        <span className="block leading-none">{card.rank}</span>
        <span className="block leading-none -mt-1">{suitSymbol}</span>
      </div>
      <div className={`text-3xl sm:text-4xl ${suitColorClass} opacity-80`}>
        {suitSymbol}
      </div>
      <div className={`self-end font-bold text-lg sm:text-xl ${suitColorClass} transform rotate-180`}>
        <span className="block leading-none">{card.rank}</span>
        <span className="block leading-none -mt-1">{suitSymbol}</span>
      </div>
    </div>
  );
};

export default CardView;