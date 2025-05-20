import React from 'react';
import { GamePhase } from '../types';
import { MINIMUM_BET_AMOUNT } from '../constants';

interface GameControlsProps {
  gamePhase: GamePhase;
  onPlaceBetAndDeal: () => void;
  onHit: () => void;
  onStand: () => void;
  onDoubleDown: () => void;
  onNextRound: () => void;
  onRestartGame: () => void;
  isDealing?: boolean;
  betAmountInput: string;
  onBetAmountChange: (value: string) => void;
  playerChips: number;
  canAffordMinimumBet: boolean;
  canDoubleDown: boolean; // New prop for Double Down eligibility
}

const baseButtonClass = "w-full sm:w-auto px-5 py-2.5 rounded-md font-semibold text-sm text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 shadow-md hover:shadow-lg transform disabled:transform-none hover:disabled:transform-none hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed";

const ActionButton: React.FC<{ onClick: () => void; disabled: boolean; label: string; className?: string; 'aria-label'?: string, variant?: 'primary' | 'secondary' | 'warning' }> = 
  ({ onClick, disabled, label, className = '', 'aria-label': ariaLabel, variant = 'primary' }) => {
  
  let colorClass = '';
  switch(variant) {
    case 'primary': colorClass = 'bg-teal-500 hover:bg-teal-600 focus:ring-teal-500'; break;
    case 'secondary': colorClass = 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-500'; break;
    case 'warning': colorClass = 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500'; break;
    default: colorClass = 'bg-teal-500 hover:bg-teal-600 focus:ring-teal-500';
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseButtonClass} ${colorClass} ${className}`}
      aria-label={ariaLabel || label}
    >
      {label}
    </button>
  );
};


const GameControls: React.FC<GameControlsProps> = ({ 
  gamePhase, 
  onPlaceBetAndDeal, 
  onHit, 
  onStand,
  onDoubleDown,
  onNextRound,
  onRestartGame,
  isDealing,
  betAmountInput,
  onBetAmountChange,
  playerChips,
  canAffordMinimumBet,
  canDoubleDown
}) => {
  const showBettingUI = gamePhase === GamePhase.IDLE || gamePhase === GamePhase.BETTING;
  const playerTurnPhase = gamePhase === GamePhase.PLAYER_TURN;
  const gameOverPhase = gamePhase === GamePhase.GAME_OVER;

  const handleBetInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === '' || (/^\d+$/.test(value) && !(value.length > 1 && value.startsWith('0')))) {
        onBetAmountChange(value);
    }
  };

  const betInputValid = parseInt(betAmountInput) >= MINIMUM_BET_AMOUNT && parseInt(betAmountInput) <= playerChips;

  return (
    <div className="flex flex-col items-center space-y-4 my-5 p-3">
      { showBettingUI && (
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3 w-full max-w-xs sm:max-w-sm animate-fade-in-up">
          <label htmlFor="betAmount" className="sr-only">Bet Amount</label>
          <input 
            type="text"
            id="betAmount"
            value={betAmountInput}
            onChange={handleBetInputChange}
            placeholder={`Min ${MINIMUM_BET_AMOUNT}`}
            className="px-4 py-2.5 rounded-md bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none w-full sm:w-32 flex-grow text-center text-lg transition-colors duration-200"
            aria-label={`Enter bet amount, your chips: ${playerChips}`}
            pattern="\d*"
            inputMode="numeric"
            disabled={isDealing}
          />
          <ActionButton
            onClick={onPlaceBetAndDeal}
            disabled={isDealing || !betAmountInput || !betInputValid}
            label="Place Bet & Deal"
            variant="primary"
            aria-label="Place your bet and start the deal"
          />
        </div>
      )}

      { playerTurnPhase && (
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          <ActionButton
            onClick={onHit}
            disabled={isDealing || false}
            label="Hit"
            variant="primary"
            aria-label="Request another card"
          />
          <ActionButton
            onClick={onStand}
            disabled={isDealing || false}
            label="Stand"
            variant="secondary"
            aria-label="Keep your current hand and end your turn"
          />
          {canDoubleDown && (
            <ActionButton
              onClick={onDoubleDown}
              disabled={isDealing || false}
              label="Double Down"
              variant="warning"
              aria-label="Double your bet and receive one more card"
            />
          )}
        </div>
      )}

      { gameOverPhase && (
          <div className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            {canAffordMinimumBet ? (
              <ActionButton
                  onClick={onNextRound}
                  disabled={isDealing || false}
                  label="Next Round"
                  variant="primary"
                  aria-label="Start the next round of Blackjack"
              />
            ) : (
              <ActionButton
                  onClick={onRestartGame}
                  disabled={isDealing || false}
                  label="Restart Game"
                  variant="warning"
                  aria-label="Restart the game with initial chips"
              />
            )}
          </div>
      )}
    </div>
  );
};

export default GameControls;