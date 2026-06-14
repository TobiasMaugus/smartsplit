import React from "react";
import { View } from "react-native";
import Svg, { Rect } from "react-native-svg";

export function QRCodeMock({ seed }: { seed: string }) {
  const N = 21;
  const C = 9;
  const FINDER = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];

  const getCell = (r: number, c: number): boolean => {
    if (r < 7 && c < 7) return FINDER[r][c] === 1;
    if (r < 7 && c >= N - 7) return FINDER[r][c - (N - 7)] === 1;
    if (r >= N - 7 && c < 7) return FINDER[r - (N - 7)][c] === 1;
    if (r === 7 || c === 7) return false;
    let h = 5381;
    const k = `${r}-${c}-${seed}`;
    for (let i = 0; i < k.length; i++) h = ((h << 5) + h + k.charCodeAt(i)) & 0xffffff;
    return Math.abs(h) % 2 === 0;
  };

  const rects: JSX.Element[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (getCell(r, c)) {
        rects.push(
          <Rect key={`${r}-${c}`} x={c * C} y={r * C} width={C} height={C} fill="#111318" rx={1} />
        );
      }
    }
  }

  return (
    <View className="w-40 h-40">
      <Svg viewBox={`0 0 ${N * C} ${N * C}`} width="100%" height="100%">
        <Rect width={N * C} height={N * C} fill="white" />
        {rects}
      </Svg>
    </View>
  );
}
