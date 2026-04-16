import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

function GoldParticle({ delay, x }: { delay: number; x: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        bottom: 0,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#C8A96E',
        opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.6, 0] }),
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.7] }) }],
      }}
    />
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();

  const logoScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const arabicOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(60)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const devOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(arabicOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(buttonSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(buttonOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(devOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading && user?.convexUserId) {
      router.replace('/(tabs)');
    }
  }, [isLoading, user]);

  const particles = Array.from({ length: 20 }, (_, i) => ({
    delay: Math.random() * 3000,
    x: Math.random() * width,
  }));

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A0F' }]}>
      {particles.map((p, i) => (
        <GoldParticle key={i} delay={p.delay} x={p.x} />
      ))}

      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
          <View style={styles.crescentOuter}>
            <Ionicons name="moon" size={80} color="#C8A96E" />
            <View style={styles.starContainer}>
              <Ionicons name="star" size={24} color="#C8A96E" />
            </View>
          </View>
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
          SULTAN
        </Animated.Text>

        <Animated.Text style={[styles.arabicTitle, { opacity: arabicOpacity }]}>
          سلطان
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          كن سلطان مالك
        </Animated.Text>
        <Animated.Text style={[styles.taglineEn, { opacity: taglineOpacity }]}>
          Be the Sultan of Your Money
        </Animated.Text>

        <Animated.View style={{ opacity: buttonOpacity, transform: [{ translateY: buttonSlide }] }}>
          <TouchableOpacity
            testID="start-free-btn"
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => router.push('/auth?mode=register')}
          >
            <Text style={styles.primaryButtonText}>ابدأ مجاناً / Start Free</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="sign-in-btn"
            style={styles.outlineButton}
            activeOpacity={0.8}
            onPress={() => router.push('/auth?mode=login')}
          >
            <Text style={styles.outlineButtonText}>تسجيل الدخول / Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.Text style={[styles.devCredit, { opacity: devOpacity }]}>
        Developed by Ziad Sabry
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  crescentOuter: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#C8A96E',
    letterSpacing: 8,
    marginBottom: 4,
  },
  arabicTitle: {
    fontSize: 36,
    color: '#C8A96E',
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    color: '#C8A96E',
    opacity: 0.8,
    marginBottom: 4,
  },
  taglineEn: {
    fontSize: 14,
    color: '#9A9A9A',
    marginBottom: 48,
  },
  primaryButton: {
    backgroundColor: '#C8A96E',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 280,
    alignItems: 'center',
    shadowColor: '#C8A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: '700',
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: '#C8A96E',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 280,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#C8A96E',
    fontSize: 16,
    fontWeight: '600',
  },
  devCredit: {
    position: 'absolute',
    bottom: 40,
    color: '#444455',
    fontSize: 12,
    letterSpacing: 1,
  },
});
