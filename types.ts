export enum Suit {
  Hearts = "Hearts",
  Diamonds = "Diamonds",
  Clubs = "Clubs",
  Spades = "Spades",
}

export enum Rank {
  Two = "2", Three = "3", Four = "4", Five = "5", Six = "6", Seven = "7", Eight = "8", Nine = "9", Ten = "10",
  Jack = "J", Queen = "Q", King = "K", Ace = "A",
}

export interface Card {
  suit: Suit;
  rank: Rank;
  hidden: boolean;
  animationDelay?: string; // For staggered animations
}

export enum GamePhase {
  IDLE = "IDLE", // Before first game starts or after full restart
  BETTING = "BETTING", // Player is placing a bet
  PLAYER_TURN = "PLAYER_TURN",
  DEALER_TURN = "DEALER_TURN",
  GAME_OVER = "GAME_OVER", // Round ended, player might be out of chips or can start new round
}

export type PlayerAction = "hit" | "stand" | "deal" | "new_game" | "double_down";
export type DealerCommentSituation = 
  | "game_start" // After bet, cards dealt
  | "player_hit_safe"
  | "player_hit_blackjack"
  | "player_blackjack_deal"
  | "player_bust"
  | "player_stands"
  | "dealer_turn_start"
  | "dealer_hits"
  | "dealer_busts"
  | "dealer_blackjack"
  | "win_player"
  | "win_dealer"
  | "push"
  | "betting_phase_start" // When it's time to bet
  | "player_out_of_chips_game_over"
  | "player_attempts_bet_too_high"
  | "player_attempts_bet_too_low"
  | "new_round_welcome" // Generic welcome or start of game
  | "player_doubles_down"; // Player chooses to double their bet