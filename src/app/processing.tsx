import { router } from "expo-router";
import {
  CheckCircle2,
  ChevronLeft,
  Minus,
  Plus,
  RotateCcw,
  Undo2,
  Users,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { getInitials } from "../components/Avatar";
import { ThemeColors } from "../constants/theme";
import { useAppContext } from "../context/AppContext";
import { useThemeContext } from "../context/ThemeContext";
import { Allocations, COLLECTIVE, getCollectiveLabel } from "../types";

interface UndoEntry {
  remaining: Record<string, number>;
  allocs: Allocations;
  itemIdx: number;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function ProcessingScreen() {
  const {
    profiles,
    items,
    allocs: globalAllocs,
    setItems,
    setAllocs: setGlobalAllocs,
  } = useAppContext();
  const { colors, isDark } = useThemeContext();

  const PURCHASE_TOTAL = items.reduce(
    (s, i) => s + i.totalUnits * i.unitPrice,
    0,
  );

  const mkRemaining = () =>
    Object.fromEntries(items.map((i) => [i.id, i.totalUnits]));

  const buildRemainingFromAllocs = (allocsSource: Allocations) =>
    Object.fromEntries(
      items.map((item) => {
        const assigned = Object.values(allocsSource[item.id] ?? {}).reduce(
          (sum, units) => sum + units,
          0,
        );
        return [item.id, Math.max(0, item.totalUnits - assigned)];
      }),
    );

  const [remaining, setRemaining] =
    useState<Record<string, number>>(mkRemaining);
  const [allocs, setAllocs] = useState<Allocations>(globalAllocs ?? {});
  const [curIdx, setCurIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [personalizado, setPersonalizado] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const initialAllocs = Object.keys(globalAllocs).length ? globalAllocs : {};
    setAllocs(initialAllocs);
    setRemaining(buildRemainingFromAllocs(initialAllocs));

    const nextItemIndex = items.findIndex(
      (item) => buildRemainingFromAllocs(initialAllocs)[item.id] > 0,
    );
    setCurIdx(nextItemIndex >= 0 ? nextItemIndex : 0);
    setSelected([]);
    setQty(1);
    setPersonalizado(false);
    setUndoStack([]);
  }, [items, globalAllocs]);

  const cur = items[curIdx];
  const rem = cur ? (remaining[cur.id] ?? 0) : 0;
  const allDone =
    items.length > 0 && Object.values(remaining).every((v) => v === 0);
  const doneCount = items.filter((i) => remaining[i.id] === 0).length;
  const pct = items.length > 0 ? (doneCount / items.length) * 100 : 0;
  const clamp = (v: number) => Math.max(1, Math.min(v, rem));

  const profileCount = profiles.length;
  const collectiveLabel = getCollectiveLabel(profileCount);
  const avatarDensity: "spacious" | "normal" | "compact" =
    profileCount <= 2 ? "spacious" : profileCount <= 6 ? "normal" : "compact";
  const contentGap =
    profileCount === 2 ? 170 : avatarDensity === "spacious" ? 14 : 18;

  const pushUndo = (r: Record<string, number>, a: Allocations, idx: number) =>
    setUndoStack((s) => [
      ...s.slice(-9),
      {
        remaining: { ...r },
        allocs: JSON.parse(JSON.stringify(a)),
        itemIdx: idx,
      },
    ]);

  const advance = (newRem: Record<string, number>, fromIdx: number) => {
    const next = items.findIndex(
      (item, i) => i > fromIdx && newRem[item.id] > 0,
    );
    if (next !== -1) setCurIdx(next);
  };

  const attribute = (profileId: string, pids: string[] = []) => {
    if (!cur || rem === 0) return;
    const units = Math.min(qty, rem);
    pushUndo(remaining, allocs, curIdx);

    const newAllocs: Allocations = JSON.parse(JSON.stringify(allocs));
    if (!newAllocs[cur.id]) newAllocs[cur.id] = {};

    if (personalizado && pids.length > 1) {
      // 💡 CORREÇÃO: Divisão fracionada exata, sem Math.floor ou resto
      const each = units / pids.length;

      pids.forEach((pid) => {
        newAllocs[cur.id][pid] = (newAllocs[cur.id][pid] ?? 0) + each;
      });
    } else {
      newAllocs[cur.id][profileId] =
        (newAllocs[cur.id][profileId] ?? 0) + units;
    }

    const newRem = { ...remaining, [cur.id]: rem - units };
    setAllocs(newAllocs);
    setRemaining(newRem);

    // A seleção persiste no modo personalizado
    if (!personalizado) {
      setSelected([]);
    }

    setQty(1);
    if (newRem[cur.id] === 0) advance(newRem, curIdx);
  };

  const clickProfile = (pid: string) => {
    if (personalizado) {
      setSelected((s) =>
        s.includes(pid) ? s.filter((x) => x !== pid) : [...s, pid],
      );
    } else {
      attribute(pid);
    }
  };

  const confirmPersonalizado = () => {
    if (!selected.length) return;
    if (selected.length === 1) attribute(selected[0]);
    else attribute(COLLECTIVE, selected);
  };

  const undo = () => {
    if (!undoStack.length) return;
    const last = undoStack[undoStack.length - 1];
    setRemaining(last.remaining);
    setAllocs(last.allocs);
    setCurIdx(last.itemIdx);
    setUndoStack((s) => s.slice(0, -1));
    setQty(1);

    // Ao desfazer, se estiver no modo personalizado, mantém a seleção
    if (!personalizado) setSelected([]);
  };

  const reset = () => {
    setRemaining(mkRemaining());
    setAllocs({});
    setCurIdx(0);
    setUndoStack([]);
    setQty(1);
    setSelected([]);
    setPersonalizado(false);
  };

  const onFinalize = () => {
    setGlobalAllocs(allocs);
    router.replace("/summary");
  };

  const onCancelPurchase = () => {
    setItems([]);
    router.replace("/");
  };

  const renderAvatarElements = () => {
    const elements = profiles.map((p) => {
      const isSel = personalizado && selected.includes(p.id);
      return (
        <AvatarItem
          key={p.id}
          $density={avatarDensity}
          onPress={() => clickProfile(p.id)}
          activeOpacity={0.7}
        >
          <AvatarCircle
            $density={avatarDensity}
            style={{ backgroundColor: p.color }}
            $isSelected={isSel}
          >
            <AvatarText $density={avatarDensity}>
              {getInitials(p.name)}
            </AvatarText>
          </AvatarCircle>
          <AvatarLabel $density={avatarDensity} numberOfLines={1}>
            {p.name.split(" ")[0]}
          </AvatarLabel>
        </AvatarItem>
      );
    });

    if (!personalizado && profileCount > 1) {
      const collectiveNode = (
        <AvatarItem
          key="collective"
          $density={avatarDensity}
          onPress={() => attribute(COLLECTIVE)}
          activeOpacity={0.7}
        >
          <AvatarCircle
            $density={avatarDensity}
            style={{ backgroundColor: isDark ? "#3F3F46" : "#27272A" }}
            $isSelected={false}
          >
            <Users
              size={
                avatarDensity === "spacious"
                  ? 28
                  : avatarDensity === "normal"
                    ? 22
                    : 18
              }
              color="#FFFFFF"
            />
          </AvatarCircle>
          <AvatarLabel $density={avatarDensity} numberOfLines={1}>
            {collectiveLabel}
          </AvatarLabel>
        </AvatarItem>
      );

      // Lógica atualizada: no meio se forem 2 perfis, no final se forem mais de 2.
      if (profileCount === 2) {
        const middleIndex = Math.ceil(profileCount / 2);
        elements.splice(middleIndex, 0, collectiveNode);
      } else {
        elements.push(collectiveNode);
      }
    }

    return elements;
  };

  return (
    <Container>
      <TopPanel>
        <HeaderActions>
          <BackButton onPress={() => router.back()} activeOpacity={0.7}>
            <ChevronLeft size={20} color={colors.textMuted} />
            <BackBtnText>Voltar</BackBtnText>
          </BackButton>

          <CancelButton onPress={onCancelPurchase} activeOpacity={0.6}>
            <X size={18} color={colors.textMuted} />
          </CancelButton>
        </HeaderActions>

        <HeaderInfo>
          <TotalText>Total: {fmt(PURCHASE_TOTAL)}</TotalText>
          <ProgressLabel>
            {allDone
              ? "Concluído ✓"
              : `Item ${doneCount + 1} de ${items.length}`}
          </ProgressLabel>
        </HeaderInfo>

        <ProgressTrack>
          <ProgressFill style={{ width: `${pct}%` }} />
        </ProgressTrack>
      </TopPanel>

      <ScrollContent
        scrollEnabled={isScrollable}
        alwaysBounceVertical={false}
        bounces={false}
        onContentSizeChange={(contentWidth, contentHeight) => {
          setIsScrollable(contentHeight > 550);
        }}
      >
        {allDone ? (
          <DoneContainer>
            <DoneIconWrapper>
              <CheckCircle2 size={48} color={colors.accent} />
            </DoneIconWrapper>
            <DoneTitle>Todos atribuídos!</DoneTitle>
            <DoneSubtitle>Clique em Finalizar para ver o resumo.</DoneSubtitle>
          </DoneContainer>
        ) : (
          <View style={{ gap: contentGap, flex: 1 }}>
            <Card $density={avatarDensity}>
              <CardLabel>Produto atual</CardLabel>
              <ItemTitle $density={avatarDensity} numberOfLines={2}>
                {cur?.name}
              </ItemTitle>
              <ItemRow>
                <ItemPrice $density={avatarDensity}>
                  {fmt(cur?.unitPrice ?? 0)} / un.
                </ItemPrice>
                <ItemRemaining $density={avatarDensity}>
                  Faltam {rem} {rem === 1 ? "unidade" : "unidades"}
                </ItemRemaining>
              </ItemRow>
            </Card>

            {/* Oculta o seletor de quantidade se houver 1 ou menos unidades restantes */}
            {rem > 1 && (
              <Card $density={avatarDensity}>
                <CardLabel style={{ marginBottom: 10 }}>
                  Unidades a atribuir
                </CardLabel>
                <QtyContainer>
                  <QtyButton
                    $density={avatarDensity}
                    onPress={() => setQty(clamp(qty - 1))}
                    activeOpacity={0.7}
                  >
                    <Minus
                      size={avatarDensity === "spacious" ? 24 : 20}
                      color={colors.textSecondary}
                    />
                  </QtyButton>
                  <QtyValue $density={avatarDensity}>
                    {Math.min(qty, rem)}
                  </QtyValue>
                  <QtyButton
                    $density={avatarDensity}
                    onPress={() => setQty(clamp(qty + 1))}
                    activeOpacity={0.7}
                  >
                    <Plus
                      size={avatarDensity === "spacious" ? 24 : 20}
                      color={colors.textSecondary}
                    />
                  </QtyButton>
                </QtyContainer>
              </Card>
            )}

            {/* Apenas exibe o toggle se houverem mais de 2 perfis (3 ou mais) */}
            {profileCount > 2 && (
              <ToggleCard>
                <ToggleTextGroup>
                  <ToggleTitle>Modo Personalizado</ToggleTitle>
                  <ToggleSubtitle>
                    {personalizado
                      ? "Multi-seleção ativa"
                      : "Seleção individual"}
                  </ToggleSubtitle>
                </ToggleTextGroup>
                <SwitchTrack
                  onPress={() => {
                    setPersonalizado((p) => !p);
                    setSelected([]);
                    qty > rem ? setQty(clamp(qty)) : null;
                  }}
                  activeOpacity={1}
                  $isActive={personalizado}
                >
                  <SwitchThumb $isActive={personalizado} />
                </SwitchTrack>
              </ToggleCard>
            )}

            {/* O flex condicional estica o cartão se o card de qtde sumir, mas APENAS se houver mais de 2 perfis */}
            <Card
              $density={avatarDensity}
              style={profileCount > 2 ? { flex: 1 } : {}}
            >
              <CardLabel style={{ marginBottom: 12 }}>Atribuir para</CardLabel>
              <AvatarGrid $density={avatarDensity}>
                {renderAvatarElements()}
              </AvatarGrid>

              {personalizado && selected.length > 0 && (
                <ConfirmButton
                  onPress={confirmPersonalizado}
                  activeOpacity={0.85}
                >
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <ConfirmText>
                    Atribuir para {selected.length} perfil
                    {selected.length > 1 ? "s" : ""}
                  </ConfirmText>
                </ConfirmButton>
              )}
              {personalizado && selected.length === 0 && (
                <HelperText>Toque nos perfis para selecionar</HelperText>
              )}
            </Card>
          </View>
        )}
        <Spacing />
      </ScrollContent>

      <BottomBar>
        {allDone && (
          <ActionButton
            onPress={onFinalize}
            $variant="primary"
            activeOpacity={0.85}
            style={{ marginBottom: 12 }}
          >
            <ActionButtonText $variant="primary">Finalizar</ActionButtonText>
          </ActionButton>
        )}

        <ButtonRow>
          <ActionButton
            onPress={undo}
            disabled={!undoStack.length}
            $variant={undoStack.length ? "default" : "disabled"}
            activeOpacity={0.7}
            style={{ flex: 1 }}
          >
            <Undo2 size={18} color={undoStack.length ? colors.textSecondary : colors.textMuted} />
            <ActionButtonText
              $variant={undoStack.length ? "default" : "disabled"}
            >
              Desfazer
            </ActionButtonText>
          </ActionButton>

          <ActionButton
            onPress={reset}
            $variant="default"
            activeOpacity={0.7}
            style={{ flex: 1 }}
          >
            <RotateCcw size={18} color={colors.textSecondary} />
            <ActionButtonText $variant="default">Reiniciar</ActionButtonText>
          </ActionButton>
        </ButtonRow>
      </BottomBar>
    </Container>
  );
}

// --- Styled Components ---

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.background};
`;

const TopPanel = styled.View`
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElevated};
  padding: 16px 24px 16px 24px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }: { theme: ThemeColors }) => theme.borderLight};
  z-index: 10;
`;

const HeaderActions = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const BackButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const BackBtnText = styled.Text`
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  font-size: 16px;
  font-weight: 600;
`;

const CancelButton = styled.TouchableOpacity`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElement};
  align-items: center;
  justify-content: center;
`;

const HeaderInfo = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
`;

const TotalText = styled.Text`
  font-size: 22px;
  font-weight: 900;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
`;

const ProgressLabel = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  margin-bottom: 2px;
`;

const ProgressTrack = styled.View`
  height: 7px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElement};
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.View`
  height: 100%;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.accent};
  border-radius: 3px;
`;

// flexGrow: 1 mantido para o caso de expansão
const ScrollContent = styled.ScrollView.attrs({
  contentContainerStyle: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flexGrow: 1,
  },
})`
  flex: 1;
`;

const DoneContainer = styled.View`
  align-items: center;
  justify-content: center;
  padding-vertical: 40px;
  gap: 16px;
`;

const DoneIconWrapper = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.accentLight};
  align-items: center;
  justify-content: center;
`;

const DoneTitle = styled.Text`
  font-size: 22px;
  font-weight: 900;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
`;

const DoneSubtitle = styled.Text`
  font-size: 14px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  font-weight: 500;
`;

const Card = styled.View<{ $density?: "spacious" | "normal" | "compact" }>`
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.cardBackground};
  border-radius: 20px;
  padding: ${({ $density }) =>
    $density === "spacious"
      ? "23px"
      : $density === "compact"
        ? "16px 18px"
        : "20px 24px"};
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.border};
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.04;
  shadow-radius: 8px;
  elevation: 2;
`;

const CardLabel = styled.Text`
  font-size: 12px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
`;

const ItemTitle = styled.Text<{ $density?: "spacious" | "normal" | "compact" }>`
  font-size: ${({ $density }) =>
    $density === "spacious"
      ? "26px"
      : $density === "compact"
        ? "20px"
        : "22px"};
  font-weight: 900;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  margin-bottom: 12px;
  line-height: ${({ $density }) =>
    $density === "spacious"
      ? "34px"
      : $density === "compact"
        ? "26px"
        : "30px"};
  height: ${({ $density }) =>
    $density === "spacious"
      ? "68px"
      : $density === "compact"
        ? "52px"
        : "60px"};
  overflow: hidden;
`;

const ItemRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ItemPrice = styled.Text<{ $density?: "spacious" | "normal" | "compact" }>`
  font-size: ${({ $density }) =>
    $density === "spacious"
      ? "18px"
      : $density === "compact"
        ? "14px"
        : "16px"};
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  font-weight: 700;
`;

const ItemRemaining = styled.Text<{
  $density?: "spacious" | "normal" | "compact";
}>`
  font-size: ${({ $density }) =>
    $density === "spacious"
      ? "16px"
      : $density === "compact"
        ? "13px"
        : "14px"};
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.accent};
`;

const QtyContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const QtyButton = styled.TouchableOpacity<{
  $density?: "spacious" | "normal" | "compact";
}>`
  width: ${({ $density }) =>
    $density === "spacious"
      ? "56px"
      : $density === "compact"
        ? "44px"
        : "48px"};
  height: ${({ $density }) =>
    $density === "spacious"
      ? "56px"
      : $density === "compact"
        ? "44px"
        : "48px"};
  border-radius: 16px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElement};
  align-items: center;
  justify-content: center;
`;

const QtyValue = styled.Text<{ $density?: "spacious" | "normal" | "compact" }>`
  font-size: ${({ $density }) =>
    $density === "spacious"
      ? "48px"
      : $density === "compact"
        ? "32px"
        : "38px"};
  font-weight: 900;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  width: 70px;
  text-align: center;
`;

const ToggleCard = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.cardBackground};
  border-radius: 20px;
  padding: 16px 20px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.border};
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.04;
  shadow-radius: 8px;
  elevation: 2;
`;

const ToggleTextGroup = styled.View``;

const ToggleTitle = styled.Text`
  font-size: 14px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
`;

const ToggleSubtitle = styled.Text`
  font-size: 12px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  margin-top: 2px;
  font-weight: 500;
`;

const SwitchTrack = styled.TouchableOpacity<{ $isActive: boolean }>`
  width: 46px;
  height: 26px;
  border-radius: 13px;
  background-color: ${({ $isActive, theme }: { $isActive: boolean; theme: ThemeColors }) =>
    $isActive ? theme.accent : theme.borderLight};
  justify-content: center;
  padding-horizontal: 2px;
`;

const SwitchThumb = styled.View<{ $isActive: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 11px;
  background-color: #ffffff;
  align-self: ${({ $isActive }) => ($isActive ? "flex-end" : "flex-start")};
`;

const AvatarGrid = styled.View<{
  $density?: "spacious" | "normal" | "compact";
}>`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ $density }) =>
    $density === "spacious" ? "12px" : $density === "compact" ? "8px" : "10px"};
  width: 100%;
`;

const AvatarItem = styled.TouchableOpacity<{
  $density?: "spacious" | "normal" | "compact";
}>`
  align-items: center;
  width: ${({ $density }) =>
    $density === "spacious" ? "30%" : $density === "compact" ? "22%" : "26%"};
  min-width: ${({ $density }) =>
    $density === "spacious"
      ? "72px"
      : $density === "compact"
        ? "56px"
        : "64px"};
  gap: ${({ $density }) => ($density === "compact" ? "4px" : "6px")};
`;

const AvatarCircle = styled.View<{
  $isSelected: boolean;
  $density?: "spacious" | "normal" | "compact";
}>`
  width: ${({ $density }) =>
    $density === "spacious"
      ? "76px"
      : $density === "compact"
        ? "48px"
        : "60px"};
  height: ${({ $density }) =>
    $density === "spacious"
      ? "76px"
      : $density === "compact"
        ? "48px"
        : "60px"};
  border-radius: ${({ $density }) =>
    $density === "spacious"
      ? "38px"
      : $density === "compact"
        ? "24px"
        : "30px"};
  align-items: center;
  justify-content: center;

  ${({ $isSelected, theme }) =>
    $isSelected &&
    `
    border-width: 2.5px;
    border-color: ${(theme as ThemeColors).text};
    transform: scale(1.05);
  `}
`;

const AvatarText = styled.Text<{
  $density?: "spacious" | "normal" | "compact";
}>`
  font-weight: 900;
  color: #ffffff;
  font-size: ${({ $density }) =>
    $density === "spacious"
      ? "22px"
      : $density === "compact"
        ? "13px"
        : "16px"};
`;

const AvatarLabel = styled.Text<{
  $density?: "spacious" | "normal" | "compact";
}>`
  font-size: ${({ $density }) =>
    $density === "spacious"
      ? "13px"
      : $density === "compact"
        ? "10px"
        : "11px"};
  font-weight: 700;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  text-align: center;
  max-width: 100%;
`;

const ConfirmButton = styled.TouchableOpacity`
  margin-top: 16px;
  width: 100%;
  padding-vertical: 14px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.accent};
  border-radius: 14px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const ConfirmText = styled.Text`
  color: #ffffff;
  font-weight: 800;
  font-size: 14px;
`;

const HelperText = styled.Text`
  margin-top: 12px;
  font-size: 12px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  text-align: center;
  font-weight: 600;
`;

const Spacing = styled.View`
  height: 16px;
`;

const BottomBar = styled.View`
  padding: 12px 24px 24px 24px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.backgroundElevated};
  border-top-width: 1px;
  border-top-color: ${({ theme }: { theme: ThemeColors }) => theme.border};
`;

const ButtonRow = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const ActionButton = styled.TouchableOpacity<{
  $variant: "default" | "primary" | "disabled";
}>`
  padding-vertical: 14px;
  border-radius: 14px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: ${({ $variant, theme }: { $variant: string; theme: ThemeColors }) => {
    if ($variant === "primary") return theme.accent;
    if ($variant === "disabled") return theme.backgroundElement;
    return theme.backgroundElement;
  }};
`;

const ActionButtonText = styled.Text<{
  $variant: "default" | "primary" | "disabled";
}>`
  font-weight: 800;
  font-size: 13px;
  color: ${({ $variant, theme }: { $variant: string; theme: ThemeColors }) => {
    if ($variant === "primary") return "#FFFFFF";
    if ($variant === "disabled") return theme.textMuted;
    return theme.textSecondary;
  }};
`;
