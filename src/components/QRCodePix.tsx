import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import QRCodeGenerator from "qrcode";

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
  const [modules, setModules] = useState<boolean[][]>([]);

  useEffect(() => {
    QRCodeGenerator.toDataURL(value, { errorCorrectionLevel: "M" })
      .then(() => {
        // Use the create method to get the raw matrix
        const qr = QRCodeGenerator.create(value, { errorCorrectionLevel: "M" });
        const mods = qr.modules;
        const moduleCount = mods.size;
        const data: boolean[][] = [];

        for (let row = 0; row < moduleCount; row++) {
          const rowData: boolean[] = [];
          for (let col = 0; col < moduleCount; col++) {
            rowData.push(mods.get(row, col) === 1);
          }
          data.push(rowData);
        }
        setModules(data);
      })
      .catch(console.error);
  }, [value]);

  if (modules.length === 0) {
    return <View style={{ width: size, height: size }} />;
  }

  const moduleCount = modules.length;
  const cellSize = size / moduleCount;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect x={0} y={0} width={size} height={size} fill={backgroundColor} />
        {modules.map((row, rowIndex) =>
          row.map((cell, colIndex) =>
            cell ? (
              <Rect
                key={`${rowIndex}-${colIndex}`}
                x={colIndex * cellSize}
                y={rowIndex * cellSize}
                width={cellSize}
                height={cellSize}
                fill={color}
              />
            ) : null,
          ),
        )}
      </Svg>
    </View>
  );
}
