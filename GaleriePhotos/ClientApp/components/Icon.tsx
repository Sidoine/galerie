import React from "react";
import { TextStyle } from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";

// Type d'icône supporté
export type IconSet = "ion" | "mci" | "mi";

export interface IconProps {
  name: string; // nom de l'icône dans la librairie choisie
  size?: number;
  color?: string;
  set?: IconSet; // librairie (ion par défaut)
  style?: TextStyle;
}

/**
 * Wrapper unifié d'icônes permettant de changer facilement de pack.
 * Usage: <Icon name="information-outline" set="mci" size={20} color="#fff" />
 */
export function Icon({
  name,
  size = 20,
  color = "#fff",
  set = "ion",
  style,
}: IconProps) {
  switch (set) {
    case "mci":
      return (
        <MaterialCommunityIcons
          name={name as any}
          size={size}
          color={color}
          style={style}
        />
      );
    case "mi":
      return (
        <MaterialIcons
          name={name as any}
          size={size}
          color={color}
          style={style}
        />
      );
    case "ion":
    default:
      return (
        <Ionicons name={name as any} size={size} color={color} style={style} />
      );
  }
}

export default Icon;
