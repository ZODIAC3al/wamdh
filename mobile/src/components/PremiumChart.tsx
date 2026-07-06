import React from "react";
import { View, Text, Platform, StyleSheet } from "react-native";

interface PremiumChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  type?: "bar" | "line";
  height?: number;
}

export const PremiumChart: React.FC<PremiumChartProps> = ({
  data,
  xKey,
  yKey,
  color = "#BE1A1A",
  type = "bar",
  height = 180,
}) => {
  if (Platform.OS === "web") {
    const maxVal = Math.max(...data.map((d) => Number(d[yKey]) || 0), 1);

    return (
      <View style={[styles.webContainer, { height }]}>
        <View style={styles.chartArea}>
          {data.map((item, idx) => {
            const val = Number(item[yKey]) || 0;
            const pct = Math.min((val / maxVal) * 100, 100);
            return (
              <View key={idx} style={styles.barColumn}>
                <View style={styles.barValueContainer}>
                  <Text style={styles.barValueText}>{val}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${pct}%`,
                        backgroundColor: color,
                        shadowColor: color,
                      },
                    ]}
                  />
                </View>
                <Text numberOfLines={1} style={styles.barLabel}>
                  {String(item[xKey] || "")}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  // Native dynamically required to prevent Skia web import crash
  try {
    const { CartesianChart, Bar, Line } = require("victory-native");
    return (
      <View style={{ height }}>
        <CartesianChart
          data={data}
          xKey={xKey}
          yKeys={[yKey]}
          domainPadding={{ left: 24, right: 24, top: 10 }}
        >
          {({ points, chartBounds }: any) => {
            if (type === "line") {
              return (
                <Line
                  chartBounds={chartBounds}
                  points={points[yKey]}
                  color={color}
                  strokeWidth={2.5}
                />
              );
            }
            return (
              <Bar
                chartBounds={chartBounds}
                points={points[yKey]}
                roundedCorners={{ topLeft: 4, topRight: 4 }}
                color={color}
              />
            );
          }}
        </CartesianChart>
      </View>
    );
  } catch (e) {
    return (
      <View style={[styles.webContainer, { height }, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#BE1A1A", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Chart rendering unavailable</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  webContainer: {
    width: "100%",
    paddingTop: 10,
  },
  chartArea: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    borderBottomWidth: 1.5,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    maxWidth: 60,
  },
  barValueContainer: {
    marginBottom: 4,
  },
  barValueText: {
    fontSize: 9,
    fontFamily: "Sora_600SemiBold",
    color: "#6B7280",
  },
  barTrack: {
    width: 14,
    height: "65%",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "#4B5563",
    marginTop: 6,
    width: "100%",
    textAlign: "center",
  },
});
