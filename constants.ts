
import { Suit, Rank } from './types';

export const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.Hearts]: "♥",
  [Suit.Diamonds]: "♦",
  [Suit.Clubs]: "♣",
  [Suit.Spades]: "♠",
};

export const SUIT_COLORS: Record<Suit, string> = {
  [Suit.Hearts]: "text-red-500",
  [Suit.Diamonds]: "text-red-500",
  [Suit.Clubs]: "text-gray-800", // On a light card, black is better
  [Suit.Spades]: "text-gray-800", // On a light card, black is better
};

export const RANK_ORDER: Rank[] = [
  Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
  Rank.Jack, Rank.Queen, Rank.King, Rank.Ace,
];

export const FACE_CARD_VALUE = 10;
export const ACE_HIGH_VALUE = 11;
export const ACE_LOW_VALUE = 1;

export const DEALER_STAND_MINIMUM = 17;
export const BLACKJACK_VALUE = 21;
export const DEALER_DRAW_DELAY_MS = 800;

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';

// Chip and Bet constants
export const INITIAL_CHIPS_AMOUNT = 100;
export const DEFAULT_BET_AMOUNT = 10;
export const MINIMUM_BET_AMOUNT = 5;
export const BLACKJACK_PAYOUT_MULTIPLIER = 1.5; // Pays 3:2
