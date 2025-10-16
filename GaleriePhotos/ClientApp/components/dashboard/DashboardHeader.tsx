import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "@/components/Icon";
import { palette } from "@/stores/theme";

type DashboardHeaderProps = {
  title: string;
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title }) => (
  <View style={styles.header}>
    <Icon set="mi" name="dashboard" size={24} color={palette.primary} />
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: palette.textPrimary,
    marginLeft: 12,
  },
});

export default DashboardHeader;
