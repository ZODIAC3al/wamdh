import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useWamdh } from '../../../context/WamdhContext';
import { apiClient } from '../../../lib/api';

interface LanguagePreset {
  name: string;
  extension: string;
  defaultCode: string;
  runMock: (code: string) => { stdout: string; error?: boolean };
  icon: string;
  color: string;
}

const LANGUAGE_PRESETS: Record<string, LanguagePreset> = {
  javascript: {
    name: "JavaScript",
    extension: ".js",
    icon: "logo-javascript",
    color: "#F7DF1E",
    defaultCode: `// Welcome to Wamdh Code Engine!
const greet = (name) => {
  console.log("Hello, " + name + "!");
};

greet("Student");`,
    runMock: (code: string) => {
      let logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        logs.push(
          args
            .map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x)))
            .join(" "),
        );
      };
      try {
        eval(code);
        console.log = originalLog;
        return {
          stdout:
            logs.join("\n") ||
            "Code executed successfully with no output logs.",
        };
      } catch (err: any) {
        console.log = originalLog;
        return { stdout: `Error: ${err.message}`, error: true };
      }
    },
  },
  typescript: {
    name: "TypeScript",
    extension: ".ts",
    icon: "code-slash",
    color: "#3178C6",
    defaultCode: `// TypeScript Example
interface Student {
  name: string;
  xp: number;
}

const student: Student = {
  name: "Wamdh Learner",
  xp: 1000
};

console.log(student.name, student.xp);`,
    runMock: (code: string) => {
      return {
        stdout:
          "// Compiled TypeScript successfully\ntsc --strict --out dir/\n\nOutput:\nWamdh Learner 1000\n\nProcess finished with exit code 0",
      };
    },
  },
  python: {
    name: "Python",
    extension: ".py",
    icon: "terminal-outline",
    color: "#3776AB",
    defaultCode: `# Python Learning OS
def calculate_sum(limit):
    return sum(range(1, limit + 1))

print(f"Sum of 1..100: {calculate_sum(100)}")`,
    runMock: (code: string) => {
      if (code.includes("print(")) {
        return {
          stdout:
            ">>> Running Python 3.11 interpreter...\n>>> exec(open('main.py').read())\nSum of 1..100: 5050\n\nProcess finished with exit code 0",
        };
      }
      return {
        stdout:
          ">>> Running Python interpreter...\nProcess finished with exit code 0",
      };
    },
  },
  java: {
    name: "Java",
    extension: ".java",
    icon: "cafe-outline",
    color: "#EA2D2E",
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Welcome to Wamdh Learning!");
    }
}`,
    runMock: (code: string) => {
      return {
        stdout:
          "$ javac Main.java\n$ java Main\nWelcome to Wamdh Learning!\n\nProcess finished with exit code 0",
      };
    },
  },
  cpp: {
    name: "C++",
    extension: ".cpp",
    icon: "code-working-outline",
    color: "#00599D",
    defaultCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Welcome to Wamdh Learning OS!" << endl;
    return 0;
}`,
    runMock: (code: string) => {
      return {
        stdout:
          "$ g++ -std=c++17 main.cpp -o main\n$ ./main\nWelcome to Wamdh Learning OS!\n\nProcess finished with exit code 0",
      };
    },
  },
  sql: {
    name: "SQL",
    extension: ".sql",
    icon: "server-outline",
    color: "#336791",
    defaultCode: `-- SQL Example
SELECT name, xp FROM students 
WHERE xp > 1000 
ORDER BY xp DESC 
LIMIT 10;`,
    runMock: (code: string) => {
      return {
        stdout:
          ">>> Executing SQL query...\nQuery executed in 5ms.\n\nResult:\n┌────────────┬──────────┐\n│ name       │ xp       │\n├────────────┼──────────┤\n│ Alice      │ 2500     │\n│ Bob        │ 2100     │\n│ ...        │ ...      │\n└────────────┴──────────┘\n\nProcess finished with exit code 0",
      };
    },
  },
  go: {
    name: "Go",
    extension: ".go",
    icon: "rocket-outline",
    color: "#00ADD8",
    defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("Hello from Wamdh Go sandbox!")
}`,
    runMock: (code: string) => {
      return {
        stdout:
          "$ go run main.go\nHello from Wamdh Go sandbox!\n\nProcess finished with exit code 0",
      };
    },
  },
  rust: {
    name: "Rust",
    extension: ".rs",
    icon: "hardware-chip-outline",
    color: "#DEA584",
    defaultCode: `fn main() {
    println!("Welcome to Wamdh Rust!");
}`,
    runMock: (code: string) => {
      return {
        stdout:
          "$ cargo run\n   Compiling wamdh-sandbox v0.1.0\n    Finished dev [unoptimized + debuginfo] target(s)\n\nWelcome to Wamdh Rust!\n\nProcess finished with exit code 0",
      };
    },
  },
  html: {
    name: "HTML/CSS",
    extension: ".html",
    icon: "globe-outline",
    color: "#E34F26",
    defaultCode: `<!DOCTYPE html>
<html>
<body style="font-family: 'Inter', sans-serif; background: #111; color: #EEE;">
  <h1 style="color: #BE1A1A;">Wamdh Sandbox</h1>
  <p>Encouraging tech learners world-wide.</p>
</body>
</html>`,
    runMock: (code: string) => {
      return {
        stdout:
          "DOM Tree compiled successfully.\nRender Preview updated.\n🎨 CSS validated and applied.",
      };
    },
  },
};

const PRACTICE_CHALLENGES = [
  {
    id: "1",
    title: "Array Sum",
    desc: "Write a script that prints the sum of [12, 5, 8, 3].",
    language: "javascript",
    xp: 100,
  },
  {
    id: "2",
    title: "Text Counter",
    desc: "Write a function that counts occurrences of 'a' in a string.",
    language: "python",
    xp: 150,
  },
  {
    id: "3",
    title: "Fibonacci",
    desc: "Print first 10 Fibonacci numbers.",
    language: "cpp",
    xp: 200,
  },
  {
    id: "4",
    title: "Prime Checker",
    desc: "Check if a number is prime.",
    language: "java",
    xp: 175,
  },
  {
    id: "5",
    title: "SQL Query",
    desc: "Fetch top students by XP.",
    language: "sql",
    xp: 150,
  },
];

export default function CodingSandboxScreen() {
  const router = useRouter();
  const { colors, isDark: dark } = useWamdh();
  const ACCENT = colors.accent;
  const queryClient = useQueryClient();

  const [selectedLang, setSelectedLang] =
    useState<keyof typeof LANGUAGE_PRESETS>("javascript");
  const [code, setCode] = useState(LANGUAGE_PRESETS.javascript.defaultCode);
  const [title, setTitle] = useState("Untitled Script");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => (await apiClient.get("/api/groups/")).data,
  });

  const saveSnippet = useMutation({
    mutationFn: async (data: {
      title: string;
      code: string;
      language: string;
      subject?: string;
    }) => {
      return apiClient.post("/api/notes/", {
        title: data.title,
        raw_text: data.code,
        subject: data.subject || "Code Snippets",
        tags: ["code", data.language],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setShowSaveModal(false);
    },
  });

  const runCodeInGroups = useMutation({
    mutationFn: async (groupId: string) => {
      return apiClient.post("/api/messages/rooms/", {
        name: `Code: ${title}`,
        members: [groupId],
        type: "code",
        code,
        language: selectedLang,
      });
    },
  });

  const handleSelectLanguage = (lang: keyof typeof LANGUAGE_PRESETS) => {
    setSelectedLang(lang);
    setCode(LANGUAGE_PRESETS[lang].defaultCode);
    setConsoleOutput("");
  };

  const handleRun = () => {
    if (!code.trim()) return;
    historyRef.current.push(code);
    historyIndexRef.current = historyRef.current.length - 1;
    setIsRunning(true);
    setTimeout(() => {
      const res = LANGUAGE_PRESETS[selectedLang].runMock(code);
      setConsoleOutput(res.stdout);
      setIsRunning(false);
    }, 800);
  };

  const handleAiExplain = () => {
    setIsExplaining(true);
    setShowAiModal(true);
    setTimeout(() => {
      const explanation = `✨ **Wamdh AI Code Analysis:**

1. **Language:** ${LANGUAGE_PRESETS[selectedLang].name}
2. **Structure:** The code utilizes standard flow control blocks and outputs runtime logs directly.
3. **Optimal Improvements:** Consider wrapping expressions into reusable pure functions to improve complexity and unit test coverage.
4. **Learning Tip:** Try adding error handling and edge case tests to strengthen your code.`;
      setAiExplanation(explanation);
      setIsExplaining(false);
    }, 1500);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert("Copied", "Code copied to clipboard");
  };

  const handleSave = () => {
    saveSnippet.mutate({ title, code, language: selectedLang });
  };

  const handleShare = (groupId: string) => {
    runCodeInGroups.mutate(groupId);
    setShowShareModal(false);
  };

  const bg = colors.background;
  const cardBg = colors.cardBg;
  const cardBorder = colors.border;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const inputBg = colors.inputBg;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: cardBg, borderBottomColor: cardBorder },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: inputBg }]}
        >
          <Ionicons name="chevron-back" size={20} color={ACCENT} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>
          Code Playground
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={handleRun}
            disabled={isRunning}
            style={[styles.iconBtn, { backgroundColor: ACCENT }]}
          >
            {isRunning ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="play" size={16} color="#FFF" />
            )}
          </Pressable>
        </View>
      </View>

      <View style={{ padding: 20 }}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Script title..."
          placeholderTextColor="#6B7280"
          style={[
            styles.titleInput,
            {
              color: textPrimary,
              borderColor: cardBorder,
              backgroundColor: inputBg,
            },
          ]}
        />

        <Text
          style={{
            color: textSecondary,
            fontFamily: "Inter_700Bold",
            fontSize: 11,
            marginBottom: 8,
            letterSpacing: 0.8,
          }}
        >
          LANGUAGES
        </Text>
        <View style={styles.langGrid}>
          {(
            Object.keys(LANGUAGE_PRESETS) as Array<
              keyof typeof LANGUAGE_PRESETS
            >
          ).map((key) => {
            const isSelected = selectedLang === key;
            const lang = LANGUAGE_PRESETS[key];
            return (
              <Pressable
                key={key}
                onPress={() => handleSelectLanguage(key)}
                style={[
                  styles.langCard,
                  {
                    backgroundColor: isSelected ? ACCENT + "15" : cardBg,
                    borderColor: isSelected ? ACCENT : cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name={lang.icon as any}
                  size={20}
                  color={isSelected ? ACCENT : lang.color}
                />
                <Text
                  style={{
                    color: isSelected ? ACCENT : textSecondary,
                    fontFamily: "Inter_700Bold",
                    fontSize: 10,
                    marginTop: 4,
                    textAlign: "center",
                  }}
                >
                  {lang.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons
                name={LANGUAGE_PRESETS[selectedLang].icon as any}
                size={16}
                color={LANGUAGE_PRESETS[selectedLang].color}
              />
              <Text
                style={{
                  color: textPrimary,
                  fontFamily: "Sora_700Bold",
                  fontSize: 15,
                  marginBottom: 0,
                }}
              >
                Edit Code ({LANGUAGE_PRESETS[selectedLang].extension})
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable onPress={handleAiExplain} style={styles.smallBtn}>
                <Ionicons name="sparkles" size={12} color="#FFF" />
              </Pressable>
              <Pressable onPress={handleCopy} style={styles.smallBtn}>
                <Ionicons name="copy-outline" size={12} color="#FFF" />
              </Pressable>
            </View>
          </View>
          <TextInput
            multiline
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            style={[
              styles.editor,
              {
                backgroundColor: dark ? "#0D1117" : "#1E1E1E",
                color: "#A9FFB2",
                borderColor: cardBorder,
              },
            ]}
          />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 16 },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="terminal-outline" size={16} color={ACCENT} />
            <Text
              style={{
                color: textPrimary,
                fontFamily: "Sora_700Bold",
                fontSize: 15,
                marginBottom: 0,
                marginLeft: 6,
              }}
            >
              Terminal Output
            </Text>
          </View>
          <View
            style={[
              styles.consoleBox,
              {
                backgroundColor: dark ? "#000000" : "#111827",
                borderColor: ACCENT + "40",
              },
            ]}
          >
            <Text
              style={{
                color: "#10B981",
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              {consoleOutput || "$ Run your code to see output here..."}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
          <Pressable
            onPress={handleSave}
            disabled={saveSnippet.isPending}
            style={[styles.actionBtn, { backgroundColor: ACCENT, flex: 1 }]}
          >
            {saveSnippet.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text
                style={{
                  color: "#FFF",
                  fontFamily: "Inter_700Bold",
                  fontSize: 13,
                }}
              >
                Save as Note
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => setShowShareModal(true)}
            style={[styles.actionBtn, { backgroundColor: "#3B82F6", flex: 1 }]}
          >
            <Text
              style={{
                color: "#FFF",
                fontFamily: "Inter_700Bold",
                fontSize: 13,
              }}
            >
              Share to Group
            </Text>
          </Pressable>
        </View>

        <Text
          style={{
            color: textPrimary,
            fontFamily: "Sora_700Bold",
            fontSize: 15,
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          ⚡ Coding Practice Challenges
        </Text>
        <View style={{ gap: 10 }}>
          {PRACTICE_CHALLENGES.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                handleSelectLanguage(
                  item.language as keyof typeof LANGUAGE_PRESETS,
                );
                Alert.alert(
                  "Challenge Activated",
                  `Boilerplate for ${item.title} loaded. +${item.xp} XP reward!`,
                );
              }}
              style={[
                styles.challengeCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: textPrimary,
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    color: textSecondary,
                    fontFamily: "Inter_400Regular",
                    fontSize: 11,
                    marginTop: 2,
                  }}
                >
                  {item.desc}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{
                    color: ACCENT,
                    fontFamily: "Inter_700Bold",
                    fontSize: 11,
                  }}
                >
                  +{item.xp} XP
                </Text>
                <Ionicons name="code-slash" size={18} color={ACCENT} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <Modal
        visible={showAiModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                AI Code Explainer
              </Text>
              <Pressable onPress={() => setShowAiModal(false)}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </Pressable>
            </View>
            {isExplaining ? (
              <ActivityIndicator
                color={ACCENT}
                style={{ marginVertical: 32 }}
              />
            ) : (
              <View style={{ marginTop: 8 }}>
                <Text
                  style={{
                    color: textPrimary,
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                    lineHeight: 20,
                  }}
                >
                  {aiExplanation}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showShareModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                Share to Group
              </Text>
              <Pressable onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={24} color={textPrimary} />
              </Pressable>
            </View>
            <FlatList
              data={groups || []}
              keyExtractor={(item: any) => item.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }: any) => (
                <Pressable
                  onPress={() => handleShare(item.id)}
                  style={[styles.groupItem, { borderBottomColor: cardBorder }]}
                >
                  <Text
                    style={{
                      color: textPrimary,
                      fontFamily: "Inter_500Medium",
                    }}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  titleInput: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  langCard: {
    width: "22%",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: { padding: 18, borderRadius: 16, borderWidth: 1 },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#BE1A1A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  editor: {
    padding: 14,
    borderRadius: 12,
    height: 220,
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 12,
    textAlignVertical: "top",
    borderWidth: 1,
  },
  consoleBox: { padding: 14, borderRadius: 12, borderWidth: 1, minHeight: 90 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontFamily: "Sora_700Bold", fontSize: 17 },
  groupItem: { paddingVertical: 14, borderBottomWidth: 1 },
});
