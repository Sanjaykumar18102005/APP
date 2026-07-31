import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { TOKENS } from '../theme/tokens';
import { 
  User, 
  LayoutList, 
  History, 
  Settings, 
  CreditCard, 
  ChevronLeft, 
  Copy, 
  Trash2, 
  LogOut, 
  Sparkles 
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

type ViewMode = 'main' | 'saved' | 'history' | 'settings' | 'subscription';

export const ProfileScreen = () => {
  const [view, setView] = useState<ViewMode>('main');
  const [copied, setCopied] = useState(false);

  // Mock user state matching Firebase Auth
  const user = {
    displayName: "AI Power User",
    email: "user@promptglow.app",
    plan: "Free",
    promptsCount: 42,
    chatsCount: 18,
    visionCount: 9,
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {view !== 'main' && (
        <TouchableOpacity style={styles.backBtn} onPress={() => setView('main')}>
          <ChevronLeft color={TOKENS.colors.textSoft} size={20} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      )}

      {view === 'main' && (
        <>
          {/* User Hero Card */}
          <GlassCard style={styles.userCard} pinkGlow>
            <View style={styles.avatarCircle}>
              <User color={TOKENS.colors.primaryAccent} size={32} />
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user.displayName}</Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{user.plan} PLAN</Text>
                </View>
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </GlassCard>

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            <GlassCard style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: TOKENS.colors.primaryAccent }]}>
                {user.promptsCount}
              </Text>
              <Text style={styles.metricLabel}>PROMPTS</Text>
            </GlassCard>

            <GlassCard style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: '#3b82f6' }]}>
                {user.chatsCount}
              </Text>
              <Text style={styles.metricLabel}>CHATS</Text>
            </GlassCard>

            <GlassCard style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: TOKENS.colors.secondaryAccent }]}>
                {user.visionCount}
              </Text>
              <Text style={styles.metricLabel}>VISION SCANS</Text>
            </GlassCard>
          </View>

          {/* Navigation Feature Cards */}
          <View style={styles.navStack}>
            <TouchableOpacity onPress={() => setView('saved')}>
              <GlassCard style={styles.navCard}>
                <View style={[styles.navIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <LayoutList color="#3b82f6" size={22} />
                </View>
                <View style={styles.navTextContainer}>
                  <Text style={styles.navTitle}>Saved Prompts</Text>
                  <Text style={styles.navSub}>Manage your collection</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setView('history')}>
              <GlassCard style={styles.navCard}>
                <View style={[styles.navIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <History color={TOKENS.colors.secondaryAccent} size={22} />
                </View>
                <View style={styles.navTextContainer}>
                  <Text style={styles.navTitle}>Recent History</Text>
                  <Text style={styles.navSub}>Your generated context</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setView('subscription')}>
              <GlassCard style={styles.navCard}>
                <View style={[styles.navIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <CreditCard color="#f59e0b" size={22} />
                </View>
                <View style={styles.navTextContainer}>
                  <Text style={styles.navTitle}>Subscription</Text>
                  <Text style={styles.navSub}>Manage your plan</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setView('settings')}>
              <GlassCard style={styles.navCard}>
                <View style={[styles.navIconBox, { backgroundColor: 'rgba(156, 163, 175, 0.15)' }]}>
                  <Settings color={TOKENS.colors.textSoft} size={22} />
                </View>
                <View style={styles.navTextContainer}>
                  <Text style={styles.navTitle}>Settings</Text>
                  <Text style={styles.navSub}>App preferences</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>
        </>
      )}

      {view === 'saved' && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Saved Prompts</Text>
          <GlassCard style={styles.promptItemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Landing Page Design Prompt</Text>
              <TouchableOpacity onPress={() => handleCopy("Design a modern responsive page")}>
                <Copy color={TOKENS.colors.textSoft} size={18} />
              </TouchableOpacity>
            </View>
            <Text style={styles.itemContent}>
              Act as a senior UI designer creating a high-converting landing page with glassmorphic cards and dark themes.
            </Text>
          </GlassCard>
        </View>
      )}

      {view === 'history' && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent History</Text>
          <GlassCard style={styles.promptItemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Python Web Scraper</Text>
              <TouchableOpacity onPress={() => handleCopy("Write a Python BeautifulSoup scraper")}>
                <Copy color={TOKENS.colors.textSoft} size={18} />
              </TouchableOpacity>
            </View>
            <Text style={styles.itemContent}>
              Build a resilient Python web scraper using BeautifulSoup and requests with retry capabilities.
            </Text>
          </GlassCard>
        </View>
      )}

      {view === 'subscription' && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Subscription Plan</Text>
          <GlassCard style={styles.subCard} glow>
            <View style={styles.subBadgeCircle}>
              <Sparkles color={TOKENS.colors.secondaryAccent} size={24} />
            </View>
            <Text style={styles.subPlanTitle}>PromptGlow Free</Text>
            <Text style={styles.subPlanSub}>You are currently on the free plan with basic limits.</Text>
            <TouchableOpacity style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Pro Plan: Pay As You Go</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}

      {view === 'settings' && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <GlassCard style={styles.settingsCard}>
            <Text style={styles.settingLabel}>Theme Mode</Text>
            <View style={styles.themeRow}>
              <View style={[styles.themeChip, styles.themeChipActive]}>
                <Text style={styles.themeTextActive}>Dark</Text>
              </View>
              <View style={styles.themeChip}>
                <Text style={styles.themeText}>Light</Text>
              </View>
            </View>
          </GlassCard>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.colors.bgNebula,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  backText: {
    fontSize: 14,
    color: TOKENS.colors.textSoft,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
    gap: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: TOKENS.borderRadius.full,
    backgroundColor: 'rgba(255, 0, 122, 0.15)',
    borderWidth: 2,
    borderColor: TOKENS.colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: TOKENS.colors.textMain,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: TOKENS.borderRadius.full,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: TOKENS.colors.secondaryAccent,
  },
  userEmail: {
    fontSize: 13,
    color: TOKENS.colors.textSoft,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: TOKENS.colors.textSoft,
    letterSpacing: 1,
  },
  navStack: {
    gap: 12,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  navIconBox: {
    width: 44,
    height: 44,
    borderRadius: TOKENS.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: TOKENS.colors.glassBorder,
  },
  navTextContainer: {
    flex: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TOKENS.colors.textMain,
    marginBottom: 2,
  },
  navSub: {
    fontSize: 12,
    color: TOKENS.colors.textSoft,
  },
  sectionContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TOKENS.colors.textMain,
    marginBottom: 16,
  },
  promptItemCard: {
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TOKENS.colors.textMain,
  },
  itemContent: {
    fontSize: 13,
    color: TOKENS.colors.textSoft,
    lineHeight: 18,
  },
  subCard: {
    padding: 24,
    alignItems: 'center',
  },
  subBadgeCircle: {
    width: 52,
    height: 52,
    borderRadius: TOKENS.borderRadius.full,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  subPlanTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TOKENS.colors.textMain,
    marginBottom: 6,
  },
  subPlanSub: {
    fontSize: 13,
    color: TOKENS.colors.textSoft,
    textAlign: 'center',
    marginBottom: 20,
  },
  upgradeBtn: {
    width: '100%',
    backgroundColor: TOKENS.colors.secondaryAccent,
    borderRadius: TOKENS.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  upgradeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsCard: {
    padding: 18,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.colors.textSoft,
    marginBottom: 12,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: TOKENS.borderRadius.md,
    backgroundColor: TOKENS.colors.inputBg,
    borderWidth: 1,
    borderColor: TOKENS.colors.glassBorder,
  },
  themeChipActive: {
    backgroundColor: 'rgba(255, 0, 122, 0.2)',
    borderColor: TOKENS.colors.primaryAccent,
  },
  themeText: {
    fontSize: 13,
    color: TOKENS.colors.textSoft,
  },
  themeTextActive: {
    fontSize: 13,
    color: TOKENS.colors.textMain,
    fontWeight: '700',
  },
});
