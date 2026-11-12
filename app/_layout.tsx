import React from 'react';
import { Tabs } from 'expo-router';
import TabIcon from '../src/components/TabIcon';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { DatabaseProvider } from '../src/hooks/useDatabase';
import { ThemeProvider, useAppTheme } from '../src/hooks/useAppTheme';
import { DriveSyncProvider } from '../src/hooks/useDriveSync';
import { PreferencesProvider } from '../src/hooks/usePreferences';
import { PendingExpenseDeletionProvider } from '../src/hooks/usePendingExpenseDeletion';
import { nunito } from '../src/theme/theme';

const destinations = [
  { name: 'index', title: 'Dashboard', icon: 'dashboard' },
  { name: 'expenses', title: 'Expenses', icon: 'expenses' },
  { name: 'budget', title: 'Budget', icon: 'budget' },
  { name: 'settings', title: 'Settings', icon: 'settings' },
] as const;

function AppContent() {
  const { isDark, colors } = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: nunito.semibold,
        }}
      >
        {destinations.map(({ name, title, icon }) => (
          <Tabs.Screen key={name} name={name} options={{
            title,
            tabBarIcon: ({ focused, size }) => (
              <TabIcon name={icon} color={focused ? colors.primary : colors.textSecondary} size={size} />
            ),
          }} />
        ))}
      </Tabs>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <DatabaseProvider>
        <PreferencesProvider>
          <ThemeProvider>
            <DriveSyncProvider>
              <PendingExpenseDeletionProvider>
                <AppContent />
              </PendingExpenseDeletionProvider>
            </DriveSyncProvider>
          </ThemeProvider>
        </PreferencesProvider>
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

