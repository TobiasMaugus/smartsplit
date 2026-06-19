import { router } from "expo-router";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Modal, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { getInitials } from "../components/Avatar";
import { useAppContext } from "../context/AppContext";
import { COLORS, MAX_PROFILES, ProfileForm } from "../types";

const makeBlankForm = (index: number): ProfileForm => ({
  id: `perfil_${Date.now()}_${index}`,
  name: "",
  color: COLORS[index % COLORS.length] || "#10B981",
  pixKey: "",
  pixName: "",
  pixCity: "",
  showPix: false,
});

export default function SetupScreen() {
  const { profiles, setProfiles } = useAppContext();
  const [forms, setForms] = useState<ProfileForm[]>([]);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [profileToDeleteIndex, setProfileToDeleteIndex] = useState<
    number | null
  >(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Usamos o Math.max para garantir que, caso o seu MIN_PROFILES seja menor que 2,
    // ele inicie a tela sempre com pelo menos 2 formulários no primeiro uso.
    if (profiles && profiles.length >= 2) {
      setForms(
        profiles.map((p) => ({
          ...p,
          showPix: !!p.pixKey,
        })),
      );
    } else {
      setForms([makeBlankForm(0), makeBlankForm(1)]);
    }
  }, [profiles]);

  const upd = (i: number, k: keyof ProfileForm, v: string | boolean) =>
    setForms((fs) => fs.map((f, j) => (j === i ? { ...f, [k]: v } : f)));

  const addProfile = () => {
    if (forms.length >= MAX_PROFILES) return;
    setForms((fs) => [...fs, makeBlankForm(fs.length)]);
  };

  const removeProfile = (index: number) => {
    // 🔥 CORREÇÃO AQUI: Travado rigidamente no número 2 em vez da variável
    if (forms.length <= 2) {
      setToastMessage(`Não é possível ter menos de 2 perfis.`);
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setProfileToDeleteIndex(index);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (profileToDeleteIndex !== null) {
      setForms((fs) => fs.filter((_, j) => j !== profileToDeleteIndex));
    }
    setIsDeleteModalVisible(false);
    setProfileToDeleteIndex(null);
  };

  // 🔥 CORREÇÃO AQUI: Só pode salvar se houver pelo menos 2 perfis
  const canGo =
    forms.length >= 2 && forms.every((f) => f.name.trim().length >= 2);

  const handleSubmit = () => {
    if (!canGo) return;
    setProfiles(
      forms.map((f) => ({
        id: f.id,
        name: f.name.trim(),
        color: f.color,
        pixKey: f.pixKey.trim(),
        pixName: f.pixName.trim(),
        pixCity: f.pixCity.trim(),
      })),
    );
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const targetProfileName =
    profileToDeleteIndex !== null
      ? forms[profileToDeleteIndex]?.name.trim()
      : "";
  const displayName = targetProfileName
    ? `"${targetProfileName}"`
    : `o Perfil ${(profileToDeleteIndex ?? 0) + 1}`;

  return (
    <Container>
      <KeyboardWrapper behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollContent showsVerticalScrollIndicator={false}>
          <Header>
            <Title>Crie seus{"\n"}Perfis</Title>
            <Subtitle>Adicione de 2 até {MAX_PROFILES} pessoas</Subtitle>
          </Header>

          {forms.map((form, i) => (
            <Card key={form.id}>
              <CardTopRow>
                <ProfileIndex>Perfil {i + 1}</ProfileIndex>

                {/* 🔥 CORREÇÃO AQUI: Estilos baseados rigidamente no número 2 */}
                <RemoveButton
                  onPress={() => removeProfile(i)}
                  activeOpacity={forms.length > 2 ? 0.7 : 1}
                  $isDisabled={forms.length <= 2}
                >
                  <Trash2
                    size={16}
                    color={forms.length > 2 ? "#EF4444" : "#FCA5A5"}
                  />
                </RemoveButton>
              </CardTopRow>

              <CardHeader>
                <AvatarCircle style={{ backgroundColor: form.color }}>
                  <AvatarText>
                    {form.name ? getInitials(form.name) : (i + 1).toString()}
                  </AvatarText>
                </AvatarCircle>

                <InputContainer>
                  <Label>Nome</Label>
                  <StyledInput
                    value={form.name}
                    onChangeText={(v) => upd(i, "name", v)}
                    placeholder={`Nome do perfil ${i + 1}`}
                    placeholderTextColor="#A1A1AA"
                  />
                </InputContainer>
              </CardHeader>

              <Section>
                <Label style={{ marginBottom: 12 }}>Cor do Perfil</Label>
                <ColorGrid>
                  {COLORS.map((c) => (
                    <ColorOption
                      key={c}
                      onPress={() => upd(i, "color", c)}
                      style={[{ backgroundColor: c }]}
                      $isSelected={form.color === c}
                      activeOpacity={0.8}
                    />
                  ))}
                </ColorGrid>
              </Section>

              <PixToggle
                onPress={() => upd(i, "showPix", !form.showPix)}
                activeOpacity={0.7}
              >
                {form.showPix ? (
                  <ChevronUp size={16} color="#A1A1AA" />
                ) : (
                  <ChevronDown size={16} color="#A1A1AA" />
                )}
                <PixToggleText>Dados Pix (opcional)</PixToggleText>
              </PixToggle>

              {form.showPix && (
                <PixFormContainer>
                  {(
                    [
                      ["pixKey", "Chave Pix", "CPF, e-mail, telefone ou chave"],
                      [
                        "pixName",
                        "Nome do Titular",
                        "Nome completo do titular",
                      ],
                      ["pixCity", "Cidade do Titular", "Sua cidade"],
                    ] as const
                  ).map(([k, label, ph]) => (
                    <InputContainer key={k}>
                      <Label>{label}</Label>
                      <StyledInput
                        value={form[k] as string}
                        onChangeText={(v) => upd(i, k, v)}
                        placeholder={ph}
                        placeholderTextColor="#A1A1AA"
                      />
                    </InputContainer>
                  ))}
                </PixFormContainer>
              )}
            </Card>
          ))}

          {forms.length < MAX_PROFILES && (
            <AddProfileButton onPress={addProfile} activeOpacity={0.8}>
              <Plus size={20} color="#10B981" />
              <AddProfileText>Adicionar perfil</AddProfileText>
            </AddProfileButton>
          )}

          <Spacing />
        </ScrollContent>

        <BottomContainer>
          <SubmitButton
            onPress={handleSubmit}
            disabled={!canGo}
            $isActive={canGo}
            activeOpacity={0.85}
          >
            <SubmitButtonText $isActive={canGo}>Salvar Perfis</SubmitButtonText>
          </SubmitButton>
        </BottomContainer>
      </KeyboardWrapper>

      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <ConfirmOverlay>
          <ConfirmContent>
            <ConfirmTitle>Excluir Perfil</ConfirmTitle>
            <ConfirmSubtitle>
              Tem certeza que deseja remover {displayName}? Esta ação não poderá
              ser desfeita e apagará os dados deste cartão.
            </ConfirmSubtitle>

            <ActionButtonsContainer>
              <ModalCancelButton
                onPress={() => {
                  setIsDeleteModalVisible(false);
                  setProfileToDeleteIndex(null);
                }}
                activeOpacity={0.7}
              >
                <ModalCancelText>Cancelar</ModalCancelText>
              </ModalCancelButton>

              <ModalDeleteButton
                onPress={handleConfirmDelete}
                activeOpacity={0.7}
              >
                <ModalDeleteText>Excluir</ModalDeleteText>
              </ModalDeleteButton>
            </ActionButtonsContainer>
          </ConfirmContent>
        </ConfirmOverlay>
      </Modal>

      {toastMessage && (
        <ToastContainer>
          <ToastText>{toastMessage}</ToastText>
        </ToastContainer>
      )}
    </Container>
  );
}

// --- Styled Components ---

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #f4f6f9;
`;

const KeyboardWrapper = styled.KeyboardAvoidingView`
  flex: 1;
`;

const ScrollContent = styled.ScrollView`
  flex: 1;
  padding-horizontal: 24px;
  padding-top: 16px;
`;

const Header = styled.View`
  margin-bottom: 32px;
  margin-top: 8px;
`;

const Title = styled.Text`
  font-size: 32px;
  font-weight: 900;
  color: #18181b;
  line-height: 38px;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.Text`
  font-size: 15px;
  color: #71717a;
  margin-top: 12px;
  font-weight: 500;
  line-height: 22px;
`;

const Card = styled.View`
  background-color: #ffffff;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  border-width: 1px;
  border-color: #f4f4f5;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
  elevation: 3;
`;

const CardTopRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ProfileIndex = styled.Text`
  font-size: 11px;
  font-weight: 800;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

type RemoveButtonProps = {
  $isDisabled?: boolean;
};

const RemoveButton = styled.TouchableOpacity<RemoveButtonProps>`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${(props: RemoveButtonProps) =>
    props.$isDisabled ? "#F4F4F5" : "#fef2f2"};
  align-items: center;
  justify-content: center;
  opacity: ${(props: RemoveButtonProps) => (props.$isDisabled ? 0.45 : 1)};
`;

const CardHeader = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 24px;
`;

const AvatarCircle = styled.View`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`;

const AvatarText = styled.Text`
  font-weight: 900;
  color: #ffffff;
  font-size: 22px;
`;

const InputContainer = styled.View`
  flex: 1;
  margin-bottom: 12px;
`;

const Label = styled.Text`
  font-size: 11px;
  font-weight: 800;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  margin-left: 4px;
`;

const StyledInput = styled.TextInput`
  width: 100%;
  background-color: #f4f6f9;
  border-radius: 12px;
  padding-vertical: 14px;
  padding-horizontal: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #18181b;
`;

const Section = styled.View`
  margin-bottom: 24px;
`;

const ColorGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
`;

const ColorOption = styled.TouchableOpacity<{ $isSelected: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  align-items: center;
  justify-content: center;
  ${({ $isSelected }) =>
    $isSelected &&
    `
    border-width: 3px;
    border-color: #FFFFFF;
    transform: scale(1.15);
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.2;
    shadow-radius: 4px;
    elevation: 4;
  `}
`;

const PixToggle = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding-vertical: 8px;
`;

const PixToggleText = styled.Text`
  font-size: 12px;
  font-weight: 800;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: 8px;
`;

const PixFormContainer = styled.View`
  margin-top: 16px;
  gap: 8px;
`;

const AddProfileButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-vertical: 16px;
  border-radius: 16px;
  border-width: 2px;
  border-color: #10b981;
  border-style: dashed;
  margin-bottom: 8px;
`;

const AddProfileText = styled.Text`
  font-size: 15px;
  font-weight: 800;
  color: #10b981;
`;

const Spacing = styled.View`
  height: 40px;
`;

const BottomContainer = styled.View`
  padding-horizontal: 24px;
  padding-bottom: 40px;
  padding-top: 16px;
  background-color: #f4f6f9;
`;

const SubmitButton = styled.TouchableOpacity<{ $isActive: boolean }>`
  width: 100%;
  padding-vertical: 18px;
  border-radius: 16px;
  align-items: center;
  justify-content: center;
  background-color: ${({ $isActive }) => ($isActive ? "#10B981" : "#E4E4E7")};

  ${({ $isActive }) =>
    $isActive &&
    `
    shadow-color: #10B981;
    shadow-offset: 0px 6px;
    shadow-opacity: 0.25;
    shadow-radius: 12px;
    elevation: 5;
  `}
`;

const SubmitButtonText = styled.Text<{ $isActive: boolean }>`
  font-weight: 800;
  font-size: 16px;
  letter-spacing: 0.3px;
  color: ${({ $isActive }) => ($isActive ? "#FFFFFF" : "#A1A1AA")};
`;

const ConfirmOverlay = styled.View`
  flex: 1;
  background-color: rgba(9, 9, 11, 0.5);
  justify-content: center;
  align-items: center;
  padding: 24px;
`;

const ConfirmContent = styled.View`
  background-color: #ffffff;
  border-radius: 24px;
  padding: 24px;
  width: 100%;
  max-width: 340px;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.15;
  shadow-radius: 16px;
  elevation: 10;
`;

const ConfirmTitle = styled.Text`
  font-size: 20px;
  font-weight: 900;
  color: #18181b;
  margin-bottom: 8px;
  letter-spacing: -0.3px;
`;

const ConfirmSubtitle = styled.Text`
  font-size: 14px;
  color: #71717a;
  line-height: 20px;
  font-weight: 500;
  margin-bottom: 24px;
`;

const ActionButtonsContainer = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const ModalCancelButton = styled.TouchableOpacity`
  flex: 1;
  background-color: #f4f4f5;
  padding-vertical: 14px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
`;

const ModalCancelText = styled.Text`
  font-size: 15px;
  font-weight: 700;
  color: #71717a;
`;

const ModalDeleteButton = styled.TouchableOpacity`
  flex: 1;
  background-color: #ef4444;
  padding-vertical: 14px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
`;

const ModalDeleteText = styled.Text`
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
`;

const ToastContainer = styled.View`
  position: absolute;
  bottom: 120px;
  left: 32px;
  right: 32px;
  background-color: #18181b;
  padding-vertical: 14px;
  padding-horizontal: 20px;
  border-radius: 14px;
  align-items: center;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 8px;
  elevation: 6;
`;

const ToastText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  letter-spacing: -0.1px;
`;
