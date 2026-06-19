import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styled from "styled-components/native";
import LogoSvg from "../../assets/Group1.svg";
import { Avatar } from "../../components/Avatar";
import { SettingsModal } from "../../components/SettingsModal";
import { useAppContext } from "../../context/AppContext";
import { HistoryEntry } from "../../types";

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function HistoryScreen() {
  const { historyEntries } = useAppContext();
  const router = useRouter();
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  // Pegamos os limites seguros da tela do celular (como a barra de status no topo)
  const insets = useSafeAreaInsets();

  return (
    // Substituímos o SafeAreaView por View e aplicamos margem apenas no topo
    <Container style={{ paddingTop: insets.top }}>
      <ScrollContent showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
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

        {/* Lista de Histórico */}
        <ListContainer>
          {historyEntries.length === 0 ? (
            <EmptyText>Nenhum histórico disponível.</EmptyText>
          ) : (
            historyEntries.map((e: HistoryEntry, i) => {
              // 🔥 REGRA INTELIGENTE: Só mostra a data da nota se ela for DIFERENTE da data do App
              // @ts-ignore
              const showPurchaseDate = e.dateCompra && e.dateCompra !== e.date;

              return (
                <Pressable
                  key={e.id}
                  onPress={() =>
                    router.push({
                      pathname: "/history-details/[id]",
                      params: { id: e.id },
                    })
                  }
                  accessibilityRole="button"
                >
                  <Card>
                    <Avatar
                      name={e.payer.name}
                      color={e.payer.color}
                      size="md"
                    />

                    <CardBody>
                      <TopRow>
                        {/* Nome do Mercado agora ocupa toda a largura da linha */}
                        {/* @ts-ignore */}
                        <MarketTitle numberOfLines={1}>
                          {/* @ts-ignore */}
                          {e.marketName || "Supermercado"}
                        </MarketTitle>
                      </TopRow>

                      {/* Valor total da compra */}
                      <PriceText>{fmt(e.total)}</PriceText>

                      {/* Fluxo de pagamento verticalizado */}
                      {/* Fluxo de pagamento verticalizado */}
                      {/* Fluxo de pagamento verticalizado */}
                      <SplitDetailsContainer>
                        <PayerText numberOfLines={1}>
                          {e.payer.name.split(" ")[0]} pagou
                        </PayerText>

                        {/* Quebra apenas nas vírgulas seguidas de espaço, preservando os centavos (ex: R$ 17,56) */}
                        {e.desc.split(/,\s+/).map((debtor, index) => {
                          const trimmedDebtor = debtor.trim();
                          if (!trimmedDebtor) return null; // Evita linhas vazias

                          return (
                            <DebtorText key={index} numberOfLines={1}>
                              • {trimmedDebtor}
                            </DebtorText>
                          );
                        })}
                      </SplitDetailsContainer>

                      {/* Bloco de datas alinhado perfeitamente à esquerda */}
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
                    </CardBody>

                    <RightSide>
                      <IndexBadge>
                        <IndexText>#{historyEntries.length - i}</IndexText>
                      </IndexBadge>
                      <ChevronRight size={20} color="#D4D4D8" />
                    </RightSide>
                  </Card>
                </Pressable>
              );
            })
          )}
        </ListContainer>

        <Spacing />
      </ScrollContent>
      <SettingsModal
        visible={isSettingsModalVisible}
        onRequestClose={() => setIsSettingsModalVisible(false)}
      />
    </Container>
  );
}

// --- Styled Components ---

const Container = styled(View)`
  flex: 1;
  background-color: #f4f6f9;
`;

const ScrollContent = styled.ScrollView.attrs({
  contentContainerStyle: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
})`
  flex: 1;
`;

const Header = styled.View`
  margin-bottom: 32px;
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
  margin-top: 8px;
  font-weight: 500;
`;

const ListContainer = styled.View`
  gap: 16px;
`;

const EmptyText = styled.Text`
  font-size: 15px;
  color: #a1a1aa;
  text-align: center;
  margin-top: 40px;
  font-weight: 500;
`;

const Card = styled.View`
  background-color: #ffffff;
  border-radius: 20px;
  padding: 16px;
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: #f4f4f5;

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
  color: #18181b;
  flex: 1;
`;

const PriceText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 6px;
`;

const SplitDetailsContainer = styled.View`
  gap: 2px;
  margin-bottom: 8px;
`;

const PayerText = styled.Text`
  font-size: 12px;
  color: #4b5563;
  font-weight: 600;
`;

const DebtorText = styled.Text`
  font-size: 12px;
  color: #71717a;
  font-weight: 500;
`;

const DatesContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const DateText = styled.Text`
  font-size: 11px;
  font-weight: 600;
  color: #a1a1aa;
  background-color: #f4f6f9;
  padding-vertical: 2px;
  padding-horizontal: 6px;
  border-radius: 6px;
`;

const PurchaseDateText = styled.Text`
  font-size: 11px;
  font-weight: 600;
  color: #71717a;
  background-color: #eef2f7;
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
  background-color: #f4f6f9;
  align-items: center;
  justify-content: center;
`;

const IndexText = styled.Text`
  font-size: 10px;
  font-weight: 800;
  color: #a1a1aa;
`;

const Spacing = styled.View`
  height: 40px;
`;
