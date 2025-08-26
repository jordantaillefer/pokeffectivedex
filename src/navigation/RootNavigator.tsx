import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import type { RootStackParamList, MainTabParamList } from '../types/navigation';

// Screens (to be created)
import SearchScreen from '../screens/SearchScreen';
import TeamsScreen from '../screens/TeamsScreen';
import PokemonDetailScreen from '../screens/PokemonDetailScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';

const RootStack = createStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Teams') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Recommendations') {
            iconName = focused ? 'star' : 'star-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e74c3c',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e1e1e1',
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#e74c3c',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <MainTab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          title: 'Recherche',
        }}
      />
      <MainTab.Screen 
        name="Teams" 
        component={TeamsScreen}
        options={{
          title: 'Mes Équipes',
        }}
      />
      <MainTab.Screen 
        name="Recommendations" 
        component={RecommendationsScreen}
        options={{
          title: 'Recommandations',
        }}
      />
    </MainTab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#e74c3c',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <RootStack.Screen 
          name="MainTabs" 
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <RootStack.Screen 
          name="PokemonDetail" 
          component={PokemonDetailScreen}
          options={({ route }) => ({
            title: route.params.pokemonName,
          })}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}