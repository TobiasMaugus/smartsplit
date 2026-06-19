import * as LocalAuthentication from "expo-local-authentication";
import { router, useFocusEffect } from "expo-router";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FolderGit2,
  Globe,
  Pencil,
  Settings,
  Trash2,
  Wallet,
  X,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Linking, Modal, Pressable, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styled from "styled-components/native";
import LogoSvg from "../../assets/Group1.svg";
import Group2Svg from "../../assets/Group2.svg";
import { Avatar } from "../../components/Avatar";
import { useAppContext } from "../../context/AppContext";

export default function ProfilesScreen() {
  const { profiles, clearAllData } = useAppContext();
  const insets = useSafeAreaInsets();

  // --- ESTADOS ---
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isResetConfirmModalVisible, setIsResetConfirmModalVisible] =
    useState(false);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(
    null,
  );

  // --- LÓGICA DA ANIMAÇÃO AO ENTRAR NA ABA ---
  const rotationValue = useSharedValue(0);
  const isSettingsVisible = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      rotationValue.value = withTiming(180, { duration: 600 });
      isSettingsVisible.value = withTiming(1, { duration: 600 });

      const interval = setInterval(() => {
        rotationValue.value = withTiming(rotationValue.value + 180, {
          duration: 600,
        });

        const nextTarget = isSettingsVisible.value === 0 ? 1 : 0;
        isSettingsVisible.value = withTiming(nextTarget, { duration: 600 });
      }, 5000);

      return () => {
        clearInterval(interval);
        rotationValue.value = 0;
        isSettingsVisible.value = 0;
      };
    }, []),
  );

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotationValue.value}deg` }],
      opacity: interpolate(isSettingsVisible.value, [0, 0.5, 1], [1, 0, 0]),
    };
  });

  const settingsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotationValue.value}deg` }],
      opacity: interpolate(isSettingsVisible.value, [0, 0.5, 1], [0, 0, 1]),
    };
  });

  // --- FUNÇÕES DE AÇÃO ---
  const handleResetData = () => {
    if (clearAllData) {
      clearAllData();
    }
    setIsResetConfirmModalVisible(false);
    setIsSettingsModalVisible(false);
  };

  const openGithub = () => {
    Linking.openURL("https://github.com/TobiasMaugus");
  };

  const openPortfolio = () => {
    Linking.openURL("https://portfolio-ten-ashy-46.vercel.app/");
  };

  const toggleExpand = (id: string) => {
    setExpandedProfileId(expandedProfileId === id ? null : id);
  };

  // 💡 Lógica para exigir Autenticação Local antes de editar
  const handleEditProfiles = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: "Autentique-se para editar os perfis",
          fallbackLabel: "Usar senha",
        });

        if (authResult.success) {
          router.push("/setup");
        } else {
          // Usuário cancelou ou errou, encerra a ação
          return;
        }
      } else {
        // Dispositivo sem biometria/senha cadastrada, libera a edição
        router.push("/setup");
      }
    } catch (error) {
      console.error("Erro ao autenticar:", error);
      // Fallback seguro em caso de erro na biblioteca
      router.push("/setup");
    }
  };

  return (
    <Container style={{ paddingTop: insets.top }}>
      <ScrollContainer showsVerticalScrollIndicator={false}>
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

        {/* 💡 Lista de Perfis com cards expansíveis */}
        <ProfilesList>
          {profiles.map((p) => {
            const isExpanded = expandedProfileId === p.id;

            return (
              <ProfileCard
                key={p.id}
                onPress={() => toggleExpand(p.id)}
                activeOpacity={0.7}
              >
                <ColorIndicator style={{ backgroundColor: p.color }} />

                <ProfileCardTop>
                  <Avatar name={p.name} color={p.color} size="lg" />

                  <ProfileInfo>
                    <ProfileName>{p.name}</ProfileName>
                    {p.pixKey ? (
                      <PixBadge>
                        <Wallet size={12} color="#059669" />
                        <PixText numberOfLines={1}>Com Pix</PixText>
                      </PixBadge>
                    ) : (
                      <NoPixBadge>
                        <AlertCircle size={12} color="#ea580c" />
                        <NoPixText>Sem Pix</NoPixText>
                      </NoPixBadge>
                    )}
                  </ProfileInfo>

                  <ActionIconWrapper>
                    {isExpanded ? (
                      <ChevronDown size={20} color="#6b7280" />
                    ) : (
                      <ChevronRight size={20} color="#9CA3AF" />
                    )}
                  </ActionIconWrapper>
                </ProfileCardTop>

                {isExpanded && (
                  <ProfileExpandedContent>
                    <ExpandedDivider />
                    {p.pixKey ? (
                      <ExpandedDetails>
                        <DetailGroup>
                          <DetailLabel>Chave Pix</DetailLabel>
                          <DetailValue>{p.pixKey}</DetailValue>
                        </DetailGroup>

                        {p.pixName && (
                          <DetailGroup>
                            <DetailLabel>Nome do Titular</DetailLabel>
                            <DetailValue>{p.pixName}</DetailValue>
                          </DetailGroup>
                        )}

                        {p.pixCity && (
                          <DetailGroup>
                            <DetailLabel>Cidade</DetailLabel>
                            <DetailValue>{p.pixCity}</DetailValue>
                          </DetailGroup>
                        )}
                      </ExpandedDetails>
                    ) : (
                      <EmptyDetailsText>
                        Nenhum dado de transferência cadastrado para este
                        perfil.
                      </EmptyDetailsText>
                    )}
                  </ProfileExpandedContent>
                )}
              </ProfileCard>
            );
          })}
        </ProfilesList>

        <BottomAction>
          <EditButton onPress={handleEditProfiles} activeOpacity={0.8}>
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
              <View style={{ width: 40, height: 40 }} />
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

// O card principal agora é interativo e em coluna
const ProfileCard = styled.TouchableOpacity`
  background-color: #ffffff;
  border-radius: 24px;
  padding: 20px;
  border-width: 1px;
  border-color: #f9fafb;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.04;
  shadow-radius: 12px;
  elevation: 2;
  position: relative;
`;

// A parte superior mantém o layout de linha que existia antes
const ProfileCardTop = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 16px;
`;

const ColorIndicator = styled.View`
  position: absolute;
  left: 0;
  top: 20px;
  bottom: 20px;
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

// 💡 Novos componentes para a área expandida
const ProfileExpandedContent = styled.View`
  margin-top: 16px;
  padding-left: 4px;
`;

const ExpandedDivider = styled.View`
  height: 1px;
  background-color: #f3f4f6;
  margin-bottom: 16px;
`;

const ExpandedDetails = styled.View`
  gap: 12px;
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  border-width: 1px;
  border-color: #f1f5f9;
`;

const DetailGroup = styled.View`
  gap: 2px;
`;

const DetailLabel = styled.Text`
  font-size: 11px;
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailValue = styled.Text`
  font-size: 15px;
  color: #334155;
  font-weight: 600;
`;

const EmptyDetailsText = styled.Text`
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
  font-style: italic;
  margin-top: 4px;
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
// STYLED COMPONENTS - MODAIS (MANTIDOS ORIGINAIS)
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
