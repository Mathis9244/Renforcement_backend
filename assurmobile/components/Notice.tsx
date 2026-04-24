import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";

export function Notice(props: PropsWithChildren<{ tone?: "error" | "info" }>) {
  const { tone = "info" } = props;
  const theme = useTheme();
  const border = tone === "error" ? theme.colors.error : theme.colors.outlineVariant;
  const bg = tone === "error" ? "rgba(239,68,68,0.12)" : theme.colors.surface;

  return (
    <Card style={[styles.card, { borderColor: border, backgroundColor: bg }]}>
      <Card.Content>
        <Text style={{ opacity: 0.95 }}>{props.children}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth },
});

