import * as LocalAuthentication from "expo-local-authentication";
import { router, useFocusEffect } from "expo-router";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Pencil,
  Settings,
  Wallet,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styled from "styled-components/native";
import LogoSvg from "../../assets/Group1.svg";
import { Avatar } from "../../components/Avatar";
import { SettingsModal } from "../../components/SettingsModal";
import { ThemeColors } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";
import { useThemeContext } from "../../context/ThemeContext";

const ThemedPencil = styled(Pencil).attrs(
  ({ theme }: { theme: ThemeColors }) => ({
    color: theme.background,
  }),
)``;

// ==========================================
// FUNÇÕES DE MÁSCARA E IDENTIFICAÇÃO (Apenas Visual)
// ==========================================
const isValidCPF = (cpf: string): boolean => {
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  const calc = (n: number) => {
    let sum = 0;
    for (let i = 0; i < n - 1; i++) sum += parseInt(cpf.charAt(i)) * (n - i);
    const rest = (sum * 10) % 11;
    return rest === 10 || rest === 11 ? 0 : rest;
  };
  return (
    calc(10) === parseInt(cpf.charAt(9)) &&
    calc(11) === parseInt(cpf.charAt(10))
  );
};

const isValidCNPJ = (cnpj: string): boolean => {
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false;
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
};

const getPixInfo = (value: string) => {
  const num = value.replace(/\D/g, "");
  if (num.length === 11 && isValidCPF(num)) {
    return {
      type: "CPF",
      formatted: num.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
    };
  }
  if (num.length === 14 && isValidCNPJ(num)) {
    return {
      type: "CNPJ",
      formatted: num.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5",
      ),
    };
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { type: "E-MAIL", formatted: value };
  }
  if (num.length >= 10 && num.length <= 11 && !value.includes("@")) {
    return {
      type: "TELEFONE",
      formatted:
        num.length === 11
          ? num.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
          : num.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3"),
    };
  }
  if (value.length >= 32) {
    return { type: "ALEATÓRIA", formatted: value };
  }
  return { type: "CHAVE", formatted: value };
};

export default function ProfilesScreen() {
  const { profiles, clearAllData } = useAppContext();
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();

  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(
    null,
  );

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

  const toggleExpand = (id: string) => {
    setExpandedProfileId(expandedProfileId === id ? null : id);
  };

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
          return;
        }
      } else {
        router.push("/setup");
      }
    } catch (error) {
      console.error("Erro ao autenticar:", error);
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
              <Settings size={28} color={colors.text} />
            </Animated.View>
          </Pressable>

          <Subtitle>Gerencie quem participa das divisões.</Subtitle>
        </Header>

        <ProfilesList>
          {profiles.map((p) => {
            const isExpanded = expandedProfileId === p.id;

            // 💡 Pegamos as infos visuais da chave PIX aqui
            const pixInfo = p.pixKey ? getPixInfo(p.pixKey) : null;

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
                        <Wallet size={12} color={colors.accentText} />
                        <PixText numberOfLines={1}>Com Pix</PixText>
                      </PixBadge>
                    ) : (
                      <NoPixBadge>
                        <AlertCircle size={12} color={colors.warningText} />
                        <NoPixText>Sem Pix</NoPixText>
                      </NoPixBadge>
                    )}
                  </ProfileInfo>

                  <ActionIconWrapper>
                    {isExpanded ? (
                      <ChevronDown size={20} color={colors.textSecondary} />
                    ) : (
                      <ChevronRight size={20} color={colors.textMuted} />
                    )}
                  </ActionIconWrapper>
                </ProfileCardTop>

                {isExpanded && (
                  <ProfileExpandedContent>
                    <ExpandedDivider />
                    {p.pixKey && pixInfo ? (
                      <ExpandedDetails>
                        <DetailGroup>
                          <DetailLabel>Chave Pix</DetailLabel>
                          {/* 💡 Nova estrutura com o Badge alinhado à direita */}
                          <PixValueRow>
                            <DetailValue>{pixInfo.formatted}</DetailValue>
                            <StatusBadge
                              style={{ backgroundColor: `${colors.accent}20` }}
                            >
                              <StatusText style={{ color: colors.accent }}>
                                {pixInfo.type}
                              </StatusText>
                            </StatusBadge>
                          </PixValueRow>
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
            <ThemedPencil size={18} />
            <EditButtonText>Editar Perfis</EditButtonText>
          </EditButton>
        </BottomAction>
      </ScrollContainer>
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
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  letter-spacing: -0.5px;
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  margin-top: 6px;
  font-weight: 500;
`;

const ProfilesList = styled.View`
  gap: 16px;
`;

const ProfileCard = styled.TouchableOpacity`
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.cardBackground};
  border-radius: 24px;
  padding: 20px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.border};
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.04;
  shadow-radius: 12px;
  elevation: 2;
  position: relative;
`;

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
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  font-size: 17px;
  margin-bottom: 4px;
`;

const PixBadge = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.accentLight};
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 6px;
  margin-top: 2px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.accentBorder};
`;

const PixText = styled.Text`
  font-size: 12px;
  font-weight: bold;
  color: ${({ theme }: { theme: ThemeColors }) => theme.accentText};
  margin-left: 6px;
`;

const NoPixBadge = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.warningLight};
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 6px;
  margin-top: 2px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.warningBorder};
`;

const NoPixText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }: { theme: ThemeColors }) => theme.warningText};
  margin-left: 6px;
`;

const ActionIconWrapper = styled.View`
  width: 40px;
  height: 40px;
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.backgroundElement};
  border-radius: 9999px;
  align-items: center;
  justify-content: center;
`;

const ProfileExpandedContent = styled.View`
  margin-top: 16px;
  padding-left: 4px;
`;

const ExpandedDivider = styled.View`
  height: 1px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.divider};
  margin-bottom: 16px;
`;

const ExpandedDetails = styled.View`
  gap: 12px;
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.backgroundElement};
  padding: 16px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.border};
`;

const DetailGroup = styled.View`
  gap: 2px;
`;

// 💡 Container flexível para alinhar Chave e Badge
const PixValueRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const StatusBadge = styled.View`
  padding-horizontal: 8px;
  padding-vertical: 3px;
  border-radius: 6px;
  align-items: center;
  justify-content: center;
`;

const StatusText = styled.Text`
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailLabel = styled.Text`
  font-size: 11px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const DetailValue = styled.Text`
  font-size: 15px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  font-weight: 600;
`;

const EmptyDetailsText = styled.Text`
  font-size: 13px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
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
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.text};
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
  color: ${({ theme }: { theme: ThemeColors }) => theme.background};
  font-size: 16px;
  letter-spacing: 0.5px;
`;
