import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styled from "styled-components/native";
import LogoSvg from "../../assets/Group1.svg";
import { Avatar } from "../../components/Avatar";
import { SettingsModal } from "../../components/SettingsModal";
import { ThemeColors } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";
import { useThemeContext } from "../../context/ThemeContext";
import { HistoryEntry } from "../../types";

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function HistoryScreen() {
  const { historyEntries } = useAppContext();
  const { colors } = useThemeContext();
  const router = useRouter();
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  const insets = useSafeAreaInsets();

  const renderHeader = () => (
    <Header style={{ position: "relative", justifyContent: "center" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingRight: 48,
        }}
      >
        <Title>Últimas Compras</Title>
      </View>
      <Pressable
        onPress={() => setIsSettingsModalVisible(true)}
        style={{ position: "absolute", right: 4, top: -15 }}
      >
        <LogoSvg width={34} height={34} />
      </Pressable>
      <Subtitle>Exibe as últimas compras realizadas.</Subtitle>
    </Header>
  );

  const renderItem = ({
    item: e,
    index,
  }: {
    item: HistoryEntry;
    index: number;
  }) => {
    // @ts-ignore
    const showPurchaseDate = e.dateCompra && e.dateCompra !== e.date;

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/history-details/[id]",
            params: { id: e.id },
          })
        }
        accessibilityRole="button"
      >
        <Card>
          <Avatar name={e.payer.name} color={e.payer.color} size="md" />

          <CardBody>
            <TopRow>
              {/* @ts-ignore */}
              <MarketTitle numberOfLines={1}>
                {e.marketName || "Supermercado"}
              </MarketTitle>
            </TopRow>

            <PriceText>{fmt(e.total)}</PriceText>

            <SplitDetailsContainer>
              <PayerText numberOfLines={1}>
                {e.payer.name.split(" ")[0]} pagou tudo
              </PayerText>

              {/* 💡 AQUI ENTRA A MÁGICA DA LEITURA DO PAGO/NÃO PAGO */}
              {e.desc.split(/,\s+/).map((debtor, idx) => {
                const trimmedDebtor = debtor.trim();
                if (!trimmedDebtor) return null;

                // Extrai o nome e o valor da string "Nome deve R$ X"
                const match = trimmedDebtor.match(/(.+?) deve (.+)/);
                if (!match) {
                  return (
                    <DebtorText key={idx} numberOfLines={1}>
                      • {trimmedDebtor}
                    </DebtorText>
                  );
                }

                const name = match[1];
                const amount = match[2];

                // Busca o ID do perfil para checar no paidStatus
                const profile = e.participants?.find(
                  (p) => p.name.split(" ")[0] === name,
                );
                const isPaid = profile
                  ? (e.paidStatus?.[profile.id] ?? false)
                  : false;

                return (
                  <DebtorRow key={idx}>
                    <DebtorText numberOfLines={1}>
                      • {name}: {amount}
                    </DebtorText>
                    <StatusPill $isPaid={isPaid}>
                      <StatusText $isPaid={isPaid}>
                        {isPaid ? "PAGO" : "NÃO PAGO"}
                      </StatusText>
                    </StatusPill>
                  </DebtorRow>
                );
              })}
              <DatesContainer>
                <DateText numberOfLines={1}>
                  📱 App: {e.date}
                  {/* @ts-ignore */}
                  {e.horario ? ` às ${e.horario}` : null}
                </DateText>

                <PurchaseDateText numberOfLines={1}>
                  📅 Nota: {/* @ts-ignore */}
                  {e.dateCompra}
                  {/* @ts-ignore */}
                  {e.horarioCompra ? ` às ${e.horarioCompra}` : null}
                </PurchaseDateText>
              </DatesContainer>
            </SplitDetailsContainer>
          </CardBody>

          <RightSide>
            <IndexBadge>
              <IndexText>#{historyEntries.length - index}</IndexText>
            </IndexBadge>
            <ChevronRight size={20} color={colors.textMuted} />
          </RightSide>
        </Card>
      </Pressable>
    );
  };

  return (
    <Container style={{ paddingTop: insets.top }}>
      <FlatList
        data={historyEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyText>Nenhum histórico disponível.</EmptyText>}
        ListFooterComponent={<Spacing />}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 24,
        }}
      />

      <SettingsModal
        visible={isSettingsModalVisible}
        onRequestClose={() => setIsSettingsModalVisible(false)}
      />
    </Container>
  );
}

// ==========================================
// STYLED COMPONENTS
// ==========================================

const Container = styled(View)`
  flex: 1;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.background};
`;

const Header = styled.View`
  margin-bottom: 32px;
`;

const Title = styled.Text`
  font-size: 32px;
  font-weight: 900;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  letter-spacing: -0.5px;
  line-height: 38px;
`;

const Subtitle = styled.Text`
  font-size: 15px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  margin-top: 8px;
  font-weight: 500;
`;

const EmptyText = styled.Text`
  font-size: 15px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  text-align: center;
  margin-top: 40px;
  font-weight: 500;
`;

const Card = styled.View`
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.cardBackground};
  border-radius: 20px;
  padding: 16px;
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.border};
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.04;
  shadow-radius: 8px;
  elevation: 2;
`;

const CardBody = styled.View`
  flex: 1;
  margin-left: 16px;
  margin-right: 12px;
  justify-content: center;
`;

const TopRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 2px;
`;

const MarketTitle = styled.Text`
  font-size: 15px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  flex: 1;
`;

const PriceText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }: { theme: ThemeColors }) => theme.accent};
  margin-bottom: 6px;
`;

const SplitDetailsContainer = styled.View`
  gap: 2px;
  margin-bottom: 8px;
`;

const PayerText = styled.Text`
  font-size: 12px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  font-weight: 600;
`;

const DebtorRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 2px;
`;

const DebtorText = styled.Text`
  font-size: 12px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  font-weight: 500;
`;

const StatusPill = styled.View<{ $isPaid: boolean }>`
  border-width: 1px;
  border-color: ${({
    $isPaid,
    theme,
  }: {
    $isPaid: boolean;
    theme: ThemeColors;
  }) => ($isPaid ? theme.accent : theme.danger)};
  border-radius: 12px;
  padding-horizontal: 6px;
  padding-vertical: 2px;
  margin-left: 6px;
`;

const StatusText = styled.Text<{ $isPaid: boolean }>`
  font-size: 9px;
  font-weight: 800;
  color: ${({ $isPaid, theme }: { $isPaid: boolean; theme: ThemeColors }) =>
    $isPaid ? theme.accent : theme.danger};
  text-transform: uppercase;
`;

const DatesContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 0px;
  margin-top: 10px;
`;

const DateText = styled.Text`
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.backgroundElement};
  padding-vertical: 2px;
  padding-horizontal: 6px;
  border-radius: 6px;
`;

const PurchaseDateText = styled.Text`
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.backgroundElement};
  padding-vertical: 2px;
  padding-horizontal: 6px;
  border-radius: 6px;
`;

const RightSide = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const IndexBadge = styled.View`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.backgroundElement};
  align-items: center;
  justify-content: center;
`;

const IndexText = styled.Text`
  font-size: 10px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
`;

const Spacing = styled.View`
  height: 40px;
`;
