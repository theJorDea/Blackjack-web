
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, GamePhase, DealerCommentSituation } from './types';
import { createDeck, shuffleDeck, calculateHandValue, dealCardFromDeck, isBlackjack } from './services/gameLogic';
import { fetchDealerComment, isGeminiEnabled } from './services/geminiService';
import HandDisplay from './components/HandDisplay';
import GameControls from './components/GameControls';
import StatusMessage from './components/StatusMessage';
import DealerCommentBox from './components/DealerCommentBox';
import { 
  DEALER_STAND_MINIMUM, 
  BLACKJACK_VALUE, 
  DEALER_DRAW_DELAY_MS,
  INITIAL_CHIPS_AMOUNT,
  DEFAULT_BET_AMOUNT,
  MINIMUM_BET_AMOUNT,
  BLACKJACK_PAYOUT_MULTIPLIER
} from './constants';

// Helper for animation delay
const createAnimatedCard = (card: Card, delayIndex: number): Card => ({
  ...card,
  animationDelay: `${delayIndex * 100}ms`
});

const App: React.FC = () => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [dealerScore, setDealerScore] = useState<number>(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.IDLE);
  const [message, setMessage] = useState<string>("");
  const [dealerComment, setDealerComment] = useState<string>("");
  const [isDealerCommentLoading, setIsDealerCommentLoading] = useState<boolean>(false);
  const [isDealing, setIsDealing] = useState<boolean>(false); // For disabling controls during card animations

  const [playerChips, setPlayerChips] = useState<number>(INITIAL_CHIPS_AMOUNT);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [betAmountInput, setBetAmountInput] = useState<string>(DEFAULT_BET_AMOUNT.toString());

  const [canDoubleDown, setCanDoubleDown] = useState<boolean>(false);
  const [showDealerComments, setShowDealerComments] = useState<boolean>(true);

  const [statusMessageKey, setStatusMessageKey] = useState<number>(0);
  const [dealerCommentKey, setDealerCommentKey] = useState<number>(0);


  // Refs to get latest values in callbacks without re-triggering effects
  const playerHandRef = useRef(playerHand);
  const dealerHandRef = useRef(dealerHand);
  const playerScoreRef = useRef(playerScore);
  const dealerScoreRef = useRef(dealerScore);
  const playerChipsRef = useRef(playerChips);
  const currentBetRef = useRef(currentBet);
  const deckRef = useRef(deck);

  useEffect(() => { playerHandRef.current = playerHand; }, [playerHand]);
  useEffect(() => { dealerHandRef.current = dealerHand; }, [dealerHand]);
  useEffect(() => { playerScoreRef.current = playerScore; }, [playerScore]);
  useEffect(() => { dealerScoreRef.current = dealerScore; }, [dealerScore]);
  useEffect(() => { playerChipsRef.current = playerChips; }, [playerChips]);
  useEffect(() => { currentBetRef.current = currentBet; }, [currentBet]);
  useEffect(() => { deckRef.current = deck; }, [deck]);

  const updateMessage = useCallback((newMessage: string) => {
    setMessage(newMessage);
    setStatusMessageKey(prevKey => prevKey + 1);
  }, []);

  const updateDealerComment = useCallback((newComment: string) => {
    setDealerComment(newComment);
    setDealerCommentKey(prevKey => prevKey + 1);
  }, []);

  const getDealerCommentAsync = useCallback(async (situation: DealerCommentSituation, betOverride?: number) => {
    if (!isGeminiEnabled() || !showDealerComments) {
      updateDealerComment(""); // Clear any existing comment if disabled
      return;
    }
    setIsDealerCommentLoading(true);
    try {
      const effectiveBet = betOverride !== undefined ? betOverride : currentBetRef.current;
      const comment = await fetchDealerComment(situation, playerScoreRef.current, dealerScoreRef.current, effectiveBet, playerChipsRef.current);
      updateDealerComment(comment);
    } catch (error) {
      console.error("Failed to fetch dealer comment:", error);
      updateDealerComment("Dealer's taking a quick break...");
    } finally {
      setIsDealerCommentLoading(false);
    }
  }, [showDealerComments, updateDealerComment]); 

  const initializeGame = useCallback((isFullRestart: boolean = true) => {
    if (isFullRestart) {
      setPlayerChips(INITIAL_CHIPS_AMOUNT);
      setBetAmountInput(DEFAULT_BET_AMOUNT.toString());
      updateMessage("Welcome to Modern Blackjack! Place your bet.");
      setGamePhase(GamePhase.IDLE);
      getDealerCommentAsync("new_round_welcome");
    } else { 
      updateMessage(`Place your bet. Chips: ${playerChipsRef.current}`); 
      setGamePhase(GamePhase.BETTING);
       getDealerCommentAsync("betting_phase_start");
    }
    setDeck(shuffleDeck(createDeck()));
    setPlayerHand([]);
    setDealerHand([]);
    setPlayerScore(0);
    setDealerScore(0);
    setCurrentBet(0);
    setCanDoubleDown(false);
    if (!isFullRestart) updateDealerComment("");
  }, [getDealerCommentAsync, updateMessage, updateDealerComment]);

  useEffect(() => {
    initializeGame(true);
  }, [initializeGame]);

  const handlePlaceBetAndDeal = useCallback(async () => {
    const betVal = parseInt(betAmountInput);
    if (isNaN(betVal) || betVal < MINIMUM_BET_AMOUNT) {
      updateMessage(`Minimum bet is ${MINIMUM_BET_AMOUNT}.`);
      getDealerCommentAsync("player_attempts_bet_too_low", betVal);
      return;
    }
    if (betVal > playerChipsRef.current) {
      updateMessage("Not enough chips for that bet.");
      getDealerCommentAsync("player_attempts_bet_too_high", betVal);
      return;
    }

    setPlayerChips(prev => prev - betVal);
    setCurrentBet(betVal);
    setIsDealing(true);
    setPlayerHand([]);
    setDealerHand([]);
    updateMessage("Dealing...");
    updateDealerComment(""); 
    setCanDoubleDown(false);

    let mutableDeck = deckRef.current.length < 10 ? shuffleDeck(createDeck()) : [...deckRef.current];
    
    const tempPlayerHand: Card[] = [];
    const tempDealerHand: Card[] = [];
    let dealResult;

    // Card 1 (Player)
    dealResult = dealCardFromDeck(mutableDeck);
    tempPlayerHand.push(createAnimatedCard(dealResult.card, 0));
    mutableDeck = dealResult.newDeck;
    setPlayerHand([...tempPlayerHand]); 
    await new Promise(r => setTimeout(r, 200));

    // Card 2 (Dealer)
    dealResult = dealCardFromDeck(mutableDeck);
    tempDealerHand.push(createAnimatedCard(dealResult.card, 0));
    mutableDeck = dealResult.newDeck;
    setDealerHand([...tempDealerHand]); 
    await new Promise(r => setTimeout(r, 200));

    // Card 3 (Player)
    dealResult = dealCardFromDeck(mutableDeck);
    tempPlayerHand.push(createAnimatedCard(dealResult.card, 1));
    mutableDeck = dealResult.newDeck;
    setPlayerHand([...tempPlayerHand]); 
    await new Promise(r => setTimeout(r, 200));

    // Card 4 (Dealer - Hidden)
    dealResult = dealCardFromDeck(mutableDeck);
    tempDealerHand.push(createAnimatedCard({ ...dealResult.card, hidden: true }, 1));
    mutableDeck = dealResult.newDeck;
    setDealerHand([...tempDealerHand]); 
    await new Promise(r => setTimeout(r, 200));

    setDeck(mutableDeck); // Update the deck state with the truly depleted deck

    const pScore = calculateHandValue(tempPlayerHand);
    const dVisibleScore = calculateHandValue(tempDealerHand.map((c, idx) => (idx === 0 ? {...c, hidden: false} : c) ));
    setPlayerScore(pScore);
    setDealerScore(dVisibleScore); 

    setIsDealing(false);
    getDealerCommentAsync("game_start", betVal);

    if (isBlackjack(tempPlayerHand, pScore)) {
      const revealedDealerHand = tempDealerHand.map(c => ({ ...c, hidden: false }));
      setDealerHand(revealedDealerHand.map((card, idx) => createAnimatedCard(card, idx))); // Animate reveal
      const finalDScore = calculateHandValue(revealedDealerHand);
      setDealerScore(finalDScore);

      if (isBlackjack(revealedDealerHand, finalDScore)) {
        updateMessage("Push! Both Blackjack.");
        setPlayerChips(prev => prev + betVal); 
        getDealerCommentAsync("push", betVal);
      } else {
        updateMessage(`Blackjack! You win ${betVal * BLACKJACK_PAYOUT_MULTIPLIER} chips!`);
        setPlayerChips(prev => prev + betVal + (betVal * BLACKJACK_PAYOUT_MULTIPLIER));
        getDealerCommentAsync("player_blackjack_deal", betVal);
      }
      setGamePhase(GamePhase.GAME_OVER);
    } else {
      const revealedDealerHandCheck = tempDealerHand.map(c => ({ ...c, hidden: false }));
      const dealerNaturalScore = calculateHandValue(revealedDealerHandCheck);
      if (isBlackjack(revealedDealerHandCheck, dealerNaturalScore)) {
          setDealerHand(revealedDealerHandCheck.map((card, idx) => createAnimatedCard(card, idx))); // Animate reveal
          setDealerScore(dealerNaturalScore);
          updateMessage(`Dealer Blackjack! You lose ${betVal} chips.`);
          getDealerCommentAsync("dealer_blackjack", betVal);
          setGamePhase(GamePhase.GAME_OVER);
      } else {
          setGamePhase(GamePhase.PLAYER_TURN);
          updateMessage("Your turn. Hit, Stand, or Double Down?");
          if (playerChipsRef.current >= betVal && tempPlayerHand.length === 2) { 
            setCanDoubleDown(true);
          }
      }
    }
  }, [betAmountInput, getDealerCommentAsync, updateMessage, updateDealerComment]);


  const handleHit = useCallback(() => {
    if (deckRef.current.length === 0) { 
        let newFreshDeck = shuffleDeck(createDeck());
        setDeck(newFreshDeck); 
        deckRef.current = newFreshDeck; // Update ref immediately for current operation
    }
    
    setIsDealing(true); 
    const { card, newDeck } = dealCardFromDeck(deckRef.current);
    const newPlayerHand = [...playerHandRef.current, createAnimatedCard(card, playerHandRef.current.length)];
    
    setPlayerHand(newPlayerHand);
    setDeck(newDeck);
    setCanDoubleDown(false); 

    const newPlayerScore = calculateHandValue(newPlayerHand);
    setPlayerScore(newPlayerScore);
    
    setTimeout(() => setIsDealing(false), 200); 

    if (newPlayerScore > BLACKJACK_VALUE) {
      updateMessage(`Bust! You lose ${currentBetRef.current} chips.`);
      setGamePhase(GamePhase.GAME_OVER);
      getDealerCommentAsync("player_bust");
    } else if (newPlayerScore === BLACKJACK_VALUE) {
      updateMessage("21! Dealer's turn.");
      getDealerCommentAsync("player_hit_blackjack");
      setGamePhase(GamePhase.DEALER_TURN);
    } else {
      updateMessage("Hit or Stand?");
      getDealerCommentAsync("player_hit_safe");
    }
  }, [getDealerCommentAsync, updateMessage]);

  const handleStand = useCallback(() => {
    setGamePhase(GamePhase.DEALER_TURN);
    updateMessage("Dealer's turn...");
    setCanDoubleDown(false);
    getDealerCommentAsync("player_stands");
  }, [getDealerCommentAsync, updateMessage]);

  const handleDoubleDown = useCallback(async () => {
    if (!canDoubleDown || playerChipsRef.current < currentBetRef.current) {
      updateMessage("Cannot Double Down.");
      return;
    }
    setIsDealing(true);
    
    const betToDouble = currentBetRef.current;
    setPlayerChips(prev => prev - betToDouble); 
    const newTotalBet = betToDouble * 2;
    setCurrentBet(newTotalBet);
    
    if (deckRef.current.length === 0) { 
        let newFreshDeck = shuffleDeck(createDeck());
        setDeck(newFreshDeck); 
        deckRef.current = newFreshDeck; // Update ref immediately
    }
    const { card, newDeck } = dealCardFromDeck(deckRef.current);
    const newPlayerHand = [...playerHandRef.current, createAnimatedCard(card, playerHandRef.current.length)];
    
    setPlayerHand(newPlayerHand);
    setDeck(newDeck);
    setCanDoubleDown(false);

    const newPlayerScore = calculateHandValue(newPlayerHand);
    setPlayerScore(newPlayerScore);
    
    getDealerCommentAsync("player_doubles_down", newTotalBet);
    await new Promise(r => setTimeout(r, 300)); 

    setIsDealing(false);

    if (newPlayerScore > BLACKJACK_VALUE) {
      updateMessage(`Bust after Doubling! You lose ${newTotalBet} chips.`);
      setGamePhase(GamePhase.GAME_OVER);
    } else {
      updateMessage(`Doubled to ${newPlayerScore}. Dealer's turn.`);
      setGamePhase(GamePhase.DEALER_TURN);
    }
  }, [canDoubleDown, getDealerCommentAsync, updateMessage]);
  
  const determineWinner = useCallback((finalPlayerScore: number, finalDealerScore: number) => {
    const bet = currentBetRef.current; 
    if (finalPlayerScore > BLACKJACK_VALUE) { 
      updateMessage(`Bust! You lose ${bet} chips.`);
      // player_bust comment already handled in handleHit or handleDoubleDown
    } else if (finalDealerScore > BLACKJACK_VALUE) {
      updateMessage(`Dealer Busts! You Win ${bet} chips!`);
      setPlayerChips(prev => prev + bet * 2); 
      getDealerCommentAsync("dealer_busts", bet);
    } else if (finalPlayerScore > finalDealerScore) {
      updateMessage(`You Win ${bet} chips!`);
      setPlayerChips(prev => prev + bet * 2);
      getDealerCommentAsync("win_player", bet);
    } else if (finalDealerScore > finalPlayerScore) {
      updateMessage(`Dealer Wins! You lose ${bet} chips.`);
      getDealerCommentAsync("win_dealer", bet);
    } else { 
      updateMessage("Push! Bet returned.");
      setPlayerChips(prev => prev + bet); 
      getDealerCommentAsync("push", bet);
    }
    setGamePhase(GamePhase.GAME_OVER);
  }, [getDealerCommentAsync, updateMessage]);

  useEffect(() => {
    if (gamePhase === GamePhase.DEALER_TURN) {
      const playDealerTurn = async () => {
        setIsDealing(true); 
        let currentDealerHandInternal: Card[] = dealerHandRef.current.map((cardFromHand, idx) => 
            createAnimatedCard({ ...cardFromHand, hidden: false }, idx)
        );
        setDealerHand([...currentDealerHandInternal]); 
        
        let dScore = calculateHandValue(currentDealerHandInternal);
        setDealerScore(dScore);
        await new Promise(resolve => setTimeout(resolve, DEALER_DRAW_DELAY_MS / 2));
        
        if (!dealerComment && playerScoreRef.current <= BLACKJACK_VALUE) { // Check dealerComment directly
             getDealerCommentAsync("dealer_turn_start");
        }
        
        let currentDeckForDealer = [...deckRef.current]; 
        dScore = calculateHandValue(currentDealerHandInternal); 

        while (dScore < DEALER_STAND_MINIMUM) {
          await new Promise(resolve => setTimeout(resolve, DEALER_DRAW_DELAY_MS));
          if (currentDeckForDealer.length === 0) { 
              currentDeckForDealer = shuffleDeck(createDeck()); 
          }

          const { card, newDeck } = dealCardFromDeck(currentDeckForDealer);
          currentDeckForDealer = newDeck;
          currentDealerHandInternal = [...currentDealerHandInternal, createAnimatedCard(card, currentDealerHandInternal.length)];
          setDealerHand([...currentDealerHandInternal]); 
          
          dScore = calculateHandValue(currentDealerHandInternal);
          setDealerScore(dScore); 
          getDealerCommentAsync("dealer_hits");

          if (dScore > BLACKJACK_VALUE) break;
        }
        setDeck(currentDeckForDealer); 
        setIsDealing(false); 
        determineWinner(playerScoreRef.current, dScore);
      };
      playDealerTurn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase, determineWinner, getDealerCommentAsync, dealerComment]); // Added dealerComment to dep array for the conditional getDealerCommentAsync("dealer_turn_start")

  useEffect(() => {
    if (gamePhase === GamePhase.GAME_OVER) {
      if (playerChipsRef.current < MINIMUM_BET_AMOUNT && playerChipsRef.current > 0) {
        updateMessage(`Not enough chips for minimum bet. Game Over. Final Chips: ${playerChipsRef.current}`);
        getDealerCommentAsync("player_out_of_chips_game_over");
      } else if (playerChipsRef.current <= 0) {
         updateMessage(`Game Over! You're out of chips. Restart to play again. Final Chips: 0`);
         getDealerCommentAsync("player_out_of_chips_game_over");
      }
    }
  }, [gamePhase, getDealerCommentAsync, updateMessage]);


  const handleNextRound = () => initializeGame(false);
  const handleRestartGame = () => initializeGame(true);
  const toggleDealerComments = () => setShowDealerComments(prev => !prev);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-start pt-4 sm:pt-8 px-2 selection:bg-teal-500/70 selection:text-white">
      <div className="bg-slate-800 p-3 sm:p-6 rounded-xl shadow-2xl w-full max-w-3xl">
        <header className="text-center mb-4 sm:mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 tracking-tight" style={{textShadow: '1px 1px 0px #0f172a'}}>
            Modern Blackjack
          </h1>
          <div className="mt-2 text-xl sm:text-2xl font-semibold text-slate-100">
            Player Chips: <span className="text-yellow-400">{playerChips}</span>
          </div>
           {(gamePhase === GamePhase.PLAYER_TURN || gamePhase === GamePhase.DEALER_TURN || gamePhase === GamePhase.GAME_OVER) && currentBet > 0 && (
            <div className="mt-1 text-md text-slate-300">
              Current Bet: <span className="text-yellow-400">{currentBet}</span>
            </div>
          )}
        </header>

        <main className="space-y-4 sm:space-y-5">
          <HandDisplay title="Dealer's Hand" hand={dealerHand} score={dealerScore} isDealer={true} gamePhase={gamePhase} />
          <HandDisplay title="Player's Hand" hand={playerHand} score={playerScore} gamePhase={gamePhase} isPlayerTurn={gamePhase === GamePhase.PLAYER_TURN} />
          
          <StatusMessage key={`status-${statusMessageKey}`} message={message} gamePhase={gamePhase} />
          
          {showDealerComments && isGeminiEnabled() && <DealerCommentBox key={`comment-${dealerCommentKey}`} comment={dealerComment} isLoading={isDealerCommentLoading} />}

          <GameControls
            gamePhase={gamePhase}
            onPlaceBetAndDeal={handlePlaceBetAndDeal}
            onHit={handleHit}
            onStand={handleStand}
            onDoubleDown={handleDoubleDown}
            onNextRound={handleNextRound}
            onRestartGame={handleRestartGame}
            isDealing={isDealing}
            betAmountInput={betAmountInput}
            onBetAmountChange={setBetAmountInput}
            playerChips={playerChips}
            canAffordMinimumBet={playerChips >= MINIMUM_BET_AMOUNT}
            canDoubleDown={canDoubleDown}
          />
        </main>
        <footer className="text-center mt-6 sm:mt-8 text-xs text-slate-400 space-y-1">
            <p>&copy; {new Date().getFullYear()} Minimalist Blackjack. Play Responsibly.</p>
            {isGeminiEnabled() ? 
              (
                <button 
                  onClick={toggleDealerComments} 
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-cyan-300 transition-colors"
                  aria-pressed={showDealerComments}
                >
                  {showDealerComments ? 'Hide' : 'Show'} Dealer Comments
                </button>
              ) : 
              <p>Dealer commentary (Gemini API) is unavailable.</p>
            }
        </footer>
      </div>
    </div>
  );
};

export default App;