import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      console.warn('[SULTAN ErrorBoundary]', error, info?.componentStack);
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>Something interrupted us</Text>
          <Text style={styles.titleAr}>حدث خلل بسيط</Text>
          <Text style={styles.subtitle}>
            Please try again. Your data is safe.
          </Text>
          <Text style={styles.subtitleAr}>بياناتك محفوظة، حاول مرة تانية</Text>

          <TouchableOpacity testID="error-retry-btn" style={styles.btn} onPress={this.reset} activeOpacity={0.8}>
            <Text style={styles.btnText}>Try Again · حاول تانية</Text>
          </TouchableOpacity>

          {__DEV__ && this.state.error ? (
            <View style={styles.devBox}>
              <Text style={styles.devLabel}>Dev info</Text>
              <Text style={styles.devText}>{this.state.error.message}</Text>
            </View>
          ) : null}

          <Text style={styles.credit}>SULTAN · Developed by Ziad Sabry</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  crown: { fontSize: 56, marginBottom: 16 },
  title: { color: '#C8A96E', fontSize: 22, fontWeight: '800', marginBottom: 4, letterSpacing: 0.5 },
  titleAr: { color: '#C8A96E', fontSize: 18, marginBottom: 16 },
  subtitle: { color: '#A1A1AA', fontSize: 14, textAlign: 'center', marginBottom: 4 },
  subtitleAr: { color: '#9A9A9A', fontSize: 13, textAlign: 'center', marginBottom: 32 },
  btn: {
    backgroundColor: '#C8A96E',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
    minWidth: 220,
    alignItems: 'center',
  },
  btnText: { color: '#0A0A0F', fontSize: 15, fontWeight: '700' },
  devBox: { marginTop: 32, padding: 16, borderRadius: 12, backgroundColor: '#1A1A24', borderColor: '#2A2A3A', borderWidth: 1, maxWidth: '100%' },
  devLabel: { color: '#4A9EFF', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  devText: { color: '#A1A1AA', fontSize: 11, fontFamily: 'monospace' },
  credit: { position: 'absolute', bottom: 24, color: '#444455', fontSize: 11, letterSpacing: 0.5 },
});
