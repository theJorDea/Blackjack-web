import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_TEXT } from '../constants';
import { DealerCommentSituation } from "../types";

let ai: GoogleGenAI | null = null;
const API_KEY = process.env.API_KEY;

if (API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    ai = null;
  }
} else {
  console.warn("Gemini API key not found in process.env.API_KEY. Dealer comments will be disabled.");
}

export const isGeminiEnabled = (): boolean => !!ai;

const getPromptForSituation = (situation: DealerCommentSituation, playerScore?: number, dealerScore?: number, betAmount?: number, playerChips?: number): string => {
  let prompt = "You are a witty, slightly sarcastic, and experienced Blackjack dealer. Provide a very short, single-sentence comment (max 15 words) for a Blackjack game. ";

  switch (situation) {
    case "new_round_welcome":
      prompt += "Welcome to the table! Or, welcome back if you dare.";
      break;
    case "betting_phase_start":
      prompt += `Place your bets. Chips: ${playerChips}. Don't be shy.`;
      break;
    case "player_attempts_bet_too_high":
      prompt += `Betting ${betAmount} with ${playerChips} chips? Ambitious, but no.`;
      break;
    case "player_attempts_bet_too_low":
      prompt += `A ${betAmount} chip bet? The minimum is a bit higher, pal.`;
      break;
    case "game_start":
      prompt += `Bet of ${betAmount} locked in. Cards are out. Good luck.`;
      break;
    case "player_hit_safe":
      prompt += `Hit. Score: ${playerScore}. Still in it.`;
      break;
    case "player_hit_blackjack":
      prompt += `Hit to Blackjack (${playerScore})! Well played.`;
      break;
    case "player_blackjack_deal":
      prompt += `Player Blackjack! That's a sweet payout on ${betAmount} chips.`;
      break;
    case "player_bust":
      prompt += `Player busts at ${playerScore}. My favorite sound. Lost ${betAmount} chips.`;
      break;
    case "player_stands":
      prompt += `Player stands on ${playerScore}. My turn to shine.`;
      break;
    case "player_doubles_down":
      prompt += `Doubling down on ${betAmount !== undefined && betAmount > 0 ? betAmount / 2 : 'that bet'}? Bold. Here's your card.`;
      break;
    case "dealer_turn_start":
      prompt += `Dealer's turn. My visible card gives me ${dealerScore}. You stood on ${playerScore}.`;
      break;
    case "dealer_hits":
      prompt += `Dealer hits. Score's ${dealerScore}.`;
      break;
    case "dealer_busts":
      prompt += `Dealer busts at ${dealerScore}! Your ${betAmount} chips are safe... and doubled.`;
      break;
    case "dealer_blackjack":
      prompt += `Dealer Blackjack! House always has an edge. Bad luck for your ${betAmount} chips.`;
      break;
    case "win_player":
      prompt += `Player wins: ${playerScore} vs ${dealerScore}. You get ${betAmount ? betAmount * 2 : 'your winnings'}.`;
      break;
    case "win_dealer":
      prompt += `Dealer wins: ${dealerScore} vs ${playerScore}. Those ${betAmount} chips are mine.`;
      break;
    case "push":
      prompt += `Push! ${playerScore} ties ${dealerScore}. Your ${betAmount} chips are safe. For now.`;
      break;
    case "player_out_of_chips_game_over":
      prompt += "Out of chips! Game over. Maybe try checkers?";
      break;
    default:
      prompt += "Well, that was something.";
  }
  return prompt;
};

export async function fetchDealerComment(
    situation: DealerCommentSituation, 
    playerScore?: number, 
    dealerScore?: number,
    betAmount?: number, 
    playerChips?: number 
  ): Promise<string> {
  if (!ai) {
    return ""; 
  }

  const promptContent = getPromptForSituation(situation, playerScore, dealerScore, betAmount, playerChips);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: promptContent,
      config: {
        temperature: 0.75, 
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 50, 
      }
    });
    
    if (response && typeof response.text === 'string') {
      let textContent = response.text;
      let trimmedText = textContent.trim();
      
      if (trimmedText.startsWith('"') && trimmedText.endsWith('"')) {
        trimmedText = trimmedText.substring(1, trimmedText.length - 1);
      }
      return trimmedText;
    } else {
      console.warn("Gemini API response did not have a valid .text string property. Response:", response);
      
      let errorMessage = "The dealer is unusually quiet.";
      if (response) {
          if (response.candidates && response.candidates.length > 0) {
              const firstCandidate = response.candidates[0];
              if (firstCandidate.finishReason && !['STOP', 'UNSPECIFIED', 'FINISH_REASON_UNSPECIFIED'].includes(firstCandidate.finishReason)) {
                  errorMessage = `Dealer's thought process stopped: ${firstCandidate.finishReason}.`;
              } else if (firstCandidate.safetyRatings && firstCandidate.safetyRatings.some(sr => sr.blocked)) {
                  errorMessage = "Dealer's comment was blocked (safety).";
              }
          } else if ((response as any).promptFeedback) { 
              const promptFeedback = (response as any).promptFeedback;
              if (promptFeedback.blockReason) {
                  errorMessage = `Dealer's comment was blocked (prompt: ${promptFeedback.blockReason}).`;
              } else if (promptFeedback.safetyRatings && promptFeedback.safetyRatings.some((sr: any) => sr.blocked)) {
                  errorMessage = "Dealer's comment was blocked (prompt safety).";
              }
          }
      }
      return errorMessage;
    }
  } catch (error) {
    console.error("Error fetching dealer comment from Gemini:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
            return "Dealer's commentary unavailable (API Key issue).";
        }
        // If the error message is the one we're trying to prevent, provide a generic message
        if (error.message.toLowerCase().includes("cannot read properties of undefined") && error.message.toLowerCase().includes("trim")) {
            return "Dealer had a momentary lapse of thought.";
        }
    }
    return "The dealer is contemplating the meaning of life... or just lost connection.";
  }
}
