import { allowScreenCaptureAsync, preventScreenCaptureAsync } from "expo-screen-capture";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { generateMnemonic, validateMnemonic, type MnemonicLength } from "@/lib/bip39";

const COLORS = {
  background: "#08111f",
  surface: "#101e31",
  surfaceRaised: "#162943",
  border: "#27405f",
  text: "#f4f7fb",
  muted: "#9fb0c5",
  amber: "#f3b652",
  amberSoft: "#3d2d16",
  green: "#77d6a3",
  danger: "#f2a8a8",
};

export default function HomeScreen() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    void preventScreenCaptureAsync("seed-vault").catch(() => undefined);
    return () => {
      void allowScreenCaptureAsync("seed-vault").catch(() => undefined);
    };
  }, []);
  const insets = useSafeAreaInsets();
  const [length, setLength] = useState<MnemonicLength>(24);
  const [words, setWords] = useState<string[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setIsGenerating(true);
    setError(null);
    setWords(null);
    try {
      const nextWords = await generateMnemonic(length);
      const valid = await validateMnemonic(nextWords);
      if (!valid) throw new Error("Checksum verification failed");
      setWords(nextWords);
    } catch {
      setError("Не удалось получить криптографическую случайность. Попробуйте ещё раз.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 28 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>SEED VAULT</Text>
            <Text style={styles.title}>Офлайн-генератор</Text>
          </View>
          <View style={styles.offlineBadge}>
            <View style={styles.offlineDot} />
            <Text style={styles.offlineText}>OFFLINE</Text>
          </View>
        </View>

        <Text style={styles.intro}>
          Создайте BIP-39 фразу на устройстве. Приложение не делает сетевых запросов и не сохраняет секреты.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Сгенерировать seed-фразу"
          onPress={onGenerate}
          disabled={isGenerating}
          style={({ pressed }) => [styles.primaryGenerateButton, pressed && styles.pressed, isGenerating && styles.disabled]}
        >
          {isGenerating ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.primaryGenerateText}>СГЕНЕРИРОВАТЬ SEED-ФРАЗУ</Text>}
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>ДЛИНА ФРАЗЫ</Text>
          <View style={styles.choiceRow}>
            {[12, 24].map((item) => {
              const selected = length === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setLength(item as MnemonicLength)}
                  style={[styles.choice, selected && styles.choiceSelected]}
                >
                  <Text style={[styles.choiceNumber, selected && styles.choiceNumberSelected]}>{item}</Text>
                  <Text style={[styles.choiceCaption, selected && styles.choiceCaptionSelected]}>слов</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {words ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.cardLabel}>РЕЗУЛЬТАТ</Text>
                <Text style={styles.resultTitle}>{words.length} слов · checksum OK</Text>
              </View>
              <View style={styles.validPill}>
                <Text style={styles.validText}>ПРОВЕРЕНО</Text>
              </View>
            </View>
            <Text style={styles.resultHint}>Запишите слова от руки в указанном порядке. Не копируйте их и не фотографируйте экран.</Text>
            <View style={styles.wordGrid}>
              {words.map((word, index) => (
                <View key={`${word}-${index}`} style={styles.wordBox}>
                  <Text style={styles.wordIndex}>{String(index + 1).padStart(2, "0")}</Text>
                  <Text selectable={false} style={styles.word}>{word}</Text>
                </View>
              ))}
            </View>
            <View style={styles.pathBox}>
              <Text style={styles.pathLabel}>TRON / TRC-20 PATH</Text>
              <Text style={styles.pathValue}>{"m/44'/195'/0'/0/0"}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setWords(null)}
              style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
            >
              <Text style={styles.clearText}>Очистить результат</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Перед использованием</Text>
          <Text style={styles.warningText}>• Отключите Wi‑Fi и мобильную сеть, даже несмотря на отсутствие разрешения INTERNET.</Text>
          <Text style={styles.warningText}>• Seed-фраза даёт полный доступ к кошельку. Никому её не показывайте.</Text>
          <Text style={styles.warningText}>• Приложение не копирует фразу в буфер обмена и не сохраняет её.</Text>
          <Text style={styles.warningText}>• Для крупных сумм предпочтителен аппаратный кошелёк.</Text>
        </View>

        <Text style={styles.footer}>Локальная генерация · BIP-39 · без аналитики</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, gap: 16 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  eyebrow: { color: COLORS.amber, fontSize: 12, fontWeight: "800", letterSpacing: 2.4 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.7, marginTop: 6 },
  offlineBadge: { flexDirection: "row", alignItems: "center", borderColor: COLORS.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, marginTop: 2 },
  offlineDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: COLORS.green, marginRight: 7 },
  offlineText: { color: COLORS.green, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  intro: { color: COLORS.muted, fontSize: 15, lineHeight: 23, maxWidth: 420 },
  card: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 20, padding: 18, gap: 16 },
  cardLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  choiceRow: { flexDirection: "row", gap: 10 },
  choice: { flex: 1, backgroundColor: COLORS.surfaceRaised, borderColor: COLORS.border, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  choiceSelected: { backgroundColor: COLORS.amberSoft, borderColor: COLORS.amber },
  choiceNumber: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  choiceNumberSelected: { color: COLORS.amber },
  choiceCaption: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  choiceCaptionSelected: { color: COLORS.amber },
  primaryGenerateButton: { alignItems: "center", justifyContent: "center", minHeight: 64, backgroundColor: COLORS.amber, borderColor: "#ffd985", borderWidth: 2, borderRadius: 16, paddingHorizontal: 16, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  primaryGenerateText: { color: COLORS.background, fontSize: 17, fontWeight: "900", letterSpacing: 0.4 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.55 },
  resultCard: { backgroundColor: COLORS.surface, borderColor: COLORS.amber, borderWidth: 1, borderRadius: 20, padding: 18, gap: 14 },
  resultHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  resultTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700", marginTop: 5 },
  validPill: { backgroundColor: "#173c2d", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  validText: { color: COLORS.green, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  resultHint: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },
  wordGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  wordBox: { width: "48.5%", minHeight: 43, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surfaceRaised, borderRadius: 10, paddingHorizontal: 10, gap: 9 },
  wordIndex: { color: COLORS.muted, fontSize: 11, fontWeight: "700", width: 20 },
  word: { color: COLORS.text, fontFamily: "monospace", fontSize: 14, fontWeight: "700", flexShrink: 1 },
  pathBox: { backgroundColor: COLORS.background, borderRadius: 11, padding: 12, gap: 5 },
  pathLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.1 },
  pathValue: { color: COLORS.amber, fontFamily: "monospace", fontSize: 13 },
  clearButton: { borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, minHeight: 46, justifyContent: "center", alignItems: "center" },
  clearText: { color: COLORS.muted, fontSize: 14, fontWeight: "700" },
  warningCard: { borderLeftColor: COLORS.amber, borderLeftWidth: 2, paddingLeft: 14, gap: 8 },
  warningTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  warningText: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },
  errorBox: { backgroundColor: "#3a1e25", borderColor: "#7b3540", borderWidth: 1, borderRadius: 12, padding: 13 },
  errorText: { color: COLORS.danger, fontSize: 13, lineHeight: 19 },
  footer: { color: "#60738c", fontSize: 11, textAlign: "center", marginTop: 4 },
});
