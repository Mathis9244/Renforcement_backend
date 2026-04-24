import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";

export function Screen(props: PropsWithChildren<ViewProps & { padded?: boolean }>) {
  const { style, padded = true, children, ...rest } = props;
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View
        {...rest}
        style={[
          styles.content,
          padded ? styles.padded : null,
          { backgroundColor: theme.colors.background },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1 },
  padded: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16, gap: 12 },
});

