
import { Card, Suit, Rank } from '../types';
import { RANK_ORDER, ACE_HIGH_VALUE, ACE_LOW_VALUE, FACE_CARD_VALUE, BLACKJACK_VALUE } from '../constants';

export function createDeck(): Card[] {
  const allSuits = Object.values(Suit);
  const allRanks = RANK_ORDER;
  const shoe: Card[] = [];
  const numberOfDecks = 4;

  for (let i = 0; i < numberOfDecks; i++) {
    for (const suit of allSuits) {
      for (const rank of allRanks) {
        shoe.push({ suit, rank, hidden: false });
      }
    }
  }
  // The 'shoe' now contains 208 cards (4 decks * 52 cards/deck).
  // Each card instance is a new object.
  // Example distributions:
  // - Each suit (Hearts, Diamonds, Clubs, Spades) appears 13 (ranks) * 4 (decks) = 52 times.
  // - Each rank (Ace, King, Two, etc.) appears 4 (suits) * 4 (decks) = 16 times.
  // This ensures the correct composition for a 4-deck shoe without unintended repetition of specific suit/rank combinations beyond what's standard.
  return shoe;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffledDeck = [...deck];
  for (let i = shuffledDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
  }
  return shuffledDeck;
}

export function calculateHandValue(hand: Card[]): number {
  if (!hand) return 0;
  let value = 0;
  let aceCount = 0;

  const liveHand = hand.filter(card => !card.hidden);
  if (liveHand.length === 0 && hand.length > 0 && hand.every(c => c.hidden)) return 0; // All hidden, score is effectively 0 for display
  if (liveHand.length === 0) return 0;


  for (const card of liveHand) {
    if (card.rank === Rank.Ace) {
      aceCount++;
      value += ACE_HIGH_VALUE;
    } else if (card.rank === Rank.King || card.rank === Rank.Queen || card.rank === Rank.Jack) {
      value += FACE_CARD_VALUE;
    } else {
      value += parseInt(card.rank, 10);
    }
  }

  while (value > BLACKJACK_VALUE && aceCount > 0) {
    value -= (ACE_HIGH_VALUE - ACE_LOW_VALUE);
    aceCount--;
  }
  return value;
}

export function dealCardFromDeck(currentDeck: Card[]): { card: Card, newDeck: Card[] } {
  if (currentDeck.length === 0) throw new Error("Deck is empty, cannot deal card.");
  const deckCopy = [...currentDeck];
  const card = deckCopy.pop()!; // Assert non-null as we checked length
  return { card, newDeck: deckCopy };
}

export function isBlackjack(hand: Card[], score: number): boolean {
  return hand.length === 2 && score === BLACKJACK_VALUE;
}
