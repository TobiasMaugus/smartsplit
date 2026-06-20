import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Share2 } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Modal, ScrollView, Share, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { Avatar } from "../../components/Avatar";
import { ThemeColors } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";
import { useThemeContext } from "../../context/ThemeContext";
import {
  COLLECTIVE,
  GroceryItem,
  Profile,
  getCollectiveLabel,
} from "../../types";
import { generatePixBRCode } from "../../utils/pix";

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function HistoryDetail() {
  const params = useLocalSearchParams();
  const { id } = params as { id?: string };
  const router = useRouter();

  // 💡 Importante: pegamos a função setHistoryEntries para poder atualizar os pagamentos
  const {
    historyEntries,
    setHistoryEntries,
    profiles,
    deleteHistoryEntry,
    restoreHistoryEntry,
  } = useAppContext();
  const { colors } = useThemeContext();

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false); // Novo estado do Modal
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const entry = historyEntries.find((h) => h.id === id);
  const collectiveLabel = getCollectiveLabel(profiles.length);

  const involvedProfiles = useMemo(() => {
    if (!entry) return [];
    const referenceProfiles =
      entry.participants && entry.participants.length > 0
        ? entry.participants
        : profiles;
    const ids = new Set<string>();
    if (entry.payer?.id) ids.add(entry.payer.id);

    entry.items?.forEach((it: GroceryItem) => {
      const alloc = entry.allocs?.[it.id] ?? {};
      Object.entries(alloc).forEach(([pid, units]) => {
        if (pid !== COLLECTIVE && units > 0) ids.add(pid);
      });
    });

    return Array.from(ids).map((pid) => {
      if (pid === entry.payer?.id) return entry.payer;
      const found = referenceProfiles.find((p: Profile) => p.id === pid);
      if (found) return found;
      return { id: pid, name: "Perfil Excluído", color: "#A1A1AA" } as Profile;
    });
  }, [entry, profiles]);

  // 💡 Extraímos o cálculo dos devedores para poder usar no Modal e no Compartilhar
  const { participants, totals, validDebtors } = useMemo(() => {
    if (!entry) return { participants: [], totals: {}, validDebtors: [] };

    const payer = entry.payer;
    const parts =
      entry.participants && entry.participants.length > 0
        ? entry.participants
        : profiles;
    const calcTotals: Record<string, number> = {};
    parts.forEach((p) => (calcTotals[p.id] = 0));

    entry.items?.forEach((it) => {
      const alloc = entry.allocs?.[it.id] ?? {};
      Object.entries(alloc).forEach(([pid, units]) => {
        if (units > 0) {
          const cost = units * it.unitPrice;
          if (pid === COLLECTIVE) {
            const splitValue = cost / parts.length;
            parts.forEach((p) => {
              calcTotals[p.id] = (calcTotals[p.id] || 0) + splitValue;
            });
          } else {
            calcTotals[pid] = (calcTotals[pid] || 0) + cost;
          }
        }
      });
    });

    const vDebtors = parts.filter(
      (p) => p.id !== payer.id && calcTotals[p.id] > 0,
    );
    return { participants: parts, totals: calcTotals, validDebtors: vDebtors };
  }, [entry, profiles]);

  if (!entry) {
    return (
      <Container>
        <Header>
          <BackButton onPress={() => router.back()} activeOpacity={0.7}>
            <ChevronLeft size={20} color={colors.textMuted} />
            <BackText>Voltar</BackText>
          </BackButton>
        </Header>
        <Body>
          <EmptyText>Histórico não encontrado.</EmptyText>
        </Body>
      </Container>
    );
  }

  const confirmDelete = () => {
    deleteHistoryEntry(entry.id);
    setIsDeleteModalVisible(false);
    router.replace("/(tabs)");
  };

  const handleEdit = () => {
    restoreHistoryEntry(entry);
    router.push("/processing");
  };

  // 💡 Função que alterna o status de pago/não pago
  const togglePaymentStatus = (debtorId: string) => {
    const currentStatus = entry.paidStatus?.[debtorId] ?? false;
    const updatedEntry = {
      ...entry,
      paidStatus: {
        ...(entry.paidStatus || {}),
        [debtorId]: !currentStatus,
      },
    };
    setHistoryEntries((prev) =>
      prev.map((h) => (h.id === entry.id ? updatedEntry : h)),
    );
  };

  // 💡 Lógica de compartilhamento atualizada
  const handleShare = async () => {
    try {
      const payer = entry.payer;
      const pixKey = payer.pixKey || "";
      const pixName = payer.pixName || payer.name;
      const pixCity = payer.pixCity || "São Paulo";

      const messageBlock = [
        `💰 Divisão Concluída!`,
        entry.marketName ? `🛒 Local: ${entry.marketName}` : "",
        `Total da compra: ${fmt(entry.total)}`,
        `Pagador: ${payer.name}`,
        pixKey ? `Chave PIX: ${pixKey}\n` : "",
      ]
        .filter(Boolean)
        .join("\n");

      // Separa quem pagou de quem não pagou
      const paidDebtors = validDebtors.filter((d) => entry.paidStatus?.[d.id]);
      const unpaidDebtors = validDebtors.filter(
        (d) => !entry.paidStatus?.[d.id],
      );

      let debtLines: string[] = [];

      // Grupo dos que JÁ PAGARAM (vêm primeiro)
      if (paidDebtors.length > 0) {
        debtLines.push("✅ *Já Pagaram:*");
        paidDebtors.forEach((o) => {
          debtLines.push(
            `• ${o.name.split(" ")[0]}: ${fmt(totals[o.id])} (Pago)`,
          );
        });
        debtLines.push(""); // Linha em branco separadora
      }

      // Grupo dos que FALTAM PAGAR (Exatamente como era antes)
      if (unpaidDebtors.length > 0) {
        debtLines.push("⏳ *Faltam Pagar:*");
        unpaidDebtors.forEach((o) => {
          const valorIndividual = totals[o.id] ?? 0;

          if (pixKey) {
            let texto = `• ${o.name.split(" ")[0]} deve ${fmt(valorIndividual)}:`;
            const emvCode = generatePixBRCode(
              pixKey,
              valorIndividual,
              pixName,
              pixCity,
            );
            const safePixCode = encodeURIComponent(emvCode);
            const pixLink = `https://tobiasmaugus.github.io/smartsplitPIX-SITE/?codigo=${safePixCode}`;
            texto += `\n${pixLink}`;
            debtLines.push(texto);
          } else {
            debtLines.push(
              `• ${o.name.split(" ")[0]} deve ${fmt(valorIndividual)}`,
            );
          }
        });
      }

      const separador = pixKey ? "\n\n" : "\n";
      const message = `${messageBlock}\n${debtLines.join(separador)}`;

      await Share.share({ message });
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };
  const hasCollective = entry.items?.some(
    (it) => (entry.allocs?.[it.id]?.[COLLECTIVE] ?? 0) > 0,
  );
  const filteredItems =
    entry.items?.filter((it: GroceryItem) => {
      if (!selectedFilter) return true;
      const alloc = entry.allocs?.[it.id] ?? {};
      return alloc[selectedFilter] !== undefined && alloc[selectedFilter] > 0;
    }) ?? [];

  return (
    <Container>
      <Header>
        <View style={{ width: "100%", alignItems: "center", marginBottom: 24 }}>
          <Title>Detalhes da Compra</Title>
        </View>

        <BackButton onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={colors.textMuted} />
          <BackText>Voltar</BackText>
        </BackButton>
      </Header>

      <Scroll>
        <Top>
          <Avatar name={entry.payer.name} color={entry.payer.color} size="lg" />
          <TopInfo>
            <MarketRow>
              <Market numberOfLines={1}>
                {entry.marketName || "Supermercado"}
              </Market>
              <ShareBtn onPress={handleShare} activeOpacity={0.7}>
                <Share2 size={40} color={colors.accent} />
              </ShareBtn>
            </MarketRow>
            <Meta>
              <MetaText>{entry.date}</MetaText>
              {entry.horario ? <MetaText>às {entry.horario}</MetaText> : null}
            </Meta>
            <Total>R$ {entry.total.toFixed(2).replace(".", ",")}</Total>
          </TopInfo>
        </Top>

        <Divider />

        <FilterScrollWrapper>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
          >
            <FilterPill
              $active={selectedFilter === null}
              onPress={() => setSelectedFilter(null)}
              activeOpacity={0.7}
            >
              <FilterPillText $active={selectedFilter === null}>
                Todos os itens
              </FilterPillText>
            </FilterPill>

            {hasCollective && (
              <FilterPill
                $active={selectedFilter === COLLECTIVE}
                onPress={() => setSelectedFilter(COLLECTIVE)}
                activeOpacity={0.7}
              >
                <FilterPillText $active={selectedFilter === COLLECTIVE}>
                  Uso Coletivo
                </FilterPillText>
              </FilterPill>
            )}

            {involvedProfiles.map((p) => (
              <FilterPill
                key={p.id}
                $active={selectedFilter === p.id}
                onPress={() => setSelectedFilter(p.id)}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: p.color,
                  }}
                />
                <FilterPillText $active={selectedFilter === p.id}>
                  {p.name.split(" ")[0]}
                </FilterPillText>
              </FilterPill>
            ))}
          </ScrollView>
        </FilterScrollWrapper>

        <Section>
          <SectionTitle>
            Itens da Compra {selectedFilter && `(${filteredItems.length})`}
          </SectionTitle>
          {filteredItems.length > 0 ? (
            filteredItems.map((it: GroceryItem) => {
              const alloc = entry.allocs?.[it.id] ?? {};
              const allocEntries = Object.entries(alloc);

              return (
                <ItemRow key={it.id}>
                  <ItemHeader>
                    <ItemName numberOfLines={1}>{it.name}</ItemName>
                    <ItemUnitPrice>
                      R$ {it.unitPrice.toFixed(2).replace(".", ",")} / un
                    </ItemUnitPrice>
                  </ItemHeader>

                  <AllocationsWrapper>
                    {allocEntries.map(([pid, units]) => {
                      if (units <= 0) return null;
                      const cost = units * it.unitPrice;

                      if (pid === COLLECTIVE) {
                        return (
                          <AllocRow key={COLLECTIVE}>
                            <SharedBadge>
                              <SharedBadgeText>USO COLETIVO</SharedBadgeText>
                            </SharedBadge>
                            <AllocText>
                              {units} {units === 1 ? "unidade" : "unidades"} ·
                              R$ {cost.toFixed(2).replace(".", ",")}
                            </AllocText>
                          </AllocRow>
                        );
                      }

                      const profile = involvedProfiles.find(
                        (p) => p.id === pid,
                      );
                      if (!profile) return null;

                      return (
                        <AllocRow key={pid}>
                          <Avatar
                            name={profile.name}
                            color={profile.color}
                            size="xs"
                          />
                          <AllocText>
                            {profile.name.split(" ")[0]} · {units}{" "}
                            {units === 1 ? "unidade" : "unidades"} · R${" "}
                            {cost.toFixed(2).replace(".", ",")}
                          </AllocText>
                        </AllocRow>
                      );
                    })}
                  </AllocationsWrapper>
                </ItemRow>
              );
            })
          ) : (
            <EmptyText>Nenhum item encontrado para este filtro.</EmptyText>
          )}
        </Section>
        <Spacing />
      </Scroll>

      <Footer>
        <ManageButton
          onPress={() => setIsPaymentModalVisible(true)}
          activeOpacity={0.8}
        >
          <ManageText>Gerenciar Pagamentos</ManageText>
        </ManageButton>
        <ActionButtonsRow>
          <DangerButton
            onPress={() => setIsDeleteModalVisible(true)}
            activeOpacity={0.8}
          >
            <DangerText>Excluir</DangerText>
          </DangerButton>
          <PrimaryButton onPress={handleEdit} activeOpacity={0.85}>
            <PrimaryText>Refazer Divisão</PrimaryText>
          </PrimaryButton>
        </ActionButtonsRow>
      </Footer>

      {/* 💡 MODAL DE GERENCIAMENTO DE PAGAMENTOS */}
      <Modal
        visible={isPaymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <ModalOverlay>
          <ModalContent style={{ paddingVertical: 24 }}>
            <ModalTitle>Quem já te pagou?</ModalTitle>
            <ModalSubtitle>
              Toque na pessoa para alterar o status.
            </ModalSubtitle>

            <ScrollView
              style={{ width: "100%", maxHeight: 300, marginBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {validDebtors.map((d) => {
                const isPaid = entry.paidStatus?.[d.id] ?? false;
                return (
                  <PaymentToggleRow
                    key={d.id}
                    onPress={() => togglePaymentStatus(d.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Avatar name={d.name} color={d.color} size="sm" />
                      <View>
                        <PaymentName>{d.name}</PaymentName>
                        <PaymentAmount>{fmt(totals[d.id])}</PaymentAmount>
                      </View>
                    </View>
                    <StatusPill $isPaid={isPaid}>
                      <StatusText $isPaid={isPaid}>
                        {isPaid ? "PAGO" : "NÃO PAGO"}
                      </StatusText>
                    </StatusPill>
                  </PaymentToggleRow>
                );
              })}
            </ScrollView>

            <ModalPrimaryButton
              onPress={() => setIsPaymentModalVisible(false)}
              activeOpacity={0.8}
            >
              <PrimaryText>Pronto</PrimaryText>
            </ModalPrimaryButton>
          </ModalContent>
        </ModalOverlay>
      </Modal>

      {/* MODAL DE DELETAR HISTÓRICO MANTIDO */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Excluir histórico</ModalTitle>
            <ModalSubtitle>
              Tem certeza que deseja excluir este histórico? Esta ação não
              poderá ser desfeita.
            </ModalSubtitle>
            <ActionButtonsContainer>
              <ModalCancelButton
                onPress={() => setIsDeleteModalVisible(false)}
                activeOpacity={0.7}
              >
                <ModalCancelText>Cancelar</ModalCancelText>
              </ModalCancelButton>
              <ModalDeleteButton onPress={confirmDelete} activeOpacity={0.7}>
                <ModalDeleteText>Excluir</ModalDeleteText>
              </ModalDeleteButton>
            </ActionButtonsContainer>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </Container>
  );
}

// ==========================================
// STYLED COMPONENTS
// ==========================================

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.background};
`;
const Header = styled.View`
  padding: 20px 24px 8px 24px;
`;
const Title = styled.Text`
  font-size: 32px;
  font-weight: 900;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  letter-spacing: -0.5px;
  line-height: 38px;
  text-align: center;
`;
const BackButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
`;
const BackText = styled.Text`
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  font-size: 16px;
  font-weight: 600;
`;
const Scroll = styled.ScrollView.attrs({
  contentContainerStyle: { paddingHorizontal: 24, paddingBottom: 24 },
})`
  flex: 1;
`;
const Body = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;
const Top = styled.View`
  flex-direction: row;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
`;
const TopInfo = styled.View`
  flex: 1;
`;
const MarketRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;
const Market = styled.Text`
  font-size: 16px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  flex: 1;
  margin-right: 8px;
`;
const ShareBtn = styled.TouchableOpacity`
  padding: 10px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.accentLight};
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  transform: translateY(20px);
`;
const Meta = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-top: 0px;
`;
const Total = styled.Text`
  font-size: 20px;
  font-weight: 900;
  color: ${({ theme }: { theme: ThemeColors }) => theme.accent};
  margin-top: 0px;
`;
const MetaText = styled.Text`
  font-size: 12px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  font-weight: 600;
`;
const Divider = styled.View`
  height: 1px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.divider};
  margin-vertical: 16px;
`;
const FilterScrollWrapper = styled.View`
  margin-horizontal: -24px;
  margin-bottom: 20px;
`;
const FilterPill = styled.TouchableOpacity<{ $active: boolean }>`
  padding: 8px 16px;
  border-radius: 999px;
  background-color: ${({
    $active,
    theme,
  }: {
    $active: boolean;
    theme: ThemeColors;
  }) => ($active ? theme.text : theme.cardBackground)};
  border-width: 1px;
  border-color: ${({
    $active,
    theme,
  }: {
    $active: boolean;
    theme: ThemeColors;
  }) => ($active ? theme.text : theme.borderLight)};
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;
const FilterPillText = styled.Text<{ $active: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${({ $active, theme }: { $active: boolean; theme: ThemeColors }) =>
    $active ? theme.background : theme.textSecondary};
`;
const Section = styled.View``;
const SectionTitle = styled.Text`
  font-size: 13px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  margin-bottom: 8px;
`;
const ItemRow = styled.View`
  padding-vertical: 12px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }: { theme: ThemeColors }) => theme.divider};
`;
const ItemHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;
const ItemName = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  flex: 1;
  margin-right: 12px;
`;
const ItemUnitPrice = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
`;
const AllocationsWrapper = styled.View`
  gap: 6px;
`;
const AllocRow = styled.View`
  flex-direction: row;
  gap: 8px;
  align-items: center;
`;
const AllocText = styled.Text`
  font-size: 12px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  font-weight: 500;
`;
const SharedBadge = styled.View`
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.infoLight};
  padding: 4px 8px;
  border-radius: 999px;
`;
const SharedBadgeText = styled.Text`
  font-size: 10px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.infoText};
  text-transform: uppercase;
`;
const EmptyText = styled.Text`
  font-size: 14px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  margin-top: 8px;
`;
const Spacing = styled.View`
  height: 20px;
`;

const Footer = styled.View`
  gap: 12px;
  padding: 12px 24px 24px 24px;
`;

const ActionButtonsRow = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const ManageButton = styled.TouchableOpacity`
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.backgroundElement};
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.border};
  padding: 14px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
`;

const ManageText = styled.Text`
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  font-weight: 800;
  font-size: 15px;
`;

const PrimaryButton = styled.TouchableOpacity`
  flex: 1;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.accent};
  padding: 14px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
`;
const PrimaryText = styled.Text`
  color: #ffffff;
  font-weight: 800;
`;
const DangerButton = styled.TouchableOpacity`
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.cardBackground};
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.danger};
  padding: 14px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
`;
const DangerText = styled.Text`
  color: ${({ theme }: { theme: ThemeColors }) => theme.danger};
  font-weight: 800;
`;
const ModalOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.modalOverlay};
  align-items: center;
  justify-content: center;
  padding: 24px;
`;
const ModalContent = styled.View`
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.backgroundElevated};
  width: 100%;
  max-width: 340px;
  border-radius: 24px;
  padding: 32px;
  align-items: center;
  justify-content: center;
  shadow-color: #000000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.15;
  shadow-radius: 16px;
  elevation: 8;
`;
const ModalTitle = styled.Text`
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  font-size: 18px;
  font-weight: 700;
  text-align: center;
`;
const ModalSubtitle = styled.Text`
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
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.backgroundElement};
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

// 💡 Estilos do novo Modal de Pagamentos
const PaymentToggleRow = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-vertical: 12px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.borderLight};
`;

const PaymentName = styled.Text`
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
`;

const PaymentAmount = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
`;

const StatusPill = styled.View<{ $isPaid: boolean }>`
  border-width: 1.5px;
  border-color: ${({
    $isPaid,
    theme,
  }: {
    $isPaid: boolean;
    theme: ThemeColors;
  }) => ($isPaid ? theme.accent : theme.danger)};
  border-radius: 12px;
  padding-horizontal: 8px;
  padding-vertical: 4px;
  background-color: transparent;
`;

const StatusText = styled.Text<{ $isPaid: boolean }>`
  font-size: 10px;
  font-weight: 900;
  color: ${({ $isPaid, theme }: { $isPaid: boolean; theme: ThemeColors }) =>
    $isPaid ? theme.accent : theme.danger};
  text-transform: uppercase;
`;

const ModalPrimaryButton = styled.TouchableOpacity`
  width: 100%;
  height: 48px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.accent};
  border-radius: 14px;
  align-items: center;
  justify-content: center;
`;
