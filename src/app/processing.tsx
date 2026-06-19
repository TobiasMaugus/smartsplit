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
import { useAppContext } from "../context/AppContext";
import { Allocations, COLLECTIVE } from "../types";

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

  // 🔥 Verificação que ativará o design espaçoso caso só tenhamos 2 perfis
  const isTwoProfiles = profiles.length === 2;

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
      const each = Math.floor(units / pids.length);
      const extra = units % pids.length;
      pids.forEach((pid, i) => {
        newAllocs[cur.id][pid] =
          (newAllocs[cur.id][pid] ?? 0) + each + (i === 0 ? extra : 0);
      });
    } else {
      newAllocs[cur.id][profileId] =
        (newAllocs[cur.id][profileId] ?? 0) + units;
    }

    const newRem = { ...remaining, [cur.id]: rem - units };
    setAllocs(newAllocs);
    setRemaining(newRem);
    setSelected([]);
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
    setSelected([]);
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

  return (
    <Container>
      <TopPanel>
        {/* LInha 1: Navegação (Voltar e Cancelar) */}
        <HeaderActions>
          <BackButton onPress={() => router.back()} activeOpacity={0.7}>
            <ChevronLeft size={20} color="#A1A1AA" />
            <BackText>Voltar</BackText>
          </BackButton>

          <CancelButton onPress={onCancelPurchase} activeOpacity={0.6}>
            <X size={18} color="#A1A1AA" />
          </CancelButton>
        </HeaderActions>

        {/* Linha 2: Informações (Total e Progresso) */}
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
              <CheckCircle2 size={48} color="#10B981" />
            </DoneIconWrapper>
            <DoneTitle>Todos atribuídos!</DoneTitle>
            <DoneSubtitle>Clique em Finalizar para ver o resumo.</DoneSubtitle>
          </DoneContainer>
        ) : (
          <View style={{ gap: isTwoProfiles ? 14 : 18 }}>
            {/* --- Produto Atual --- */}
            <Card $isSpacious={isTwoProfiles}>
              <CardLabel>Produto atual</CardLabel>
              <ItemTitle $isSpacious={isTwoProfiles} numberOfLines={2}>
                {cur?.name}
              </ItemTitle>
              <ItemRow>
                <ItemPrice $isSpacious={isTwoProfiles}>
                  {fmt(cur?.unitPrice ?? 0)} / un.
                </ItemPrice>
                <ItemRemaining $isSpacious={isTwoProfiles}>
                  Faltam {rem} {rem === 1 ? "unidade" : "unidades"}
                </ItemRemaining>
              </ItemRow>
            </Card>

            {/* --- Quantidade --- */}
            <Card $isSpacious={isTwoProfiles}>
              <CardLabel style={{ marginBottom: 10 }}>
                Unidades a atribuir
              </CardLabel>
              <QtyContainer>
                <QtyButton
                  $isSpacious={isTwoProfiles}
                  onPress={() => setQty(clamp(qty - 1))}
                  activeOpacity={0.7}
                >
                  <Minus size={isTwoProfiles ? 24 : 20} color="#3F3F46" />
                </QtyButton>
                <QtyValue $isSpacious={isTwoProfiles}>
                  {Math.min(qty, rem)}
                </QtyValue>
                <QtyButton
                  $isSpacious={isTwoProfiles}
                  onPress={() => setQty(clamp(qty + 1))}
                  activeOpacity={0.7}
                >
                  <Plus size={isTwoProfiles ? 24 : 20} color="#3F3F46" />
                </QtyButton>
              </QtyContainer>
            </Card>

            {/* --- Toggle Personalizado (Oculto se isTwoProfiles) --- */}
            {!isTwoProfiles && (
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

            {/* --- Atribuir Para --- */}
            <Card $isSpacious={isTwoProfiles}>
              <CardLabel style={{ marginBottom: 12 }}>Atribuir para</CardLabel>
              <AvatarGrid>
                {isTwoProfiles ? (
                  <>
                    {/* 1º Perfil */}
                    <AvatarItem
                      onPress={() => clickProfile(profiles[0].id)}
                      activeOpacity={0.7}
                    >
                      <AvatarCircle
                        $isSpacious={isTwoProfiles}
                        style={{ backgroundColor: profiles[0].color }}
                        $isSelected={
                          personalizado && selected.includes(profiles[0].id)
                        }
                      >
                        <AvatarText $isSpacious={isTwoProfiles}>
                          {getInitials(profiles[0].name)}
                        </AvatarText>
                      </AvatarCircle>
                      <AvatarLabel $isSpacious={isTwoProfiles}>
                        {profiles[0].name.split(" ")[0]}
                      </AvatarLabel>
                    </AvatarItem>

                    {/* Perfil Coletivo (Ambos) */}
                    <AvatarItem
                      onPress={() => attribute(COLLECTIVE)}
                      activeOpacity={0.7}
                    >
                      <AvatarCircle
                        $isSpacious={isTwoProfiles}
                        style={{ backgroundColor: "#27272A" }}
                        $isSelected={false}
                      >
                        <Users size={isTwoProfiles ? 28 : 22} color="#FFFFFF" />
                      </AvatarCircle>
                      <AvatarLabel $isSpacious={isTwoProfiles}>
                        Ambos
                      </AvatarLabel>
                    </AvatarItem>

                    {/* 2º Perfil */}
                    <AvatarItem
                      onPress={() => clickProfile(profiles[1].id)}
                      activeOpacity={0.7}
                    >
                      <AvatarCircle
                        $isSpacious={isTwoProfiles}
                        style={{ backgroundColor: profiles[1].color }}
                        $isSelected={
                          personalizado && selected.includes(profiles[1].id)
                        }
                      >
                        <AvatarText $isSpacious={isTwoProfiles}>
                          {getInitials(profiles[1].name)}
                        </AvatarText>
                      </AvatarCircle>
                      <AvatarLabel $isSpacious={isTwoProfiles}>
                        {profiles[1].name.split(" ")[0]}
                      </AvatarLabel>
                    </AvatarItem>
                  </>
                ) : (
                  <>
                    {profiles.map((p) => {
                      const isSel = personalizado && selected.includes(p.id);
                      return (
                        <AvatarItem
                          key={p.id}
                          onPress={() => clickProfile(p.id)}
                          activeOpacity={0.7}
                        >
                          <AvatarCircle
                            $isSpacious={false}
                            style={{ backgroundColor: p.color }}
                            $isSelected={isSel}
                          >
                            <AvatarText $isSpacious={false}>
                              {getInitials(p.name)}
                            </AvatarText>
                          </AvatarCircle>
                          <AvatarLabel $isSpacious={false}>
                            {p.name.split(" ")[0]}
                          </AvatarLabel>
                        </AvatarItem>
                      );
                    })}
                    {!personalizado && (
                      <AvatarItem
                        onPress={() => attribute(COLLECTIVE)}
                        activeOpacity={0.7}
                      >
                        <AvatarCircle
                          $isSpacious={false}
                          style={{ backgroundColor: "#27272A" }}
                          $isSelected={false}
                        >
                          <Users size={22} color="#FFFFFF" />
                        </AvatarCircle>
                        <AvatarLabel $isSpacious={false}>Todos</AvatarLabel>
                      </AvatarItem>
                    )}
                  </>
                )}
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
        {/* Botão Finalizar aparece ACIMA e ocupa a largura total */}
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
            <Undo2 size={18} color={undoStack.length ? "#3F3F46" : "#A1A1AA"} />
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
            <RotateCcw size={18} color="#3F3F46" />
            <ActionButtonText $variant="default">Reiniciar</ActionButtonText>
          </ActionButton>
        </ButtonRow>
      </BottomBar>
    </Container>
  );
}

// --- Styled Components Modificados ---

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #f4f6f9;
`;

const TopPanel = styled.View`
  background-color: #ffffff;
  padding: 16px 24px 16px 24px;
  border-bottom-width: 1px;
  border-bottom-color: #e4e4e7;
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
  /* Removido o margin-bottom que causava o desalinhamento */
`;

const BackText = styled.Text`
  color: #a1a1aa;
  font-size: 16px;
  font-weight: 600;
`;

const CancelButton = styled.TouchableOpacity`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: #f4f6f9;
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
  color: #18181b;
`;

const ProgressLabel = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: #71717a;
  margin-bottom: 2px;
`;

const ProgressTrack = styled.View`
  height: 7px;
  background-color: #f4f4f5;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.View`
  height: 100%;
  background-color: #10b981;
  border-radius: 3px;
`;

const ScrollContent = styled.ScrollView.attrs({
  contentContainerStyle: {
    paddingHorizontal: 24,
    paddingTop: 16,
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
  background-color: #ecfdf5;
  align-items: center;
  justify-content: center;
`;

const DoneTitle = styled.Text`
  font-size: 22px;
  font-weight: 900;
  color: #18181b;
`;

const DoneSubtitle = styled.Text`
  font-size: 14px;
  color: #a1a1aa;
  font-weight: 500;
`;

const Card = styled.View<{ $isSpacious?: boolean }>`
  background-color: #ffffff;
  border-radius: 20px;
  padding: ${({ $isSpacious }) => ($isSpacious ? "23px" : "20px 24px")};
  border-width: 1px;
  border-color: #f4f4f5;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.04;
  shadow-radius: 8px;
  elevation: 2;
`;

const CardLabel = styled.Text`
  font-size: 12px;
  font-weight: 800;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
`;

const ItemTitle = styled.Text<{ $isSpacious?: boolean }>`
  font-size: ${({ $isSpacious }) => ($isSpacious ? "26px" : "22px")};
  font-weight: 900;
  color: #18181b;
  margin-bottom: 12px;
  line-height: ${({ $isSpacious }) => ($isSpacious ? "34px" : "30px")};
  height: ${({ $isSpacious }) => ($isSpacious ? "68px" : "60px")};
  overflow: hidden;
`;

const ItemRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ItemPrice = styled.Text<{ $isSpacious?: boolean }>`
  font-size: ${({ $isSpacious }) => ($isSpacious ? "18px" : "16px")};
  color: #71717a;
  font-weight: 700;
`;

const ItemRemaining = styled.Text<{ $isSpacious?: boolean }>`
  font-size: ${({ $isSpacious }) => ($isSpacious ? "16px" : "14px")};
  font-weight: 800;
  color: #10b981;
`;

const QtyContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const QtyButton = styled.TouchableOpacity<{ $isSpacious?: boolean }>`
  width: ${({ $isSpacious }) => ($isSpacious ? "56px" : "48px")};
  height: ${({ $isSpacious }) => ($isSpacious ? "56px" : "48px")};
  border-radius: 16px;
  background-color: #f4f6f9;
  align-items: center;
  justify-content: center;
`;

const QtyValue = styled.Text<{ $isSpacious?: boolean }>`
  font-size: ${({ $isSpacious }) => ($isSpacious ? "48px" : "38px")};
  font-weight: 900;
  color: #18181b;
  width: 70px;
  text-align: center;
`;

const ToggleCard = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: 20px;
  padding: 16px 20px;
  border-width: 1px;
  border-color: #f4f4f5;
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
  color: #18181b;
`;

const ToggleSubtitle = styled.Text`
  font-size: 12px;
  color: #a1a1aa;
  margin-top: 2px;
  font-weight: 500;
`;

const SwitchTrack = styled.TouchableOpacity<{ $isActive: boolean }>`
  width: 46px;
  height: 26px;
  border-radius: 13px;
  background-color: ${({ $isActive }) => ($isActive ? "#10B981" : "#E4E4E7")};
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

const AvatarGrid = styled.View`
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`;

const AvatarItem = styled.TouchableOpacity`
  align-items: center;
  flex: 1;
  gap: 6px;
`;

const AvatarCircle = styled.View<{
  $isSelected: boolean;
  $isSpacious?: boolean;
}>`
  width: ${({ $isSpacious }) => ($isSpacious ? "76px" : "60px")};
  height: ${({ $isSpacious }) => ($isSpacious ? "76px" : "60px")};
  border-radius: ${({ $isSpacious }) => ($isSpacious ? "38px" : "30px")};
  align-items: center;
  justify-content: center;

  ${({ $isSelected }) =>
    $isSelected &&
    `
    border-width: 2.5px;
    border-color: #10B981;
    transform: scale(1.05);
  `}
`;

const AvatarText = styled.Text<{ $isSpacious?: boolean }>`
  font-weight: 900;
  color: #ffffff;
  font-size: ${({ $isSpacious }) => ($isSpacious ? "22px" : "16px")};
`;

const AvatarLabel = styled.Text<{ $isSpacious?: boolean }>`
  font-size: ${({ $isSpacious }) => ($isSpacious ? "13px" : "11px")};
  font-weight: 700;
  color: #52525b;
  text-align: center;
`;

const ConfirmButton = styled.TouchableOpacity`
  margin-top: 16px;
  width: 100%;
  padding-vertical: 14px;
  background-color: #10b981;
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
  color: #d4d4d8;
  text-align: center;
  font-weight: 600;
`;

const Spacing = styled.View`
  height: 16px;
`;

const BottomBar = styled.View`
  padding: 12px 24px 24px 24px;
  background-color: #ffffff;
  border-top-width: 1px;
  border-top-color: #f4f4f5;
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
  background-color: ${({ $variant }) => {
    if ($variant === "primary") return "#10B981";
    if ($variant === "disabled") return "#FAFAFA";
    return "#F4F4F5";
  }};
`;

const ActionButtonText = styled.Text<{
  $variant: "default" | "primary" | "disabled";
}>`
  font-weight: 800;
  font-size: 13px;
  color: ${({ $variant }) => {
    if ($variant === "primary") return "#FFFFFF";
    if ($variant === "disabled") return "#A1A1AA";
    return "#3F3F46";
  }};
`;
