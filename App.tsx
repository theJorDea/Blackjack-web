import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; // Assuming you have some basic styles

interface Card {
  suit: string;
  rank: string;
  value: number;
  hidden?: boolean;
}

type GameState = 'betting' | 'playerTurn' | 'dealerTurn' | 'gameOver';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = [
  { rank: 'A', value: 11 }, { rank: '2', value: 2 }, { rank: '3', value: 3 },
  { rank: '4', value: 4 }, { rank: '5', value: 5 }, { rank: '6', value: 6 },
  { rank: '7', value: 7 }, { rank: '8', value: 8 }, { rank: '9', value: 9 },
  { rank: '10', value: 10 }, { rank: 'J', value: 10 }, { rank: 'Q', value: 10 },
  { rank: 'K', value: 10 },
];

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rankObj of RANKS) {
      deck.push({ suit, rank: rankObj.rank, value: rankObj.value });
    }
  }
  return deck;
};

const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const calculateScore = (hand: Card[]): number => {
  let score = hand.reduce((sum, card) => sum + (card.hidden ? 0 : card.value), 0);
  let aceCount = hand.filter(card => !card.hidden && card.rank === 'A').length;
  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount--;
  }
  return score;
};

// Simplified HandDisplay component
const HandDisplay: React.FC<{ hand: Card[]; title: string; score?: number }> = ({ hand, title, score }) => (
  <div className="hand">
    <h3>{title}{score !== undefined ? `: ${score}` : ''}</h3>
    <div className="cards">
      {hand.map((card, index) => (
        <div key={index} className={`card ${card.hidden ? 'hidden' : ''}`}>
          {card.hidden ? '?' : `${card.rank}${card.suit}`}
        </div>
      ))}
    </div>
  </div>
);

// Simplified StatusMessage component
const StatusMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="status-message">
    <p>{message}</p>
  </div>
);


const App: React.FC = () => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [dealerScore, setDealerScore] = useState<number>(0);
  const [playerMoney, setPlayerMoney] = useState<number>(1000);
  const [currentBet, setCurrentBet] = useState<number>(10);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [message, setMessage] = useState<string>('Place your bet!');
  const [betPlacedThisRound, setBetPlacedThisRound] = useState<boolean>(false);


  const initializeGame = useCallback((isNewGameRound: boolean, fullRestart: boolean = false) => {
    const newDeck = shuffleDeck(createDeck());
    setDeck(newDeck);
    setPlayerHand([]);
    setDealerHand([]);
    setPlayerScore(0);
    setDealerScore(0);
    setMessage('Place your bet!');
    setGameState('betting');
    if (fullRestart) {
      setPlayerMoney(1000);
      setCurrentBet(10);
    } else if (isNewGameRound) {
        // Keep current bet or reset to default if affordable
        setCurrentBet(prevBet => playerMoney >= prevBet ? prevBet : (playerMoney > 0 ? Math.min(10, playerMoney) : 0));
    }
    setBetPlacedThisRound(false);
  }, [playerMoney]);

  useEffect(() => {
    initializeGame(true, true); // Full restart on initial load
  }, [initializeGame]);

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bet = parseInt(e.target.value, 10);
    if (!isNaN(bet) && bet > 0) {
      setCurrentBet(bet);
    } else if (e.target.value === '') {
      setCurrentBet(0);
    }
  };

  const placeBet = () => {
    if (currentBet <= 0 || currentBet > playerMoney) {
      setMessage('Invalid bet amount.');
      return;
    }

    setPlayerMoney(prevMoney => prevMoney - currentBet);
    setBetPlacedThisRound(true); // Mark bet as placed for this round

    const newDeck = [...deck];
    const pHand: Card[] = [];
    const dHand: Card[] = [];

    pHand.push(newDeck.pop()!);
    dHand.push(newDeck.pop()!);
    pHand.push(newDeck.pop()!);
    dHand.push({ ...newDeck.pop()!, hidden: true }); // Dealer's second card is hidden

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDeck(newDeck);

    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);
    setPlayerScore(pScore);
    setDealerScore(dScore); // Will be incomplete due to hidden card

    setGameState('playerTurn');
    setMessage('Your turn. Hit or Stand?');

    if (pScore === 21) {
      setMessage('Blackjack! You win!');
      setPlayerMoney(prevMoney => prevMoney + currentBet * 2.5); // Blackjack typically pays 3:2
      setGameState('gameOver');
    }
  };

  const handleHit = () => {
    if (gameState !== 'playerTurn' || !deck.length) return;

    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const newPlayerHand = [...playerHand, newCard];
    setPlayerHand(newPlayerHand);
    setDeck(newDeck);

    const newPlayerScore = calculateScore(newPlayerHand);
    setPlayerScore(newPlayerScore);

    if (newPlayerScore > 21) {
      setMessage('Player busts! Dealer wins.');
      setGameState('gameOver');
    } else if (newPlayerScore === 21) {
      // Automatically stand if player hits 21
      handleStand();
    }
  };

  const handleStand = useCallback(() => {
    if (gameState !== 'playerTurn') return;

    setGameState('dealerTurn');
    setMessage("Dealer's turn...");

    let currentDealerHand = dealerHand.map(card => ({ ...card, hidden: false }));
    let currentDealerScore = calculateScore(currentDealerHand);
    let currentDeck = [...deck];

    // Reveal dealer's hidden card
    setDealerHand(currentDealerHand);
    setDealerScore(currentDealerScore);

    // Dealer plays
    while (currentDealerScore < 17 && currentDeck.length > 0) {
      const newCard = currentDeck.pop()!;
      currentDealerHand = [...currentDealerHand, newCard];
      currentDealerScore = calculateScore(currentDealerHand);
      setDealerHand(currentDealerHand); // Update hand for display
      setDealerScore(currentDealerScore); // Update score for display
    }
    setDeck(currentDeck); // Update deck state

    // Determine winner
    if (currentDealerScore > 21) {
      setMessage('Dealer busts! You win!');
      setPlayerMoney(prevMoney => prevMoney + currentBet * 2);
    } else if (playerScore > currentDealerScore) {
      setMessage('You win!');
      setPlayerMoney(prevMoney => prevMoney + currentBet * 2);
    } else if (playerScore < currentDealerScore) {
      setMessage('Dealer wins.');
    } else {
      setMessage('Push! It\'s a tie.');
      setPlayerMoney(prevMoney => prevMoney + currentBet); // Return bet
    }
    setGameState('gameOver');
  }, [gameState, dealerHand, deck, playerScore, currentBet]);


  const handleRestartGame = () => {
    initializeGame(true, true); // Full restart including money
  };
  
  const handleNextRound = () => {
    initializeGame(true, false); // Reset for new round, keep money and potentially bet
  };


  return (
    <div className="app-container">
      <h1>Blackjack</h1>
      <div className="game-info">
        <p>Player Money: ${playerMoney}</p>
        <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>Current Bet: ${currentBet}</p>
      </div>

      <StatusMessage message={message} />

      <div className="hands-container">
        <HandDisplay hand={dealerHand} title="Dealer's Hand" score={gameState === 'gameOver' || gameState === 'dealerTurn' ? dealerScore : calculateScore(dealerHand.filter(c => !c.hidden))} />
        <HandDisplay hand={playerHand} title="Your Hand" score={playerScore} />
      </div>

      <div className="game-controls">
        {gameState === 'betting' && (
          <>
            <label htmlFor="bet-input">Bet Amount:</label>
            <input
              id="bet-input"
              type="number"
              value={currentBet}
              onChange={handleBetChange}
              min="1"
              max={playerMoney}
              disabled={betPlacedThisRound}
            />
            <button onClick={placeBet} disabled={currentBet <= 0 || currentBet > playerMoney || betPlacedThisRound}>
              Place Bet
            </button>
          </>
        )}

        {gameState === 'playerTurn' && (
          <>
            <button onClick={handleHit}>Hit</button>
            <button onClick={handleStand}>Stand</button>
          </>
        )}

        {gameState === 'gameOver' && (
          <button onClick={handleNextRound} disabled={playerMoney <= 0}>
            Next Round
          </button>
        )}
      </div>
      
      <button 
        onClick={handleRestartGame} 
        style={{ backgroundColor: 'red', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', marginTop: '20px', cursor: 'pointer' }}
      >
        Restart Game
      </button>

    </div>
  );
};

export default App;
