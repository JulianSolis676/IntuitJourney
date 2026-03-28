import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useState, useRef } from 'react';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

const TFL_API_BASE = 'https://api.tfl.gov.uk';

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

  const [isListening, setIsListening] = useState(false);
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const activeFieldRef = useRef<'from' | 'to' | null>(null);

  useSpeechRecognitionEvent('start', () => setIsListening(true));

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    setActiveField(null);
    activeFieldRef.current = null;
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript && activeFieldRef.current) {
      if (activeFieldRef.current === 'from') setFrom(transcript);
      else setTo(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error, event.message);
    setIsListening(false);
    setActiveField(null);
    activeFieldRef.current = null;
  });

  const startListening = async (field: 'from' | 'to') => {
    if (isListening && activeFieldRef.current === field) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      setError('Microphone permission is required for voice input.');
      return;
    }

    if (isListening) ExpoSpeechRecognitionModule.stop();

    setError('');
    setActiveField(field);
    activeFieldRef.current = field;

    ExpoSpeechRecognitionModule.start({
      lang: 'en-GB',
      interimResults: false,
      maxAlternatives: 1,
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


  const searchJourney = async () => {
    if (!from.trim() || !to.trim()) {
      setError('Please enter both origin and destination');
      return;
    }

    setLoading(true);
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
        speakResults(results);

      } else if (firstResponse.ok) {
        const data: JourneyResponse = await firstResponse.json();
        const results = data.journeys || [];
        setJourneys(results);
        speakResults(results);
      } else {
        throw new Error(`API error: ${firstResponse.status}`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching journey');
      console.error('Journey search error:', err);
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.subtitle}>Plan your TfL journey</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="From (e.g., Waterloo Station)"
            value={from}
            onChangeText={setFrom}
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[
              styles.micButton,
              isListening && activeField === 'from' && styles.micButtonActive,
            ]}
            onPress={() => startListening('from')}
            disabled={loading}
          >
            <Text style={styles.micIcon}>
              {isListening && activeField === 'from' ? '⏹' : '🎙️'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="To (e.g., King Cross Pancras)"
            value={to}
            onChangeText={setTo}
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[
              styles.micButton,
              isListening && activeField === 'to' && styles.micButtonActive,
            ]}
            onPress={() => startListening('to')}
            disabled={loading}
          >
            <Text style={styles.micIcon}>
              {isListening && activeField === 'to' ? '⏹' : '🎙️'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={searchJourney}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Search Journey</Text>
          )}
        </TouchableOpacity>
      </View>

      {isListening && (
        <View style={styles.listeningBanner}>
          <Text style={styles.listeningText}>
            🎙️ Listening for {activeField === 'from' ? 'origin' : 'destination'}...
          </Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.resultsContainer}>
        {journeys.length > 0 && (
          <TouchableOpacity
            style={styles.replayButton}
            onPress={() => speakResults(journeys)}
          >
            <Text style={styles.replayButtonText}>🔊 Replay Results</Text>
          </TouchableOpacity>
        )}

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
  searchContainer: {
    padding: 20,
    backgroundColor: '#FEFEFE',
    borderBottomWidth: 1,
    borderBottomColor: '#D1C3B7',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#BAB4AD',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FEFEFE',
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#86C2C4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  micButtonActive: {
    backgroundColor: '#e74c3c',
  },
  micIcon: {
    fontSize: 22,
  },
  searchButton: {
    backgroundColor: '#86C2C4',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  listeningBanner: {
    backgroundColor: '#fff3cd',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffc107',
  },
  listeningText: {
    color: '#856404',
    fontSize: 14,
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
