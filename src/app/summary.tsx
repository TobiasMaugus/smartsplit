import { router } from "expo-router";
import {
  ChevronLeft,
  QrCode,
  Save,
  Share2,
  ShoppingBag,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import { Share, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { Avatar } from "../components/Avatar";
import { PixModal } from "../components/PixModal";
import { useAppContext } from "../context/AppContext";
import { Allocations, Profile } from "../types";
import { generatePixBRCode } from "../utils/pix";

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

const computeShares = (
  allocs: Allocations,
  profiles: Profile[],
  items: any[],
): Record<string, number> => {
  const s: Record<string, number> = {};
  profiles.forEach((p) => {
    s[p.id] = 0;
  });
  items.forEach((item) => {
    Object.entries(allocs[item.id] ?? {}).forEach(([pid, units]) => {
      const cost = units * item.unitPrice;
      if (pid === "__collective__") {
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
    scrapedMarket, // 🔥 Puxado do Contexto Global
    scrapedDate, // 🔥 Puxado do Contexto Global
    scrapedTime,
  } = useAppContext();

  const [payerId, setPayerId] = useState<string | null>(null);
  const [showPix, setShowPix] = useState(false);
  const [wasSavedToHistory, setWasSavedToHistory] = useState(false);

  const PURCHASE_TOTAL = items.reduce(
    (s, i) => s + i.totalUnits * i.unitPrice,
    0,
  );
  const shares = computeShares(allocs, profiles, items);
  const payer = profiles.find((p) => p.id === payerId);
  const others = profiles.filter((p) => p.id !== payerId);
  const owingTotal = others.reduce((s, p) => s + (shares[p.id] ?? 0), 0);

  // 1. Função Centralizada de Salvamento
  const checkAndSaveToHistory = (currentPayer: Profile) => {
    if (wasSavedToHistory) return;

    const newEntry = {
      id: `h${Date.now()}`,
      date: new Date().toLocaleDateString("pt-BR"),
      total: PURCHASE_TOTAL,
      payer: currentPayer,
      desc: others
        .map((o) => `${o.name.split(" ")[0]} deve ${fmt(shares[o.id] ?? 0)}`)
        .join(", "),

      // 🔥 Salva invisivelmente os dados do WebScraping no banco de dados
      marketName: scrapedMarket || "Supermercado",
      dateCompra: scrapedDate || new Date().toLocaleDateString("pt-BR"),
      horarioCompra: scrapedTime || "",
      horario: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // 🔥 Limite de histórico alterado para as últimas 10 compras
    setHistoryEntries([newEntry, ...historyEntries].slice(0, 15));
    setWasSavedToHistory(true);
  };

  // 2. Ação: Salvar e Voltar direto
  const handleSaveAndExit = () => {
    if (!payer) return;
    checkAndSaveToHistory(payer);
    router.replace("/(tabs)");
  };

  // 3. Ação: Compartilhar
  // 3. Ação: Compartilhar
  // 3. Ação: Compartilhar
  const shareAndClose = async () => {
    if (!payer) return;

    checkAndSaveToHistory(payer);

    const pixKey = payer.pixKey || "";
    const pixName = payer.pixName || payer.name;
    const pixCity = payer.pixCity || "São Paulo";
    const emvCode = pixKey
      ? generatePixBRCode(pixKey, owingTotal, pixName, pixCity)
      : "";

    const debtLines = others.map(
      (o) => `• ${o.name.split(" ")[0]} deve ${fmt(shares[o.id] ?? 0)}`,
    );

    // Separamos o bloco de resumo do bloco do Pix Copia e Cola
    const messageBlock = [
      `💰 Divisão Concluída!`,
      scrapedMarket ? `🛒 Local: ${scrapedMarket}` : "",
      `Total da compra: ${fmt(PURCHASE_TOTAL)}`,
      `Pagador: ${payer.name} \n`,
      `Chave PIX: ${payer.pixKey} \n`,
      debtLines,
    ]
      .filter(Boolean)
      .join("\n");

    // 🔥 Geramos o link codificado de forma segura para o seu site do GitHub Pages
    const safePixCode = encodeURIComponent(emvCode);
    const pixLink = `https://tobiasmaugus.github.io/smartsplitPIX-SITE/?codigo=${safePixCode}`;

    // 🔥 Montamos o texto final com o Link do site LOGO ACIMA do código copia e cola tradicional
    const message = pixKey
      ? `${messageBlock}\n\n🔗 *Pagar pelo Navegador (QR Code):*\n${pixLink}\n\n` // 📋 *Pix Copia e Cola (Toque para copiar):*\n\`\`\`${emvCode}\`\`\`
      : messageBlock;

    try {
      await Share.share({ message });
    } catch (e) {
      // Utilizador cancelou a partilha
    }

    router.replace("/(tabs)");
  };

  // 4. Ação: Gerar Pix
  const handleOpenPix = () => {
    if (!payer) return;
    checkAndSaveToHistory(payer);
    setShowPix(true);
  };

  return (
    <Container>
      <Header>
        <BackButton onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#A1A1AA" />
          <BackText>Voltar</BackText>
        </BackButton>
        <Title>Quem Pagou?</Title>
        <Subtitle>Selecione quem realizou o pagamento</Subtitle>
      </Header>

      <ScrollContent showsVerticalScrollIndicator={false}>
        {/* Card Total da Compra */}
        <TotalCard>
          <View>
            <TotalLabel>Total da Compra</TotalLabel>
            <TotalValue>{fmt(PURCHASE_TOTAL)}</TotalValue>
          </View>
          <TotalIconBox>
            <ShoppingBag size={24} color="#FFFFFF" />
          </TotalIconBox>
        </TotalCard>

        {/* Seleção de Pagador */}
        <Card>
          <CardLabel>Pagador</CardLabel>
          <PayerRow>
            {profiles.map((p) => (
              <PayerButton
                key={p.id}
                onPress={() => {
                  setPayerId(p.id);
                  setWasSavedToHistory(false);
                }}
                activeOpacity={0.7}
                $isActive={payerId === p.id}
              >
                <Avatar name={p.name} color={p.color} size="lg" />
                <PayerName>{p.name.split(" ")[0]}</PayerName>
                {payerId === p.id && <PayerStatus>✓ Selecionado</PayerStatus>}
              </PayerButton>
            ))}
          </PayerRow>
        </Card>

        {/* Detalhes do Rateio */}
        {payerId && (
          <View style={{ gap: 16 }}>
            <Card style={{ marginBottom: 0 }}>
              <CardLabel style={{ marginBottom: 16 }}>Rateio</CardLabel>
              <BreakdownList>
                {profiles.map((p) => (
                  <BreakdownItem key={p.id}>
                    <Avatar name={p.name} color={p.color} size="xs" />
                    <BreakdownInfo>
                      <BreakdownHeader>
                        <BreakdownName>
                          {p.name.split(" ")[0]}
                          {p.id === payerId ? " (pagou)" : ""}
                        </BreakdownName>
                        <BreakdownValue>
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

              <OwningBox>
                {others.length > 0 ? (
                  others.map((o) => (
                    <OwningItem key={o.id}>
                      <OwningUser>
                        <Avatar name={o.name} color={o.color} size="xs" />
                        <OwningText>{o.name.split(" ")[0]} te deve</OwningText>
                      </OwningUser>
                      <OwningValue>{fmt(shares[o.id] ?? 0)}</OwningValue>
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

        {/* Placeholder caso não haja pagador */}
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

      {/* Footer / Ações */}
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
            disabled={!payerId}
            onPress={handleOpenPix}
            $variant={payerId ? "primary" : "disabled"}
            activeOpacity={0.8}
          >
            <QrCode size={18} color={payerId ? "#FFFFFF" : "#A1A1AA"} />
            <ActionText $variant={payerId ? "primary" : "disabled"}>
              Gerar Pix
            </ActionText>
          </ActionButton>
        </ButtonRow>
      </BottomBar>

      {showPix && payer && (
        <PixModal
          visible={showPix}
          profile={payer}
          amount={owingTotal}
          onClose={() => setShowPix(false)}
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

const PayerRow = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const PayerButton = styled.TouchableOpacity<{ $isActive: boolean }>`
  flex: 1;
  align-items: center;
  gap: 10px;
  padding-vertical: 20px;
  border-radius: 20px;
  border-width: 2px;

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

const PayerName = styled.Text`
  font-size: 15px;
  font-weight: 900;
  color: #18181b;
`;

const PayerStatus = styled.Text`
  font-size: 12px;
  font-weight: 800;
  color: #10b981;
`;

const BreakdownList = styled.View`
  gap: 16px;
`;

const BreakdownItem = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const BreakdownInfo = styled.View`
  flex: 1;
`;

const BreakdownHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const BreakdownName = styled.Text`
  font-size: 14px;
  font-weight: 800;
  color: #18181b;
`;

const BreakdownValue = styled.Text`
  font-size: 14px;
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

const OwningBox = styled.View`
  background-color: #ecfdf5;
  border-radius: 16px;
  padding: 16px;
  gap: 12px;
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

const OwningText = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #3f3f46;
`;

const OwningValue = styled.Text`
  font-size: 16px;
  font-weight: 900;
  color: #10b981;
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
