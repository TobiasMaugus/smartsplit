import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { Avatar } from "../../components/Avatar";
import { useAppContext } from "../../context/AppContext";

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function HistoryScreen() {
  const { historyEntries } = useAppContext();

  // Pegamos os limites seguros da tela do celular (como a barra de status no topo)
  const insets = useSafeAreaInsets();

  return (
    // Substituímos o SafeAreaView por View e aplicamos margem apenas no topo
    <Container style={{ paddingTop: insets.top }}>
      <ScrollContent showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <Header>
          <Title>Últimas Compras</Title>
          <Subtitle>Exibe as últimas compras realizadas.</Subtitle>
        </Header>

        {/* Lista de Histórico */}
        <ListContainer>
          {historyEntries.length === 0 ? (
            <EmptyText>Nenhum histórico disponível.</EmptyText>
          ) : (
            historyEntries.map((e, i) => {
              // 🔥 REGRA INTELIGENTE: Só mostra a data da nota se ela for DIFERENTE da data do App
              // @ts-ignore
              const showPurchaseDate = e.dateCompra && e.dateCompra !== e.date;

              return (
                <Card key={e.id}>
                  <Avatar name={e.payer.name} color={e.payer.color} size="md" />

                  <CardBody>
                    <TopRow>
                      {/* Nome do Mercado */}
                      {/* @ts-ignore */}
                      <MarketTitle numberOfLines={1}>
                        {/* @ts-ignore */}
                        {e.marketName || "Supermercado"}
                      </MarketTitle>

                      {/* 🕒 DATA 1: Registro de quando foi processado no App */}
                      <DateText>App: {e.date}</DateText>
                    </TopRow>

                    {/* Valor total da compra */}
                    <PriceText>{fmt(e.total)}</PriceText>

                    {/* Descrição do rateio de quem deve quem */}
                    <DescText numberOfLines={1}>
                      {e.payer.name.split(" ")[0]} pagou · {e.desc}
                    </DescText>

                    {/* 📅 DATA 2: Exibe a data real APENAS se for diferente de hoje */}
                    {showPurchaseDate ? (
                      <PurchaseDateText>
                        📅 Nota de: {/* @ts-ignore */}
                        {e.dateCompra}
                      </PurchaseDateText>
                    ) : null}
                  </CardBody>

                  <IndexBadge>
                    <IndexText>#{historyEntries.length - i}</IndexText>
                  </IndexBadge>
                </Card>
              );
            })
          )}
        </ListContainer>

        <Spacing />
      </ScrollContent>
    </Container>
  );
}

// --- Styled Components ---

// Substituímos o SafeAreaView por View comum para eliminar a margem branca no fundo
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
  justify-content: space-between;
  margin-bottom: 2px;
`;

const MarketTitle = styled.Text`
  font-size: 15px;
  font-weight: 800;
  color: #18181b;
  flex: 1;
  margin-right: 8px;
`;

const PriceText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 4px;
`;

const DateText = styled.Text`
  font-size: 11px;
  font-weight: 600;
  color: #a1a1aa;
`;

const DescText = styled.Text`
  font-size: 12px;
  color: #71717a;
  font-weight: 500;
`;

const PurchaseDateText = styled.Text`
  font-size: 11px;
  font-weight: 600;
  color: #71717a;
  margin-top: 6px;
  background-color: #f4f6f9;
  padding-vertical: 2px;
  padding-horizontal: 6px;
  border-radius: 6px;
  align-self: flex-start;
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
