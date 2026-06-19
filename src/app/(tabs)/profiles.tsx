import { router, useFocusEffect } from "expo-router";
import {
  AlertCircle,
  ChevronRight,
  FolderGit2,
  Globe,
  Moon,
  Pencil,
  Settings,
  Trash2,
  Wallet,
  X,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Linking, Modal, Pressable, Switch, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styled from "styled-components/native";
import LogoSvg from "../../assets/Group1.svg";
import Group2Svg from "../../assets/Group2.svg"; // Novo logo para o modal
import { Avatar } from "../../components/Avatar";
import { useAppContext } from "../../context/AppContext";

export default function ProfilesScreen() {
  // ATENÇÃO: Adicione a função `clearAllData` (ou equivalente) no seu AppContext
  // para fazer a exclusão real dos dados no banco/storage.
  const { profiles, clearAllData } = useAppContext();
  const insets = useSafeAreaInsets();

  // --- ESTADOS DOS MODAIS ---
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isResetConfirmModalVisible, setIsResetConfirmModalVisible] =
    useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Apenas visual por enquanto

  // --- LÓGICA DA ANIMAÇÃO AO ENTRAR NA ABA ---
  // --- CONTROLE DE ROTAÇÃO CONTÍNUA SEM FLASH ---
  const rotationValue = useSharedValue(0); // Controla os graus (0, 180, 360, 540...)
  const isSettingsVisible = useSharedValue(0); // 0 = Logo visível, 1 = Engrenagem visível

  useFocusEffect(
    useCallback(() => {
      // Estado inicial ao entrar na aba: gira para a engrenagem
      rotationValue.value = withTiming(180, { duration: 600 });
      isSettingsVisible.value = withTiming(1, { duration: 600 });

      const interval = setInterval(() => {
        // A cada 5s, soma mais 180 graus (sempre para a frente)
        rotationValue.value = withTiming(rotationValue.value + 180, {
          duration: 600,
        });

        // Alterna o alvo da opacidade (0 ou 1)
        const nextTarget = isSettingsVisible.value === 0 ? 1 : 0;
        isSettingsVisible.value = withTiming(nextTarget, { duration: 600 });
      }, 5000);

      return () => {
        clearInterval(interval);
        // Reseta para o estado inicial ao sair da aba
        rotationValue.value = 0;
        isSettingsVisible.value = 0;
      };
    }, []),
  );

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      // Ambos os ícones giram juntos exatamente no mesmo ângulo contínuo
      transform: [{ rotate: `${rotationValue.value}deg` }],
      // O logo fica visível quando isSettingsVisible tende a 0
      opacity: interpolate(isSettingsVisible.value, [0, 0.5, 1], [1, 0, 0]),
    };
  });

  const settingsAnimatedStyle = useAnimatedStyle(() => {
    return {
      // Ambos os ícones giram juntos exatamente no mesmo ângulo contínuo
      transform: [{ rotate: `${rotationValue.value}deg` }],
      // A engrenagem fica visível quando isSettingsVisible tende a 1
      opacity: interpolate(isSettingsVisible.value, [0, 0.5, 1], [0, 0, 1]),
    };
  });

  // --- FUNÇÕES DE AÇÃO ---
  const handleResetData = () => {
    if (clearAllData) {
      clearAllData(); // Chama a função do seu contexto para limpar tudo
    }
    setIsResetConfirmModalVisible(false);
    setIsSettingsModalVisible(false);
  };

  const openGithub = () => {
    Linking.openURL("https://github.com/TobiasMaugus");
  };

  const openPortfolio = () => {
    // Substitua pela URL real do seu portfólio
    Linking.openURL("https://portfolio-ten-ashy-46.vercel.app/");
  };

  return (
    <Container style={{ paddingTop: insets.top }}>
      <ScrollContainer showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <Header style={{ position: "relative", justifyContent: "center" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingRight: 48,
            }}
          >
            <Title>Seus Perfis</Title>
          </View>

          {/* Botão que abre o modal de configurações */}
          <Pressable
            onPress={() => setIsSettingsModalVisible(true)}
            style={{
              position: "absolute",
              right: 4,
              top: -15,
              width: 34,
              height: 34,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Animated.View
              style={[{ position: "absolute" }, logoAnimatedStyle]}
            >
              <LogoSvg width={34} height={34} />
            </Animated.View>

            <Animated.View
              style={[{ position: "absolute" }, settingsAnimatedStyle]}
            >
              <Settings size={28} color="#111827" />
            </Animated.View>
          </Pressable>

          <Subtitle>Gerencie quem participa das divisões.</Subtitle>
        </Header>

        {/* Lista de Perfis */}
        <ProfilesList>
          {profiles.map((p) => (
            <ProfileCard key={p.id}>
              <ColorIndicator style={{ backgroundColor: p.color }} />
              <Avatar name={p.name} color={p.color} size="lg" />

              <ProfileInfo>
                <ProfileName>{p.name}</ProfileName>
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

              {/* <ActionIconWrapper>
                <ChevronRight size={20} color="#9CA3AF" />
              </ActionIconWrapper> */}
            </ProfileCard>
          ))}
        </ProfilesList>

        <BottomAction>
          <EditButton onPress={() => router.push("/setup")} activeOpacity={0.8}>
            <Pencil size={18} color="#FFFFFF" />
            <EditButtonText>Editar Perfis</EditButtonText>
          </EditButton>
        </BottomAction>
      </ScrollContainer>

      {/* ========================================== */}
      {/* MODAL DE CONFIGURAÇÕES */}
      {/* ========================================== */}
      <Modal
        visible={isSettingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <SettingsOverlay>
          <SettingsSheet style={{ paddingBottom: insets.bottom || 24 }}>
            <SettingsHeader
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                height: 48,
              }}
            >
              {/* Botão invisível do mesmo tamanho do fechar para garantir centralização perfeita */}
              <View style={{ width: 40, height: 40 }} />

              {/* Contêiner centralizado que limita o tamanho máximo do logo */}
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Group2Svg width={180} height={45} />
              </View>

              <CloseButton
                onPress={() => setIsSettingsModalVisible(false)}
                style={{
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={24} color="#71717a" />
              </CloseButton>
            </SettingsHeader>

            <SettingsBody>
              <SettingRow>
                <SettingRowLeft>
                  <SettingIconWrapper>
                    <Moon size={20} color="#18181b" />
                  </SettingIconWrapper>
                  <SettingLabel>Modo Escuro</SettingLabel>
                </SettingRowLeft>
                <Switch
                  value={isDarkMode}
                  onValueChange={setIsDarkMode}
                  trackColor={{ false: "#e4e4e7", true: "#6C63FF" }}
                  thumbColor="#ffffff"
                />
              </SettingRow>

              <SettingDivider />

              <SettingRow onPress={() => setIsResetConfirmModalVisible(true)}>
                <SettingRowLeft>
                  <SettingIconDanger>
                    <Trash2 size={20} color="#ef4444" />
                  </SettingIconDanger>
                  <SettingLabelDanger>Apagar todos os dados</SettingLabelDanger>
                </SettingRowLeft>
                <ChevronRight size={20} color="#d4d4d8" />
              </SettingRow>

              <LinksContainer>
                <LinksTitle>Conecte-se</LinksTitle>
                <LinkRow onPress={openGithub} activeOpacity={0.7}>
                  <FolderGit2 size={20} color="#71717a" />
                  <LinkText>GitHub</LinkText>
                </LinkRow>
                <LinkRow onPress={openPortfolio} activeOpacity={0.7}>
                  <Globe size={20} color="#71717a" />
                  <LinkText>Portfólio Web</LinkText>
                </LinkRow>
              </LinksContainer>
            </SettingsBody>

            <SettingsFooter>
              <FooterText>
                © SmartSplit Mobile - Todos os direitos reservados
              </FooterText>
              <FooterTextHighlight>
                Desenvolvido por @TobiasMaugus
              </FooterTextHighlight>
            </SettingsFooter>
          </SettingsSheet>
        </SettingsOverlay>
      </Modal>

      {/* ========================================== */}
      {/* MODAL DE CONFIRMAÇÃO DE RESET */}
      {/* ========================================== */}
      <Modal
        visible={isResetConfirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsResetConfirmModalVisible(false)}
      >
        <ConfirmOverlay>
          <ConfirmContent>
            <ConfirmTitle>Zerar Aplicativo</ConfirmTitle>
            <ConfirmSubtitle>
              Tem certeza que deseja apagar todos os perfis e o histórico de
              compras? Esta ação não poderá ser desfeita.
            </ConfirmSubtitle>

            <ActionButtonsContainer>
              <ModalCancelButton
                onPress={() => setIsResetConfirmModalVisible(false)}
                activeOpacity={0.7}
              >
                <ModalCancelText>Cancelar</ModalCancelText>
              </ModalCancelButton>

              <ModalDeleteButton onPress={handleResetData} activeOpacity={0.7}>
                <ModalDeleteText>Apagar Tudo</ModalDeleteText>
              </ModalDeleteButton>
            </ActionButtonsContainer>
          </ConfirmContent>
        </ConfirmOverlay>
      </Modal>
    </Container>
  );
}

// ==========================================
// STYLED COMPONENTS
// ==========================================

const Container = styled(View)`
  flex: 1;
  background-color: #f8fafc;
`;

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

// ==========================================
// STYLED COMPONENTS - MODAL DE CONFIGURAÇÕES
// ==========================================

const SettingsOverlay = styled.View`
  flex: 1;
  background-color: rgba(9, 9, 11, 0.6);
  justify-content: flex-end;
`;

const SettingsSheet = styled.View`
  background-color: #ffffff;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  padding: 24px;
  padding-top: 32px;
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.1;
  shadow-radius: 12px;
  elevation: 10;
`;

const SettingsHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const CloseButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  align-items: flex-end;
  justify-content: center;
`;

const SettingsBody = styled.View`
  gap: 8px;
`;

const SettingRow = styled.TouchableOpacity.attrs({ activeOpacity: 0.7 })`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 16px;
`;

const SettingRowLeft = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const SettingIconWrapper = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: #f4f4f5;
  align-items: center;
  justify-content: center;
`;

const SettingLabel = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #18181b;
`;

const SettingIconDanger = styled(SettingIconWrapper)`
  background-color: #fef2f2;
`;

const SettingLabelDanger = styled(SettingLabel)`
  color: #ef4444;
`;

const SettingDivider = styled.View`
  height: 1px;
  background-color: #f4f4f5;
  margin-vertical: 4px;
`;

const LinksContainer = styled.View`
  margin-top: 24px;
  background-color: #f8fafc;
  border-radius: 20px;
  padding: 20px;
  gap: 16px;
`;

const LinksTitle = styled.Text`
  font-size: 13px;
  font-weight: 800;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const LinkRow = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const LinkText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #52525b;
`;

const SettingsFooter = styled.View`
  align-items: center;
  margin-top: 40px;
  gap: 4px;
`;

const FooterText = styled.Text`
  font-size: 12px;
  color: #a1a1aa;
  font-weight: 500;
`;

const FooterTextHighlight = styled.Text`
  font-size: 12px;
  color: #18181b;
  font-weight: 700;
`;

// ==========================================
// STYLED COMPONENTS - MODAL DE CONFIRMAÇÃO
// ==========================================

const ConfirmOverlay = styled.View`
  flex: 1;
  background-color: rgba(9, 9, 11, 0.7);
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const ConfirmContent = styled.View`
  background-color: #ffffff;
  width: 100%;
  max-width: 340px;
  border-radius: 24px;
  padding: 32px;
  align-items: center;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.15;
  shadow-radius: 16px;
  elevation: 8;
`;

const ConfirmTitle = styled.Text`
  color: #18181b;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
`;

const ConfirmSubtitle = styled.Text`
  color: #71717a;
  margin-top: 8px;
  font-size: 13px;
  text-align: center;
  line-height: 18px;
  margin-bottom: 24px;
`;

const ActionButtonsContainer = styled.View`
  flex-direction: row;
  width: 100%;
  gap: 12px;
`;

const ModalCancelButton = styled.TouchableOpacity`
  flex: 1;
  height: 48px;
  background-color: #f4f4f5;
  border-radius: 14px;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-color: #e4e4e7;
`;

const ModalCancelText = styled.Text`
  color: #71717a;
  font-size: 14px;
  font-weight: 600;
`;

const ModalDeleteButton = styled.TouchableOpacity`
  flex: 1;
  height: 48px;
  background-color: #ef4444;
  border-radius: 14px;
  align-items: center;
  justify-content: center;
`;

const ModalDeleteText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
`;
