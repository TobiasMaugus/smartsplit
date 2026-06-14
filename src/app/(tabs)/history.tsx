import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { Avatar } from "../../components/Avatar";
import { useAppContext } from "../../context/AppContext";

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function HistoryScreen() {
  const { historyEntries } = useAppContext();

  return (
    <Container>
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
            historyEntries.map((e, i) => (
              <Card key={e.id}>
                <Avatar name={e.payer.name} color={e.payer.color} size="md" />
                
                <CardBody>
                  <TopRow>
                    <PriceText>{fmt(e.total)}</PriceText>
                    <DateText>{e.date}</DateText>
                  </TopRow>
                  
                  <DescText numberOfLines={1}>
                    {e.payer.name.split(" ")[0]} pagou · {e.desc}
                  </DescText>
                </CardBody>

                <IndexBadge>
                  <IndexText>#{historyEntries.length - i}</IndexText>
                </IndexBadge>
              </Card>
            ))
          )}
        </ListContainer>
        
        <Spacing />
      </ScrollContent>
    </Container>
  );
}

// --- Styled Components ---

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #F4F6F9;
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
  color: #18181B;
  letter-spacing: -0.5px;
  line-height: 38px;
`;

const Subtitle = styled.Text`
  font-size: 15px;
  color: #71717A;
  margin-top: 8px;
  font-weight: 500;
`;

const ListContainer = styled.View`
  gap: 16px;
`;

const EmptyText = styled.Text`
  font-size: 15px;
  color: #A1A1AA;
  text-align: center;
  margin-top: 40px;
  font-weight: 500;
`;

const Card = styled.View`
  background-color: #FFFFFF;
  border-radius: 20px;
  padding: 16px;
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: #F4F4F5;
  
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
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const PriceText = styled.Text`
  font-size: 17px;
  font-weight: 800;
  color: #18181B;
`;

const DateText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: #A1A1AA;
`;

const DescText = styled.Text`
  font-size: 13px;
  color: #71717A;
  font-weight: 500;
`;

const IndexBadge = styled.View`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: #F4F6F9;
  align-items: center;
  justify-content: center;
`;

const IndexText = styled.Text`
  font-size: 10px;
  font-weight: 800;
  color: #A1A1AA;
`;

const Spacing = styled.View`
  height: 40px;
`;