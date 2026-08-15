import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { QrCode, X, Zap } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import styled from "styled-components/native";
import LogoSvg from "../../assets/Group1.svg";
import LogoSvg2Light from "../../assets/Group2.svg";
import LogoSvg2Dark from "../../assets/Group2d.svg";
import { Avatar } from "../../components/Avatar";
import { SettingsModal } from "../../components/SettingsModal";
import { ThemeColors } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";
import { useThemeContext } from "../../context/ThemeContext";

export default function MainScreen() {
  const {
    profiles,
    setItems,
    setScrapedMarket,
    setScrapedDate,
    scrapedTotal,
    setScrapedTotal,
    scrapedPaid,
    setScrapedPaid,
    scrapedDiscount,
    setScrapedDiscount,
  } = useAppContext();
  const { setScrapedTime } = useAppContext();
  const { isDark, colors } = useThemeContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const isCompactProfiles = profiles.length > 5;
  const profileAvatarSize = isCompactProfiles ? "xs" : "sm";

  const LogoSvg2 = isDark ? LogoSvg2Dark : LogoSvg2Light;

  const onScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setIsScanning(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (data.startsWith("http")) {
      setIsScanning(false);
      setScannedUrl(data);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      if (msg.type === "LOG") {
        console.log(`[WebScraping] ${msg.message}`);
        return;
      }

      if (msg.type === "WAITING_FOR_HUMAN") {
        console.log("[WebScraping] Aguardando a verificação humana...");
        return;
      }

      if (msg.type === "ITEMS_FOUND") {
        console.log(
          `[WebScraping] Sucesso! ${msg.data.length} itens encontrados.`,
        );
        console.log(
          `[WebScraping] Mercado: ${msg.marketName} | Data: ${msg.dateCompra} | Hora: ${msg.horarioCompra}`,
        );

        if (msg.data.length > 0) {
          // Inicializa o campo desconto por item
          const itemsWithDiscount = msg.data.map((it: any) => ({
            ...it,
            desconto: 0,
          }));

          setItems(itemsWithDiscount);
          setScrapedMarket(msg.marketName || "");
          setScrapedDate(msg.dateCompra || "");
          setScrapedTime(msg.horarioCompra || "");

          // Valores agregados (se fornecidos pelo injector)
          if (typeof msg.totalCompra === "number") {
            setScrapedTotal(msg.totalCompra);
          } else {
            setScrapedTotal(null);
          }
          if (typeof msg.valorPago === "number") {
            setScrapedPaid(msg.valorPago);
          } else {
            setScrapedPaid(null);
          }

          if (typeof msg.desconto === "number") {
            setScrapedDiscount(msg.desconto);
          } else {
            setScrapedDiscount(null);
          }

          setScannedUrl(null);
          router.push("/processing");
        }
        return;
      }

      if (msg.type === "ERROR") {
        console.error(`[WebScraping] Erro Fatal: ${msg.message}`);
        Alert.alert(
          "Erro de Leitura",
          "Falha ao ler os produtos: " + msg.message,
        );
        setScannedUrl(null);
      }
    } catch (e) {
      console.error("[WebScraping] Erro ao processar mensagem do WebView", e);
      Alert.alert("Erro", "Ocorreu um erro ao processar os dados da nota.");
      setScannedUrl(null);
    }
  };

  const INJECTED_JS = `
    (() => {
      let finished = false;
      let waitingMessageSent = false;
      let attempts = 0;
      const MAX_ATTEMPTS = 300;

      const send = (payload) => {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        } catch (_) {}
      };

      const sendLog = (message) => send({ type: 'LOG', message });

      const normalize = (text) =>
        (text || '').replace(/\\s+/g, ' ').trim();

      const parseBrazilianNumber = (value) => {
        if (value == null) return NaN;
        let s = String(value).trim();
        s = s.replace(/[^0-9.,-]/g, '');
        if (s === '') return NaN;

        if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
          s = s.replace(/\\./g, '').replace(/,/g, '.');
          return parseFloat(s);
        }

        if (s.indexOf(',') !== -1 && s.indexOf('.') === -1) {
          return parseFloat(s.replace(/,/g, '.'));
        }

        return parseFloat(s);
      };

      function extractData() {
        if (finished) return;

        const bodyText = normalize(document.body?.innerText || '');
        if (!bodyText) return;

        const captchaText = /verifique|verificação|verificacao|não sou um robô|nao sou um robo|recaptcha|captcha/i.test(bodyText);
        const productText = /(?:Produtos e Serviços|Produtos e Servi[cç]os|Qtde|Quantidade|Vl\\.? Unit|Valor Unit)/i.test(bodyText);

        if (captchaText && !productText) {
          if (!waitingMessageSent) {
            waitingMessageSent = true;
            send({ type: 'WAITING_FOR_HUMAN' });
            sendLog('Aguardando o usuário concluir a verificação da SEF/MG...');
          }
          return;
        }

        if (!productText) return;

        const items = [];
        let idCounter = 1;

        // --- 1. NOME DO MERCADO ---
        let marketName = '';
        const marketEl =
          document.querySelector('th.text-center.text-uppercase h4 b') ||
          document.querySelector('table.table thead th h4 b') ||
          document.querySelector('table.table th b');

        if (marketEl) {
          const rawName = normalize(marketEl.innerText);
          marketName = rawName
            .replace(/SUPERMERCADOS?/gi, '')
            .replace(/\\s+/g, ' ')
            .trim();
        }

        // --- 2. DATA / HORÁRIO ---
        let dateCompra = new Date().toLocaleDateString('pt-BR');
        let horarioCompra = '';
        const htmlContent = document.body.innerHTML;

        const dateTimeMatch = htmlContent.match(
          /(?:Emiss[aã]o|Data)[^0-9]*?(\\d{2}\\/\\d{2}\\/\\d{4})(?:\\s*(\\d{2}:\\d{2}(?::\\d{2})?))?/i
        );

        if (dateTimeMatch?.[1]) {
          dateCompra = dateTimeMatch[1];
          horarioCompra = dateTimeMatch[2] || '';
        } else {
          const fallbackDate = htmlContent.match(
            /(\\d{2}\\/\\d{2}\\/\\d{4})(?:\\s*(\\d{2}:\\d{2}(?::\\d{2})?))?/
          );
          if (fallbackDate) {
            dateCompra = fallbackDate[1];
            horarioCompra = fallbackDate[2] || '';
          }
        }

        // --- 3. PRODUTOS ---
        const rows = document.querySelectorAll('tr');

        rows.forEach((row) => {
          const text = normalize(row.innerText);

          const match = text.match(
            /(.*?)\\s*\\(C[oó]digo:.*?\\).*?Qtde.*?:\\s*([0-9.,]+)\\s*UN:\\s*([A-Za-z]+).*?(?:Valor|Vl).*?:\\s*R\\$\\s*([0-9.,]+)/i
          );

          if (match) {
            const name = normalize(match[1]);
            const qtyRaw = parseBrazilianNumber(match[2]);
            const unitMeasure = String(match[3]).toUpperCase();
            const totalPrice = parseBrazilianNumber(match[4]);

            if (!name || !Number.isFinite(totalPrice)) return;

            let finalQty = 1;
            let finalUnitPrice = totalPrice;

            if (
              Number.isInteger(qtyRaw) &&
              qtyRaw > 0 &&
              unitMeasure !== 'KG' &&
              unitMeasure !== 'L'
            ) {
              finalQty = qtyRaw;
              finalUnitPrice = totalPrice / qtyRaw;
            }

            items.push({
              id: 'item_' + Date.now() + '_' + idCounter++,
              name: name + (unitMeasure === 'KG' ? ' (Peso)' : ''),
              totalUnits: finalQty,
              unitPrice: finalUnitPrice,
            });
          }
        });

        if (items.length === 0) {
          sendLog('A página da NFC-e foi carregada, mas nenhum produto foi reconhecido.');
          return;
        }

        // --- 4. EXTRAÇÃO PRECISA DOS VALORES ---
        const getValueByExactLabel = (labelRegex) => {
          // Busca elementos curtos (como <strong>) que contenham exatamente o título
          const elements = Array.from(document.querySelectorAll('strong, td, div, span'));
          
          for (const el of elements) {
            const txt = normalize(el.innerText || el.textContent || '');
            
            // Filtra apenas o elemento do rótulo específico (ex: "Valor total R$")
            if (txt.length < 40 && labelRegex.test(txt)) {
              
              // 1. Tenta pegar da div/elemento vizinho (estrutura padrao do Bootstrap col-lg-2)
              let parentCol = el.closest('.col-xs-4, .col-lg-4, td');
              let targetCol = parentCol ? parentCol.nextElementSibling : el.nextElementSibling;

              if (targetCol) {
                const targetText = normalize(targetCol.innerText || targetCol.textContent || '');
                const match = targetText.match(/([0-9]+[.,][0-9]{2})/);
                if (match) return parseBrazilianNumber(match[1]);
              }

              // 2. Tenta pegar do próprio container .row ou <tr>
              const row = el.closest('.row, tr');
              if (row) {
                const rowText = normalize(row.innerText || row.textContent || '');
                const numbers = rowText.match(/([0-9]+[.,][0-9]{2})/g);
                if (numbers && numbers.length > 0) {
                  return parseBrazilianNumber(numbers[numbers.length - 1]);
                }
              }
            }
          }
          return NaN;
        };

        let totalCompra = getValueByExactLabel(/^Valor\\s*total\\s*(?:R\\$)?$/i);
        let valorPago = getValueByExactLabel(/^Valor\\s*pago\\s*(?:R\\$)?$/i);

        // Fallback para total se o rótulo não tiver o R$
        if (!Number.isFinite(totalCompra)) {
          totalCompra = getValueByExactLabel(/Valor\\s*total/i);
        }

        // Fallback se não achar o total na página: soma os itens extraídos
        if (!Number.isFinite(totalCompra) && items.length > 0) {
          totalCompra = items.reduce((acc, item) => acc + (item.unitPrice * item.totalUnits), 0);
          totalCompra = Math.round(totalCompra * 100) / 100;
        }

        // Cálculo exato de desconto
        let desconto = 0;
        if (Number.isFinite(totalCompra) && Number.isFinite(valorPago)) {
          desconto = Math.max(0, Math.round((totalCompra - valorPago) * 100) / 100);
        }

        const finalHorario = horarioCompra ? horarioCompra.trim().slice(0, 5) : "";

        finished = true;
        sendLog('Extração concluída. Enviando dados ao React Native...');
        sendLog('VALORES EXTRAIDOS -> totalCompra: ' + (Number.isFinite(totalCompra) ? totalCompra : 'null') + ', valorPago: ' + (Number.isFinite(valorPago) ? valorPago : 'null') + ', desconto: ' + desconto);
        send({
          type: 'ITEMS_FOUND',
          data: items,
          marketName,
          dateCompra,
          horarioCompra: finalHorario,
          totalCompra: Number.isFinite(totalCompra) ? totalCompra : null,
          valorPago: Number.isFinite(valorPago) ? valorPago : null,
          desconto: desconto || 0,
        });
      }

      sendLog('Monitor de carregamento da NFC-e iniciado.');

      const interval = setInterval(() => {
        if (finished) {
          clearInterval(interval);
          return;
        }

        attempts++;
        extractData();

        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(interval);
          send({
            type: 'ERROR',
            message: 'Tempo limite aguardando a consulta da NFC-e. Se apareceu uma verificação, conclua-a e tente novamente.',
          });
        }
      }, 1000);

      extractData();
      true;
    })();
    true;
  `;

  if (isScanning) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <CameraView
          style={{ flex: 1 }}
          onBarcodeScanned={scannedUrl ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          enableTorch={isTorchOn}
        >
          <CameraOverlay>
            <TouchableOpacity
              onPress={() => setIsTorchOn(!isTorchOn)}
              style={{
                position: "absolute",
                top: 50,
                left: 24,
                width: 44,
                height: 44,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 22,
                backgroundColor: isTorchOn
                  ? "rgba(255, 255, 255, 0.3)"
                  : "rgba(0, 0, 0, 0.6)",
                zIndex: 10,
              }}
            >
              <Zap size={24} color={isTorchOn ? "#FFCC00" : "#FFFFFF"} />
            </TouchableOpacity>

            <CloseCameraButton
              onPress={() => setIsScanning(false)}
              style={{
                position: "absolute",
                top: 50,
                right: 24,
                margin: 0,
                zIndex: 10,
              }}
            >
              <X size={24} color="#FFFFFF" />
            </CloseCameraButton>

            <ScanArea />
            <ScanText>Aponte para o QR Code da nota fiscal</ScanText>
          </CameraOverlay>
        </CameraView>
      </View>
    );
  }

  return (
    /* 🔥 CORREÇÃO: Forçando a SafeAreaView a ignorar a borda 'bottom' */
    <Container edges={["top", "left", "right"]}>
      {scannedUrl && (
        <View
          style={{
            position: "absolute",
            zIndex: 100,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.background,
          }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 10,
                paddingBottom: 12,
                backgroundColor: colors.backgroundElevated,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
              }}
            >
              <ScanText
                style={{
                  color: colors.text,
                  fontSize: 17,
                  fontWeight: "800",
                  textAlign: "center",
                }}
              >
                Consulta da nota fiscal
              </ScanText>

              <ScanText
                style={{
                  color: colors.textSecondary,
                  marginTop: 6,
                  fontSize: 13,
                  fontWeight: "500",
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                Se aparecer uma verificação de segurança, conclua-a manualmente.
                Após a nota carregar, os produtos serão extraídos
                automaticamente.
              </ScanText>
            </View>

            <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
              <WebView
                source={{ uri: scannedUrl }}
                injectedJavaScript={INJECTED_JS}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                sharedCookiesEnabled={true}
                thirdPartyCookiesEnabled={true}
                cacheEnabled={true}
                originWhitelist={["*"]}
                startInLoadingState={true}
                renderLoading={() => (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.background,
                    }}
                  >
                    <ActivityIndicator
                      size="large"
                      color={colors.loadingAnimation}
                    />
                    <ScanText
                      style={{
                        color: colors.text,
                        marginTop: 16,
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      Carregando consulta...
                    </ScanText>
                  </View>
                )}
                onError={(event) => {
                  console.error(
                    "[WebScraping] WebView error",
                    event.nativeEvent,
                  );
                  Alert.alert(
                    "Erro de conexão",
                    "Não foi possível carregar a consulta da SEF/MG. Verifique sua conexão e tente novamente.",
                  );
                }}
                onHttpError={(event) => {
                  console.error(
                    "[WebScraping] HTTP error",
                    event.nativeEvent.statusCode,
                    event.nativeEvent.url,
                  );
                }}
              />
            </View>

            <View
              style={{
                padding: 12,
                backgroundColor: colors.backgroundElevated,
                borderTopWidth: 1,
                borderTopColor: colors.borderLight,
              }}
            >
              <TouchableOpacity
                onPress={() => setScannedUrl(null)}
                style={{
                  height: 46,
                  borderRadius: 13,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.backgroundElement,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
                activeOpacity={0.7}
              >
                <ScanText
                  style={{
                    color: colors.danger,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Cancelar leitura
                </ScanText>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}

      <ScrollContent showsVerticalScrollIndicator={false}>
        <Header style={{ position: "relative" }}>
          <HeaderTextGroup style={{ paddingRight: 48 }}>
            <Title>Nova Compra</Title>
            <Subtitle>
              Automatize a leitura da nota fiscal e divida o valor rapidamente.
            </Subtitle>
          </HeaderTextGroup>
          <Pressable
            onPress={() => setIsSettingsModalVisible(true)}
            style={{ position: "absolute", right: 4, top: -15 }}
          >
            <LogoSvg width={34} height={34} />
          </Pressable>
        </Header>

        <CenterArea>
          <MainCard>
            <IconWrapper>
              <QrCode size={44} color="#FFFFFF" />
            </IconWrapper>

            <CardTextGroup>
              <CardTitle>Ler Nota Fiscal</CardTitle>
              <CardDescription>
                Aponte para o QR Code da nota fiscal eletrônica
              </CardDescription>
            </CardTextGroup>

            <PrimaryButton onPress={onScan} activeOpacity={0.85}>
              <PrimaryButtonText>Ler Nota Fiscal</PrimaryButtonText>
            </PrimaryButton>
          </MainCard>
        </CenterArea>

        <Footer>
          <FooterLabel>Perfis ativos</FooterLabel>
          <ProfilesRow $isCompact={isCompactProfiles}>
            {profiles.map((p) => (
              <ProfileBadge key={p.id}>
                <Avatar
                  name={p.name}
                  color={p.color}
                  size={profileAvatarSize}
                />
                <ProfileName $isCompact={isCompactProfiles} numberOfLines={1}>
                  {p.name.split(" ")[0]}
                </ProfileName>
              </ProfileBadge>
            ))}
          </ProfilesRow>
        </Footer>
        <SettingsModal
          visible={isSettingsModalVisible}
          onRequestClose={() => setIsSettingsModalVisible(false)}
        />
      </ScrollContent>
    </Container>
  );
}

type ProfileNameProps = {
  $isCompact?: boolean;
};

// --- Styled Components ---

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.background};
`;

const ScrollContent = styled.ScrollView.attrs(
  ({ theme }: { theme: ThemeColors }) => ({
    contentContainerStyle: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 16,
    },
  }),
)`
  flex: 1;
`;

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
`;

const HeaderTextGroup = styled.View`
  flex: 1;
  padding-right: 16px;
`;

const Title = styled.Text`
  font-size: 32px;
  font-weight: 900;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  letter-spacing: -0.5px;
  line-height: 38px;
`;

const Subtitle = styled.Text`
  font-size: 15px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  margin-top: 8px;
  font-weight: 500;
  line-height: 22px;
`;

const CenterArea = styled.View`
  flex: 1;
  justify-content: center;
  gap: 16px;
`;

const MainCard = styled.View`
  background-color: ${({ theme }: { theme: ThemeColors }) =>
    theme.cardBackground};
  border-radius: 24px;
  padding: 32px 24px;
  align-items: center;
  border-width: 1px;
  border-color: ${({ theme }: { theme: ThemeColors }) => theme.border};

  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.06;
  shadow-radius: 16px;
  elevation: 4;
`;

const IconWrapper = styled.View`
  width: 88px;
  height: 88px;
  border-radius: 28px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.accent};
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;

  shadow-color: ${({ theme }: { theme: ThemeColors }) => theme.accent};
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 12px;
  elevation: 6;
`;

const CardTextGroup = styled.View`
  align-items: center;
  margin-bottom: 32px;
  padding-horizontal: 16px;
`;

const CardTitle = styled.Text`
  font-size: 20px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.text};
  margin-bottom: 8px;
`;

const CardDescription = styled.Text`
  font-size: 14px;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  text-align: center;
  line-height: 20px;
  font-weight: 500;
`;

const PrimaryButton = styled.TouchableOpacity`
  width: 100%;
  padding-vertical: 18px;
  background-color: ${({ theme }: { theme: ThemeColors }) => theme.accent};
  border-radius: 16px;
  align-items: center;
  justify-content: center;

  shadow-color: ${({ theme }: { theme: ThemeColors }) => theme.accent};
  shadow-offset: 0px 6px;
  shadow-opacity: 0.25;
  shadow-radius: 12px;
  elevation: 5;
`;

const PrimaryButtonText = styled.Text`
  font-weight: 800;
  font-size: 16px;
  color: #ffffff;
  letter-spacing: 0.3px;
`;

const Footer = styled.View`
  margin-top: 48px;
  align-items: center;
`;

const FooterLabel = styled.Text`
  font-size: 11px;
  font-weight: 800;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
`;

type ProfilesRowProps = {
  $isCompact?: boolean;
};

const ProfilesRow = styled.View<ProfilesRowProps>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${(props: ProfilesRowProps) => (props.$isCompact ? "10px" : "20px")};
  flex-wrap: wrap;
`;

const ProfileBadge = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const ProfileName = styled.Text<ProfileNameProps>`
  font-size: ${(props: ProfileNameProps) =>
    props.$isCompact ? "12px" : "14px"};
  font-weight: 700;
  color: ${({ theme }: { theme: ThemeColors }) => theme.textSecondary};
  max-width: ${(props: ProfileNameProps) =>
    props.$isCompact ? "60px" : "80px"};
`;

const CameraOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
`;

const CloseCameraButton = styled.TouchableOpacity`
  position: absolute;
  top: 64px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
`;

const ScanArea = styled.View`
  width: 250px;
  height: 250px;
  border-width: 2px;
  border-color: #10b981;
  background-color: transparent;
  border-radius: 24px;
  margin-bottom: 24px;
`;

const ScanText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
`;
