import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import {
  formatDurationShort,
  getStatusDisplay,
} from './src/features/journey/utils';
import { useJourneyFlow } from './src/features/journey/hooks/useJourneyFlow';

export default function App() {
  const {
    from,
    to,
    journeys,
    error,
    isListening,
    conversationState,
    statusMessage,
    fadeAnim,
    pulseAnim,
    startNewSearch,
    speakResults,
  } = useJourneyFlow();

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
            <Text style={styles.statusText}>{getStatusDisplay(conversationState, statusMessage)}</Text>
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
