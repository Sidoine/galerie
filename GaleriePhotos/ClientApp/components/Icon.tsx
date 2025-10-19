import React from "react";
import { TextStyle } from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";

// Type d'icône supporté
export type IconSet = "ion" | "mci" | "mi";

interface IoniconsProps extends BaseIconProps {
  name: React.ComponentProps<typeof Ionicons>["name"];
  set: "ion";
}

interface MaterialCommunityIconsProps extends BaseIconProps {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  set: "mci";
}

interface MaterialIconsProps extends BaseIconProps {
  name: React.ComponentProps<typeof MaterialIcons>["name"];
  set: "mi";
}

export interface BaseIconProps {
  size?: number;
  color?: string;
  style?: TextStyle;
}
type IconProps =
  | IoniconsProps
  | MaterialCommunityIconsProps
  | MaterialIconsProps;

/**
 * Wrapper unifié d'icônes permettant de changer facilement de pack.
 * Usage: <Icon name="information-outline" set="mci" size={20} color="#fff" />
 */
export function Icon({
  size = 20,
  color = "#111",
  style,
  ...props
}: IconProps) {
  switch (props.set) {
    case "mci":
      return (
        <MaterialCommunityIcons
          name={props.name}
          size={size}
          color={color}
          style={style}
        />
      );
    case "mi":
      return (
        <MaterialIcons
          name={props.name}
          size={size}
          color={color}
          style={style}
        />
      );
    case "ion":
    default:
      return (
        <Ionicons name={props.name} size={size} color={color} style={style} />
      );
  }
}

export default Icon;
