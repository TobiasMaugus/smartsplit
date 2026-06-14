import { router } from "expo-router";
import {
  ChevronLeft,
  QrCode,
  Share2,
  ShoppingBag,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { Avatar } from "../components/Avatar";
import { PixModal } from "../components/PixModal";
import { useAppContext } from "../context/AppContext";
import { Allocations, Profile } from "../types";

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
  const { profiles, allocs, items, historyEntries, setHistoryEntries } =
    useAppContext();
  const [payerId, setPayerId] = useState<string | null>(null);
  const [showPix, setShowPix] = useState(false);

  const PURCHASE_TOTAL = items.reduce(
    (s, i) => s + i.totalUnits * i.unitPrice,
    0,
  );
  const shares = computeShares(allocs, profiles, items);
  const payer = profiles.find((p) => p.id === payerId);
  const others = profiles.filter((p) => p.id !== payerId);
  const owingTotal = others.reduce((s, p) => s + (shares[p.id] ?? 0), 0);

  const saveToHistoryAndClose = () => {
    if (payer) {
      const newEntry = {
        id: `h${Date.now()}`,
        date: new Date().toLocaleDateString("pt-BR"),
        total: PURCHASE_TOTAL,
        payer,
        desc: others
          .map((o) => `${o.name.split(" ")[0]} deve ${fmt(shares[o.id] ?? 0)}`)
          .join(", "),
      };
      setHistoryEntries([newEntry, ...historyEntries].slice(0, 3));
    }
    router.replace("/(tabs)/");
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
                onPress={() => setPayerId(p.id)}
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
          <Card>
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
                      <BreakdownValue>{fmt(shares[p.id] ?? 0)}</BreakdownValue>
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
        )}

        {/* Placeholder caso não haja pagador */}
        {!payerId && (
          <EmptyPayerBox>
            <EmptyPayerIcon>
              <User size={20} color="#A1A1AA" />
            </EmptyPayerIcon>
            <EmptyPayerText>
              Selecione quem pagou para ver o rateio
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
            onPress={saveToHistoryAndClose}
            $variant={payerId ? "dark" : "disabled"}
            activeOpacity={0.8}
          >
            <Share2 size={18} color={payerId ? "#FFFFFF" : "#A1A1AA"} />
            <ActionText $variant={payerId ? "dark" : "disabled"}>
              Concluir
            </ActionText>
          </ActionButton>

          <ActionButton
            disabled={!payerId}
            onPress={() => payerId && setShowPix(true)}
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
  background-color: #F4F6F9;
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
  color: #A1A1AA;
`;

const Title = styled.Text`
  font-size: 32px;
  font-weight: 900;
  color: #18181B;
  letter-spacing: -0.5px;
  line-height: 38px;
`;

const Subtitle = styled.Text`
  font-size: 15px;
  color: #71717A;
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
  background-color: #18181B;
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
  color: #A1A1AA;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const TotalValue = styled.Text`
  font-size: 32px;
  font-weight: 900;
  color: #FFFFFF;
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
  background-color: #FFFFFF;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 16px;
  border-width: 1px;
  border-color: #F4F4F5;
  
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.04;
  shadow-radius: 8px;
  elevation: 2;
`;

const CardLabel = styled.Text`
  font-size: 11px;
  font-weight: 800;
  color: #A1A1AA;
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
  color: #18181B;
`;

const PayerStatus = styled.Text`
  font-size: 12px;
  font-weight: 800;
  color: #10B981;
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
  color: #18181B;
`;

const BreakdownValue = styled.Text`
  font-size: 14px;
  font-weight: 800;
  color: #18181B;
`;

const ProgressBarBox = styled.View`
  height: 8px;
  background-color: #F4F4F5;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressBarFill = styled.View`
  height: 100%;
  border-radius: 4px;
`;

const Divider = styled.View`
  height: 1px;
  background-color: #F4F4F5;
  margin-vertical: 16px;
`;

const OwningBox = styled.View`
  background-color: #ECFDF5;
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
  color: #3F3F46;
`;

const OwningValue = styled.Text`
  font-size: 16px;
  font-weight: 900;
  color: #10B981;
`;

const EmptyOwning = styled.Text`
  font-size: 14px;
  color: #A1A1AA;
  text-align: center;
  font-weight: 500;
`;

const EmptyPayerBox = styled.View`
  background-color: #FFFFFF;
  border-radius: 24px;
  padding: 20px;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  border-width: 1px;
  border-color: #F4F4F5;
`;

const EmptyPayerIcon = styled.View`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #F4F6F9;
  align-items: center;
  justify-content: center;
`;

const EmptyPayerText = styled.Text`
  font-size: 14px;
  color: #A1A1AA;
  font-weight: 500;
  flex: 1;
`;

const Spacing = styled.View`
  height: 40px;
`;

const BottomBar = styled.View`
  padding: 16px 24px 32px 24px;
  background-color: #FFFFFF;
  border-top-width: 1px;
  border-top-color: #F4F4F5;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const ActionButton = styled.TouchableOpacity<{ $variant: "primary" | "dark" | "disabled" }>`
  flex: 1;
  padding-vertical: 18px;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  ${({ $variant }) => {
    if ($variant === "primary") return `
      background-color: #10B981;
      shadow-color: #10B981;
      shadow-offset: 0px 6px;
      shadow-opacity: 0.25;
      shadow-radius: 12px;
      elevation: 4;
    `;
    if ($variant === "dark") return `
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