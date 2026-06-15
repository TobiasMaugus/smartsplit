import { router } from "expo-router";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { getInitials } from "../components/Avatar";
import { useAppContext } from "../context/AppContext";
import { COLORS, ProfileForm } from "../types";

export default function SetupScreen() {
  const { profiles, setProfiles } = useAppContext();

  const initialForms: ProfileForm[] =
    profiles.length >= 2
      ? profiles.map((p) => ({ ...p, showPix: !!p.pixKey }))
      : [
          {
            id: "p1",
            name: "",
            color: COLORS[0],
            pixKey: "",
            pixName: "",
            pixCity: "",
            showPix: false,
          },
          {
            id: "p2",
            name: "",
            color: COLORS[1],
            pixKey: "",
            pixName: "",
            pixCity: "",
            showPix: false,
          },
        ];

  const [forms, setForms] = useState<ProfileForm[]>([]);
  useEffect(() => {
    if (profiles && profiles.length >= 2) {
      setForms(
        profiles.map((p) => ({
          ...p,
          showPix: !!p.pixKey,
        })),
      );
    }
  }, [profiles]);

  const upd = (i: number, k: keyof ProfileForm, v: string | boolean) =>
    setForms((fs) => fs.map((f, j) => (j === i ? { ...f, [k]: v } : f)));

  const canGo = forms.every((f) => f.name.trim().length >= 2);

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
      router.replace("/(tabs)/");
    }
  };

  return (
    <Container>
      <KeyboardWrapper behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollContent showsVerticalScrollIndicator={false}>
          <Header>
            <Title>Crie seus{"\n"}Perfis</Title>
          </Header>

          {forms.map((form, i) => (
            <Card key={form.id}>
              {/* Header do Card (Avatar + Input de Nome) */}
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
                    placeholder={i === 0 ? "Seu nome" : "Nome dela/e"}
                    placeholderTextColor="#A1A1AA"
                  />
                </InputContainer>
              </CardHeader>

              {/* Seletor de Cores */}
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

              {/* Acordeão de PIX */}
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

              {/* Formulário de PIX Expandido */}
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

          {/* Espaçamento extra no fim do scroll */}
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
