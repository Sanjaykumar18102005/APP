import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Modal, 
  TextInput,
  Image as RNImage 
} from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../lib/auth-context';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserHistoryFromFirestore } from '../lib/user-service';
import { 
  User, 
  LayoutList, 
  History, 
  Settings, 
  CreditCard, 
  ChevronLeft, 
  Copy, 
  Check, 
  Trash2, 
  LogOut, 
  Sparkles, 
  X,
  Mail,
  Lock,
  UserPlus
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

type ViewMode = 'main' | 'saved' | 'history' | 'settings' | 'subscription';
type AuthMode = 'login' | 'register';

export const ProfileScreen = () => {
  const { theme, setTheme, colors } = useTheme();
  const { user, authError, clearAuthError, loginWithEmail, registerWithEmail, loginWithGoogle, loginAsGuest, logout } = useAuth();
  const [view, setView] = useState<ViewMode>('main');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Data states
  const [prompts, setPrompts] = useState<any[]>([]);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [chatsCount, setChatsCount] = useState(0);
  const [visionCount, setVisionCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modal state
  const [selectedPrompt, setSelectedPrompt] = useState<any | null>(null);

  useEffect(() => {
    if (user?.uid) {
      fetchUserPrompts();
      fetchHistory();
      fetchMetricCounts();
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid && db && !user.isSandbox) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          setUserDoc(snap.data());
        }
      }, (err) => console.warn("User doc listener warning:", err));
      return () => unsub();
    }
  }, [user]);

  const fetchMetricCounts = async () => {
    if (!db || !user?.uid || user.isSandbox) return;
    try {
      const chatQuery = query(collection(db, "chats"), where("userId", "==", user.uid));
      const chatSnap = await getDocs(chatQuery);
      setChatsCount(chatSnap.size);

      const visionQuery = query(collection(db, "visionScans"), where("userId", "==", user.uid));
      const visionSnap = await getDocs(visionQuery);
      setVisionCount(visionSnap.size);
    } catch (e) {
      console.warn("Error fetching metric counts from Firestore:", e);
    }
  };

  const fetchUserPrompts = async () => {
    setLoading(true);
    if (user?.isSandbox) {
      const saved = await AsyncStorage.getItem('sandbox_saved_prompts');
      setPrompts(saved ? JSON.parse(saved) : []);
      setLoading(false);
      return;
    }

    if (!db || !user?.uid) {
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, "prompts"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setPrompts(fetched);
    } catch (err) {
      console.warn("Error fetching prompts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (user?.isSandbox) {
      const saved = await AsyncStorage.getItem('prompt_history');
      if (saved) {
        setHistoryItems(JSON.parse(saved));
      }
      return;
    }

    if (user?.uid) {
      const history = await fetchUserHistoryFromFirestore(user.uid);
      setHistoryItems(history);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) return;
    setAuthSubmitting(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email.trim(), password.trim());
      } else {
        await registerWithEmail(email.trim(), password.trim(), displayName.trim());
      }
    } catch (e) {
      console.warn("Auth submit error:", e);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleCopyText = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeletePrompt = async (id: string) => {
    if (user?.isSandbox) {
      const updated = prompts.filter(p => p.id !== id);
      setPrompts(updated);
      await AsyncStorage.setItem('sandbox_saved_prompts', JSON.stringify(updated));
      setSelectedPrompt(null);
      return;
    }

    if (!db || !id) return;
    try {
      await deleteDoc(doc(db, "prompts", id));
      setPrompts(prev => prev.filter(p => p.id !== id));
      setSelectedPrompt(null);
    } catch (err) {
      console.warn("Delete prompt error:", err);
    }
  };

  // UNAUTHENTICATED: Show Email/Password Login & Register Form
  if (!user) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.bgNebula }]} contentContainerStyle={styles.centerContent}>
        <GlassCard style={styles.authCard}>
          <View style={[styles.authAvatarCircle, { backgroundColor: colors.inputBg, borderColor: colors.glassBorder }]}>
            <User color={colors.primaryAccent} size={36} />
          </View>
          <Text style={[styles.authTitle, { color: colors.textMain }]}>
            {authMode === 'login' ? 'Sign In to PromptGlow' : 'Create Account'}
          </Text>
          <Text style={[styles.authSub, { color: colors.textSoft }]}>
            {authMode === 'login' ? 'Enter your credentials to access your saved prompts & history.' : 'Join PromptGlow to sync AI prompts across web and mobile.'}
          </Text>

          {authError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}

          {authMode === 'register' && (
            <View style={styles.inputWrapper}>
              <User color={colors.textSoft} size={18} style={styles.inputIcon} />
              <TextInput
                style={[styles.authInput, { color: colors.textMain }]}
                placeholder="Full Name"
                placeholderTextColor={colors.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Mail color={colors.textSoft} size={18} style={styles.inputIcon} />
            <TextInput
              style={[styles.authInput, { color: colors.textMain }]}
              placeholder="Email Address"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock color={colors.textSoft} size={18} style={styles.inputIcon} />
            <TextInput
              style={[styles.authInput, { color: colors.textMain }]}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={[styles.primaryAuthBtn, { backgroundColor: colors.primaryAccent }]}
            onPress={handleEmailAuth}
            disabled={authSubmitting}
          >
            {authSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryAuthBtnText}>
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toggleAuthModeBtn} 
            onPress={() => {
              clearAuthError();
              setAuthMode(authMode === 'login' ? 'register' : 'login');
            }}
          >
            <Text style={[styles.toggleAuthText, { color: colors.secondaryAccent }]}>
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>

          <View style={styles.orDividerRow}>
            <View style={styles.orLine} />
            <Text style={[styles.orText, { color: colors.textMuted }]}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity 
            style={[styles.googleAuthBtn, { backgroundColor: '#ffffff', borderColor: colors.glassBorder }]}
            onPress={loginWithGoogle}
          >
            <RNImage 
              source={{ uri: 'https://lh3.googleusercontent.com/COxitImplementedG3d5_30' }} 
              style={styles.googleIconImg} 
              defaultSource={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
            />
            <Text style={styles.googleAuthBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.guestBtn, { borderColor: colors.glassBorder, marginTop: 10 }]}
            onPress={loginAsGuest}
          >
            <Sparkles color={colors.primaryAccent} size={18} />
            <Text style={[styles.guestBtnText, { color: colors.textMain }]}>Continue as Sandbox Guest</Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.bgNebula }]} 
      contentContainerStyle={styles.content}
    >
      {view !== 'main' && (
        <TouchableOpacity style={styles.backBtn} onPress={() => setView('main')}>
          <ChevronLeft color={colors.textSoft} size={20} />
          <Text style={[styles.backText, { color: colors.textSoft }]}>Back</Text>
        </TouchableOpacity>
      )}

      {view === 'main' && (
        <>
          {/* User Hero Card */}
          <GlassCard style={styles.userCard} pinkGlow>
            <View style={styles.userRow}>
              {user.photoURL ? (
                <RNImage source={{ uri: user.photoURL }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarCircle, { borderColor: colors.primaryAccent }]}>
                  <User color={colors.primaryAccent} size={30} />
                </View>
              )}
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.userName, { color: colors.textMain }]}>
                    {user.displayName || "Explorer"}
                  </Text>
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>
                      {(userDoc?.plan || 'Free').toUpperCase()} PLAN
                    </Text>
                  </View>
                </View>
                <Text style={[styles.userEmail, { color: colors.textSoft }]}>{user.email}</Text>
              </View>

              <TouchableOpacity style={styles.logoutIconButton} onPress={logout}>
                <LogOut color={colors.textSoft} size={20} />
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Live Metrics Grid */}
          <View style={styles.metricsGrid}>
            <GlassCard style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: colors.primaryAccent }]}>
                {Math.max(userDoc?.totalPromptsGenerated || 0, prompts.length, historyItems.length)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSoft }]}>PROMPTS</Text>
            </GlassCard>

            <GlassCard style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: '#3b82f6' }]}>
                {Math.max(userDoc?.totalChats || 0, chatsCount)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSoft }]}>CHATS</Text>
            </GlassCard>

            <GlassCard style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: colors.secondaryAccent }]}>
                {Math.max(userDoc?.totalVisionAnalyzed || 0, visionCount)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSoft }]}>VISION SCANS</Text>
            </GlassCard>
          </View>

          {/* Nav Options */}
          <View style={styles.navStack}>
            <TouchableOpacity onPress={() => setView('saved')}>
              <GlassCard style={styles.navCard}>
                <View style={[styles.navIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
                  <LayoutList color="#3b82f6" size={22} />
                </View>
                <View style={styles.navTextContainer}>
                  <Text style={[styles.navTitle, { color: colors.textMain }]}>Saved Prompts</Text>
                  <Text style={[styles.navSub, { color: colors.textSoft }]}>
                    {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'} collected
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setView('history')}>
              <GlassCard style={styles.navCard}>
                <View style={[styles.navIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
                  <History color={colors.secondaryAccent} size={22} />
                </View>
                <View style={styles.navTextContainer}>
                  <Text style={[styles.navTitle, { color: colors.textMain }]}>Recent History</Text>
                  <Text style={[styles.navSub, { color: colors.textSoft }]}>
                    {historyItems.length} recent sessions
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setView('subscription')}>
              <GlassCard style={styles.navCard}>
                <View style={[styles.navIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                  <CreditCard color="#f59e0b" size={22} />
                </View>
                <View style={styles.navTextContainer}>
                  <Text style={[styles.navTitle, { color: colors.textMain }]}>Subscription</Text>
                  <Text style={[styles.navSub, { color: colors.textSoft }]}>Manage your tier</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setView('settings')}>
              <GlassCard style={styles.navCard}>
                <View style={[styles.navIconBox, { backgroundColor: 'rgba(156, 163, 175, 0.15)', borderColor: colors.glassBorder }]}>
                  <Settings color={colors.textSoft} size={22} />
                </View>
                <View style={styles.navTextContainer}>
                  <Text style={[styles.navTitle, { color: colors.textMain }]}>Settings</Text>
                  <Text style={[styles.navSub, { color: colors.textSoft }]}>App theme & account</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* SAVED PROMPTS VIEW */}
      {view === 'saved' && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Saved Prompts</Text>
          {loading ? (
            <ActivityIndicator color={colors.primaryAccent} size="large" />
          ) : prompts.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.textSoft }]}>No saved prompts found in your account.</Text>
            </GlassCard>
          ) : (
            prompts.map((p, idx) => (
              <TouchableOpacity key={p.id || idx} activeOpacity={0.8} onPress={() => setSelectedPrompt(p)}>
                <GlassCard style={styles.promptItemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemTitle, { color: colors.textMain }]}>
                      {p.title || 'Untitled Prompt'}
                    </Text>
                    <TouchableOpacity onPress={() => handleCopyText(p.content)}>
                      <Copy color={colors.textSoft} size={18} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.itemContent, { color: colors.textSoft }]} numberOfLines={3}>
                    {p.content}
                  </Text>
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemCategory}>{p.category || 'Generated'}</Text>
                    <Text style={[styles.itemDate, { color: colors.textMuted }]}>{p.createdAtFormatted || 'Saved'}</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* RECENT HISTORY VIEW */}
      {view === 'history' && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Recent History</Text>
          {historyItems.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.textSoft }]}>No recent prompt history recorded.</Text>
            </GlassCard>
          ) : (
            historyItems.map((h, idx) => (
              <TouchableOpacity key={idx} activeOpacity={0.8} onPress={() => setSelectedPrompt({ title: h.idea || 'Generated Prompt', content: h.prompt, createdAtFormatted: h.date })}>
                <GlassCard style={styles.promptItemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemTitle, { color: colors.textMain }]}>
                      {h.idea || 'Generated Prompt'}
                    </Text>
                    <TouchableOpacity onPress={() => handleCopyText(h.prompt)}>
                      <Copy color={colors.textSoft} size={18} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.itemContent, { color: colors.textSoft }]} numberOfLines={3}>
                    {h.prompt}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* SETTINGS VIEW */}
      {view === 'settings' && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>App Settings</Text>
          <GlassCard style={styles.settingsCard}>
            <Text style={[styles.settingLabel, { color: colors.textSoft }]}>Theme Mode</Text>
            <View style={styles.themeRow}>
              <TouchableOpacity 
                style={[
                  styles.themeChip, 
                  theme === 'dark' && { backgroundColor: 'rgba(255, 0, 122, 0.2)', borderColor: colors.primaryAccent }
                ]}
                onPress={() => setTheme('dark')}
              >
                <Text style={[styles.themeChipText, { color: theme === 'dark' ? colors.primaryAccent : colors.textSoft }]}>Dark</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.themeChip, 
                  theme === 'light' && { backgroundColor: 'rgba(255, 0, 122, 0.2)', borderColor: colors.primaryAccent }
                ]}
                onPress={() => setTheme('light')}
              >
                <Text style={[styles.themeChipText, { color: theme === 'light' ? colors.primaryAccent : colors.textSoft }]}>Light</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.signOutBtn} onPress={logout}>
              <LogOut color="#ef4444" size={18} />
              <Text style={styles.signOutBtnText}>Sign Out Account</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}

      {/* SUBSCRIPTION VIEW */}
      {view === 'subscription' && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Subscription Plan</Text>
          <GlassCard style={styles.subCard} glow>
            <View style={styles.subBadgeCircle}>
              <Sparkles color={colors.secondaryAccent} size={24} />
            </View>
            <Text style={[styles.subPlanTitle, { color: colors.textMain }]}>PromptGlow Free</Text>
            <Text style={[styles.subPlanSub, { color: colors.textSoft }]}>
              You are currently on the free tier with access to standard models.
            </Text>
            <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: colors.secondaryAccent }]}>
              <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}

      {/* INTERACTIVE PROMPT DETAIL MODAL */}
      {selectedPrompt && (
        <Modal transparent animationType="fade" visible={!!selectedPrompt}>
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                  {selectedPrompt.title || "Prompt Details"}
                </Text>
                <TouchableOpacity onPress={() => setSelectedPrompt(null)}>
                  <X color={colors.textSoft} size={22} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={[styles.modalPromptText, { color: colors.textMain }]}>
                  {selectedPrompt.content}
                </Text>
              </ScrollView>

              <View style={styles.modalFooter}>
                {selectedPrompt.id && (
                  <TouchableOpacity 
                    style={styles.modalDeleteBtn}
                    onPress={() => handleDeletePrompt(selectedPrompt.id)}
                  >
                    <Trash2 color="#ef4444" size={18} />
                    <Text style={styles.modalDeleteText}>Delete</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={[styles.modalCopyBtn, { backgroundColor: colors.primaryAccent }]}
                  onPress={() => handleCopyText(selectedPrompt.content)}
                >
                  {copied ? <Check color="#FFFFFF" size={18} /> : <Copy color="#FFFFFF" size={18} />}
                  <Text style={styles.modalCopyText}>{copied ? "Copied!" : "Copy Prompt"}</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </Modal>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  authCard: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
  },
  authAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  authSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  errorBox: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  authInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
  },
  primaryAuthBtn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  primaryAuthBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  toggleAuthModeBtn: {
    marginBottom: 16,
  },
  toggleAuthText: {
    fontSize: 13,
    fontWeight: '600',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
    width: '100%',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  orText: {
    fontSize: 11,
    fontWeight: '700',
  },
  guestBtn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  googleAuthBtn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
  },
  googleIconImg: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  googleAuthBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  guestBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userCard: {
    padding: 18,
    marginBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 0, 122, 0.15)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  userEmail: {
    fontSize: 13,
  },
  logoutIconButton: {
    padding: 8,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
  },
  navTextContainer: {
    flex: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  navSub: {
    fontSize: 12,
  },
  sectionContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '700',
  },
  itemContent: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF007A',
  },
  itemDate: {
    fontSize: 11,
  },
  settingsCard: {
    padding: 20,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  themeChip: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  themeChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  signOutBtnText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  subCard: {
    padding: 24,
    alignItems: 'center',
  },
  subBadgeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subPlanTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  subPlanSub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  upgradeBtn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    paddingRight: 10,
  },
  modalBody: {
    maxHeight: 300,
    marginBottom: 20,
  },
  modalPromptText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  modalDeleteText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  modalCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCopyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
