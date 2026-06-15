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
  const [isScrollable, setIsScrollable] = useState(false);

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
            {allDone
              ? "Concluído ✓"
              : `Item ${doneCount + 1} de ${items.length}`}
          </ProgressLabel>
        </TopRow>
        <ProgressTrack>
          <ProgressFill style={{ width: `${pct}%` }} />
        </ProgressTrack>
      </TopPanel>

      <ScrollContent
        scrollEnabled={isScrollable} // Controla dinamicamente se o scroll funciona
        alwaysBounceVertical={false}
        bounces={false}
        onContentSizeChange={(contentWidth, contentHeight) => {
          // Se o conteúdo mudar (ex: mudou de produto), reavalia o tamanho
          setIsScrollable(contentHeight > 550); // 550px é uma média segura da área útil da tela
        }}
        onLayout={(e) => {
          // Se preferir uma precisão cirúrgica baseada no tamanho exato do layout do seu celular:
          const layoutHeight = e.nativeEvent.layout.height;
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
          <View style={{ gap: 18 }}>
            {/* Otimizado de 16 para 12 */}
            {/* Produto Atual */}
            <Card style={{ paddingVertical: 16 }}>
              {/* Reduzido padding vertical */}
              <CardLabel>Produto atual</CardLabel>
              <ItemTitle numberOfLines={2}>{cur?.name}</ItemTitle>
              <ItemRow>
                <ItemPrice>{fmt(cur?.unitPrice ?? 0)} / un.</ItemPrice>
                <ItemRemaining>
                  Faltam {rem} {rem === 1 ? "unidade" : "unidades"}
                </ItemRemaining>
              </ItemRow>
            </Card>
            {/* Quantidade */}
            <Card style={{ paddingVertical: 16 }}>
              {/* Reduzido padding vertical */}
              <CardLabel style={{ marginBottom: 10 }}>
                Unidades a atribuir
              </CardLabel>
              <QtyContainer>
                <QtyButton
                  onPress={() => setQty(clamp(qty - 1))}
                  activeOpacity={0.7}
                >
                  <Minus size={20} color="#3F3F46" />
                </QtyButton>
                <QtyValue>{Math.min(qty, rem)}</QtyValue>
                <QtyButton
                  onPress={() => setQty(clamp(qty + 1))}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color="#3F3F46" />
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
                  qty > rem ? setQty(clamp(qty)) : null;
                }}
                activeOpacity={1}
                $isActive={personalizado}
              >
                <SwitchThumb $isActive={personalizado} />
              </SwitchTrack>
            </ToggleCard>
            {/* Atribuir Para */}
            <Card style={{ paddingVertical: 18 }}>
              {/* Reduzido padding vertical */}
              <CardLabel style={{ marginBottom: 12 }}>Atribuir para</CardLabel>
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
                  <AvatarItem
                    onPress={() => attribute(COLLECTIVE)}
                    activeOpacity={0.7}
                  >
                    <AvatarCircle
                      style={{ backgroundColor: "#27272A" }}
                      $isSelected={false}
                    >
                      <Users size={22} color="#FFFFFF" />
                    </AvatarCircle>
                    <AvatarLabel>
                      {profiles.length === 2 ? "Ambos" : "Todos"}
                    </AvatarLabel>
                  </AvatarItem>
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

          {allDone && (
            <ActionButton
              onPress={onFinalize}
              $variant="primary"
              activeOpacity={0.85}
              style={{ flex: 1 }}
            >
              <ActionButtonText $variant="primary">Finalizar</ActionButtonText>
            </ActionButton>
          )}
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
  padding: 16px 24px 12px 24px; /* Reduzido padding superior de 24px/16px para 16px/12px */
  border-bottom-width: 1px;
  border-bottom-color: #e4e4e7;
  z-index: 10;
`;

const TopRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px; /* Reduzido de 12px */
`;

const TotalText = styled.Text`
  font-size: 19px; /* Ajuste sutil de 20px */
  font-weight: 900;
  color: #18181b;
`;

const ProgressLabel = styled.Text`
  font-size: 15px; /* Ajuste sutil de 12px */
  font-weight: 800;
  color: #a1a1aa;
`;

const ProgressTrack = styled.View`
  height: 7px; /* Reduzido de 8px */
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
    paddingTop: 16 /* Reduzido de 24 para economizar espaço de entrada */,
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

const Card = styled.View`
  background-color: #ffffff;
  border-radius: 20px; /* Sutilmente mais compacto que 24px */
  padding: 23px; /* Reduzido de 24px geral para comprimir as margens brancas internas */
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

const ItemTitle = styled.Text`
  font-size: 22px; /* Otimizado de 22px para evitar quebras de linhas desnecessárias */
  font-weight: 900;
  color: #18181b;
  margin-bottom: 12px;
  line-height: 30px;
  height: 60px; /* 30px de linha * 2 linhas = 60px fixos */
  overflow: hidden; /* Garante que nada vaze caso o sistema tente esticar */
`;

const ItemRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ItemPrice = styled.Text`
  font-size: 16px;
  color: #71717a;
  font-weight: 700;
`;

const ItemRemaining = styled.Text`
  font-size: 14px;
  font-weight: 800;
  color: #10b981;
`;

const QtyContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const QtyButton = styled.TouchableOpacity`
  width: 48px; /* Reduzido de 56px para economizar altura vertical */
  height: 48px;
  border-radius: 16px;
  background-color: #f4f6f9;
  align-items: center;
  justify-content: center;
`;

const QtyValue = styled.Text`
  font-size: 38px; /* Otimizado de 48px */
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
  padding: 16px 20px; /* Reduzido de 20px/24px */
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
  width: 46px; /* Ajuste proporcional leve */
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
  flex-wrap: wrap;
  gap: 12px; /* Reduzido de 16px */
`;

const AvatarItem = styled.TouchableOpacity`
  align-items: center;
  gap: 6px;
  width: 21%; /* Pequeno ajuste de encaixe */
`;

const AvatarCircle = styled.View<{ $isSelected: boolean }>`
  width: 60px; /* Comprimido levemente de 56px */
  height: 60px;
  border-radius: 30px;
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

const AvatarText = styled.Text`
  font-weight: 900;
  color: #ffffff;
  font-size: 16px;
`;

const AvatarLabel = styled.Text`
  font-size: 11px;
  font-weight: 700;
  color: #52525b;
  text-align: center;
`;

const ConfirmButton = styled.TouchableOpacity`
  margin-top: 16px; /* Reduzido de 24px */
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
  height: 16px; /* Reduzido drasticamente de 40px para evitar vácuo no final do Scroll */
`;

const BottomBar = styled.View`
  padding: 12px 24px 24px 24px; /* Reduzido padding interno da barra inferior */
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
  padding-vertical: 14px; /* Otimizado de 16px */
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
