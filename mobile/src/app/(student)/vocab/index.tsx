import React, { useState } from "react";
import {
  View, Text, FlatList, TextInput, Pressable, Modal,
  ActivityIndicator, StyleSheet, Alert, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { apiClient } from "../../../lib/api";
import { useWamdh } from "../../../context/WamdhContext";

const AsyncStorage = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  }
};

const STORAGE_KEY = "wamdh_vocab";

interface VocabWord {
  id: string;
  word: string;
  definition: string;
  example: string;
  subject: string;
  ipa?: string;
  arabic?: string;
  mastered: boolean;
  createdAt: string;
}

export default function VocabBuilder() {
  const router = useRouter();
  const { colors, isDark: dark, t, isRtl } = useWamdh();
  const ACCENT = colors.accent;
  const qc = useQueryClient();

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  // Add manually state
  const [showAdd, setShowAdd] = useState(false);
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [subject, setSubject] = useState("");

  // AI Explorer State
  const [showExplorer, setShowExplorer] = useState(false);
  const [searchWord, setSearchWord] = useState("");
  const [searching, setSearching] = useState(false);
  const [explorerResult, setExplorerResult] = useState<any>(null);

  // Spaced Repetition Game State
  const [showGame, setShowGame] = useState(false);
  const [gameIndex, setGameIndex] = useState(0);
  const [gameFlipped, setGameFlipped] = useState(false);

  const [filter, setFilter] = useState<"all" | "learning" | "mastered">("all");
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const { data: vocab = [], isLoading } = useQuery<VocabWord[]>({
    queryKey: ["vocab"],
    queryFn: async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    },
  });

  const saveVocab = async (list: VocabWord[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    qc.invalidateQueries({ queryKey: ["vocab"] });
  };

  const addWord = async () => {
    if (!word.trim() || !definition.trim()) {
      Alert.alert(isRtl ? "بيانات ناقصة" : "Missing fields", isRtl ? "الكلمة والتعريف مطلوبان." : "Word and definition are required.");
      return;
    }
    const newWord: VocabWord = {
      id: Date.now().toString(),
      word: word.trim(),
      definition: definition.trim(),
      example: example.trim(),
      subject: subject.trim() || "General",
      mastered: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newWord, ...vocab];
    await saveVocab(updated);
    setShowAdd(false);
    setWord(""); setDefinition(""); setExample(""); setSubject("");
  };

  // Trigger AI Lookup
  const lookupWord = async () => {
    if (!searchWord.trim()) return;
    setSearching(true);
    setExplorerResult(null);
    try {
      const res = await apiClient.post("/api/ai/word-explorer/", {
        word: searchWord.trim()
      });
      setExplorerResult(res.data);
    } catch (e) {
      Alert.alert(isRtl ? "خطأ في البحث" : "Search Failed", isRtl ? "تعذر العثور على تفاصيل الكلمة." : "Could not retrieve details for this word.");
    } finally {
      setSearching(false);
    }
  };

  // Save Looked up word
  const saveExplorerWord = async () => {
    if (!explorerResult) return;
    const isExist = vocab.some(v => v.word.toLowerCase() === explorerResult.word.toLowerCase());
    if (isExist) {
      Alert.alert(isRtl ? "الكلمة موجودة" : "Already Exists", isRtl ? "هذه الكلمة موجودة بالفعل في قاموسك." : "This word is already in your vocabulary.");
      return;
    }

    const newWord: VocabWord = {
      id: Date.now().toString(),
      word: explorerResult.word,
      definition: explorerResult.definition,
      example: explorerResult.example,
      ipa: explorerResult.ipa,
      arabic: explorerResult.arabic_translation,
      subject: "AI Explorer",
      mastered: false,
      createdAt: new Date().toISOString()
    };

    await saveVocab([newWord, ...vocab]);
    setShowExplorer(false);
    setSearchWord("");
    setExplorerResult(null);
    Alert.alert(isRtl ? "تم الحفظ" : "Saved", isRtl ? "تمت إضافة الكلمة إلى قاموسك بنجاح!" : "Word added to dictionary successfully!");
  };

  const toggleMastered = async (id: string) => {
    const updated = vocab.map(v => v.id === id ? { ...v, mastered: !v.mastered } : v);
    await saveVocab(updated);
  };

  const deleteWord = async (id: string) => {
    Alert.alert(isRtl ? "حذف الكلمة" : "Delete", isRtl ? "هل تريد إزالة هذه الكلمة؟" : "Remove this word?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const updated = vocab.filter(v => v.id !== id);
        await saveVocab(updated);
      }},
    ]);
  };

  const filtered = vocab.filter(v => {
    if (filter === "mastered") return v.mastered;
    if (filter === "learning") return !v.mastered;
    return true;
  });

  const learningList = vocab.filter(v => !v.mastered);
  const mastered = vocab.filter(v => v.mastered).length;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
          <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={20} color={ACCENT} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12, alignItems: isRtl ? "flex-end" : "flex-start" }}>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 22 }}>
            {isRtl ? "قاموس المصطلحات" : "Vocabulary"}
          </Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
            {mastered}/{vocab.length} {isRtl ? "تم إتقانها" : "mastered"}
          </Text>
        </View>
        <Pressable onPress={() => setShowAdd(true)} style={[styles.actionBtn, { backgroundColor: inputBg, marginRight: 8 }]}>
          <Ionicons name="add-outline" size={20} color={textPrimary} />
        </Pressable>
        <Pressable onPress={() => setShowExplorer(true)} style={[styles.actionBtn, { backgroundColor: ACCENT + "15" }]}>
          <Ionicons name="sparkles" size={18} color={ACCENT} />
        </Pressable>
      </View>

      {/* Stats and Practice Row */}
      {vocab.length > 0 && (
        <View style={[styles.practiceBar, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
          <View style={{ flex: 1, alignItems: isRtl ? "flex-end" : "flex-start" }}>
            <Text style={{ color: textPrimary, fontFamily: "Inter_700Bold", fontSize: 13 }}>
              {isRtl ? "ألعاب المراجعة التكرارية" : "Spaced Repetition Practice"}
            </Text>
            <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}>
              {isRtl ? `${learningList.length} كلمة بانتظار المذاكرة` : `${learningList.length} words to review`}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              if (learningList.length === 0) {
                Alert.alert(isRtl ? "رائع!" : "Great job!", isRtl ? "لقد أتقنت جميع الكلمات في قاموسك!" : "You have mastered all the words in your list!");
                return;
              }
              setGameIndex(0);
              setGameFlipped(false);
              setShowGame(true);
            }}
            style={[styles.practiceBtn, { backgroundColor: "#10B981" }]}
          >
            <Ionicons name="play" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 12 }}>
              {isRtl ? "ابدأ المراجعة" : "Start Review"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Filter tabs */}
      <View style={[styles.filterRow, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
        {(["all", "learning", "mastered"] as const).map(f => (
          <Pressable key={f} onPress={() => setFilter(f)}
            style={[styles.filterTab, filter === f && { borderBottomColor: ACCENT, borderBottomWidth: 2 }]}>
            <Text style={{
              color: filter === f ? ACCENT : textSecondary,
              fontFamily: filter === f ? "Inter_700Bold" : "Inter_400Regular", fontSize: 13,
            }}>
              {f === "all" ? (isRtl ? "الكل" : "All") : f === "learning" ? (isRtl ? "تحت التعلم" : "Learning") : (isRtl ? "تم إتقانها" : "Mastered")}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 60 }} />
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <View style={[styles.emptyBox, { backgroundColor: ACCENT + "10" }]}>
            <Ionicons name="text-outline" size={44} color={ACCENT} />
          </View>
          <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 16 }}>
            {isRtl ? "القاموس فارغ" : "Dictionary is empty"}
          </Text>
          <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 6, textAlign: "center", lineHeight: 20 }}>
            {isRtl ? "استخدم مستكشف الكلمات بالذكاء الاصطناعي للبحث وحفظ الكلمات والمصطلحات الصعبة فوراً!" : "Use the AI word explorer to lookup and save terms you struggle with!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => {
            const isFlipped = flippedId === item.id;
            return (
              <Pressable
                onPress={() => setFlippedId(isFlipped ? null : item.id)}
                style={[styles.wordCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              >
                <View style={{ flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1, alignItems: isRtl ? "flex-end" : "flex-start" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 16 }}>{item.word}</Text>
                      {item.ipa && (
                        <Text style={{ color: textSecondary, fontSize: 12, fontFamily: "JetBrainsMono_400Regular" }}>{item.ipa}</Text>
                      )}
                    </View>
                    {item.arabic && (
                      <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 2 }}>{item.arabic}</Text>
                    )}
                  </View>
                  
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Pressable onPress={() => toggleMastered(item.id)}>
                      <Ionicons
                        name={item.mastered ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={item.mastered ? "#10B981" : textSecondary}
                      />
                    </Pressable>
                    <Pressable onPress={() => deleteWord(item.id)}>
                      <Ionicons name="trash-outline" size={20} color={textSecondary} />
                    </Pressable>
                  </View>
                </View>

                {isFlipped && (
                  <View style={{ borderTopWidth: 1, borderTopColor: cardBorder, marginTop: 12, paddingTop: 12, alignItems: isRtl ? "flex-end" : "flex-start" }}>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 }}>
                      {item.definition}
                    </Text>
                    {item.example && (
                      <View style={[styles.exampleBox, { backgroundColor: inputBg, alignSelf: "stretch", marginTop: 8 }]}>
                        <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 11, fontStyle: "italic" }}>
                          "{item.example}"
                        </Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => router.push({ pathname: "/(student)/vocab/pronounce", params: { word: item.word } })}
                      style={[styles.pronounceBtn, { backgroundColor: ACCENT + "15", marginTop: 12 }]}
                    >
                      <Ionicons name="volume-high-outline" size={14} color={ACCENT} />
                      <Text style={{ color: ACCENT, fontFamily: "Inter_700Bold", fontSize: 11, marginLeft: 4 }}>
                        {isRtl ? "اختبر نطقك" : "Practice Pronunciation"}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}

      {/* AI Explorer Lookup Modal */}
      <Modal visible={showExplorer} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowExplorer(false)}>
        <View style={{ flex: 1, backgroundColor: bg }}>
          <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, textAlign: "center", flex: 1 }}>
              {isRtl ? "مستكشف الكلمات الذكي" : "AI Word Explorer"}
            </Text>
            <Pressable onPress={() => setShowExplorer(false)}>
              <Ionicons name="close" size={24} color={textPrimary} />
            </Pressable>
          </View>

          <View style={{ padding: 20 }}>
            <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
              <TextInput
                placeholder={isRtl ? "ابحث عن أي مصطلح إنجليزي..." : "Explore any English term..."}
                placeholderTextColor={textSecondary}
                value={searchWord}
                onChangeText={setSearchWord}
                onSubmitEditing={lookupWord}
                style={{ flex: 1, color: textPrimary, fontFamily: "Inter_500Medium", fontSize: 14, textAlign: isRtl ? "right" : "left" }}
              />
              <Pressable onPress={lookupWord} disabled={searching}>
                {searching
                  ? <ActivityIndicator size="small" color={ACCENT} />
                  : <Ionicons name="search" size={20} color={ACCENT} />}
              </Pressable>
            </View>

            {explorerResult && (
              <ScrollView style={{ marginTop: 24 }} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={[styles.explorerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                    <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 24 }}>{explorerResult.word}</Text>
                    <Text style={{ color: textSecondary, fontSize: 14, fontFamily: "JetBrainsMono_400Regular" }}>{explorerResult.ipa}</Text>
                  </View>
                  
                  <Text style={{ color: ACCENT, fontFamily: "Sora_700Bold", fontSize: 18, marginTop: 4 }}>
                    {explorerResult.arabic_translation}
                  </Text>
                  
                  <Text style={[styles.sectionHeading, { color: textSecondary }]}>{isRtl ? "التعريف:" : "Definition"}</Text>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, marginTop: 4 }}>
                    {explorerResult.definition}
                  </Text>

                  <Text style={[styles.sectionHeading, { color: textSecondary }]}>{isRtl ? "جملة أمثلة:" : "Example Sentence"}</Text>
                  <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 14, fontStyle: "italic", lineHeight: 22, marginTop: 4 }}>
                    "{explorerResult.example}"
                  </Text>

                  <Pressable onPress={saveExplorerWord} style={[styles.saveBtn, { backgroundColor: "#10B981" }]}>
                    <Ionicons name="bookmark" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 14 }}>
                      {isRtl ? "حفظ إلى قاموسي" : "Save to my Vocab"}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Spaced Repetition Game Overlay */}
      <Modal visible={showGame} animationType="slide">
        <View style={{ flex: 1, backgroundColor: bg }}>
          <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, flexDirection: isRtl ? "row-reverse" : "row" }]}>
            <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 18, textAlign: "center", flex: 1 }}>
              {isRtl ? "لعبة البطاقات التكرارية" : "Spaced Repetition Cards"}
            </Text>
            <Pressable onPress={() => setShowGame(false)}>
              <Ionicons name="close" size={24} color={textPrimary} />
            </Pressable>
          </View>

          {learningList.length > 0 && gameIndex < learningList.length ? (
            <View style={{ flex: 1, padding: 24, justifyContent: "center", alignItems: "stretch" }}>
              <Text style={{ color: textSecondary, fontFamily: "Inter_700Bold", fontSize: 12, textAlign: "center", marginBottom: 20 }}>
                {isRtl ? `البطاقة ${gameIndex + 1} من ${learningList.length}` : `Card ${gameIndex + 1} of ${learningList.length}`}
              </Text>

              {/* Flippable Card Container */}
              <Pressable
                onPress={() => setGameFlipped(!gameFlipped)}
                style={[styles.gameCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              >
                {!gameFlipped ? (
                  <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
                    <Text style={{ color: textPrimary, fontFamily: "Sora_700Bold", fontSize: 32 }}>
                      {learningList[gameIndex].word}
                    </Text>
                    {learningList[gameIndex].ipa && (
                      <Text style={{ color: textSecondary, fontSize: 14, fontFamily: "JetBrainsMono_400Regular", marginTop: 4 }}>
                        {learningList[gameIndex].ipa}
                      </Text>
                    )}
                    <Text style={{ color: textSecondary, fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 40 }}>
                      {isRtl ? "اضغط هنا لكشف المعنى" : "Tap card to flip"}
                    </Text>
                  </View>
                ) : (
                  <View style={{ alignItems: "center", justifyContent: "center", flex: 1, paddingHorizontal: 16 }}>
                    <Text style={{ color: ACCENT, fontFamily: "Sora_700Bold", fontSize: 24, marginBottom: 12 }}>
                      {learningList[gameIndex].arabic || learningList[gameIndex].word}
                    </Text>
                    <Text style={{ color: textPrimary, fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 24 }}>
                      {learningList[gameIndex].definition}
                    </Text>
                    {learningList[gameIndex].example && (
                      <Text style={{ color: textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, fontStyle: "italic", textAlign: "center", marginTop: 14 }}>
                        "{learningList[gameIndex].example}"
                      </Text>
                    )}
                  </View>
                )}
              </Pressable>

              {/* SM-2 Recall Buttons */}
              <View style={{ flexDirection: "row", gap: 12, marginTop: 32 }}>
                <Pressable
                  onPress={() => {
                    setGameFlipped(false);
                    if (gameIndex < learningList.length - 1) {
                      setGameIndex(i => i + 1);
                    } else {
                      setShowGame(false);
                      Alert.alert(isRtl ? "اكتملت المراجعة!" : "Review Finished!", isRtl ? "أحسنت العمل في مراجعة مصطلحاتك اليوم." : "You have finished reviewing your terms today.");
                    }
                  }}
                  style={[styles.gameActionBtn, { backgroundColor: "#EF4444" }]}
                >
                  <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 13 }}>
                    {isRtl ? "بحاجة لمراجعة" : "Still Learning"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={async () => {
                    await toggleMastered(learningList[gameIndex].id);
                    setGameFlipped(false);
                    if (gameIndex < learningList.length - 1) {
                      setGameIndex(i => i + 1);
                    } else {
                      setShowGame(false);
                      Alert.alert(isRtl ? "اكتملت المراجعة!" : "Review Finished!", isRtl ? "أحسنت العمل! لقد تم إتقان جميع الكلمات المحددة." : "Well done! You have reviewed all selected words.");
                    }
                  }}
                  style={[styles.gameActionBtn, { backgroundColor: "#10B981" }]}
                >
                  <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 13 }}>
                    {isRtl ? "تم إتقانها" : "Mastered"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 60 }} />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  addBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  practiceBar: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, alignItems: "center" },
  practiceBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  filterRow: { flexDirection: "row", paddingHorizontal: 10 },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  emptyBox: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  wordCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 10 },
  exampleBox: { borderRadius: 10, padding: 10, marginTop: 6 },
  pronounceBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignSelf: "flex-start" },
  searchBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  explorerCard: { borderRadius: 20, padding: 20, borderWidth: 1 },
  sectionHeading: { fontSize: 11, fontFamily: "Inter_700Bold", marginTop: 16, textTransform: "uppercase" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 50, marginTop: 24 },
  gameCard: { flex: 1, borderRadius: 24, borderWidth: 2, borderStyle: "dashed", padding: 24, justifyContent: "center", elevation: 2, shadowOpacity: 0.05, shadowRadius: 10, shadowColor: "#000" },
  gameActionBtn: { flex: 1, paddingVertical: 16, borderRadius: 50, alignItems: "center", justifyContent: "center" },
});
