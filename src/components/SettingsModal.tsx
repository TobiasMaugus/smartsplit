import {
  ChevronRight,
  FolderGit2,
  Globe,
  Moon,
  Smartphone,
  Sun,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import { Linking, Modal, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styled from "styled-components/native";
import Group2Svg from "../assets/Group2.svg";
import Group2dSvg from "../assets/Group2d.svg";
import { ThemeColors } from "../constants/theme";
import { useAppContext } from "../context/AppContext";
import {
  ThemePreference,
  useThemeContext,
} from "../context/ThemeContext";

type SettingsModalProps = {
  visible: boolean;
  onRequestClose: () => void;
};

const THEME_OPTIONS: { key: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { key: "system", label: "Sistema", Icon: Smartphone },
  { key: "light", label: "Claro", Icon: Sun },
  { key: "dark", label: "Escuro", Icon: Moon },
];

export function SettingsModal({ visible, onRequestClose }: SettingsModalProps) {
  const { clearAllData } = useAppContext();
  const { themePreference, setThemePreference, isDark, colors } =
    useThemeContext();
  const insets = useSafeAreaInsets();
  const [isResetConfirmModalVisible, setIsResetConfirmModalVisible] =
    useState(false);

  const handleResetData = async () => {
    if (clearAllData) {
      await clearAllData();
    }
    setIsResetConfirmModalVisible(false);
    onRequestClose();
  };

  const openGithub = () => {
    Linking.openURL("https://github.com/TobiasMaugus");
  };

  const openPortfolio = () => {
    Linking.openURL("https://portfolio-ten-ashy-46.vercel.app/");
  };

  const LogoSvg = isDark ? Group2dSvg : Group2Svg;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onRequestClose}
      >
        <SettingsOverlay>
          <SettingsSheet style={{ paddingBottom: insets.bottom || 24 }}>
            <SettingsHeader>
              <View style={{ width: 40, height: 40 }} />
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <LogoSvg width={180} height={45} />
              </View>
              <CloseButton onPress={onRequestClose}>
                <X size={24} color={colors.textMuted} />
              </CloseButton>
            </SettingsHeader>

            <SettingsBody>
              {/* Theme Selector */}
              <ThemeSelectorContainer>
                <ThemeSelectorLabel>Aparência</ThemeSelectorLabel>
                <ThemePillRow>
                  {THEME_OPTIONS.map(({ key, label, Icon }) => {
                    const isActive = themePreference === key;
                    return (
                      <ThemePill
                        key={key}
                        $isActive={isActive}
                        onPress={() => setThemePreference(key)}
                        activeOpacity={0.7}
                      >
                        <Icon
                          size={16}
                          color={
                            isActive ? colors.accent : colors.textMuted
                          }
                        />
                        <ThemePillText $isActive={isActive}>
                          {label}
                        </ThemePillText>
                      </ThemePill>
                    );
                  })}
                </ThemePillRow>
              </ThemeSelectorContainer>

              <SettingDivider />

              <SettingRow onPress={() => setIsResetConfirmModalVisible(true)}>
                <SettingRowLeft>
                  <SettingIconDanger>
                    <Trash2 size={20} color={colors.danger} />
                  </SettingIconDanger>
                  <SettingLabelDanger>Apagar todos os dados</SettingLabelDanger>
                </SettingRowLeft>
                <ChevronRight size={20} color={colors.borderLight} />
              </SettingRow>

              <LinksContainer>
                <LinksTitle>Conecte-se</LinksTitle>
                <LinkRow onPress={openGithub} activeOpacity={0.7}>
                  <FolderGit2 size={20} color={colors.textMuted} />
                  <LinkText>GitHub</LinkText>
                </LinkRow>
                <LinkRow onPress={openPortfolio} activeOpacity={0.7}>
                  <Globe size={20} color={colors.textMuted} />
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
    </>
  );
}

// --- Styled Components ---

const SettingsOverlay = styled.View`
  flex: 1;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.modalOverlay};
  justify-content: flex-end;
`;

const SettingsSheet = styled.View`
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElevated};
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
  height: 48px;
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

// --- Theme Selector ---

const ThemeSelectorContainer = styled.View`
  margin-bottom: 8px;
`;

const ThemeSelectorLabel = styled.Text`
  font-size: 13px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

const ThemePillRow = styled.View`
  flex-direction: row;
  gap: 8px;
`;

const ThemePill = styled.TouchableOpacity<{ $isActive: boolean }>`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-vertical: 12px;
  border-radius: 14px;
  border-width: 2px;
  border-color: ${({ $isActive, theme }: { $isActive: boolean; theme: ThemeColors }) =>
    $isActive ? theme.accent : theme.border};
  background-color: ${({ $isActive, theme }: { $isActive: boolean; theme: ThemeColors }) =>
    $isActive ? theme.accentLight : theme.backgroundElement};
`;

const ThemePillText = styled.Text<{ $isActive: boolean }>`
  font-size: 13px;
  font-weight: 700;
  color: ${({ $isActive, theme }: { $isActive: boolean; theme: ThemeColors }) =>
    $isActive ? theme.accent : theme.textSecondary};
`;

// --- Setting Rows ---

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
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElement};
  align-items: center;
  justify-content: center;
`;

const SettingIconDanger = styled(SettingIconWrapper)`
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.dangerLight};
`;

const SettingLabel = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
`;

const SettingLabelDanger = styled(SettingLabel)`
  color: ${({ theme }: { theme: ThemeColors }) => theme.danger};
`;

const SettingDivider = styled.View`
  height: 1px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.border};
  margin-vertical: 4px;
`;

const LinksContainer = styled.View`
  margin-top: 24px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElement};
  border-radius: 20px;
  padding: 20px;
  gap: 16px;
`;

const LinksTitle = styled.Text`
  font-size: 13px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
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
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
`;

const SettingsFooter = styled.View`
  align-items: center;
  margin-top: 40px;
  gap: 4px;
`;

const FooterText = styled.Text`
  font-size: 12px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  font-weight: 500;
`;

const FooterTextHighlight = styled.Text`
  font-size: 12px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  font-weight: 700;
`;

// --- Confirm Modal ---

const ConfirmOverlay = styled.View`
  flex: 1;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.modalOverlay};
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const ConfirmContent = styled.View`
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElevated};
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
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  font-size: 18px;
  font-weight: 700;
  text-align: center;
`;

const ConfirmSubtitle = styled.Text`
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
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
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElement};
  border-radius: 14px;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.borderLight};
`;

const ModalCancelText = styled.Text`
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  font-size: 14px;
  font-weight: 600;
`;

const ModalDeleteButton = styled.TouchableOpacity`
  flex: 1;
  height: 48px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.danger};
  border-radius: 14px;
  align-items: center;
  justify-content: center;
`;

const ModalDeleteText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
`;
