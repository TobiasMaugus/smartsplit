import {
  ChevronRight,
  FolderGit2,
  Globe,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import { Linking, Modal, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styled from "styled-components/native";
import Group2Svg from "../assets/Group2.svg";
import { useAppContext } from "../context/AppContext";

type SettingsModalProps = {
  visible: boolean;
  onRequestClose: () => void;
};

export function SettingsModal({ visible, onRequestClose }: SettingsModalProps) {
  const { clearAllData } = useAppContext();
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
                <Group2Svg width={180} height={45} />
              </View>
              <CloseButton onPress={onRequestClose}>
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

const SettingIconDanger = styled(SettingIconWrapper)`
  background-color: #fef2f2;
`;

const SettingLabel = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #18181b;
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
