import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <View style={styles.container}>
      {lines.map((line, index) => {
        if (line.startsWith('# ')) {
          return <Text key={index} style={styles.h1}>{line.replace('# ', '')}</Text>;
        } else if (line.startsWith('## ')) {
          return <Text key={index} style={styles.h2}>{line.replace('## ', '')}</Text>;
        } else if (line.startsWith('### ')) {
          return <Text key={index} style={styles.h3}>{line.replace('### ', '')}</Text>;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>{line.substring(2)}</Text>
            </View>
          );
        } else if (line.startsWith('```')) {
          return null; // Ignore fence lines
        } else if (line.trim().length === 0) {
          return <View key={index} style={{ height: 8 }} />;
        } else {
          return <Text key={index} style={styles.bodyText}>{line}</Text>;
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  h1: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ec4899',
    marginVertical: 6,
  },
  h2: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a855f7',
    marginVertical: 4,
  },
  h3: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginVertical: 4,
  },
  bodyText: {
    fontSize: 13,
    color: '#e5e7eb',
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  bulletPoint: {
    color: '#a855f7',
    marginRight: 8,
    fontSize: 14,
  },
  bulletText: {
    fontSize: 13,
    color: '#e5e7eb',
    flex: 1,
  },
});
