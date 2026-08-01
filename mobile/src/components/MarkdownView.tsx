import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';

interface MarkdownViewProps {
  content: string;
  textColor?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, textColor = '#e5e7eb' }) => {
  if (!content) return null;

  const renderInlineText = (text: string, baseStyle: TextStyle) => {
    // Regex splits by **bold** or __bold__
    const parts = text.split(/(\*\*[\s\S]*?\*\*|__[\s\S]*?__)/g);

    return parts.map((part, i) => {
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        const cleanBoldText = part.slice(2, -2);
        return (
          <Text key={i} style={[baseStyle, styles.boldText]}>
            {cleanBoldText}
          </Text>
        );
      }
      return (
        <Text key={i} style={baseStyle}>
          {part}
        </Text>
      );
    });
  };

  const lines = content.split('\n');

  return (
    <View style={styles.container}>
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('# ')) {
          return (
            <Text key={index} style={styles.h1}>
              {renderInlineText(trimmed.replace('# ', ''), styles.h1Text)}
            </Text>
          );
        } else if (trimmed.startsWith('## ')) {
          return (
            <Text key={index} style={styles.h2}>
              {renderInlineText(trimmed.replace('## ', ''), styles.h2Text)}
            </Text>
          );
        } else if (trimmed.startsWith('### ')) {
          return (
            <Text key={index} style={styles.h3}>
              {renderInlineText(trimmed.replace('### ', ''), styles.h3Text)}
            </Text>
          );
        } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const rawBulletContent = trimmed.replace(/^[\*\-]\s*/, '');
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={[styles.bulletText, { color: textColor }]}>
                {renderInlineText(rawBulletContent, { color: textColor, fontSize: 13, lineHeight: 20 })}
              </Text>
            </View>
          );
        } else if (trimmed.startsWith('```')) {
          return null; // Ignore fence markers
        } else if (trimmed.length === 0) {
          return <View key={index} style={{ height: 6 }} />;
        } else {
          return (
            <Text key={index} style={[styles.bodyText, { color: textColor }]}>
              {renderInlineText(trimmed, { color: textColor, fontSize: 14, lineHeight: 22 })}
            </Text>
          );
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
  },
  boldText: {
    fontWeight: '700',
  },
  h1: {
    marginVertical: 6,
  },
  h1Text: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF007A',
  },
  h2: {
    marginVertical: 4,
  },
  h2Text: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  h3: {
    marginVertical: 4,
  },
  h3Text: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingLeft: 4,
  },
  bulletPoint: {
    color: '#FF007A',
    marginRight: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
  },
});
