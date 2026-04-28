import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
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
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [statusMessage, setStatusMessage] = useState('Welcome to IntuitJourney');
  
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const conversationStateRef = useRef<ConversationState>('idle');
  
  // Keep refs in sync
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);
  
  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  // Start conversation on app mount
  useEffect(() => {
    startConversation();
  }, []);

  const startConversation = async () => {
    // Request permissions first
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      setError('Microphone permission is required for voice input.');
      setConversationState('error');
      return;
    }

    // Start greeting
    setConversationState('greeting');
    setStatusMessage('Greeting...');
    
    Speech.speak('Hello! Welcome to IntuitJourney. Your voice-first travel assistant.', {
      language: 'en-GB',
      rate: 0.9,
      onDone: () => {
        askForOrigin();
      },
    });
  };

  const askForOrigin = () => {
    setConversationState('asking_origin');
    setStatusMessage('Asking for origin...');
    
    Speech.speak('Where are you? Please say your current location.', {
      language: 'en-GB',
      rate: 0.9,
      onDone: () => {
        startListeningForOrigin();
      },
    });
  };

  const startListeningForOrigin = () => {
    setConversationState('listening_origin');
    setStatusMessage('Listening for your location...');
    
    ExpoSpeechRecognitionModule.start({
      lang: 'en-GB',
      interimResults: false,
      maxAlternatives: 1,
    });
  };

  const askForDestination = () => {
    setConversationState('asking_destination');
    setStatusMessage('Asking for destination...');
    
    Speech.speak(`You are at ${from}. Where do you want to go?`, {
      language: 'en-GB',
      rate: 0.9,
      onDone: () => {
        startListeningForDestination();
      },
    });
  };

  const startListeningForDestination = () => {
    setConversationState('listening_destination');
    setStatusMessage('Listening for your destination...');
    
    ExpoSpeechRecognitionModule.start({
      lang: 'en-GB',
      interimResults: false,
      maxAlternatives: 1,
    });
  };

  const confirmAndSearch = () => {
    setConversationState('confirming_destination');
    setStatusMessage('Confirming and searching...');
    
    Speech.speak(`Going to ${to}. Let me find your journey.`, {
      language: 'en-GB',
      rate: 0.9,
      onDone: () => {
        searchJourney();
      },
    });
  };

  const speakResults = (journeyList: Journey[]) => {
    Speech.stop();
    if (journeyList.length === 0) {
      Speech.speak('No journeys found. Please try different locations.', { language: 'en-GB' });
      return;
    }
    const journey = journeyList[0];
    let text = `Found ${journeyList.length} journey option${journeyList.length > 1 ? 's' : ''}. `;
    text += `The best option takes ${formatDuration(journey.duration)}. `;
    journey.legs.forEach((leg) => {
      text += `${leg.instruction.summary}. `;
    });
    Speech.speak(text, { language: 'en-GB', rate: 0.9 });
  };

  // Speech recognition event handlers
  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    
    // Handle state transition based on current conversation state
    const currentState = conversationStateRef.current;
    
    if (currentState === 'listening_origin') {
      // Finished listening for origin, ask for destination
      if (from.trim()) {
        askForDestination();
      } else {
        // No input received, ask again
        askForOrigin();
      }
    } else if (currentState === 'listening_destination') {
      // Finished listening for destination, search journey
      if (to.trim()) {
        confirmAndSearch();
      } else {
        // No input received, ask again
        askForDestination();
      }
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (!transcript) return;
    
    const currentState = conversationStateRef.current;
    
    if (currentState === 'listening_origin') {
      setFrom(transcript);
    } else if (currentState === 'listening_destination') {
      setTo(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error, event.message);
    setIsListening(false);
    
    const currentState = conversationStateRef.current;
    
    if (currentState === 'listening_origin') {
      // Try again for origin
      askForOrigin();
    } else if (currentState === 'listening_destination') {
      // Try again for destination
      askForDestination();
    }
  });


  const searchJourney = async () => {
    if (!from.trim() || !to.trim()) {
      setError('Please enter both origin and destination');
      setConversationState('error');
      return;
    }

    setLoading(true);
    setConversationState('searching');
    setStatusMessage('Searching for journeys...');
    setError('');
    setJourneys([]);

    try {
      const firstUrl = `${TFL_API_BASE}/Journey/JourneyResults/${encodeURIComponent(from)}/to/${encodeURIComponent(to)}`;
      console.log('First call:', firstUrl);

      const firstResponse = await fetch(firstUrl);

      if (firstResponse.status === 300) {
        const disambiguationData = await firstResponse.json();
        console.log('Got 300 response, extracting IDs...');

        const fromId = disambiguationData.fromLocationDisambiguation?.disambiguationOptions?.[0]?.parameterValue;
        const toId = disambiguationData.toLocationDisambiguation?.disambiguationOptions?.[0]?.parameterValue;

        if (!fromId || !toId) {
          setError('Could not resolve station IDs. Please check station names.');
          setLoading(false);
          setConversationState('error');
          return;
        }

        console.log('Resolved IDs:', fromId, toId);

        const secondUrl = `${TFL_API_BASE}/Journey/JourneyResults/${fromId}/to/${toId}`;
        console.log('Second call:', secondUrl);

        const secondResponse = await fetch(secondUrl);
        if (!secondResponse.ok) throw new Error(`API error: ${secondResponse.status}`);

        const data: JourneyResponse = await secondResponse.json();
        const results = data.journeys || [];
        setJourneys(results);
        setConversationState('results');
        setStatusMessage('Journey found!');
        speakResults(results);

      } else if (firstResponse.ok) {
        const data: JourneyResponse = await firstResponse.json();
        const results = data.journeys || [];
        setJourneys(results);
        setConversationState('results');
        setStatusMessage('Journey found!');
        speakResults(results);
      } else {
        throw new Error(`API error: ${firstResponse.status}`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching journey');
      setConversationState('error');
      setStatusMessage('Error finding journey');
      console.error('Journey search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Allow user to start a new search
  const startNewSearch = () => {
    setFrom('');
    setTo('');
    setJourneys([]);
    setError('');
    askForOrigin();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} and ${mins} minutes`;
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
      case 'greeting':
        return '👋 Saying hello...';
      case 'asking_origin':
        return '📍 Asking "Where are you?"';
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
        return '🔍 Searching for journeys...';
      case 'results':
        return '✅ Journey found!';
      case 'error':
        return '❌ Error occurred';
      default:
        return statusMessage;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Image
          source={require('./assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>IntuitJourney</Text>
        <Text style={styles.subtitle}>Voice-first travel assistant</Text>
      </View>

      {/* Status indicator */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{getStatusDisplay()}</Text>
      </View>

      {/* Listening indicator */}
      {isListening && (
        <View style={styles.listeningBanner}>
          <Text style={styles.listeningText}>🎙️ Speak now...</Text>
        </View>
      )}

      {/* Error display */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={startNewSearch}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Journey results - shown visually for accessibility helpers */}
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
            <Text style={styles.replayButtonText}>🔊 Replay Journey</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#86C2C4',
    paddingTop: 20,
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  // Voice-first status display
  statusContainer: {
    padding: 20,
    backgroundColor: '#E8F4F5',
    borderBottomWidth: 1,
    borderBottomColor: '#D1C3B7',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    color: '#2C3E50',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Input display (for visual confirmation)
  inputDisplay: {
    padding: 15,
    backgroundColor: '#F8F8F8',
    marginBottom: 10,
  },
  inputDisplayRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 50,
  },
  inputValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  // Listening indicator
  listeningBanner: {
    backgroundColor: '#fff3cd',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffc107',
  },
  listeningText: {
    color: '#856404',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  replayButton: {
    backgroundColor: '#86C2C4',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  replayButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#86C2C4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  journeyCard: {
    backgroundColor: '#FEFEFE',
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#86C2C4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D1C3B7',
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  journeyDuration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#86C2C4',
  },
  legContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#D1C3B7',
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legMode: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#86C2C4',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  legRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  legInstruction: {
    fontSize: 14,
    color: '#BAB4AD',
    marginBottom: 8,
  },
  legPoints: {
    marginVertical: 5,
  },
  pointText: {
    fontSize: 13,
    color: '#333',
    marginVertical: 2,
  },
  legDuration: {
    fontSize: 12,
    color: '#C0DDEA',
    fontStyle: 'italic',
  },
});
