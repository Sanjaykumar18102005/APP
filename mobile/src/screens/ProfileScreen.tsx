import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { User, LayoutList, History, Settings, CreditCard, LogOut } from 'lucide-react-native';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export const ProfileScreen = () => {
  const currentUser = auth.currentUser;
  const [userDoc, setUserDoc] = useState<any>(null);

  useEffect(() => {
    if (currentUser?.uid && db) {
      const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
        if (snap.exists()) {
          setUserDoc(snap.data());
        }
      }, (err) => console.warn("Firestore user sync error:", err));

      return () => unsub();
    }
  }, [currentUser]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Info Card */}
      <GlassCard style={styles.profileCard} borderColor="rgba(236, 72, 153, 0.3)">
        <View style={styles.avatarBox}>
          {currentUser?.photoURL ? (
            <Image source={{ uri: currentUser.photoURL }} style={styles.avatarImage} />
          ) : (
            <User color="#ec4899" size={32} />
          )}
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{currentUser?.displayName || "Sanjay Kumar S"}</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planText}>FREE PLAN</Text>
            </View>
          </View>
          <Text style={styles.userEmail}>{currentUser?.email || "sanjaykumar18102005@gmail.com"}</Text>
        </View>
      </GlassCard>

      {/* Metrics Grid */}
      <View style={styles.metricsRow}>
        <GlassCard style={styles.metricCard}>
          <Text style={styles.metricValue}>{userDoc?.totalPromptsGenerated || 3}</Text>
          <Text style={styles.metricLabel}>PROMPTS</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: '#60a5fa' }]}>{userDoc?.totalChats || 0}</Text>
          <Text style={styles.metricLabel}>CHATS</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: '#a855f7' }]}>{userDoc?.totalVisionAnalyzed || 0}</Text>
          <Text style={styles.metricLabel}>VISION SCANS</Text>
        </GlassCard>
      </View>

      {/* Menu Options */}
      <View style={styles.menuGrid}>
        <GlassCard style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <LayoutList color="#60a5fa" size={20} />
          </View>
          <View>
            <Text style={styles.menuTitle}>Saved Prompts</Text>
            <Text style={styles.menuSub}>Manage collection</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
            <History color="#c084fc" size={20} />
          </View>
          <View>
            <Text style={styles.menuTitle}>Recent History</Text>
            <Text style={styles.menuSub}>Generated context</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <CreditCard color="#fbbf24" size={20} />
          </View>
          <View>
            <Text style={styles.menuTitle}>Subscription</Text>
            <Text style={styles.menuSub}>Free tier</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(107, 114, 128, 0.15)' }]}>
            <Settings color="#9ca3af" size={20} />
          </View>
          <View>
            <Text style={styles.menuTitle}>Settings</Text>
            <Text style={styles.menuSub}>App preferences</Text>
          </View>
        </GlassCard>
      </View>

      <TouchableOpacity style={styles.logoutBtn}>
        <LogOut color="#ef4444" size={18} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  content: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 18,
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ec4899',
    marginRight: 14,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  planBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  planText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#c084fc',
  },
  userEmail: {
    fontSize: 12,
    color: '#9ca3af',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginTop: 4,
  },
  menuGrid: {
    gap: 10,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  menuSub: {
    fontSize: 11,
    color: '#9ca3af',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ef4444',
    marginLeft: 8,
  },
});
