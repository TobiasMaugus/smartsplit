import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { X, Copy } from "lucide-react-native";
import { Profile } from "../types";
import { QRCodeMock } from "./QRCodeMock";
import * as Clipboard from "expo-clipboard";

interface PixModalProps {
  profile: Profile;
  amount: number;
  onClose: () => void;
  visible: boolean;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export function PixModal({ profile, amount, onClose, visible }: PixModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const pixKey = profile.pixKey || "11999887766";
  const pixName = profile.pixName || profile.name;
  const pixCity = profile.pixCity || "São Paulo";
  const emvCode = `00020126580014br.gov.bcb.pix0136${pixKey}5204000053039865802BR5913${(pixName + "             ").slice(0, 13)}6009${(pixCity + "         ").slice(0, 9)}62070503***6304ABCD`;

  const copy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/60 justify-end z-50">
          <TouchableWithoutFeedback>
            <View className="bg-white w-full rounded-t-3xl px-5 pt-3 pb-10">
              <View className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              
              <View className="flex-row justify-between items-center mb-5">
                <Text className="text-xl font-extrabold text-gray-900">Gerar Pix</Text>
                <TouchableOpacity 
                  onPress={onClose} 
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <X size={16} color="#4B5563" />
                </TouchableOpacity>
              </View>

              <View className="items-center mb-5">
                <Text className="text-xs text-gray-400 font-bold uppercase tracking-wide">Valor a pagar</Text>
                <Text className="text-4xl font-extrabold text-gray-900 mt-1">{fmt(amount)}</Text>
              </View>

              <View className="flex-row justify-center mb-5">
                <View className="p-4 bg-white border-2 border-gray-100 rounded-2xl">
                  <QRCodeMock seed={pixKey + String(amount)} />
                </View>
              </View>

              <View className="bg-gray-50 rounded-2xl p-4 mb-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Chave Pix</Text>
                    <Text className="text-sm font-extrabold text-gray-800 mt-0.5" numberOfLines={1}>{pixKey}</Text>
                    <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>{pixName} · {pixCity}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => copy(pixKey, "key")}
                    className="flex-row items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-gray-200"
                  >
                    <Copy size={14} color="#4B5563" />
                    <Text className="text-xs font-bold text-gray-600">
                      {copied === "key" ? "Copiado!" : "Copiar Chave"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="bg-gray-50 rounded-2xl p-4 mb-5">
                <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-2">Copia e Cola</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="flex-1 text-xs font-mono text-gray-500" numberOfLines={1}>{emvCode}</Text>
                  <TouchableOpacity
                    onPress={() => copy(emvCode, "code")}
                    className="flex-row items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-gray-200"
                  >
                    <Copy size={14} color="#4B5563" />
                    <Text className="text-xs font-bold text-gray-600">
                      {copied === "code" ? "Copiado!" : "Copiar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                className="w-full py-4 bg-[#00C853] rounded-2xl shadow-lg shadow-green-500/25 items-center justify-center"
              >
                <Text className="text-white font-extrabold text-base">OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
