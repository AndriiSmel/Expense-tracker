import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ThemeColors } from '../core/types';
import { useDriveSync } from '../hooks/useDriveSync';
import { nunito, radius, spacing, typography } from '../theme/theme';

export default function DriveSyncSettings({ colors }: { colors: ThemeColors }) {
  const drive = useDriveSync();
  const [showInfo, setShowInfo] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [draftKey, setDraftKey] = useState('');
  const canSync = Boolean(drive.account && drive.key);
  const action = (label: string, onPress: () => void, disabled = false) => (
      <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={styles.action}>
        <Text style={[styles.label, { color: disabled ? colors.textTertiary : colors.primary }]}>{label}</Text>
      </Pressable>
  );

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>GOOGLE DRIVE SYNC</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="How Google Drive sync works"
          accessibilityState={{ expanded: showInfo }}
          onPress={() => setShowInfo(!showInfo)}
          style={styles.infoButton}
        >
          <MaterialCommunityIcons name="information-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {showInfo && (
          <Text style={[styles.details, { color: colors.textSecondary }]}>
            Connect the same Google account on each device and enter the same sync key. Google Drive stores encrypted changes. When automatic sync is on, this device sends and receives changes after you save a change here. Tap Sync now to bring in changes from another device at any time. If two devices edit the same item offline, sync keeps one version. Keep a copy of your key somewhere safe so you can connect a new device.
          </Text>
        )}
        {!drive.available ? (
          <Text style={[styles.details, { color: colors.textSecondary }]}>Google Drive sync requires a configured development or standalone build.</Text>
        ) : (
          <>
            {drive.account ? (
              <>
                <View style={styles.row}>
                  <Text style={[styles.label, { color: colors.text }]}>{drive.account}</Text>
                  {action('Disconnect', () => {
                    setShowKey(false);
                    setDraftKey('');
                    void drive.disconnect();
                  }, drive.busy)}
                </View>
                {!drive.key && (
                  <>
                    <Text style={[styles.details, { color: colors.textSecondary }]}>
                      Enter the key from your other device, or generate one if this is your first device.
                    </Text>
                    <TextInput
                      accessibilityLabel="Sync key"
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry
                      value={draftKey}
                      onChangeText={setDraftKey}
                      placeholder="Enter sync key"
                      placeholderTextColor={colors.textTertiary}
                      style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceSecondary }]}
                    />
                    <View style={styles.row}>
                      {action('Generate key', () => {
                        setShowKey(true);
                        void drive.saveKey(drive.generateKey());
                      }, drive.busy)}
                      {action('Use this key', () => {
                        void drive.saveKey(draftKey);
                        setDraftKey('');
                      }, drive.busy || draftKey.trim().length !== 64)}
                    </View>
                  </>
                )}
                {drive.key && (
                  <>
                    <View style={styles.row}>
                      <Text style={[styles.label, { color: colors.text }]}>Automatic two-way sync</Text>
                      <Switch
                        accessibilityLabel="Automatic two-way sync"
                        disabled={drive.busy}
                        value={drive.auto}
                        onValueChange={(value) => void drive.setAutomatic(value)}
                      />
                    </View>
                    <View style={styles.row}>
                      {action(drive.busy ? 'Working…' : 'Sync now', () => void drive.sync(), !canSync || drive.busy)}
                      {action(showKey ? 'Hide key' : 'Show sync key', () => setShowKey(!showKey))}
                    </View>
                    {showKey && (
                      <Text selectable style={[styles.details, { color: colors.text }]}>{drive.key}</Text>
                    )}
                  </>
                )}
              </>
            ) : action('Connect Google Drive', () => void drive.connect(), !drive.ready || drive.busy)}
            {drive.lastSync && (
              <Text style={[styles.details, { color: colors.textSecondary }]}>Last synced {drive.lastSync.toLocaleString()}</Text>
            )}
            {!!drive.error && (
              <Text accessibilityLiveRegion="polite" style={[styles.details, { color: colors.danger }]}>{drive.error}</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginHorizontal: spacing.lg, marginBottom: spacing.xl },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.caption, ...nunito.bold, letterSpacing: 1 },
  card: { borderRadius: radius.lg, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  label: { ...typography.body, ...nunito.semibold },
  action: { minHeight: 44, justifyContent: 'center' },
  infoButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  details: { ...typography.bodySmall, paddingVertical: spacing.sm },
  input: { ...typography.body, padding: spacing.sm, borderRadius: radius.md },
});
