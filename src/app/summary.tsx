import { router } from "expo-router";
import {
  ChevronLeft,
  QrCode,
  Save,
  Share2,
  ShoppingBag,
  User,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Animated, Share, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { Avatar } from "../components/Avatar";
import { PixModal } from "../components/PixModal";
import { useAppContext } from "../context/AppContext";
import {
  Allocations,
  COLLECTIVE,
  GroceryItem,
  HistoryEntry,
  Profile,
} from "../types";
import { generatePixBRCode } from "../utils/pix";

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

const computeShares = (
  allocs: Allocations,
  profiles: Profile[],
  items: GroceryItem[],
): Record<string, number> => {
  const s: Record<string, number> = {};
  profiles.forEach((p) => {
    s[p.id] = 0;
  });
  items.forEach((item) => {
    Object.entries(allocs[item.id] ?? {}).forEach(([pid, units]) => {
      const cost = units * item.unitPrice;
      if (pid === COLLECTIVE) {
        profiles.forEach((p) => {
          s[p.id] += cost / profiles.length;
        });
      } else {
        s[pid] = (s[pid] ?? 0) + cost;
      }
    });
  });
  return s;
};

export default function SummaryScreen() {
  const {
    profiles,
    allocs,
    items,
    historyEntries,
    setHistoryEntries,
    scrapedMarket,
    scrapedDate,
    scrapedTime,
    editingEntry,
    setEditingEntry,
  } = useAppContext();

  const [payerId, setPayerId] = useState<string | null>(null);
  const [showPix, setShowPix] = useState(false);
  const [wasSavedToHistory, setWasSavedToHistory] = useState(false);
  const [currentDebtorIndex, setCurrentDebtorIndex] = useState(0);

  // 💡 Estados para o Toast Customizado com Animação
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastOpacity] = useState(new Animated.Value(0));

  const PURCHASE_TOTAL = items.reduce(
    (s, i) => s + i.totalUnits * i.unitPrice,
    0,
  );

  const shares = computeShares(allocs, profiles, items);
  const payer = profiles.find((p) => p.id === payerId);
  const others = profiles.filter((p) => p.id !== payerId);

  const validDebtors = others.filter((o: Profile) => (shares[o.id] ?? 0) > 0);

  const isCompact = profiles.length > 4;
  const payerAvatarSize = isCompact ? "sm" : "lg";
  const breakdownAvatarSize = isCompact ? "xs" : "xs";

  // 💡 Função para disparar o aviso animado no topo com fade-out
  const showCustomToast = (msg: string) => {
    setToastMessage(msg);

    // Faz o Toast aparecer subindo a opacidade para 1
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Aguarda 2.5 segundos e faz o efeito desaparecer suavemente
    setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setToastMessage(null);
      });
    }, 2500);
  };

  const checkAndSaveToHistory = (currentPayer: Profile) => {
    if (wasSavedToHistory) return;
    const quantidadeHistorico = 15;

    const baseEntry: HistoryEntry = {
      id: editingEntry ? editingEntry.id : `h${Date.now()}`,
      date: new Date().toLocaleDateString("pt-BR"),
      total: PURCHASE_TOTAL,
      payer: currentPayer,
      desc: others
        .map((o) => `${o.name.split(" ")[0]} deve ${fmt(shares[o.id] ?? 0)}`)
        .join(", "),
      marketName: scrapedMarket || "Supermercado",
      dateCompra: scrapedDate || new Date().toLocaleDateString("pt-BR"),
      horarioCompra: scrapedTime || "",
      horario: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      items: items,
      allocs: allocs,
      participants: profiles,
    };

    if (editingEntry) {
      setHistoryEntries((prev) =>
        prev.map((h) => (h.id === baseEntry.id ? baseEntry : h)),
      );
      setEditingEntry(null);
    } else {
      setHistoryEntries(
        [baseEntry, ...historyEntries].slice(0, quantidadeHistorico),
      );
    }

    setWasSavedToHistory(true);
  };

  useEffect(() => {
    if (editingEntry) {
      setPayerId(editingEntry.payer.id);
      setWasSavedToHistory(false);
    }
  }, [editingEntry]);

  const handleSaveAndExit = () => {
    if (!payer) return;
    checkAndSaveToHistory(payer);
    router.replace("/(tabs)");
  };

  const shareAndClose = async () => {
    if (!payer) return;

    checkAndSaveToHistory(payer);

    const pixKey = payer.pixKey || "";
    const pixName = payer.pixName || payer.name;
    const pixCity = payer.pixCity || "São Paulo";

    const messageBlock = [
      `💰 Divisão Concluída!`,
      scrapedMarket ? `🛒 Local: ${scrapedMarket}` : "",
      `Total da compra: ${fmt(PURCHASE_TOTAL)}`,
      `Pagador: ${payer.name}`,
      pixKey ? `Chave PIX: ${pixKey}\n` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const debtLines = validDebtors.map((o: Profile) => {
      const valorIndividual = shares[o.id] ?? 0;
      let texto = `${o.name.split(" ")[0]} deve ${fmt(valorIndividual)}:`;

      if (pixKey) {
        const emvCode = generatePixBRCode(
          pixKey,
          valorIndividual,
          pixName,
          pixCity,
        );
        const safePixCode = encodeURIComponent(emvCode);
        const pixLink = `https://tobiasmaugus.github.io/smartsplitPIX-SITE/?codigo=${safePixCode}`;
        texto += `\n${pixLink}`;
      }
      return texto;
    });

    const message = `${messageBlock}\n${debtLines.join("\n\n")}`;

    try {
      await Share.share({ message });
    } catch (e) {
      // Usuário cancelou o compartilhamento
    }
  };

  const handleOpenPix = () => {
    if (!payer || validDebtors.length === 0) return;

    if (!payer.pixKey) {
      showCustomToast("Pagador não possui chave Pix cadastrada.");
      return;
    }

    checkAndSaveToHistory(payer);
    setCurrentDebtorIndex(0);
    setShowPix(true);
  };

  return (
    <Container>
      {/* 💡 Toast Animado adicionado no topo da tela */}
      {toastMessage && (
        <AnimatedToastContainer style={{ opacity: toastOpacity }}>
          <ToastText>{toastMessage}</ToastText>
        </AnimatedToastContainer>
      )}

      <Header>
        <BackButton onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#A1A1AA" />
          <BackText>Voltar</BackText>
        </BackButton>
        <Title>Quem Pagou?</Title>
        <Subtitle>Selecione quem realizou o pagamento</Subtitle>
      </Header>

      <ScrollContent showsVerticalScrollIndicator={false}>
        <TotalCard>
          <View>
            <TotalLabel>Total da Compra</TotalLabel>
            <TotalValue>{fmt(PURCHASE_TOTAL)}</TotalValue>
          </View>
          <TotalIconBox>
            <ShoppingBag size={24} color="#FFFFFF" />
          </TotalIconBox>
        </TotalCard>

        <Card>
          <CardLabel>Pagador</CardLabel>
          <PayerRow $isCompact={isCompact}>
            {profiles.map((p) => (
              <PayerButton
                key={p.id}
                $isCompact={isCompact}
                onPress={() => {
                  setPayerId(p.id);
                  setWasSavedToHistory(false);
                }}
                activeOpacity={0.7}
                $isActive={payerId === p.id}
              >
                <Avatar name={p.name} color={p.color} size={payerAvatarSize} />
                <PayerName $isCompact={isCompact}>
                  {p.name.split(" ")[0]}
                </PayerName>
                {payerId === p.id && (
                  <PayerStatus $isCompact={isCompact}>
                    ✓ Selecionado
                  </PayerStatus>
                )}
              </PayerButton>
            ))}
          </PayerRow>
        </Card>

        {payerId && (
          <View style={{ gap: 16 }}>
            <Card style={{ marginBottom: 0 }}>
              <CardLabel style={{ marginBottom: 16 }}>Rateio</CardLabel>
              <BreakdownList $isCompact={isCompact}>
                {profiles.map((p) => (
                  <BreakdownItem key={p.id} $isCompact={isCompact}>
                    <Avatar
                      name={p.name}
                      color={p.color}
                      size={breakdownAvatarSize}
                    />
                    <BreakdownInfo>
                      <BreakdownHeader>
                        <BreakdownName $isCompact={isCompact}>
                          {p.name.split(" ")[0]}
                          {p.id === payerId ? " (pagou)" : ""}
                        </BreakdownName>
                        <BreakdownValue $isCompact={isCompact}>
                          {fmt(shares[p.id] ?? 0)}
                        </BreakdownValue>
                      </BreakdownHeader>
                      <ProgressBarBox>
                        <ProgressBarFill
                          style={{
                            width: `${((shares[p.id] ?? 0) / Math.max(1, PURCHASE_TOTAL)) * 100}%`,
                            backgroundColor: p.color,
                          }}
                        />
                      </ProgressBarBox>
                    </BreakdownInfo>
                  </BreakdownItem>
                ))}
              </BreakdownList>

              <Divider />

              <OwningBox $isCompact={isCompact}>
                {others.length > 0 ? (
                  others.map((o: Profile) => (
                    <OwningItem key={o.id}>
                      <OwningUser>
                        <Avatar
                          name={o.name}
                          color={o.color}
                          size={breakdownAvatarSize}
                        />
                        <OwningText $isCompact={isCompact}>
                          {o.name.split(" ")[0]} te deve
                        </OwningText>
                      </OwningUser>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <OwningValue $isCompact={isCompact}>
                          {fmt(shares[o.id] ?? 0)}
                        </OwningValue>

                        {(shares[o.id] ?? 0) > 0 && (
                          <MiniQrButton
                            $disabled={!payer?.pixKey}
                            activeOpacity={0.7}
                            onPress={() => {
                              if (!payer?.pixKey) {
                                showCustomToast(
                                  "Pagador não possui chave Pix cadastrada.",
                                );
                                return;
                              }
                              checkAndSaveToHistory(payer!);
                              const idx = validDebtors.findIndex(
                                (d: Profile) => d.id === o.id,
                              );
                              if (idx !== -1) {
                                setCurrentDebtorIndex(idx);
                                setShowPix(true);
                              }
                            }}
                          >
                            <QrCode
                              size={16}
                              color={payer?.pixKey ? "#10B981" : "#A1A1AA"}
                            />
                          </MiniQrButton>
                        )}
                      </View>
                    </OwningItem>
                  ))
                ) : (
                  <EmptyOwning>Nenhum valor a receber</EmptyOwning>
                )}
              </OwningBox>
            </Card>

            <InlineSaveButton onPress={handleSaveAndExit} activeOpacity={0.85}>
              <Save size={18} color="#10B981" />
              <InlineSaveText>Salvar e Voltar</InlineSaveText>
            </InlineSaveButton>
          </View>
        )}

        {!payerId && (
          <EmptyPayerBox>
            <EmptyPayerIcon>
              <User size={20} color="#A1A1AA" />
            </EmptyPayerIcon>
            <EmptyPayerText>
              Selecione quem pagou para ver a divisão de valores
            </EmptyPayerText>
          </EmptyPayerBox>
        )}

        <Spacing />
      </ScrollContent>

      <BottomBar>
        <ButtonRow>
          <ActionButton
            disabled={!payerId}
            onPress={shareAndClose}
            $variant={payerId ? "dark" : "disabled"}
            activeOpacity={0.8}
          >
            <Share2 size={18} color={payerId ? "#FFFFFF" : "#A1A1AA"} />
            <ActionText $variant={payerId ? "dark" : "disabled"}>
              Partilhar
            </ActionText>
          </ActionButton>

          <ActionButton
            onPress={handleOpenPix}
            $variant={
              payerId && validDebtors.length > 0 && payer?.pixKey
                ? "primary"
                : "disabled"
            }
            activeOpacity={0.8}
          >
            <QrCode
              size={18}
              color={
                payerId && validDebtors.length > 0 && payer?.pixKey
                  ? "#FFFFFF"
                  : "#A1A1AA"
              }
            />
            <ActionText
              $variant={
                payerId && validDebtors.length > 0 && payer?.pixKey
                  ? "primary"
                  : "disabled"
              }
            >
              Gerar Pix
            </ActionText>
          </ActionButton>
        </ButtonRow>
      </BottomBar>

      {showPix && payer && validDebtors.length > 0 && (
        <PixModal
          visible={showPix}
          profile={payer}
          debtor={validDebtors[currentDebtorIndex]}
          amount={shares[validDebtors[currentDebtorIndex]?.id] ?? 0}
          onClose={() => setShowPix(false)}
          onNext={
            currentDebtorIndex < validDebtors.length - 1
              ? () => setCurrentDebtorIndex(currentDebtorIndex + 1)
              : undefined
          }
          onPrevious={
            currentDebtorIndex > 0
              ? () => setCurrentDebtorIndex(currentDebtorIndex - 1)
              : undefined
          }
        />
      )}
    </Container>
  );
}

// --- Styled Components ---

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #f4f6f9;
`;

// 💡 Container Base com estilo Branco limpo e posicionado no Topo superior
const ToastContainerBase = styled.View`
  position: absolute;
  top: 60px;
  left: 32px;
  right: 32px;
  background-color: #ffffff;
  padding-vertical: 14px;
  padding-horizontal: 20px;
  border-radius: 20px;
  border-width: 1px;
  border-color: #f4f4f5;
  align-items: center;
  justify-content: center;

  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
  elevation: 4;
  z-index: 9999;
`;

// Vincula o component com o sistema Animated do React Native
const AnimatedToastContainer =
  Animated.createAnimatedComponent(ToastContainerBase);

const ToastText = styled.Text`
  color: #18181b;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  letter-spacing: -0.2px;
`;

const Header = styled.View`
  padding: 40px 24px 16px 24px;
`;

const BackButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
`;

const BackText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #a1a1aa;
`;

const Title = styled.Text`
  font-size: 32px;
  font-weight: 900;
  color: #18181b;
  letter-spacing: -0.5px;
  line-height: 38px;
`;

const Subtitle = styled.Text`
  font-size: 15px;
  color: #71717a;
  margin-top: 4px;
  font-weight: 500;
`;

const ScrollContent = styled.ScrollView.attrs({
  contentContainerStyle: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
})`
  flex: 1;
`;

const TotalCard = styled.View`
  background-color: #18181b;
  border-radius: 24px;
  padding: 24px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  elevation: 5;
`;

const TotalLabel = styled.Text`
  font-size: 11px;
  color: #a1a1aa;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const TotalValue = styled.Text`
  font-size: 32px;
  font-weight: 900;
  color: #ffffff;
  margin-top: 4px;
`;

const TotalIconBox = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.1);
  align-items: center;
  justify-content: center;
`;

const Card = styled.View`
  background-color: #ffffff;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 16px;
  border-width: 1px;
  border-color: #f4f4f5;

  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.04;
  shadow-radius: 8px;
  elevation: 2;
`;

const CardLabel = styled.Text`
  font-size: 11px;
  font-weight: 800;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

const PayerRow = styled.View<{ $isCompact?: boolean }>`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ $isCompact }) => ($isCompact ? "8px" : "12px")};
  justify-content: center;
`;

const PayerButton = styled.TouchableOpacity<{
  $isActive: boolean;
  $isCompact?: boolean;
}>`
  align-items: center;
  gap: ${({ $isCompact }) => ($isCompact ? "6px" : "10px")};
  padding-vertical: ${({ $isCompact }) => ($isCompact ? "12px 8px" : "20px")};
  padding-horizontal: ${({ $isCompact }) => ($isCompact ? "8px" : "12px")};
  border-radius: ${({ $isCompact }) => ($isCompact ? "16px" : "20px")};
  border-width: 2px;
  width: ${({ $isCompact }) => ($isCompact ? "30%" : "46%")};
  min-width: ${({ $isCompact }) => ($isCompact ? "90px" : "120px")};
  max-width: ${({ $isCompact }) => ($isCompact ? "110px" : "160px")};

  ${({ $isActive }) =>
    $isActive
      ? `
    border-color: #10B981;
    background-color: #ECFDF5;
  `
      : `
    border-color: #F4F4F5;
    background-color: #FAFAFA;
  `}
`;

const PayerName = styled.Text<{ $isCompact?: boolean }>`
  font-size: ${({ $isCompact }) => ($isCompact ? "13px" : "15px")};
  font-weight: 900;
  color: #18181b;
  text-align: center;
`;

const PayerStatus = styled.Text<{ $isCompact?: boolean }>`
  font-size: ${({ $isCompact }) => ($isCompact ? "10px" : "12px")};
  font-weight: 800;
  color: #10b981;
`;

const BreakdownList = styled.View<{ $isCompact?: boolean }>`
  gap: ${({ $isCompact }) => ($isCompact ? "10px" : "16px")};
`;

const BreakdownItem = styled.View<{ $isCompact?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${({ $isCompact }) => ($isCompact ? "8px" : "12px")};
`;

const BreakdownInfo = styled.View`
  flex: 1;
`;

const BreakdownHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const BreakdownName = styled.Text<{ $isCompact?: boolean }>`
  font-size: ${({ $isCompact }) => ($isCompact ? "12px" : "14px")};
  font-weight: 800;
  color: #18181b;
`;

const BreakdownValue = styled.Text<{ $isCompact?: boolean }>`
  font-size: ${({ $isCompact }) => ($isCompact ? "12px" : "14px")};
  font-weight: 800;
  color: #18181b;
`;

const ProgressBarBox = styled.View`
  height: 8px;
  background-color: #f4f4f5;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressBarFill = styled.View`
  height: 100%;
  border-radius: 4px;
`;

const Divider = styled.View`
  height: 1px;
  background-color: #f4f4f5;
  margin-vertical: 16px;
`;

const OwningBox = styled.View<{ $isCompact?: boolean }>`
  background-color: #ecfdf5;
  border-radius: 16px;
  padding: ${({ $isCompact }) => ($isCompact ? "12px" : "16px")};
  gap: ${({ $isCompact }) => ($isCompact ? "8px" : "12px")};
`;

const OwningItem = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const OwningUser = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const OwningText = styled.Text<{ $isCompact?: boolean }>`
  font-size: ${({ $isCompact }) => ($isCompact ? "12px" : "14px")};
  font-weight: 600;
  color: #3f3f46;
`;

const OwningValue = styled.Text<{ $isCompact?: boolean }>`
  font-size: ${({ $isCompact }) => ($isCompact ? "14px" : "16px")};
  font-weight: 900;
  color: #10b981;
`;

const MiniQrButton = styled.TouchableOpacity<{ $disabled?: boolean }>`
  background-color: ${({ $disabled }) => ($disabled ? "#FAFAFA" : "#ffffff")};
  padding: 6px;
  border-radius: 10px;
  border-width: 1px;
  border-color: ${({ $disabled }) => ($disabled ? "#E4E4E7" : "#d1fae5")};
`;

const EmptyOwning = styled.Text`
  font-size: 14px;
  color: #a1a1aa;
  text-align: center;
  font-weight: 500;
`;

const EmptyPayerBox = styled.View`
  background-color: #ffffff;
  border-radius: 24px;
  padding: 20px;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  border-width: 1px;
  border-color: #f4f4f5;
`;

const EmptyPayerIcon = styled.View`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #f4f6f9;
  align-items: center;
  justify-content: center;
`;

const EmptyPayerText = styled.Text`
  font-size: 14px;
  color: #a1a1aa;
  font-weight: 500;
  flex: 1;
`;

const InlineSaveButton = styled.TouchableOpacity`
  background-color: #ffffff;
  border-width: 1px;
  border-color: #e4e4e7;
  border-radius: 20px;
  padding-vertical: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;

  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.02;
  shadow-radius: 4px;
  elevation: 1;
`;

const InlineSaveText = styled.Text`
  color: #18181b;
  font-size: 15px;
  font-weight: 800;
`;

const Spacing = styled.View`
  height: 40px;
`;

const BottomBar = styled.View`
  padding: 16px 24px 32px 24px;
  background-color: #ffffff;
  border-top-width: 1px;
  border-top-color: #f4f4f5;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const ActionButton = styled.TouchableOpacity<{
  $variant: "primary" | "dark" | "disabled";
}>`
  flex: 1;
  padding-vertical: 18px;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;

  ${({ $variant }) => {
    if ($variant === "primary")
      return `
      background-color: #10B981;
      shadow-color: #10B981;
      shadow-offset: 0px 6px;
      shadow-opacity: 0.25;
      shadow-radius: 12px;
      elevation: 4;
    `;
    if ($variant === "dark")
      return `
      background-color: #18181B;
      shadow-color: #000;
      shadow-offset: 0px 6px;
      shadow-opacity: 0.2;
      shadow-radius: 12px;
      elevation: 4;
    `;
    return `
      background-color: #F4F4F5;
    `;
  }}
`;

const ActionText = styled.Text<{ $variant: "primary" | "dark" | "disabled" }>`
  font-weight: 800;
  font-size: 15px;
  color: ${({ $variant }) => ($variant === "disabled" ? "#A1A1AA" : "#FFFFFF")};
`;
