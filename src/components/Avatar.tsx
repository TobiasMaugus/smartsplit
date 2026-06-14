import React from "react";
import { View, Text, ViewStyle } from "react-native";

export const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface AvProps {
  name: string;
  color: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  glowing?: boolean;
}

export function Avatar({ name, color, size = "md", glowing }: AvProps) {
  const sizeStyles = {
    xs: { width: 28, height: 28, fontSize: 9 },
    sm: { width: 40, height: 40, fontSize: 12 },
    md: { width: 48, height: 48, fontSize: 14 },
    lg: { width: 64, height: 64, fontSize: 16 },
    xl: { width: 80, height: 80, fontSize: 20 },
  }[size];

  const containerStyle: ViewStyle = {
    width: sizeStyles.width,
    height: sizeStyles.height,
    borderRadius: sizeStyles.width / 2,
    backgroundColor: color,
    alignItems: "center",
    justifyContent: "center",
    ...(glowing
      ? {
          borderWidth: 3,
          borderColor: "white",
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 5,
          elevation: 5, // For Android
        }
      : {}),
  };

  return (
    <View style={containerStyle}>
      <Text style={{ color: "white", fontWeight: "900", fontSize: sizeStyles.fontSize }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
