import { router } from "expo-router";
import { QrCode } from "lucide-react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { Avatar } from "../../components/Avatar";
import { useAppContext } from "../../context/AppContext";

export default function MainScreen() {
  const { profiles, loadMockData, items } = useAppContext();

  const onScan = () => {
    if (items.length > 0) {
      router.push("/processing");
    } else {
      loadMockData();
      setTimeout(() => router.push("/processing"), 500);
    }
  };

  return (
    <Container>
      <ScrollContent showsVerticalScrollIndicator={false}>
        
        {/* Cabeçalho */}
        <Header>
          <HeaderTextGroup>
            <Title>Nova Compra</Title>
            <Subtitle>
              Automatize a leitura da nota fiscal e divida o valor rapidamente.
            </Subtitle>
          </HeaderTextGroup>
        </Header>

        {/* Área Central (Ações Principais) */}
        <CenterArea>
          <MainCard>
            <IconWrapper>
              <QrCode size={44} color="#FFFFFF" />
            </IconWrapper>
            
            <CardTextGroup>
              <CardTitle>Ler Nota Fiscal</CardTitle>
              <CardDescription>
                Aponte para o QR Code da nota fiscal eletrônica
              </CardDescription>
            </CardTextGroup>

            <PrimaryButton onPress={onScan} activeOpacity={0.85}>
              <PrimaryButtonText>Ler Nota Fiscal</PrimaryButtonText>
            </PrimaryButton>
          </MainCard>


        </CenterArea>

        {/* Rodapé (Perfis Ativos) */}
        <Footer>
          <FooterLabel>Perfis ativos</FooterLabel>
          <ProfilesRow>
            {profiles.map((p) => (
              <ProfileBadge key={p.id}>
                <Avatar name={p.name} color={p.color} size="sm" />
                <ProfileName numberOfLines={1}>
                  {p.name.split(" ")[0]}
                </ProfileName>
              </ProfileBadge>
            ))}
          </ProfilesRow>
        </Footer>

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
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
`;

const HeaderTextGroup = styled.View`
  flex: 1;
  padding-right: 16px;
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
  line-height: 22px;
`;

const MockButton = styled.TouchableOpacity`
  background-color: #E4E4E7;
  padding-horizontal: 12px;
  padding-vertical: 6px;
  border-radius: 8px;
  margin-top: 6px;
`;

const MockButtonText = styled.Text`
  font-size: 11px;
  font-weight: 800;
  color: #52525B;
  text-transform: uppercase;
`;

const CenterArea = styled.View`
  flex: 1;
  justify-content: center;
  gap: 16px;
`;

const MainCard = styled.View`
  background-color: #FFFFFF;
  border-radius: 24px;
  padding: 32px 24px;
  align-items: center;
  border-width: 1px;
  border-color: #F4F4F5;
  
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.06;
  shadow-radius: 16px;
  elevation: 4;
`;

const IconWrapper = styled.View`
  width: 88px;
  height: 88px;
  border-radius: 28px;
  background-color: #10B981;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  
  shadow-color: #10B981;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 12px;
  elevation: 6;
`;

const CardTextGroup = styled.View`
  align-items: center;
  margin-bottom: 32px;
  padding-horizontal: 16px;
`;

const CardTitle = styled.Text`
  font-size: 20px;
  font-weight: 800;
  color: #18181B;
  margin-bottom: 8px;
`;

const CardDescription = styled.Text`
  font-size: 14px;
  color: #A1A1AA;
  text-align: center;
  line-height: 20px;
  font-weight: 500;
`;

const PrimaryButton = styled.TouchableOpacity`
  width: 100%;
  padding-vertical: 18px;
  background-color: #10B981;
  border-radius: 16px;
  align-items: center;
  justify-content: center;
  
  shadow-color: #10B981;
  shadow-offset: 0px 6px;
  shadow-opacity: 0.25;
  shadow-radius: 12px;
  elevation: 5;
`;

const PrimaryButtonText = styled.Text`
  font-weight: 800;
  font-size: 16px;
  color: #FFFFFF;
  letter-spacing: 0.3px;
`;

const SecondaryButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-vertical: 16px;
  background-color: #FFFFFF;
  border-radius: 16px;
  border-width: 1px;
  border-color: #E4E4E7;
  gap: 8px;
  
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.03;
  shadow-radius: 4px;
  elevation: 2;
`;

const SecondaryButtonText = styled.Text`
  font-weight: 700;
  font-size: 15px;
  color: #52525B;
`;

const Footer = styled.View`
  margin-top: 48px;
  align-items: center;
`;

const FooterLabel = styled.Text`
  font-size: 11px;
  font-weight: 800;
  color: #D4D4D8;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
`;

const ProfilesRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
`;

const ProfileBadge = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const ProfileName = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: #52525B;
  max-width: 80px;
`;