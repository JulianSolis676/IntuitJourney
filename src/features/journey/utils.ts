import { BASIC_CONFIRMATION_WORDS, GLOBAL_CONFIRMATION_WORDS } from './constants';
import { ConversationState } from './types';

export const isGlobalConfirmation = (text: string): boolean => {
  const response = text.toLowerCase();
  return GLOBAL_CONFIRMATION_WORDS.some((word) => response.includes(word));
};

export const isBasicConfirmation = (text: string): boolean => {
  const response = text.toLowerCase();
  return BASIC_CONFIRMATION_WORDS.some((word) => response.includes(word));
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} hora${hours > 1 ? 's' : ''} y ${mins} minutos`;
};

export const formatDurationShort = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const getStatusDisplay = (
  conversationState: ConversationState,
  fallbackStatus: string
): string => {
  switch (conversationState) {
    case 'splash':
      return '';
    case 'greeting':
      return '👋 Greeting...';
    case 'asking_origin':
      return '📍 Asking "Where are you departing from?"';
    case 'listening_origin':
      return '🎙️ Listening for your location...';
    case 'asking_destination':
      return '📍 Asking "Where do you want to go?"';
    case 'listening_destination':
      return '🎙️ Listening for your destination...';
    case 'confirming_both':
      return '✅ Confirming your journey details';
    case 'listening_both_confirm':
      return '🎙️ Listening for confirmation (Yes or No)...';
    case 'searching':
      return '🔍 Searching for routes...';
    case 'results':
      return '✅ Route found!';
    case 'asking_repeat':
      return '🔄 Asking if you want to repeat...';
    case 'listening_repeat':
      return '🎙️ Listening for your answer...';
    case 'asking_retry':
      return '🔄 Asking if you want to try again...';
    case 'listening_retry':
      return '🎙️ Listening for your answer...';
    case 'error':
      return '❌ An error occurred';
    default:
      return fallbackStatus;
  }
};
