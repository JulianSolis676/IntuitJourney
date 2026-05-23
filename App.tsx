import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

const TFL_API_BASE = 'https://api.tfl.gov.uk';

// Conversation states
type ConversationState = 
  | 'splash'                  // Initial splash screen
  | 'idle'                    // App just opened, not started yet
  | 'greeting'                // Speaking greeting
  | 'asking_origin'           // Asking "Where are you?"
  | 'listening_origin'        // Listening for origin
  | 'confirming_origin'       // Confirming origin
  | 'asking_destination'      // Asking "Where do you want to go?"
  | 'listening_destination'   // Listening for destination
  | 'confirming_destination'  // Confirming destination
  | 'searching'               // Searching journey
  | 'results'                 // Showing results
  | 'asking_repeat'           // Asking if user wants to repeat results
  | 'listening_repeat'        // Listening for repeat confirmation
  | 'asking_retry'            // Asking if user wants to retry after error
  | 'listening_retry'         // Listening for retry confirmation
  | 'error';                  // Showing error

interface JourneyLeg {
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

interface Journey {
  duration: number;
  legs: JourneyLeg[];
}

interface JourneyResponse {
  journeys: Journey[];
}

export default function App() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [error, setError] = useState('');

  // Voice-first conversation state
  const [conversationState, setConversationState] = useState<ConversationState>('splash');
  const [statusMessage, setStatusMessage] = useState('Welcome to IntuitJourney');
  
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const conversationStateRef = useRef<ConversationState>('splash');
  
  // Refs for immediate access to from/to values (fix async state issue)
  const fromRef = useRef('');
  const toRef = useRef('');
  
  // Prevent duplicate calls and infinite loops
  const isProcessingError = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 2; // Max 2 attempts before offering to restart
  const journeySearchRetries = useRef(0);
  const maxJourneySearchRetries = 3; // Max 3 journey search attempts
  
  // Animation for splash and listening
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Keep refs in sync
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);
  
  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);
  
  useEffect(() => {
    fromRef.current = from;
  }, [from]);
  
  useEffect(() => {
    toRef.current = to;
  }, [to]);

  // Start with splash screen
  useEffect(() => {
    console.log('🔧 App mounted, starting splash screen...');
    
    // Start splash screen immediately
    showSplashScreen();
  }, []);

  // Pulse animation for listening state
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
  }, [isListening]);

  const showSplashScreen = () => {
    console.log('🎬 Showing splash screen');
    setConversationState('splash');
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      // After 2.5 seconds, transition to main app
      setTimeout(() => {
        console.log('⏱️ Splash timeout, fading out');
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }).start(() => {
          console.log('✅ Splash done, starting conversation');
          startConversation();
        });
      }, 2500);
    });
  };

  const startConversation = async () => {
    console.log('🎤 Starting conversation, requesting permissions...');
    
    // Stop any previous speech
    Speech.stop();
    
    // Request permissions first
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      console.log('🔒 Permissions granted:', granted);
      
      if (!granted) {
        setError('Microphone permission is required to use this app.');
        setConversationState('error');
        console.log('🔊 Speaking error message...');
        Speech.stop();
        Speech.speak('Microphone permission is required to use this app.', {
          language: 'en-GB',
          rate: 0.9,
          volume: 1.0,
        });
        return;
      }

      // Start greeting
      console.log('👋 Starting greeting...');
      setConversationState('greeting');
      setStatusMessage('Greeting...');
      
      console.log('🔊 About to speak greeting...');
      
      // Wait a moment to ensure audio system is ready
      setTimeout(() => {
        Speech.stop();
        Speech.speak('Hello! Welcome to Intuit Journey. Your voice-activated travel assistant.', {
          language: 'en-GB',
          rate: 0.85, // Slightly slower for clarity
          volume: 1.0,
          pitch: 1.0,
          onStart: () => {
            console.log('🗣️ Speech started!');
          },
          onDone: () => {
            console.log('✅ Greeting speech done');
            askForOrigin();
          },
          onError: (error) => {
            console.error('❌ Speech error:', error);
          },
        });
      }, 500);
    } catch (error) {
      console.error('❌ Error in startConversation:', error);
      setError('Error starting the application');
      setConversationState('error');
    }
  };

  const closeApp = () => {
    console.log('🚪 Closing application');
    setConversationState('idle');
    setStatusMessage('Application closed');
    setError('');
    setFrom('');
    setTo('');
    fromRef.current = '';
    toRef.current = '';
    retryCount.current = 0;
    journeySearchRetries.current = 0; // Reset journey search retries
    isProcessingError.current = false;
    setJourneys([]);
    setIsListening(false);
    
    // Note: iOS doesn't allow apps to close themselves programmatically
    // The app will remain in an idle state and user can close manually
    // or reopen the app to start a new session
  };

  const playListenStartCue = (next: () => void) => {
    console.log('🔔 Playing start cue before listening');
    Speech.speak('You can start speaking now.', {
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      pitch: 1.2,
      onDone: () => {
        // First beep - high pitch
        Speech.speak('Beep', {
          language: 'en-GB',
          rate: 2.0, // Much faster to create a "beep" effect
          pitch: 1.8, // Higher pitch for distinctness
          volume: 1.0,
          onDone: () => {
            // Second beep - rapid succession
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
              onError: (error) => {
                console.error('❌ Second beep error:', error);
                next();
              },
            });
          },
          onError: (error) => {
            console.error('❌ First beep error:', error);
            next();
          },
        });
      },
      onError: (error) => {
        console.error('❌ Cue prompt error:', error);
        next();
      },
    });
  };

  const askForOrigin = () => {
    console.log('📍 Asking for origin...');
    setConversationState('asking_origin');
    setStatusMessage('Asking where you are...');
    
    console.log('🔊 About to speak origin question...');
    // Stop any ongoing speech first
    Speech.stop();
    
    Speech.speak('Where would you like to depart from?', {
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      onStart: () => {
        console.log('🗣️ Origin question speech started!');
      },
      onDone: () => {
        console.log('✅ Origin question speech done, playing the beep cue');
        playListenStartCue(startListeningForOrigin);
      },
      onError: (error) => {
        console.error('❌ Origin speech error:', error);
      },
    });
  };

  const startListeningForOrigin = () => {
    console.log('👂 Starting to listen for origin...');
    setConversationState('listening_origin');
    setStatusMessage('Listening for your location...');
    
    // Reset error processing flag
    isProcessingError.current = false;
    
    try {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-GB',
        interimResults: false,
        maxAlternatives: 1,
      });
      console.log('✅ Speech recognition started for origin');
    } catch (error) {
      console.error('❌ Error starting speech recognition:', error);
    }
  };

  const askForDestination = () => {
    console.log('🎯 Asking for destination...');
    setConversationState('asking_destination');
    setStatusMessage('Asking where you want to go...');
    
    console.log('🔊 About to speak destination question...');
    // Stop any ongoing speech first
    Speech.stop();
    
    Speech.speak('Where would you like to go?', {
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      onStart: () => {
        console.log('🗣️ Destination question speech started!');
      },
      onDone: () => {
        console.log('✅ Destination question speech done, playing the beep cue');
        playListenStartCue(startListeningForDestination);
      },
      onError: (error) => {
        console.error('❌ Destination speech error:', error);
      },
    });
  };

  const startListeningForDestination = () => {
    console.log('👂 Starting to listen for destination...');
    setConversationState('listening_destination');
    setStatusMessage('Listening for your destination...');
    
    // Reset error processing flag
    isProcessingError.current = false;
    
    try {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-GB',
        interimResults: false,
        maxAlternatives: 1,
      });
      console.log('✅ Speech recognition started for destination');
    } catch (error) {
      console.error('❌ Error starting speech recognition:', error);
    }
  };

  const confirmAndSearch = () => {
    console.log('🔍 confirmAndSearch() called');
    console.log('📌 From:', from, '| To:', to);
    console.log('📌 FromRef:', fromRef.current, '| ToRef:', toRef.current);
    
    // Use refs for immediate values
    const fromValue = fromRef.current.trim().toLowerCase();
    const toValue = toRef.current.trim().toLowerCase();
    
    // Check if origin and destination are the same
    if (fromValue === toValue) {
      console.log('⚠️ Origin and destination are the same');
      setConversationState('error');
      Speech.stop();
      Speech.speak('The origin and destination are the same. I cannot search for routes. Let me ask you again.', {
        language: 'en-GB',
        rate: 0.9,
        volume: 1.0,
        onStart: () => {
          console.log('🗣️ Speaking same location error...');
        },
        onDone: () => {
          console.log('✅ Restarting questions');
          // Reset and start over
          setFrom('');
          setTo('');
          fromRef.current = '';
          toRef.current = '';
          retryCount.current = 0;
          setTimeout(() => {
            askForOrigin();
          }, 500);
        },
        onError: (error) => {
          console.error('❌ Error speaking same location error:', error);
        },
      });
      return;
    }
    
    setConversationState('confirming_destination');
    setStatusMessage('Confirming and searching...');
    
    Speech.stop();
    Speech.speak(`Perfect. Searching for your route from ${fromRef.current} to ${toRef.current}.`, {
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      onStart: () => {
        console.log('🗣️ Speaking confirmation...');
      },
      onDone: () => {
        console.log('✅ Confirmation done, calling searchJourney()');
        searchJourney();
      },
      onError: (error) => {
        console.error('❌ Error speaking confirmation:', error);
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
    const journey = journeyList[0];
    let text = `I found ${journeyList.length} travel ${journeyList.length > 1 ? 'options' : 'option'}. `;
    text += `The best option takes ${formatDuration(journey.duration)}. `;
    journey.legs.forEach((leg) => {
      text += `${leg.instruction.summary}. `;
    });
    Speech.speak(text, { 
      language: 'en-GB',
      rate: 0.9,
      volume: 1.0,
      onDone: () => {
        askToRepeatResults();
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

  const startListeningForRepeat = () => {
    setConversationState('listening_repeat');
    setStatusMessage('Listening for your answer...');
    
    // Reset error processing flag
    isProcessingError.current = false;
    
    ExpoSpeechRecognitionModule.start({
      lang: 'en-GB',
      interimResults: false,
      maxAlternatives: 1,
    });
  };

  // Speech recognition event handlers
  useSpeechRecognitionEvent('start', () => {
    console.log('🎤 Speech recognition started event');
    setIsListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('🎤 Speech recognition ended event');
    setIsListening(false);
    
    // If we're already processing an error, don't do anything here
    if (isProcessingError.current) {
      console.log('⏭️ Skipping end handler - error already being processed');
      return;
    }
    
    // Handle state transition based on current conversation state
    const currentState = conversationStateRef.current;
    console.log('📊 Current state on end:', currentState);
    
    if (currentState === 'listening_origin') {
      // Use REF for immediate access
      const fromValue = fromRef.current;
      console.log('📝 From value (ref):', fromValue);
      // Finished listening for origin, ask for destination
      if (fromValue && fromValue.trim()) {
        console.log('✅ Origin captured, calling askForDestination()');
        retryCount.current = 0; // Reset on success
        askForDestination();
      } else {
        console.log('⚠️ No origin value, waiting for error handler');
      }
      // If no input, wait for error handler
    } else if (currentState === 'listening_destination') {
      // Use REF for immediate access
      const toValue = toRef.current;
      console.log('📝 To value (ref):', toValue);
      // Finished listening for destination, search journey
      if (toValue && toValue.trim()) {
        console.log('✅ Destination captured, calling confirmAndSearch()');
        retryCount.current = 0; // Reset on success
        confirmAndSearch();
      } else {
        console.log('⚠️ No destination value, waiting for error handler');
      }
      // If no input, wait for error handler
    } else if (currentState === 'listening_repeat') {
      console.log('🔄 Finished listening for repeat answer');
      // User responded to repeat question - handled in result event
    } else if (currentState === 'listening_retry') {
      console.log('🔄 Finished listening for retry answer');
      // User responded to retry question - handled in result event
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    console.log('📝 Speech result:', transcript);
    if (!transcript) return;
    
    const currentState = conversationStateRef.current;
    console.log('📊 Current state on result:', currentState);
    
    if (currentState === 'listening_origin') {
      console.log('✅ Setting origin to:', transcript);
      // Reset retry count on successful speech capture
      retryCount.current = 0;
      setFrom(transcript);
      fromRef.current = transcript; // Update ref immediately
    } else if (currentState === 'listening_destination') {
      console.log('✅ Setting destination to:', transcript);
      // Reset retry count on successful speech capture
      retryCount.current = 0;
      setTo(transcript);
      toRef.current = transcript; // Update ref immediately
    } else if (currentState === 'listening_repeat') {
      // Reset retry count on successful speech capture
      retryCount.current = 0;
      // Check if user wants to repeat
      const response = transcript.toLowerCase();
      if (response.includes('yes') || response.includes('yeah') || response.includes('sure') || response.includes('ok')) {
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
      // Reset retry count on successful speech capture
      retryCount.current = 0;
      // Check if user wants to retry
      const response = transcript.toLowerCase();
      if (response.includes('yes') || response.includes('yeah') || response.includes('sure') || response.includes('ok')) {
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
    // Don't show error overlay for 'no-speech' since we handle it gracefully with voice
    if (event.error === 'no-speech') {
      console.log('⚠️ No speech detected (expected behavior)');
    } else {
      console.error('❌ Speech recognition error:', event.error, event.message);
    }
    
    setIsListening(false);
    
    // Mark that we're processing an error to prevent duplicate handling
    isProcessingError.current = true;
    
    const currentState = conversationStateRef.current;
    console.log('📊 Current state on error:', currentState);
    console.log('🔢 Retry count BEFORE increment:', retryCount.current);
    
    // Increment retry count
    retryCount.current += 1;
    console.log('🔢 Retry count AFTER increment:', retryCount.current);
    
    // Stop any ongoing speech
    Speech.stop();
    
    // Handle specific error types
    if (event.error === 'no-speech') {
      
      // Check if we've exceeded max retries (2 attempts)
      if (retryCount.current > maxRetries) {
        console.log('🛑 Max retries exceeded, closing app due to inactivity');
        
        // Different message depending on state
        let closureMessage = 'I have not detected any activity. The application will now close. Goodbye.';
        
        if (currentState === 'listening_repeat' || currentState === 'listening_retry') {
          closureMessage = 'I have not detected a response. If you would like to search for a route, please restart the application. Goodbye.';
        }
        
        Speech.speak(closureMessage, {
          language: 'en-GB',
          rate: 0.9,
          volume: 1.0,
          onStart: () => {
            console.log('🗣️ Speaking inactivity closure message');
          },
          onDone: () => {
            console.log('✅ Closing app due to inactivity');
            closeApp();
          },
        });
        return;
      }
      
      // First or second attempt - ask again
      const attemptNumber = retryCount.current;
      console.log(`🔄 Retry attempt ${attemptNumber} of ${maxRetries}`);
      
      Speech.speak('I could not hear you. Please wait for the beep and then speak.', {
        language: 'en-GB',
        rate: 0.9,
        volume: 1.0,
        onStart: () => {
          console.log('🗣️ Speaking no-speech error message');
        },
        onDone: () => {
          console.log('✅ No-speech error message done, retrying question');
          isProcessingError.current = false;
          
          // Retry the same question after a short delay
          setTimeout(() => {
            if (currentState === 'listening_origin') {
              askForOrigin();
            } else if (currentState === 'listening_destination') {
              askForDestination();
            } else if (currentState === 'listening_repeat') {
              askToRepeatResults();
            } else if (currentState === 'listening_retry') {
              askToRetry();
            }
          }, 500);
        },
        onError: (error) => {
          console.error('❌ Error speaking no-speech message:', error);
          isProcessingError.current = false;
        },
      });
    } else {
      // Other errors
      console.log('⚠️ Other speech error:', event.error);
      
      Speech.speak('An error occurred. Let me try again.', {
        language: 'en-GB',
        rate: 0.9,
        volume: 1.0,
        onStart: () => {
          console.log('🗣️ Speaking general error message');
        },
        onDone: () => {
          console.log('✅ General error message done, retrying question');
          isProcessingError.current = false;
          
          setTimeout(() => {
            if (currentState === 'listening_origin') {
              askForOrigin();
            } else if (currentState === 'listening_destination') {
              askForDestination();
            } else if (currentState === 'listening_repeat') {
              askToRepeatResults();
            } else if (currentState === 'listening_retry') {
              askToRetry();
            }
          }, 500);
        },
        onError: (error) => {
          console.error('❌ Error speaking general error message:', error);
          isProcessingError.current = false;
        },
      });
    }
  });


  const searchJourney = async () => {
    console.log('🔎 searchJourney() called');
    
    // Use refs for immediate values
    const fromValue = fromRef.current;
    const toValue = toRef.current;
    
    console.log('📍 Searching from:', fromValue, 'to:', toValue);
    
    if (!fromValue.trim() || !toValue.trim()) {
      console.log('❌ Missing from or to values');
      setError('Please enter origin and destination');
      setConversationState('error');
      return;
    }

    // Check if departure and arrival are the same
    const fromNormalized = fromValue.trim().toLowerCase();
    const toNormalized = toValue.trim().toLowerCase();
    
    if (fromNormalized === toNormalized) {
      console.log('⚠️ Departure and arrival are the same');
      journeySearchRetries.current++;
      
      if (journeySearchRetries.current < maxJourneySearchRetries) {
        const errorMsg = `You cannot have the same departure and arrival location. Try again. Attempt ${journeySearchRetries.current} of ${maxJourneySearchRetries}.`;
        setError(errorMsg);
        setConversationState('asking_origin');
        setStatusMessage('Asking for departure location...');
        
        Speech.stop();
        Speech.speak('You cannot have the same departure and arrival location. Please say your departure location again.', {
          language: 'en-GB',
          rate: 0.9,
          volume: 1.0,
          onDone: () => {
            // Reset inputs and ask again
            setFrom('');
            setTo('');
            playListenStartCue(startListeningForOrigin);
          },
        });
      } else {
        // Max retries reached
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

    try {
      const firstUrl = `${TFL_API_BASE}/Journey/JourneyResults/${encodeURIComponent(fromValue)}/to/${encodeURIComponent(toValue)}`;
      console.log('First call:', firstUrl);

      const firstResponse = await fetch(firstUrl);

      if (firstResponse.status === 300) {
        const disambiguationData = await firstResponse.json();
        console.log('Got 300 response, extracting IDs...');

        const fromId = disambiguationData.fromLocationDisambiguation?.disambiguationOptions?.[0]?.parameterValue;
        const toId = disambiguationData.toLocationDisambiguation?.disambiguationOptions?.[0]?.parameterValue;

        if (!fromId || !toId) {
          const errorMsg = 'Could not resolve the stations. Please verify the names.';
          setError(errorMsg);
          setLoading(false);
          setConversationState('error');
          Speech.speak(errorMsg, {
            language: 'en-GB',
            rate: 0.9,
            volume: 1.0,
            onDone: () => {
              askToRetry();
            },
          });
          return;
        }

        console.log('Resolved IDs:', fromId, toId);

        const secondUrl = `${TFL_API_BASE}/Journey/JourneyResults/${fromId}/to/${toId}`;
        console.log('Second call:', secondUrl);

        const secondResponse = await fetch(secondUrl);
        if (!secondResponse.ok) throw new Error(`API error: ${secondResponse.status}`);

        const data: JourneyResponse = await secondResponse.json();
        const results = data.journeys || [];
        
        // Handle no routes found
        if (results.length === 0) {
          console.log('⚠️ No routes found');
          journeySearchRetries.current++;
          
          if (journeySearchRetries.current < maxJourneySearchRetries) {
            const errorMsg = `No routes found for ${fromValue} to ${toValue}. Try again. Attempt ${journeySearchRetries.current} of ${maxJourneySearchRetries}.`;
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
                // Reset inputs and ask again
                setFrom('');
                setTo('');
                playListenStartCue(startListeningForOrigin);
              },
            });
          } else {
            // Max retries reached
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
          return;
        }
        
        // Success: routes found
        journeySearchRetries.current = 0; // Reset retry counter
        setJourneys(results);
        setConversationState('results');
        setStatusMessage('Route found!');
        setLoading(false);
        speakResults(results);

      } else if (firstResponse.ok) {
        const data: JourneyResponse = await firstResponse.json();
        const results = data.journeys || [];
        
        // Handle no routes found
        if (results.length === 0) {
          console.log('⚠️ No routes found');
          journeySearchRetries.current++;
          
          if (journeySearchRetries.current < maxJourneySearchRetries) {
            const errorMsg = `No routes found for ${fromValue} to ${toValue}. Try again. Attempt ${journeySearchRetries.current} of ${maxJourneySearchRetries}.`;
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
                // Reset inputs and ask again
                setFrom('');
                setTo('');
                playListenStartCue(startListeningForOrigin);
              },
            });
          } else {
            // Max retries reached
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
          return;
        }
        
        // Success: routes found
        journeySearchRetries.current = 0; // Reset retry counter
        setJourneys(results);
        setConversationState('results');
        setStatusMessage('Route found!');
        setLoading(false);
        speakResults(results);
      } else {
        throw new Error(`API error: ${firstResponse.status}`);
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error searching for route';
      setError(errorMsg);
      setConversationState('error');
      setStatusMessage('Service unavailable');
      console.error('Journey search error:', err);
      
      Speech.stop();
      Speech.speak('The service is currently unavailable. Please try again later. The application will now close. Goodbye.', {
        language: 'en-GB',
        rate: 0.9,
        volume: 1.0,
        onStart: () => {
          console.log('🗣️ Speaking service error message');
        },
        onDone: () => {
          console.log('✅ Closing app due to service error');
          setTimeout(() => {
            closeApp();
          }, 1000);
        },
        onError: (error) => {
          console.error('❌ Error speaking service error:', error);
          closeApp();
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Ask if user wants to retry after error
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

  const startListeningForRetry = () => {
    setConversationState('listening_retry');
    setStatusMessage('Listening for your answer...');
    
    // Reset error processing flag
    isProcessingError.current = false;
    
    ExpoSpeechRecognitionModule.start({
      lang: 'en-GB',
      interimResults: false,
      maxAlternatives: 1,
    });
  };

  // Allow user to start a new search
  const startNewSearch = () => {
    setFrom('');
    setTo('');
    fromRef.current = '';
    toRef.current = '';
    setJourneys([]);
    setError('');
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} hora${hours > 1 ? 's' : ''} y ${mins} minutos`;
  };

  const formatDurationShort = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get status message based on conversation state
  const getStatusDisplay = () => {
    switch (conversationState) {
      case 'splash':
        return '';
      case 'greeting':
        return '👋 Greeting...';
      case 'asking_origin':
        return '📍 Asking "Where are you departing from?"';
      case 'listening_origin':
        return '🎙️ Listening for your location...';
      case 'confirming_origin':
        return '✅ Confirming your location';
      case 'asking_destination':
        return '📍 Asking "Where do you want to go?"';
      case 'listening_destination':
        return '🎙️ Listening for your destination...';
      case 'confirming_destination':
        return '✅ Confirming destination';
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
        return statusMessage;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Splash Screen */}
      {conversationState === 'splash' && (
        <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
          <Image
            source={require('./assets/logo-eye.png')}
            style={styles.splashLogo}
            resizeMode="contain"
          />
        </Animated.View>
      )}

      {/* Main App Content */}
      {conversationState !== 'splash' && (
        <>
          <View style={styles.header}>
            <Image
              source={require('./assets/logo-eye.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Status indicator */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{getStatusDisplay()}</Text>
          </View>

          {/* Listening indicator with animation */}
          {isListening && (
            <View style={styles.listeningContainer}>
              <Animated.View style={[styles.listeningCircle, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.listeningIcon}>🎙️</Text>
              </Animated.View>
              <Text style={styles.listeningTitle}>Listening...</Text>
              <View style={styles.waveformContainer}>
                <View style={[styles.wave, styles.wave1]} />
                <View style={[styles.wave, styles.wave2]} />
                <View style={[styles.wave, styles.wave3]} />
                <View style={[styles.wave, styles.wave4]} />
                <View style={[styles.wave, styles.wave5]} />
              </View>
              <Text style={styles.listeningSubtext}>voice assistant</Text>
            </View>
          )}

          {/* Error display */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={startNewSearch}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Journey results */}
          <ScrollView style={styles.resultsContainer}>
            {/* Current input display */}
            {(from || to) && (
              <View style={styles.inputDisplay}>
                {from && (
                  <View style={styles.inputDisplayRow}>
                    <Text style={styles.inputLabel}>From:</Text>
                    <Text style={styles.inputValue}>{from}</Text>
                  </View>
                )}
                {to && (
                  <View style={styles.inputDisplayRow}>
                    <Text style={styles.inputLabel}>To:</Text>
                    <Text style={styles.inputValue}>{to}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Replay button */}
            {journeys.length > 0 && (
              <TouchableOpacity
                style={styles.replayButton}
                onPress={() => speakResults(journeys)}
              >
                <Text style={styles.replayButtonText}>🔊 Repeat Route</Text>
              </TouchableOpacity>
            )}

            {/* Journey cards */}
            {journeys.map((journey, idx) => (
              <View key={idx} style={styles.journeyCard}>
                <View style={styles.journeyHeader}>
                  <Text style={styles.journeyTitle}>Option {idx + 1}</Text>
                  <Text style={styles.journeyDuration}>
                    {formatDurationShort(journey.duration)}
                  </Text>
                </View>

                {journey.legs.map((leg, legIdx) => (
                  <View key={legIdx} style={styles.legContainer}>
                    <View style={styles.legHeader}>
                      <Text style={styles.legMode}>{leg.mode.id.toUpperCase()}</Text>
                      {leg.routeOptions && leg.routeOptions[0] && (
                        <Text style={styles.legRoute}>{leg.routeOptions[0].name}</Text>
                      )}
                    </View>

                    <Text style={styles.legInstruction}>{leg.instruction.summary}</Text>

                    <View style={styles.legPoints}>
                      <Text style={styles.pointText}>📍 {leg.departurePoint.commonName}</Text>
                      <Text style={styles.pointText}>📍 {leg.arrivalPoint.commonName}</Text>
                    </View>

                    <Text style={styles.legDuration}>{formatDurationShort(leg.duration)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7B68EE',
  },
  // Splash Screen
  splashContainer: {
    flex: 1,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  splashLogo: {
    width: 350,
    height: 350,
    marginBottom: 30,
  },
  splashTitle: {
    fontSize: 48,
    fontWeight: '300',
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  splashSubtitle: {
    fontSize: 20,
    color: '#FFD700',
    fontWeight: '400',
  },
  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#7B68EE',
    paddingTop: 60,
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  subtitleContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  subtitleBeyond: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '400',
  },
  // Status display
  statusContainer: {
    padding: 15,
    backgroundColor: '#9B88EE',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Listening container (full screen overlay)
  listeningContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2D1B69',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  listeningCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#5B4EBE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  listeningIcon: {
    fontSize: 50,
  },
  listeningTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#9B7FD9',
    marginBottom: 40,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 100,
    marginBottom: 20,
  },
  wave: {
    width: 8,
    backgroundColor: '#7B68EE',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  wave1: {
    height: 30,
  },
  wave2: {
    height: 60,
  },
  wave3: {
    height: 90,
  },
  wave4: {
    height: 60,
  },
  wave5: {
    height: 30,
  },
  listeningSubtext: {
    fontSize: 16,
    color: '#7B68EE',
    fontWeight: '400',
  },
  // Input display
  inputDisplay: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
  },
  inputDisplayRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B68EE',
    width: 60,
  },
  inputValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  replayButton: {
    backgroundColor: '#7B68EE',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
  },
  replayButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#7B68EE',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  journeyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 15,
    marginVertical: 10,
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#E8E0FF',
  },
  journeyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D1B69',
  },
  journeyDuration: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7B68EE',
  },
  legContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBFF',
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legMode: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#7B68EE',
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 10,
  },
  legRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B69',
  },
  legInstruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  legPoints: {
    marginVertical: 8,
  },
  pointText: {
    fontSize: 13,
    color: '#444',
    marginVertical: 3,
  },
  legDuration: {
    fontSize: 12,
    color: '#9B88EE',
    fontStyle: 'italic',
    marginTop: 5,
  },
});
