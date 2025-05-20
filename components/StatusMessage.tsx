import React from 'react';
import { GamePhase } from '../types';

interface StatusMessageProps {
  message: string;
  gamePhase: GamePhase;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, gamePhase }) => {
  let textColor = "text-slate-100";
  if (message.toLowerCase().includes("win") || message.toLowerCase().includes("blackjack!")) {
    textColor = "text-green-400";
  } else if (message.toLowerCase().includes("lose") || message.toLowerCase().includes("bust")) {
    textColor = "text-red-400";
  } else if (message.toLowerCase().includes("push")) {
    textColor = "text-yellow-400";
  }

  return (
    <div className="my-3 p-3 bg-slate-700/80 rounded-md shadow min-h-[3rem] flex items-center justify-center w-full max-w-md mx-auto animate-fade-in-up"
      role="status"
      aria-live="polite"
    >
      <p className={`text-center text-md font-semibold ${textColor}`}>
        {message || (gamePhase === GamePhase.IDLE ? "Place your bet to start!" : "...")}
      </p>
    </div>
  );
};

export default StatusMessage;