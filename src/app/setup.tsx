import { router } from "expo-router";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Animated, Modal, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { getInitials } from "../components/Avatar";
import { ThemeColors } from "../constants/theme";
import { useAppContext } from "../context/AppContext";
import { useThemeContext } from "../context/ThemeContext";
import { COLORS, MAX_PROFILES, ProfileForm } from "../types";

// ==========================================
// FUNÇÕES DE VALIDAÇÃO (Extraídas do pix.ts)
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

// ==========================================
// COMPONENTE ISOLADO: INPUT DA CHAVE PIX
// ==========================================
const PixKeyInput = ({
  value,
  onChangeText,
  colors,
}: {
  value: string;
  onChangeText: (v: string) => void;
  colors: any;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [info, setInfo] = useState({
    type: "",
    isValid: false,
    formatted: value,
  });

  useEffect(() => {
    // DEBOUNCE: Espera 400ms após o usuário parar de digitar
    const handler = setTimeout(() => {
      if (!value) {
        setInfo({ type: "", isValid: false, formatted: "" });
        return;
      }

      const num = value.replace(/\D/g, "");
      let type = "Chave Inválida";
      let isValid = false;
      let formatted = value;
      let cleanRaw = value;

      // 1. É CPF?
      if (num.length === 11 && isValidCPF(num)) {
        type = "CPF";
        isValid = true;
        cleanRaw = num; // Salva só números crus
        formatted = num.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      }
      // 2. É CNPJ?
      else if (num.length === 14 && isValidCNPJ(num)) {
        type = "CNPJ";
        isValid = true;
        cleanRaw = num;
        formatted = num.replace(
          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
          "$1.$2.$3/$4-$5",
        );
      }
      // 3. É E-mail?
      else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        type = "E-mail";
        isValid = true;
        cleanRaw = value.trim();
        formatted = cleanRaw;
      }
      // 4. É Telefone?
      else if (num.length >= 10 && num.length <= 11 && !value.includes("@")) {
        type = "Telefone";
        isValid = true;
        cleanRaw = num;
        formatted =
          num.length === 11
            ? num.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
            : num.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
      }
      // 5. É Chave Aleatória? (Tamanho padrão de UUID é 36)
      else if (value.length >= 32) {
        type = "Aleatória";
        isValid = true;
        cleanRaw = value.trim();
        formatted = cleanRaw;
      }

      setInfo({ type, isValid, formatted });

      // O PULO DO GATO: Se o usuário colou com máscara, e a chave é válida,
      // nós enviamos silenciosamente pro estado pai APENAS os dados crus.
      if (isValid && value !== cleanRaw) {
        onChangeText(cleanRaw);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [value]);

  // Exibe a máscara SOMENTE se for válida e NÃO estiver editando (focado)
  const displayValue = !isFocused && info.isValid ? info.formatted : value;

  return (
    <InputContainer>
      <LabelRow>
        <Label style={{ marginBottom: 0 }}>Chave Pix</Label>
        {value.length > 0 && (
          <StatusBadge
            style={{
              backgroundColor: info.isValid
                ? `${colors.accent}20`
                : `${colors.danger}20`,
            }}
          >
            <StatusText
              style={{ color: info.isValid ? colors.accent : colors.danger }}
            >
              {info.type}
            </StatusText>
          </StatusBadge>
        )}
      </LabelRow>
      <StyledInput
        value={displayValue}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="CPF, e-mail, telefone ou chave"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </InputContainer>
  );
};

// ==========================================
// TELA PRINCIPAL (SETUP)
// ==========================================
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
  const { colors, isDark } = useThemeContext();
  const [forms, setForms] = useState<ProfileForm[]>([]);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [profileToDeleteIndex, setProfileToDeleteIndex] = useState<
    number | null
  >(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
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

  const showCustomToast = (msg: string) => {
    setToastMessage(msg);
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setToastMessage(null);
      });
    }, 2500);
  };

  const upd = (i: number, k: keyof ProfileForm, v: string | boolean) =>
    setForms((fs) => fs.map((f, j) => (j === i ? { ...f, [k]: v } : f)));

  const addProfile = () => {
    if (forms.length >= MAX_PROFILES) return;
    setForms((fs) => [...fs, makeBlankForm(fs.length)]);
  };

  const removeProfile = (index: number) => {
    if (forms.length <= 2) {
      showCustomToast(`Não é possível ter menos de 2 perfis.`);
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
      {toastMessage && (
        <AnimatedToastContainer style={{ opacity: toastOpacity }}>
          <ToastText>{toastMessage}</ToastText>
        </AnimatedToastContainer>
      )}

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

                <RemoveButton
                  onPress={() => removeProfile(i)}
                  activeOpacity={forms.length > 2 ? 0.7 : 1}
                  $isDisabled={forms.length <= 2}
                >
                  <Trash2
                    size={16}
                    color={
                      forms.length > 2 ? colors.danger : colors.dangerBorder
                    }
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
                    placeholderTextColor={colors.textMuted}
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
                      $isSelected={
                        form.color?.toUpperCase() === c.toUpperCase()
                      }
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
                  <ChevronUp size={16} color={colors.textMuted} />
                ) : (
                  <ChevronDown size={16} color={colors.textMuted} />
                )}
                <PixToggleText>Dados Pix (opcional)</PixToggleText>
              </PixToggle>

              {form.showPix && (
                <PixFormContainer>
                  {/* 💡 Novo Componente Inteligente da Chave Pix */}
                  <PixKeyInput
                    value={form.pixKey}
                    onChangeText={(v) => upd(i, "pixKey", v)}
                    colors={colors}
                  />

                  {/* Demais inputs (Nome e Cidade) mapeados normalmente */}
                  {(
                    [
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
                        placeholderTextColor={colors.textMuted}
                      />
                    </InputContainer>
                  ))}
                </PixFormContainer>
              )}
            </Card>
          ))}

          {forms.length < MAX_PROFILES && (
            <AddProfileButton onPress={addProfile} activeOpacity={0.8}>
              <Plus size={20} color={colors.accent} />
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
    </Container>
  );
}

// --- Styled Components ---

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.background};
`;

const ToastContainerBase = styled.View`
  position: absolute;
  top: 60px;
  left: 32px;
  right: 32px;
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.backgroundElevated};
  padding-vertical: 14px;
  padding-horizontal: 20px;
  border-radius: 20px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.border};
  align-items: center;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
  elevation: 4;
  z-index: 9999;
`;

const AnimatedToastContainer =
  Animated.createAnimatedComponent(ToastContainerBase);

const ToastText = styled.Text`
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  letter-spacing: -0.2px;
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
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  line-height: 38px;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.Text`
  font-size: 15px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  margin-top: 12px;
  font-weight: 500;
  line-height: 22px;
`;

const Card = styled.View`
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.cardBackground};
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.border};
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
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
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
  background-color: ${({
    $isDisabled,
    theme,
  }: {
    $isDisabled?: boolean;
    theme: ThemeColors;
  }) => ($isDisabled ? theme.backgroundElement : theme.dangerLight)};
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

// 💡 Novos componentes de estilo para o layout da Label com o Badge do Pix
const LabelRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  margin-left: 4px;
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

const Label = styled.Text`
  font-size: 11px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  margin-left: 4px;
`;

const StyledInput = styled.TextInput`
  width: 100%;
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.inputBackground};
  border-radius: 12px;
  padding-vertical: 14px;
  padding-horizontal: 16px;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
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
  ${({ $isSelected, theme }) =>
    $isSelected &&
    `
    border-width: 3px;
    border-color: ${(theme as ThemeColors).text};
    transform: scale(1.15);
    shadow-color: #000;
    shadow-offset: 0px;
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
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
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
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.accent};
  border-style: dashed;
  margin-bottom: 8px;
`;

const AddProfileText = styled.Text`
  font-size: 15px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.accent};
`;

const Spacing = styled.View`
  height: 40px;
`;

const BottomContainer = styled.View`
  padding-horizontal: 24px;
  padding-bottom: 40px;
  padding-top: 16px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.background};
`;

const SubmitButton = styled.TouchableOpacity<{ $isActive: boolean }>`
  width: 100%;
  padding-vertical: 18px;
  border-radius: 16px;
  align-items: center;
  justify-content: center;
  background-color: ${({
    $isActive,
    theme,
  }: {
    $isActive: boolean;
    theme: ThemeColors;
  }) => ($isActive ? theme.accent : theme.borderLight)};

  ${({ $isActive, theme }) =>
    $isActive &&
    `
    shadow-color: ${(theme as ThemeColors).accent};
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
  color: ${({
    $isActive,
    theme,
  }: {
    $isActive: boolean;
    theme: ThemeColors;
  }) => ($isActive ? "#FFFFFF" : theme.textMuted)};
`;

const ConfirmOverlay = styled.View`
  flex: 1;
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.modalOverlay};
  justify-content: center;
  align-items: center;
  padding: 24px;
`;

const ConfirmContent = styled.View`
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.backgroundElevated};
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
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  margin-bottom: 8px;
  letter-spacing: -0.3px;
`;

const ConfirmSubtitle = styled.Text`
  font-size: 14px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
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
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.backgroundElement};
  padding-vertical: 14px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
`;

const ModalCancelText = styled.Text`
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
`;

const ModalDeleteButton = styled.TouchableOpacity`
  flex: 1;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.danger};
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
