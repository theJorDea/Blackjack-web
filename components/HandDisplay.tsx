import React, { useState, useEffect, useRef } from 'react';
import { Card, GamePhase } from '../types';
import CardView from './CardView';

interface HandDisplayProps {
  title: string;
  hand: Card[];
  score: number;
  isDealer?: boolean;
  gamePhase?: GamePhase; 
  isPlayerTurn?: boolean; // To potentially highlight active hand
}

const HandDisplay: React.FC<HandDisplayProps> = ({ title, hand, score, isDealer = false, gamePhase, isPlayerTurn }) => {
  const showScore = !isDealer || gamePhase === GamePhase.DEALER_TURN || gamePhase === GamePhase.GAME_OVER || (hand.length > 0 && !hand.some(c => c.hidden));
  const handContainerClasses = `my-3 p-3 sm:p-4 bg-slate-700/70 rounded-lg shadow-inner w-full ${isPlayerTurn ? 'ring-2 ring-cyan-400' : ''}`;

  const [isScoreAnimating, setIsScoreAnimating] = useState(false);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    if (prevScoreRef.current !== score && score > 0 && showScore) {
      setIsScoreAnimating(true);
    }
    prevScoreRef.current = score;
  }, [score, showScore]);

  const handleScoreAnimationEnd = () => {
    setIsScoreAnimating(false);
  };

  return (
    <div className={handContainerClasses} aria-label={`${title} - Score: ${showScore && score > 0 ? score : 'Hidden'}`}>
      <h2 className="text-lg sm:text-xl font-semibold mb-2 text-center text-cyan-300">{title}</h2>
      <div className="flex justify-center items-start space-x-[-25px] sm:space-x-[-35px] min-h-[10rem] sm:min-h-[12rem] py-2 overflow-x-auto px-2 sm:px-4 perspective">
        {hand.length === 0 ? (
          <CardView card={null} isAnimated={false} />
        ) : (
          hand.map((card, index) => (
            <div 
              key={index} 
              className="transform transition-transform duration-300 hover:scale-105 hover:z-10"
              // Staggering handled by CardView's animationDelay prop
            >
               <CardView card={card} isAnimated={true} animationDelay={`${index * 100}ms`} />
            </div>
          ))
        )}
      </div>
      { (showScore || (isDealer && score > 0 && gamePhase !== GamePhase.PLAYER_TURN && gamePhase !== GamePhase.BETTING && gamePhase !== GamePhase.IDLE)) && (
        <p className="text-center mt-2 text-md font-medium text-slate-200">
          Score: <span 
                    className={`text-yellow-400 font-bold inline-block ${isScoreAnimating ? 'score-pulse-animation' : ''}`}
                    onAnimationEnd={handleScoreAnimationEnd}
                  >
                    {score > 0 ? score : ''}
                  </span>
          {score > 21 && <span className="text-red-400 ml-2 font-semibold">(Bust!)</span>}
        </p>
      )}
    </div>
  );
};

export default HandDisplay;