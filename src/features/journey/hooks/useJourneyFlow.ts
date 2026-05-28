import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import {
  MAX_JOURNEY_SEARCH_RETRIES,
  MAX_SPEECH_RETRIES,
} from '../constants';
import { fetchJourneyOptions } from '../services/tflService';
import { ConversationState, Journey } from '../types';
import {
  formatDuration,
  isBasicConfirmation,
  isGlobalConfirmation,
} from '../utils';
import {
  getFromLocalCache,
  saveToLocalCache,
} from '../../../services/cacheService';

interface UseJourneyFlowResult {
  from: string;
  to: string;
  loading: boolean;
  journeys: Journey[];
  error: string;
  isCachedData: boolean;
  cachedDataTimestamp: number | null;
  conversationState: ConversationState;
  statusMessage: string;
  isListening: boolean;
  fadeAnim: Animated.Value;
  pulseAnim: Animated.Value;
  startNewSearch: () => void;
  speakResults: (journeyList: Journey[]) => void;
}

export const useJourneyFlow = (): UseJourneyFlowResult => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [error, setError] = useState('');
  const [isCachedData, setIsCachedData] = useState(false);
  const [cachedDataTimestamp, setCachedDataTimestamp] = useState<number | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>('splash');
  const [statusMessage, setStatusMessage] = useState('Welcome to IntuitJourney');
  const [isListening, setIsListening] = useState(false);

  const conversationStateRef = useRef<ConversationState>('splash');
  const fromRef = useRef('');
  const toRef = useRef('');
  const isProcessingError = useRef(false);
  const retryCount = useRef(0);
  const journeySearchRetries = useRef(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  useEffect(() => {
    fromRef.current = from;
  }, [from]);

  useEffect(() => {
    toRef.current = to;
  }, [to]);

  useEffect(() => {
    showSplashScreen();
  }, []);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  const closeApp = () => {
    setConversationState('idle');
    setStatusMessage('Application closed');
    setError('');
    setFrom('');
    setTo('');
    fromRef.current = '';
    toRef.current = '';
    retryCount.current = 0;
    journeySearchRetries.current = 0;
    isProcessingError.current = false;
    setJourneys([]);
    setIsListening(false);
  };

  const startListeningForOrigin = () => {
    setConversationState('listening_origin');
    setStatusMessage('Listening for your location...');
    isProcessingError.current = false;

    try {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-GB',
        interimResults: false,
        maxAlternatives: 1,
      });
    } catch (speechError) {
      console.error('Error starting speech recognition for origin:', speechError);
    }
  };

  const startListeningForDestination = () => {
    setConversationState('listening_destination');
    setStatusMessage('Listening for your destination...');
    isProcessingError.current = false;

    try {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-GB',
        interimResults: false,
        maxAlternatives: 1,
      });
    } catch (speechError) {
      console.error('Error starting speech recognition for destination:', speechError);
    }
  };

  const startListeningForBothConfirmation = () => {
    setConversationState('listening_both_confirm');
    setStatusMessage('Listening for confirmation...');
    isProcessingError.current = false;

    try {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-GB',
        interimResults: false,
        maxAlternatives: 1,
      });
    } catch (speechError) {
      console.error('Error starting speech recognition for confirmation:', speechError);
    }
  };

  const startListeningForRepeat = () => {
    setConversationState('listening_repeat');
    setStatusMessage('Listening for your answer...');
    isProcessingError.current = false;

    ExpoSpeechRecognitionModule.start({
      lang: 'en-GB',
      interimResults: false,
      maxAlternatives: 1,
    });
  };

  const startListeningForRetry = () => {
    setConversationState('listening_retry');
    setStatusMessage('Listening for your answer...');
    isProcessingError.current = false;

    ExpoSpeechRecognitionModule.start({
      lang: 'en-GB',
      interimResults: false,
      maxAlternatives: 1,
    });
  };

  const playListenStartCue = (next: () => void) => {
    Speech.speak('You can start speaking now.', {
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      pitch: 1.2,
      onDone: () => {
        Speech.speak('Beep', {
          language: 'en-GB',
          rate: 2.0,
          pitch: 1.8,
          volume: 1.0,
          onDone: () => {
            Speech.speak('Beep', {
              language: 'en-GB',
              rate: 2.0,
              pitch: 1.8,
              volume: 1.0,
              onDone: () => {
                setTimeout(() => {
                  next();
                }, 300);
              },
              onError: () => {
                next();
              },
            });
          },
          onError: () => {
            next();
          },
        });
      },
      onError: () => {
        next();
      },
    });
  };

  const askForOrigin = () => {
    setConversationState('asking_origin');
    setStatusMessage('Asking where you are...');
    Speech.stop();

    Speech.speak('Where would you like to depart from?', {
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      onDone: () => {
        playListenStartCue(startListeningForOrigin);
      },
    });
  };

  const askForDestination = () => {
    setConversationState('asking_destination');
    setStatusMessage('Asking where you want to go...');
    Speech.stop();

    Speech.speak('Where would you like to go?', {
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      onDone: () => {
        playListenStartCue(startListeningForDestination);
      },
    });
  };

  const confirmBoth = () => {
    setConversationState('confirming_both');
    setStatusMessage('Confirming your journey...');

    Speech.stop();
    Speech.speak(`Just to confirm, you want to travel from ${fromRef.current} to ${toRef.current}. Is that correct?`, {
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      onDone: () => {
        startListeningForBothConfirmation();
      },
    });
  };

  const askToRepeatResults = () => {
    setConversationState('asking_repeat');
    setStatusMessage('Asking if you want to repeat...');

    Speech.stop();
    Speech.speak('Would you like me to repeat the results?', {
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      onDone: () => {
        startListeningForRepeat();
      },
    });
  };

  const askToRetry = () => {
    setConversationState('asking_retry');
    setStatusMessage('Asking if you want to try again...');

    Speech.stop();
    Speech.speak('Would you like to try again with different locations?', {
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      onDone: () => {
        startListeningForRetry();
      },
    });
  };

  const speakResults = (journeyList: Journey[]) => {
    Speech.stop();
    if (journeyList.length === 0) {
      Speech.speak('No routes were found. Please try with different locations.', {
        language: 'en-GB',
        volume: 1.0,
        rate: 0.9,
      });
      return;
    }

    const bestJourney = journeyList[0];
    let text = `I found ${journeyList.length} travel ${journeyList.length > 1 ? 'options' : 'option'}. `;
    text += `The best option takes ${formatDuration(bestJourney.duration)}. `;
    bestJourney.legs.forEach((leg) => {
      text += `${leg.instruction.summary}. `;
    });

    if (isCachedData) {
      text += ' Remember, this information may be outdated.';
    }

    Speech.speak(text, {
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      onDone: () => {
        askToRepeatResults();
      },
    });
  };

  const searchJourney = async () => {
    const fromValue = fromRef.current;
    const toValue = toRef.current;

    if (!fromValue.trim() || !toValue.trim()) {
      setError('Please enter origin and destination');
      setConversationState('error');
      return;
    }

    const fromNormalized = fromValue.trim().toLowerCase();
    const toNormalized = toValue.trim().toLowerCase();

    if (fromNormalized === toNormalized) {
      journeySearchRetries.current += 1;

      if (journeySearchRetries.current < MAX_JOURNEY_SEARCH_RETRIES) {
        const errorMsg = `You cannot have the same departure and arrival location. Try again. Attempt ${journeySearchRetries.current} of ${MAX_JOURNEY_SEARCH_RETRIES}.`;
        setError(errorMsg);
        setConversationState('asking_origin');
        setStatusMessage('Asking for departure location...');

        Speech.stop();
        Speech.speak('You cannot have the same departure and arrival location. Please say your departure location again.', {
          language: 'en-GB',
          rate: 0.9,
          volume: 1.0,
          onDone: () => {
            setFrom('');
            setTo('');
            playListenStartCue(startListeningForOrigin);
          },
        });
      } else {
        Speech.stop();
        Speech.speak('Unable to find valid routes after three attempts. Closing application. Goodbye.', {
          language: 'en-GB',
          rate: 0.9,
          volume: 1.0,
          onDone: () => {
            closeApp();
          },
        });
      }
      return;
    }

    setLoading(true);
    setConversationState('searching');
    setStatusMessage('Searching for routes...');
    setError('');
    setJourneys([]);
    setIsCachedData(false);

    try {
      const journeyLookup = await fetchJourneyOptions(fromValue, toValue);
      const apiRequestFailed = journeyLookup.kind === 'request_failed';
      const apiResponseEmpty = journeyLookup.kind === 'empty';

      if (journeyLookup.kind === 'success') {
        await saveToLocalCache(fromValue, toValue, journeyLookup.journeys);

        journeySearchRetries.current = 0;
        setJourneys(journeyLookup.journeys);
        setIsCachedData(false);
        setCachedDataTimestamp(null);
        setConversationState('results');
        setStatusMessage('Route found!');
        setLoading(false);

        speakResults(journeyLookup.journeys);
        return;
      }

      if (apiRequestFailed) {
        const cachedData = await getFromLocalCache(fromValue, toValue);

        if (cachedData && cachedData.journeys && cachedData.journeys.length > 0) {
          setJourneys(cachedData.journeys);
          setIsCachedData(true);
          setCachedDataTimestamp(cachedData.timestamp);
          setConversationState('results');
          setStatusMessage('Route found (from cache)!');
          setLoading(false);
          journeySearchRetries.current = 0;

          Speech.stop();
          const timeSinceCache = Date.now() - cachedData.timestamp;
          const hoursAgo = Math.floor(timeSinceCache / (1000 * 60 * 60));

          Speech.speak(
            `I couldn't reach the live service, but I found your previous search from ${hoursAgo} hours ago. The routes I'm showing may not reflect current service changes. Please note this information might be outdated.`,
            {
              language: 'en-GB',
              rate: 0.9,
              volume: 1.0,
              onDone: () => {
                speakResults(cachedData.journeys);
              },
            }
          );
          return;
        }
      }

      if (apiResponseEmpty || apiRequestFailed) {
        journeySearchRetries.current += 1;

        if (journeySearchRetries.current < MAX_JOURNEY_SEARCH_RETRIES) {
          const errorMsg = `No routes found for ${fromValue} to ${toValue}. Try again. Attempt ${journeySearchRetries.current} of ${MAX_JOURNEY_SEARCH_RETRIES}.`;
          setError(errorMsg);
          setConversationState('asking_origin');
          setStatusMessage('Asking for departure location...');
          setLoading(false);

          Speech.stop();
          Speech.speak(`No routes found for ${fromValue} to ${toValue}. Please say your departure location again.`, {
            language: 'en-GB',
            rate: 0.9,
            volume: 1.0,
            onDone: () => {
              setFrom('');
              setTo('');
              playListenStartCue(startListeningForOrigin);
            },
          });
        } else {
          setLoading(false);
          Speech.stop();
          Speech.speak('Unable to find valid routes after three attempts. Closing application. Goodbye.', {
            language: 'en-GB',
            rate: 0.9,
            volume: 1.0,
            onDone: () => {
              closeApp();
            },
          });
        }
      }
    } catch (journeyError) {
      const errorMsg = journeyError instanceof Error ? journeyError.message : 'Error searching for route';
      setError(errorMsg);
      setConversationState('error');
      setStatusMessage('Service unavailable');
      setLoading(false);

      Speech.stop();
      Speech.speak('An unexpected error occurred. The application will now close. Goodbye.', {
        language: 'en-GB',
        rate: 0.9,
        volume: 1.0,
        onDone: () => {
          closeApp();
        },
        onError: () => {
          closeApp();
        },
      });
    }
  };

  const confirmAndSearch = () => {
    const fromValue = fromRef.current.trim().toLowerCase();
    const toValue = toRef.current.trim().toLowerCase();

    if (fromValue === toValue) {
      setConversationState('error');
      Speech.stop();
      Speech.speak('The origin and destination are the same. I cannot search for routes. Let me ask you again.', {
        language: 'en-GB',
        rate: 0.9,
        volume: 1.0,
        onDone: () => {
          setFrom('');
          setTo('');
          fromRef.current = '';
          toRef.current = '';
          retryCount.current = 0;
          setTimeout(() => {
            askForOrigin();
          }, 500);
        },
      });
      return;
    }

    setConversationState('confirming_both');
    setStatusMessage('Confirming and searching...');

    Speech.stop();
    Speech.speak(`Perfect. Searching for your route from ${fromRef.current} to ${toRef.current}.`, {
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      onDone: () => {
        searchJourney();
      },
    });
  };

  const startConversation = async () => {
    Speech.stop();

    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!granted) {
        setError('Microphone permission is required to use this app.');
        setConversationState('error');
        Speech.stop();
        Speech.speak('Microphone permission is required to use this app.', {
          language: 'en-GB',
          rate: 0.9,
          volume: 1.0,
        });
        return;
      }

      setConversationState('greeting');
      setStatusMessage('Greeting...');

      setTimeout(() => {
        Speech.stop();
        Speech.speak('Hello! Welcome to Intuit Journey. Your voice-activated travel assistant.', {
          language: 'en-GB',
          rate: 0.85,
          volume: 1.0,
          pitch: 1.0,
          onDone: () => {
            askForOrigin();
          },
        });
      }, 500);
    } catch (conversationError) {
      console.error('Error in startConversation:', conversationError);
      setError('Error starting the application');
      setConversationState('error');
    }
  };

  const showSplashScreen = () => {
    setConversationState('splash');
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }).start(() => {
          startConversation();
        });
      }, 2500);
    });
  };

  const startNewSearch = () => {
    setFrom('');
    setTo('');
    fromRef.current = '';
    toRef.current = '';
    setJourneys([]);
    setError('');
    setIsCachedData(false);
    setCachedDataTimestamp(null);
    setConversationState('idle');
    Speech.speak('Perfect. Let us search for a new route.', {
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      onDone: () => {
        askForOrigin();
      },
    });
  };

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);

    if (isProcessingError.current) {
      return;
    }

    const currentState = conversationStateRef.current;

    if (currentState === 'listening_origin') {
      const fromValue = fromRef.current;
      if (fromValue && fromValue.trim()) {
        retryCount.current = 0;
        askForDestination();
      }
    } else if (currentState === 'listening_destination') {
      const toValue = toRef.current;
      if (toValue && toValue.trim()) {
        retryCount.current = 0;
        confirmBoth();
      }
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (!transcript) return;

    const currentState = conversationStateRef.current;

    if (currentState === 'listening_origin') {
      retryCount.current = 0;
      setFrom(transcript);
      fromRef.current = transcript;
    } else if (currentState === 'listening_destination') {
      retryCount.current = 0;
      setTo(transcript);
      toRef.current = transcript;
    } else if (currentState === 'listening_both_confirm') {
      retryCount.current = 0;
      if (isGlobalConfirmation(transcript)) {
        confirmAndSearch();
      } else {
        Speech.stop();
        Speech.speak('No problem. Let me ask you again. Where would you like to depart from?', {
          language: 'en-GB',
          rate: 0.9,
          volume: 1.0,
          onDone: () => {
            setFrom('');
            setTo('');
            fromRef.current = '';
            toRef.current = '';
            playListenStartCue(startListeningForOrigin);
          },
        });
      }
    } else if (currentState === 'listening_repeat') {
      retryCount.current = 0;
      if (isBasicConfirmation(transcript)) {
        setConversationState('results');
        speakResults(journeys);
      } else {
        Speech.speak('Thank you for using Intuit Journey. Goodbye.', {
          language: 'en-GB',
          rate: 0.9,
          volume: 1.0,
          onDone: () => {
            setConversationState('idle');
          },
        });
      }
    } else if (currentState === 'listening_retry') {
      retryCount.current = 0;
      if (isBasicConfirmation(transcript)) {
        startNewSearch();
      } else {
        Speech.speak('Thank you for using Intuit Journey. Goodbye.', {
          language: 'en-GB',
          rate: 0.9,
          volume: 1.0,
        });
        setConversationState('idle');
      }
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    isProcessingError.current = true;

    const currentState = conversationStateRef.current;
    retryCount.current += 1;

    Speech.stop();

    if (event.error === 'no-speech') {
      if (retryCount.current > MAX_SPEECH_RETRIES) {
        let closureMessage = 'I have not detected any activity. The application will now close. Goodbye.';

        if (currentState === 'listening_repeat' || currentState === 'listening_retry') {
          closureMessage = 'I have not detected a response. If you would like to search for a route, please restart the application. Goodbye.';
        }

        Speech.speak(closureMessage, {
          language: 'en-GB',
          rate: 0.9,
          volume: 1.0,
          onDone: () => {
            closeApp();
          },
        });
        return;
      }

      Speech.speak('I could not hear you. Please wait for the beep and then speak.', {
        language: 'en-GB',
        rate: 0.9,
        volume: 1.0,
        onDone: () => {
          isProcessingError.current = false;

          setTimeout(() => {
            if (currentState === 'listening_origin') {
              askForOrigin();
            } else if (currentState === 'listening_destination') {
              askForDestination();
            } else if (currentState === 'listening_both_confirm') {
              confirmBoth();
            } else if (currentState === 'listening_repeat') {
              askToRepeatResults();
            } else if (currentState === 'listening_retry') {
              askToRetry();
            }
          }, 500);
        },
        onError: () => {
          isProcessingError.current = false;
        },
      });
    } else {
      Speech.speak('An error occurred. Let me try again.', {
        language: 'en-GB',
        rate: 0.9,
        volume: 1.0,
        onDone: () => {
          isProcessingError.current = false;

          setTimeout(() => {
            if (currentState === 'listening_origin') {
              askForOrigin();
            } else if (currentState === 'listening_destination') {
              askForDestination();
            } else if (currentState === 'listening_both_confirm') {
              confirmBoth();
            } else if (currentState === 'listening_repeat') {
              askToRepeatResults();
            } else if (currentState === 'listening_retry') {
              askToRetry();
            }
          }, 500);
        },
        onError: () => {
          isProcessingError.current = false;
        },
      });
    }
  });

  return {
    from,
    to,
    loading,
    journeys,
    error,
    isCachedData,
    cachedDataTimestamp,
    conversationState,
    statusMessage,
    isListening,
    fadeAnim,
    pulseAnim,
    startNewSearch,
    speakResults,
  };
};
