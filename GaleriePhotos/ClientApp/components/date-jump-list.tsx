import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { DateJump } from "@/services/views";
import { observer } from "mobx-react-lite";

interface DateJumpListProps {
  dateJumps: DateJump[];
  onJumpToDate: (date: string) => void;
  visible: boolean;
}

/**
 * Component that displays a list of date jumps on the right side of the screen
 * when the user is scrolling through photos
 */
export const DateJumpList = observer(function DateJumpList({
  dateJumps,
  onJumpToDate,
  visible,
}: DateJumpListProps) {
  const handlePress = useCallback(
    (date: string) => {
      onJumpToDate(date);
    },
    [onJumpToDate]
  );

  if (!visible || dateJumps.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {dateJumps.map((jump, index) => (
          <TouchableOpacity
            key={`${jump.date}-${index}`}
            style={styles.jumpItem}
            onPress={() => handlePress(jump.date)}
            activeOpacity={0.7}
          >
            <Text style={styles.jumpText}>{jump.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 10,
    top: "20%",
    bottom: "20%",
    width: 120,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  jumpItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  jumpText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
