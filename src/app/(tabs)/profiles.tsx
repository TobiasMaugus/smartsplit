import { router } from "expo-router";
import { AlertCircle, ChevronRight, Pencil, Wallet } from "lucide-react-native";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { Avatar } from "../../components/Avatar";
import { useAppContext } from "../../context/AppContext";

export default function ProfilesScreen() {
  const { profiles } = useAppContext();

  // Pegamos os limites seguros da tela do celular para igualar com history.tsx
  const insets = useSafeAreaInsets();

  return (
    <Container style={{ paddingTop: insets.top }}>
      {/* showsVerticalScrollIndicator={false} deixa a rolagem mais limpa visualmente */}
      <ScrollContainer showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <Header>
          <Title>Seus Perfis</Title>
          <Subtitle>Gerencie quem participa das divisões.</Subtitle>
        </Header>

        {/* Lista de Perfis */}
        <ProfilesList>
          {profiles.map((p) => (
            <ProfileCard key={p.id}>
              {/* Indicador de cor lateral */}
              <ColorIndicator style={{ backgroundColor: p.color }} />

              <Avatar name={p.name} color={p.color} size="lg" />

              <ProfileInfo>
                <ProfileName>{p.name}</ProfileName>

                {/* Badges de Pix Modernos */}
                {p.pixKey ? (
                  <PixBadge>
                    <Wallet size={12} color="#059669" />
                    <PixText numberOfLines={1}>{p.pixKey}</PixText>
                  </PixBadge>
                ) : (
                  <NoPixBadge>
                    <AlertCircle size={12} color="#ea580c" />
                    <NoPixText>Sem Pix</NoPixText>
                  </NoPixBadge>
                )}
              </ProfileInfo>

              {/* Ícone de seta para indicar que há uma ação ou continuação */}
              <ActionIconWrapper>
                <ChevronRight size={20} color="#9CA3AF" />
              </ActionIconWrapper>
            </ProfileCard>
          ))}
        </ProfilesList>

        {/* Botão de Ação Inferior */}
        <BottomAction>
          <EditButton onPress={() => router.push("/setup")} activeOpacity={0.8}>
            <Pencil size={18} color="#FFFFFF" />
            <EditButtonText>Editar Perfis</EditButtonText>
          </EditButton>
        </BottomAction>
      </ScrollContainer>
    </Container>
  );
}

// --- Styled Components ---

// Substituímos o SafeAreaView por View comum (igual no history.tsx)
const Container = styled(View)`
  flex: 1;
  background-color: #f8fafc;
`;

// Aplicamos o espaçamento no contentContainerStyle para refletir o mesmo alinhamento
const ScrollContainer = styled.ScrollView.attrs({
  contentContainerStyle: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
})`
  flex: 1;
`;

// Removemos o margin-top: 8px que estava desalinhando a altura em relação ao history
const Header = styled.View`
  margin-bottom: 32px;
`;

const Title = styled.Text`
  font-size: 32px;
  font-weight: 900;
  color: #111827;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: #6b7280;
  margin-top: 6px;
  font-weight: 500;
`;

const ProfilesList = styled.View`
  gap: 16px;
`;

const ProfileCard = styled.View`
  background-color: #ffffff;
  border-radius: 24px;
  padding: 20px;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  border-width: 1px;
  border-color: #f9fafb;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.04;
  shadow-radius: 12px;
  elevation: 2;
`;

const ColorIndicator = styled.View`
  position: absolute;
  left: 0;
  top: 24px;
  bottom: 24px;
  width: 6px;
  border-top-right-radius: 9999px;
  border-bottom-right-radius: 9999px;
`;

const ProfileInfo = styled.View`
  flex: 1;
  margin-left: 4px;
`;

const ProfileName = styled.Text`
  font-weight: 800;
  color: #111827;
  font-size: 17px;
  margin-bottom: 4px;
`;

const PixBadge = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #ecfdf5;
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 6px;
  margin-top: 2px;
  border-width: 1px;
  border-color: #d1fae5;
`;

const PixText = styled.Text`
  font-size: 12px;
  font-weight: bold;
  color: #047857;
  margin-left: 6px;
`;

const NoPixBadge = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #fff7ed;
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 6px;
  margin-top: 2px;
  border-width: 1px;
  border-color: #ffedd5;
`;

const NoPixText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: #c2410c;
  margin-left: 6px;
`;

const ActionIconWrapper = styled.View`
  width: 40px;
  height: 40px;
  background-color: #f9fafb;
  border-radius: 9999px;
  align-items: center;
  justify-content: center;
`;

const BottomAction = styled.View`
  margin-top: 32px;
  padding-bottom: 48px;
`;

const EditButton = styled.TouchableOpacity`
  width: 100%;
  padding-vertical: 16px;
  background-color: #111827;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12px;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.15;
  shadow-radius: 16px;
  elevation: 4;
`;

const EditButtonText = styled.Text`
  font-weight: bold;
  color: #ffffff;
  font-size: 16px;
  letter-spacing: 0.5px;
`;
