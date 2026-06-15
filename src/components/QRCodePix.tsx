import React from "react";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface QRCodePixProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export function QRCodePix({
  value,
  size = 180,
  color = "#111318",
  backgroundColor = "#FFFFFF",
}: QRCodePixProps) {
  // O QR Code precisa de um valor válido logo no primeiro frame
  if (!value) {
    return <View style={{ width: size, height: size, backgroundColor }} />;
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <QRCode
        value={value}
        size={size}
        color={color}
        backgroundColor={backgroundColor}
        // Nível 'M' é o padrão recomendado pelo Banco Central para Pix
        ecl="M"
      />
    </View>
  );
}
