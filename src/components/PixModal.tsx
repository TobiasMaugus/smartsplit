import React, { useState } from "react";
import { Modal, TouchableWithoutFeedback } from "react-native";
import { X, Copy, Check } from "lucide-react-native";
import { Profile } from "../types";
import * as Clipboard from "expo-clipboard";
import { generatePixBRCode } from "../utils/pix";
import { QRCodePix } from "./QRCodePix";
import styled from "styled-components/native";

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

  // Gera o código EMV real
  const emvCode = generatePixBRCode(pixKey, amount, pixName, pixCity);

  const copy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Backdrop>
          <TouchableWithoutFeedback>
            <Sheet>
              <Handle />

              <HeaderRow>
                <SheetTitle>Gerar Pix</SheetTitle>
                <CloseBtn onPress={onClose} activeOpacity={0.7}>
                  <X size={16} color="#4B5563" />
                </CloseBtn>
              </HeaderRow>

              {/* Valor */}
              <AmountBox>
                <AmountLabel>Valor a pagar</AmountLabel>
                <AmountValue>{fmt(amount)}</AmountValue>
              </AmountBox>

              {/* QR Code Real */}
              <QRWrapper>
                <QRBorder>
                  <QRCodePix
                    value={emvCode}
                    size={180}
                    backgroundColor="#FFFFFF"
                    color="#111318"
                  />
                </QRBorder>
              </QRWrapper>

              {/* Chave Pix */}
              <InfoCard>
                <InfoRow>
                  <InfoContent>
                    <InfoLabel>Chave Pix</InfoLabel>
                    <InfoValue numberOfLines={1}>{pixKey}</InfoValue>
                    <InfoSub numberOfLines={1}>{pixName} · {pixCity}</InfoSub>
                  </InfoContent>
                  <CopyBtn onPress={() => copy(pixKey, "key")} activeOpacity={0.7}>
                    {copied === "key" ? (
                      <Check size={14} color="#10B981" />
                    ) : (
                      <Copy size={14} color="#4B5563" />
                    )}
                    <CopyText $success={copied === "key"}>
                      {copied === "key" ? "Copiado!" : "Copiar Chave"}
                    </CopyText>
                  </CopyBtn>
                </InfoRow>
              </InfoCard>

              {/* Copia e Cola */}
              <InfoCard>
                <InfoLabel>Copia e Cola</InfoLabel>
                <CopyColRow>
                  <EmvText numberOfLines={1}>{emvCode}</EmvText>
                  <CopyBtn onPress={() => copy(emvCode, "code")} activeOpacity={0.7}>
                    {copied === "code" ? (
                      <Check size={14} color="#10B981" />
                    ) : (
                      <Copy size={14} color="#4B5563" />
                    )}
                    <CopyText $success={copied === "code"}>
                      {copied === "code" ? "Copiado!" : "Copiar"}
                    </CopyText>
                  </CopyBtn>
                </CopyColRow>
              </InfoCard>

              {/* Botão OK */}
              <OkButton onPress={onClose} activeOpacity={0.85}>
                <OkText>OK</OkText>
              </OkButton>
            </Sheet>
          </TouchableWithoutFeedback>
        </Backdrop>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// --- Styled Components ---

const Backdrop = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.6);
  justify-content: flex-end;
`;

const Sheet = styled.View`
  background-color: #FFFFFF;
  width: 100%;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 12px 20px 40px 20px;
`;

const Handle = styled.View`
  width: 40px;
  height: 4px;
  background-color: #E5E7EB;
  border-radius: 2px;
  align-self: center;
  margin-bottom: 20px;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SheetTitle = styled.Text`
  font-size: 20px;
  font-weight: 800;
  color: #111827;
`;

const CloseBtn = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: #F3F4F6;
  align-items: center;
  justify-content: center;
`;

const AmountBox = styled.View`
  align-items: center;
  margin-bottom: 20px;
`;

const AmountLabel = styled.Text`
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const AmountValue = styled.Text`
  font-size: 36px;
  font-weight: 900;
  color: #111827;
  margin-top: 4px;
`;

const QRWrapper = styled.View`
  align-items: center;
  margin-bottom: 20px;
`;

const QRBorder = styled.View`
  padding: 16px;
  background-color: #FFFFFF;
  border-width: 2px;
  border-color: #F3F4F6;
  border-radius: 16px;
`;

const InfoCard = styled.View`
  background-color: #F9FAFB;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
`;

const InfoRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const InfoContent = styled.View`
  flex: 1;
`;

const InfoLabel = styled.Text`
  font-size: 10px;
  color: #9CA3AF;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
`;

const InfoValue = styled.Text`
  font-size: 14px;
  font-weight: 800;
  color: #1F2937;
`;

const InfoSub = styled.Text`
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 2px;
`;

const CopyBtn = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #FFFFFF;
  border-radius: 12px;
  border-width: 1px;
  border-color: #E5E7EB;
`;

const CopyText = styled.Text<{ $success: boolean }>`
  font-size: 12px;
  font-weight: 700;
  color: ${({ $success }) => ($success ? "#10B981" : "#4B5563")};
`;

const CopyColRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
`;

const EmvText = styled.Text`
  flex: 1;
  font-size: 12px;
  color: #6B7280;
  font-family: monospace;
`;

const OkButton = styled.TouchableOpacity`
  width: 100%;
  padding: 16px 0;
  background-color: #10B981;
  border-radius: 16px;
  align-items: center;
  justify-content: center;
  margin-top: 4px;

  shadow-color: #10B981;
  shadow-offset: 0px 6px;
  shadow-opacity: 0.25;
  shadow-radius: 12px;
  elevation: 4;
`;

const OkText = styled.Text`
  color: #FFFFFF;
  font-weight: 800;
  font-size: 16px;
`;
