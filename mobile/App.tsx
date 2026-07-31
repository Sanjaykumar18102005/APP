import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomHeader } from './src/components/CustomHeader';
import { HomeScreen } from './src/screens/HomeScreen';
import { GlowScreen } from './src/screens/GlowScreen';
import { VisionScreen } from './src/screens/VisionScreen';
import { VoiceScreen } from './src/screens/VoiceScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { Home, Sparkles, Camera, Mic, MessageSquare, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0b0f19" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            header: () => <CustomHeader />,
            tabBarStyle: {
              backgroundColor: '#0b0f19',
              borderTopColor: 'rgba(255, 255, 255, 0.08)',
              height: 60,
              paddingBottom: 8,
              paddingTop: 6,
            },
            tabBarActiveTintColor: '#ec4899',
            tabBarInactiveTintColor: '#6b7280',
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ color, size }: { color: string; size: number }) => <Home color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Glow"
            component={GlowScreen}
            options={{
              tabBarLabel: 'Glow',
              tabBarIcon: ({ color, size }: { color: string; size: number }) => <Sparkles color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Vision"
            component={VisionScreen}
            options={{
              tabBarIcon: ({ color, size }: { color: string; size: number }) => <Camera color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Voice"
            component={VoiceScreen}
            options={{
              tabBarIcon: ({ color, size }: { color: string; size: number }) => <Mic color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              tabBarIcon: ({ color, size }: { color: string; size: number }) => <MessageSquare color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarIcon: ({ color, size }: { color: string; size: number }) => <User color={color} size={size} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
