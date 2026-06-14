import { router } from "expo-router";
import {
  CheckCircle2,
  Minus,
  Plus,
  RotateCcw,
  Undo2,
  Users,
} from "lucide-react-native";
import React, { useState } from "react";
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
  const { profiles, items, setAllocs: setGlobalAllocs } = useAppContext();

  const PURCHASE_TOTAL = items.reduce(
    (s, i) => s + i.totalUnits * i.unitPrice,
    0,
  );

  const mkRemaining = () =>
    Object.fromEntries(items.map((i) => [i.id, i.totalUnits]));

  const [remaining, setRemaining] =
    useState<Record<string, number>>(mkRemaining);
  const [allocs, setAllocs] = useState<Allocations>({});
  const [curIdx, setCurIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [personalizado, setPersonalizado] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);

  const cur = items[curIdx];
  const rem = cur ? (remaining[cur.id] ?? 0) : 0;
  const allDone =
    items.length > 0 && Object.values(remaining).every((v) => v === 0);
  const doneCount = items.filter((i) => remaining[i.id] === 0).length;
  const pct = items.length > 0 ? (doneCount / items.length) * 100 : 0;
  const clamp = (v: number) => Math.max(1, Math.min(v, rem));

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

  return (
    <Container>
      {/* Top Header & Progress */}
      <TopPanel>
        <TopRow>
          <TotalText>Total: {fmt(PURCHASE_TOTAL)}</TotalText>
          <ProgressLabel>
            {allDone ? "Concluído ✓" : `Item ${doneCount + 1} de ${items.length}`}
          </ProgressLabel>
        </TopRow>
        <ProgressTrack>
          <ProgressFill style={{ width: `${pct}%` }} />
        </ProgressTrack>
      </TopPanel>

      <ScrollContent showsVerticalScrollIndicator={false}>
        {allDone ? (
          <DoneContainer>
            <DoneIconWrapper>
              <CheckCircle2 size={48} color="#10B981" />
            </DoneIconWrapper>
            <DoneTitle>Todos atribuídos!</DoneTitle>
            <DoneSubtitle>
              Clique em Finalizar para ver o resumo.
            </DoneSubtitle>
          </DoneContainer>
        ) : (
          <View style={{ gap: 16 }}>
            {/* Produto Atual */}
            <Card>
              <CardLabel>Produto atual</CardLabel>
              <ItemTitle>{cur?.name}</ItemTitle>
              <ItemRow>
                <ItemPrice>{fmt(cur?.unitPrice ?? 0)} / un.</ItemPrice>
                <ItemRemaining>
                  Faltam {rem} {rem === 1 ? "unidade" : "unidades"}
                </ItemRemaining>
              </ItemRow>
            </Card>

            {/* Quantidade */}
            <Card>
              <CardLabel style={{ marginBottom: 16 }}>Unidades a atribuir</CardLabel>
              <QtyContainer>
                <QtyButton onPress={() => setQty(clamp(qty - 1))} activeOpacity={0.7}>
                  <Minus size={22} color="#3F3F46" />
                </QtyButton>
                <QtyValue>{Math.min(qty, rem)}</QtyValue>
                <QtyButton onPress={() => setQty(clamp(qty + 1))} activeOpacity={0.7}>
                  <Plus size={22} color="#3F3F46" />
                </QtyButton>
              </QtyContainer>
            </Card>

            {/* Toggle Personalizado */}
            <ToggleCard>
              <ToggleTextGroup>
                <ToggleTitle>Modo Personalizado</ToggleTitle>
                <ToggleSubtitle>
                  {personalizado ? "Multi-seleção ativa" : "Seleção individual"}
                </ToggleSubtitle>
              </ToggleTextGroup>
              <SwitchTrack 
                onPress={() => {
                  setPersonalizado((p) => !p);
                  setSelected([]);
                }}
                activeOpacity={1}
                $isActive={personalizado}
              >
                <SwitchThumb $isActive={personalizado} />
              </SwitchTrack>
            </ToggleCard>

            {/* Atribuir Para */}
            <Card>
              <CardLabel style={{ marginBottom: 16 }}>Atribuir para</CardLabel>
              <AvatarGrid>
                {profiles.map((p) => {
                  const isSel = personalizado && selected.includes(p.id);
                  return (
                    <AvatarItem
                      key={p.id}
                      onPress={() => clickProfile(p.id)}
                      activeOpacity={0.7}
                    >
                      <AvatarCircle
                        style={{ backgroundColor: p.color }}
                        $isSelected={isSel}
                      >
                        <AvatarText>{getInitials(p.name)}</AvatarText>
                      </AvatarCircle>
                      <AvatarLabel>{p.name.split(" ")[0]}</AvatarLabel>
                    </AvatarItem>
                  );
                })}

                {!personalizado && (
                  <AvatarItem onPress={() => attribute(COLLECTIVE)} activeOpacity={0.7}>
                    <AvatarCircle style={{ backgroundColor: "#27272A" }} $isSelected={false}>
                      <Users size={24} color="#FFFFFF" />
                    </AvatarCircle>
                    <AvatarLabel>
                      {profiles.length === 2 ? "Ambos" : "Todos"}
                    </AvatarLabel>
                  </AvatarItem>
                )}
              </AvatarGrid>

              {personalizado && selected.length > 0 && (
                <ConfirmButton onPress={confirmPersonalizado} activeOpacity={0.85}>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <ConfirmText>
                    Atribuir para {selected.length} perfil{selected.length > 1 ? "s" : ""}
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

      {/* Footer / Ações */}
      <BottomBar>
        <ButtonRow>
          <ActionButton
            onPress={undo}
            disabled={!undoStack.length}
            $variant={undoStack.length ? "default" : "disabled"}
            activeOpacity={0.7}
            style={{ flex: 1 }}
          >
            <Undo2 size={18} color={undoStack.length ? "#3F3F46" : "#A1A1AA"} />
            <ActionButtonText $variant={undoStack.length ? "default" : "disabled"}>
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
            <ActionButtonText $variant="default">
              Reiniciar
            </ActionButtonText>
          </ActionButton>

          {allDone && (
            <ActionButton
              onPress={onFinalize}
              $variant="primary"
              activeOpacity={0.85}
              style={{ flex: 1 }}
            >
              <ActionButtonText $variant="primary">
                Finalizar
              </ActionButtonText>
            </ActionButton>
          )}
        </ButtonRow>
      </BottomBar>
    </Container>
  );
}

// --- Styled Components ---

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #F4F6F9;
`;

const TopPanel = styled.View`
  background-color: #FFFFFF;
  padding: 24px 24px 16px 24px;
  border-bottom-width: 1px;
  border-bottom-color: #E4E4E7;
  z-index: 10;
`;

const TopRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
`;

const TotalText = styled.Text`
  font-size: 20px;
  font-weight: 900;
  color: #18181B;
`;

const ProgressLabel = styled.Text`
  font-size: 12px;
  font-weight: 800;
  color: #A1A1AA;
`;

const ProgressTrack = styled.View`
  height: 8px;
  background-color: #F4F4F5;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.View`
  height: 100%;
  background-color: #10B981;
  border-radius: 4px;
`;

const ScrollContent = styled.ScrollView.attrs({
  contentContainerStyle: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
})`
  flex: 1;
`;

const DoneContainer = styled.View`
  align-items: center;
  justify-content: center;
  padding-vertical: 60px;
  gap: 20px;
`;

const DoneIconWrapper = styled.View`
  width: 96px;
  height: 96px;
  border-radius: 48px;
  background-color: #ECFDF5;
  align-items: center;
  justify-content: center;
`;

const DoneTitle = styled.Text`
  font-size: 24px;
  font-weight: 900;
  color: #18181B;
`;

const DoneSubtitle = styled.Text`
  font-size: 14px;
  color: #A1A1AA;
  font-weight: 500;
`;

const Card = styled.View`
  background-color: #FFFFFF;
  border-radius: 24px;
  padding: 24px;
  border-width: 1px;
  border-color: #F4F4F5;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.04;
  shadow-radius: 8px;
  elevation: 2;
`;

const CardLabel = styled.Text`
  font-size: 11px;
  font-weight: 800;
  color: #A1A1AA;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const ItemTitle = styled.Text`
  font-size: 22px;
  font-weight: 900;
  color: #18181B;
  margin-bottom: 16px;
  line-height: 28px;
`;

const ItemRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ItemPrice = styled.Text`
  font-size: 15px;
  color: #71717A;
  font-weight: 700;
`;

const ItemRemaining = styled.Text`
  font-size: 14px;
  font-weight: 800;
  color: #10B981;
`;

const QtyContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 24px;
`;

const QtyButton = styled.TouchableOpacity`
  width: 56px;
  height: 56px;
  border-radius: 20px;
  background-color: #F4F6F9;
  align-items: center;
  justify-content: center;
`;

const QtyValue = styled.Text`
  font-size: 48px;
  font-weight: 900;
  color: #18181B;
  width: 80px;
  text-align: center;
`;

const ToggleCard = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #FFFFFF;
  border-radius: 24px;
  padding: 20px 24px;
  border-width: 1px;
  border-color: #F4F4F5;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.04;
  shadow-radius: 8px;
  elevation: 2;
`;

const ToggleTextGroup = styled.View``;

const ToggleTitle = styled.Text`
  font-size: 15px;
  font-weight: 800;
  color: #18181B;
`;

const ToggleSubtitle = styled.Text`
  font-size: 13px;
  color: #A1A1AA;
  margin-top: 4px;
  font-weight: 500;
`;

const SwitchTrack = styled.TouchableOpacity<{ $isActive: boolean }>`
  width: 52px;
  height: 28px;
  border-radius: 14px;
  background-color: ${({ $isActive }) => ($isActive ? "#10B981" : "#E4E4E7")};
  justify-content: center;
  padding-horizontal: 2px;
`;

const SwitchThumb = styled.View<{ $isActive: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: #FFFFFF;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 3px;
  elevation: 2;
  align-self: ${({ $isActive }) => ($isActive ? "flex-end" : "flex-start")};
`;

const AvatarGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
`;

const AvatarItem = styled.TouchableOpacity`
  align-items: center;
  gap: 8px;
  width: 20%;
`;

const AvatarCircle = styled.View<{ $isSelected: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  align-items: center;
  justify-content: center;
  
  ${({ $isSelected }) =>
    $isSelected &&
    `
    border-width: 3px;
    border-color: #10B981;
    transform: scale(1.1);
  `}
`;

const AvatarText = styled.Text`
  font-weight: 900;
  color: #FFFFFF;
  font-size: 18px;
`;

const AvatarLabel = styled.Text`
  font-size: 12px;
  font-weight: 700;
  color: #52525B;
  text-align: center;
`;

const ConfirmButton = styled.TouchableOpacity`
  margin-top: 24px;
  width: 100%;
  padding-vertical: 16px;
  background-color: #10B981;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  shadow-color: #10B981;
  shadow-offset: 0px 6px;
  shadow-opacity: 0.25;
  shadow-radius: 12px;
  elevation: 4;
`;

const ConfirmText = styled.Text`
  color: #FFFFFF;
  font-weight: 800;
  font-size: 15px;
`;

const HelperText = styled.Text`
  margin-top: 16px;
  font-size: 13px;
  color: #D4D4D8;
  text-align: center;
  font-weight: 600;
`;

const Spacing = styled.View`
  height: 40px;
`;

const BottomBar = styled.View`
  padding: 16px 24px 32px 24px;
  background-color: #FFFFFF;
  border-top-width: 1px;
  border-top-color: #F4F4F5;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const ActionButton = styled.TouchableOpacity<{ $variant: "default" | "primary" | "disabled" }>`
  padding-vertical: 16px;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: ${({ $variant }) => {
    if ($variant === "primary") return "#10B981";
    if ($variant === "disabled") return "#FAFAFA";
    return "#F4F4F5";
  }};

  ${({ $variant }) =>
    $variant === "primary" &&
    `
    shadow-color: #10B981;
    shadow-offset: 0px 6px;
    shadow-opacity: 0.25;
    shadow-radius: 12px;
    elevation: 4;
  `}
`;

const ActionButtonText = styled.Text<{ $variant: "default" | "primary" | "disabled" }>`
  font-weight: 800;
  font-size: 14px;
  color: ${({ $variant }) => {
    if ($variant === "primary") return "#FFFFFF";
    if ($variant === "disabled") return "#A1A1AA";
    return "#3F3F46";
  }};
`;