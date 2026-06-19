import * as Clipboard from "expo-clipboard";
import { Check, Copy, X } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, TouchableWithoutFeedback, View } from "react-native";
import styled from "styled-components/native";
import { ThemeColors } from "../constants/theme";
import { Profile } from "../types";
import { generatePixBRCode } from "../utils/pix";
import { QRCodePix } from "./QRCodePix";

interface PixModalProps {
  profile: Profile; // Quem vai receber (Pagador)
  debtor?: Profile; // Quem vai pagar (Devedor atual)
  amount: number;
  onClose: () => void;
  visible: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export function PixModal({
  profile,
  debtor,
  amount,
  onClose,
  visible,
  onNext,
  onPrevious,
}: PixModalProps) {
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Backdrop>
          <TouchableWithoutFeedback>
            <Sheet>
              <Handle />

              <HeaderRow>
                <View>
                  <SheetTitle>
                    {debtor
                      ? `Cobrança para ${debtor.name.split(" ")[0]}`
                      : "Gerar Pix"}
                  </SheetTitle>
                </View>
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
                    <InfoLabel>
                      Chave Pix de {profile.name.split(" ")[0]}
                    </InfoLabel>
                    <InfoValue numberOfLines={1}>{pixKey}</InfoValue>
                    <InfoSub numberOfLines={1}>
                      {pixName} · {pixCity}
                    </InfoSub>
                  </InfoContent>
                  <CopyBtn
                    onPress={() => copy(pixKey, "key")}
                    activeOpacity={0.7}
                  >
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
                  <CopyBtn
                    onPress={() => copy(emvCode, "code")}
                    activeOpacity={0.7}
                  >
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

              {/* Botões de Navegação */}
              <FooterRow>
                {/* Se existir "Anterior" e ainda houver "Próximo" (QR Code Intermediário) */}
                {onPrevious && onNext && (
                  <ActionBtn
                    $variant="secondary"
                    onPress={onPrevious}
                    activeOpacity={0.85}
                  >
                    <ActionText $variant="secondary">Anterior</ActionText>
                  </ActionBtn>
                )}

                {/* Lógica do botão principal */}
                {!onNext ? (
                  // ÚLTIMO ou ÚNICO QR Code: Botão único de OK fechando o modal
                  <ActionBtn
                    $variant="primary"
                    onPress={onClose}
                    activeOpacity={0.85}
                  >
                    <ActionText $variant="primary">OK</ActionText>
                  </ActionBtn>
                ) : (
                  // PRIMEIRO ou INTERMEDIÁRIO: Botão de Próximo
                  <ActionBtn
                    $variant="primary"
                    onPress={onNext}
                    activeOpacity={0.85}
                  >
                    <ActionText $variant="primary">Próximo</ActionText>
                  </ActionBtn>
                )}
              </FooterRow>
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
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.modalOverlay};
  justify-content: flex-end;
`;

const Sheet = styled.View`
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElevated};
  width: 100%;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 12px 20px 40px 20px;
`;

const Handle = styled.View`
  width: 40px;
  height: 4px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.borderLight};
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
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
`;

const CloseBtn = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElement};
  align-items: center;
  justify-content: center;
`;

const AmountBox = styled.View`
  align-items: center;
  margin-bottom: 20px;
`;

const AmountLabel = styled.Text`
  font-size: 11px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const AmountValue = styled.Text`
  font-size: 36px;
  font-weight: 900;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  margin-top: 4px;
`;

const QRWrapper = styled.View`
  align-items: center;
  margin-bottom: 20px;
`;

const QRBorder = styled.View`
  padding: 16px;
  background-color: #ffffff;
  border-width: 2px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.borderLight};
  border-radius: 16px;
`;

const InfoCard = styled.View`
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElement};
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
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
`;

const InfoValue = styled.Text`
  font-size: 14px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
`;

const InfoSub = styled.Text`
  font-size: 12px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  margin-top: 2px;
`;

const CopyBtn = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElevated};
  border-radius: 12px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.borderLight};
`;

const CopyText = styled.Text<{ $success: boolean }>`
  font-size: 12px;
  font-weight: 700;
  color: ${({ $success, theme }: { $success: boolean; theme: ThemeColors }) =>
    $success ? theme.accent : theme.textSecondary};
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
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  font-family: monospace;
`;

const FooterRow = styled.View`
  flex-direction: row;
  gap: 12px;
  margin-top: 4px;
`;

const ActionBtn = styled.TouchableOpacity<{
  $variant: "primary" | "secondary";
}>`
  flex: 1;
  padding: 16px 0;
  border-radius: 16px;
  align-items: center;
  justify-content: center;
  background-color: ${({ $variant, theme }: { $variant: string; theme: ThemeColors }) =>
    $variant === "primary" ? theme.accent : theme.backgroundElement};

  ${({ $variant, theme }) =>
    $variant === "primary" &&
    `
    shadow-color: ${(theme as ThemeColors).accent};
    shadow-offset: 0px 6px;
    shadow-opacity: 0.25;
    shadow-radius: 12px;
    elevation: 4;
  `}
`;

const ActionText = styled.Text<{ $variant: "primary" | "secondary" }>`
  font-weight: 800;
  font-size: 16px;
  color: ${({ $variant, theme }: { $variant: string; theme: ThemeColors }) =>
    $variant === "primary" ? "#FFFFFF" : theme.textSecondary};
`;
