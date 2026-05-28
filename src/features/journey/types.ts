export type ConversationState =
  | 'splash'
  | 'idle'
  | 'greeting'
  | 'asking_origin'
  | 'listening_origin'
  | 'asking_destination'
  | 'listening_destination'
  | 'confirming_both'
  | 'listening_both_confirm'
  | 'searching'
  | 'results'
  | 'asking_repeat'
  | 'listening_repeat'
  | 'asking_retry'
  | 'listening_retry'
  | 'error';

export interface JourneyLeg {
  mode: { id: string };
  departurePoint: { commonName: string };
  arrivalPoint: { commonName: string };
  instruction: { summary: string };
  duration: number;
  routeOptions?: Array<{
    name: string;
    directions: string[];
  }>;
}

export interface Journey {
  duration: number;
  legs: JourneyLeg[];
}

export interface JourneyResponse {
  journeys: Journey[];
}

export type JourneyLookupResult =
  | { kind: 'success'; journeys: Journey[] }
  | { kind: 'empty' }
  | { kind: 'request_failed'; error: string };
