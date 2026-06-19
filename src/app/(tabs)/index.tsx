import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { QrCode, X, Zap } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import styled from "styled-components/native";
import LogoSvg from "../../assets/Group1.svg";
import LogoSvg2 from "../../assets/Group2.svg";
import { Avatar } from "../../components/Avatar";
import { useAppContext } from "../../context/AppContext";

export default function MainScreen() {
  const { profiles, setItems, setScrapedMarket, setScrapedDate } =
    useAppContext();
  const { setScrapedTime } = useAppContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);

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

      // 🔥 INTERCEPTA OS LOGS DO WEBVIEW E IMPRIME NO TERMINAL DO EXPO
      if (msg.type === "LOG") {
        console.log(`[WebScraping] ${msg.message}`);
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
          setItems(msg.data);

          setScrapedMarket(msg.marketName || "");
          setScrapedDate(msg.dateCompra || "");
          setScrapedTime(msg.horarioCompra || "");

          setScannedUrl(null);
          router.push("/processing");
        } else {
          Alert.alert(
            "Aviso",
            "Nenhum produto encontrado nesta nota fiscal. O formato pode não ser suportado.",
          );
          setScannedUrl(null);
        }
      } else if (msg.type === "ERROR") {
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
    setTimeout(() => {
      // 🔥 Função auxiliar para mandar LOGs para o React Native
      const sendLog = (msg) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', message: msg }));
      };

      try {
        sendLog("Iniciando a varredura do DOM...");
        const items = [];
        let idCounter = 1;
        
        // --- 1. NOME DO MERCADO ---
        sendLog("1. Buscando nome do mercado...");
        let marketName = "";
        const marketEl =
          document.querySelector("th.text-center.text-uppercase h4 b") ||
          document.querySelector("table.table thead th h4 b") ||
          document.querySelector("table.table th b");
        
        if (marketEl) {
          let rawName = marketEl.innerText.trim();
            
            // 🔥 REGRA NOVA: Remove "SUPERMERCADO" ou "SUPERMERCADOS" (gi = ignora maiúsculo/minúsculo)
            // O replace(/\\s+/g, ' ') garante que não vão sobrar espaços duplos se a palavra for cortada do meio
            marketName = rawName
              .replace(/SUPERMERCADOS?/gi, '')
              .replace(/\\s+/g, ' ')
              .trim();
              
            sendLog("   -> Mercado encontrado: " + marketName + " (Original: " + rawName + ")");
        } else {
          sendLog("   -> Aviso: Mercado não encontrado, usará o fallback.");
        }

        // --- 2. DATA / HORÁRIO DA COMPRA ---
        sendLog("2. Buscando a data e horário de emissão...");
        let dateCompra = new Date().toLocaleDateString("pt-BR");
        let horarioCompra = "";
        const htmlContent = document.body.innerHTML;

        // Tenta capturar: 23/05/2026 17:06:01 ou 23/05/2026 17:06
        const dateTimeMatch = htmlContent.match(/(?:Emiss[aã]o|Data)[^0-9]*?(\\d{2}\\/\\d{2}\\/\\d{4})(?:\\s*(\\d{2}:\\d{2}(?::\\d{2})?))?/i);

        if (dateTimeMatch && dateTimeMatch[1]) {
          dateCompra = dateTimeMatch[1];
          if (dateTimeMatch[2]) horarioCompra = dateTimeMatch[2];
          sendLog("   -> Sucesso! Data encontrada (Regex 1): " + dateCompra + (horarioCompra ? " " + horarioCompra : ""));
        } else {
          sendLog("   -> Aviso: Regex principal falhou, tentando Fallback secundário para data/hora...");
          const qualquerDataMatch = htmlContent.match(/(\\d{2}\\/\\d{2}\\/\\d{4})(?:\\s*(\\d{2}:\\d{2}(?::\\d{2})?))?/);
          if (qualquerDataMatch) {
            dateCompra = qualquerDataMatch[1];
            if (qualquerDataMatch[2]) horarioCompra = qualquerDataMatch[2];
            sendLog("   -> Sucesso! Data encontrada (Fallback Secundário): " + dateCompra + (horarioCompra ? " " + horarioCompra : ""));
          } else {
            sendLog("   -> Erro: Nenhuma data encontrada na página. Usará a data de hoje.");
          }
        }

        // --- 3. PRODUTOS DA NOTA ---
        sendLog("3. Buscando os produtos...");
        const rows = document.querySelectorAll('tr');
        sendLog("   -> Total de linhas <tr> na página: " + rows.length);
        
        rows.forEach((row, index) => {
          const text = row.innerText.replace(/\\s+/g, ' ').trim();
          const match = text.match(/(.*?)\\s*\\(C[oó]digo:.*?\\).*?Qtde.*?:\\s*([0-9.,]+)\\s*UN:\\s*([A-Za-z]+).*?(?:Valor|Vl).*?:\\s*R\\$\\s*([0-9.,]+)/i);
          
          if (match) {
            const name = match[1].trim();
            const qtyRaw = parseFloat(match[2].replace(',', '.'));
            const unitMeasure = match[3].toUpperCase();
            const totalPriceRaw = match[4].replace(/\\./g, '').replace(',', '.');
            const totalPrice = parseFloat(totalPriceRaw);
            
            let finalQty = 1;
            let finalUnitPrice = totalPrice;

            if (Number.isInteger(qtyRaw) && qtyRaw > 0 && unitMeasure !== 'KG' && unitMeasure !== 'L') {
              finalQty = qtyRaw;
              finalUnitPrice = totalPrice / qtyRaw;
            }
            
            items.push({
              id: 'item_' + Date.now() + '_' + idCounter++,
              name: name + (unitMeasure === 'KG' ? ' (Peso)' : ''),
              totalUnits: finalQty,
              unitPrice: finalUnitPrice
            });
          }
        });
        sendLog("   -> Produtos encontrados usando Regex Padrão: " + items.length);
        
        // Fallback para formato antigo (txtTit2)
        if (items.length === 0) {
          sendLog("   -> Aviso: Tentando Fallback para notas antigas (.txtTit2)...");
          const nameElements = document.querySelectorAll('.txtTit2');
          nameElements.forEach(nameEl => {
            const name = nameEl.innerText.trim();
            let currentEl = nameEl.closest('tr') || nameEl.parentElement;
            
            let qty = 1;
            let unitPrice = 0;
            
            for (let i = 0; i < 5; i++) {
              currentEl = currentEl.nextElementSibling;
              if (!currentEl) break;
              
              const text = currentEl.innerText || '';
              if (text.includes('Qtde') || text.includes('Vl. Unit')) {
                const qMatch = text.match(/(?:Qtde|Qtd).*?([0-9]+,[0-9]+)/i);
                const pMatch = text.match(/(?:Vl.*?Unit).*?([0-9]+,[0-9]+)/i);
                
                if (qMatch) qty = parseFloat(qMatch[1].replace(',', '.'));
                if (pMatch) unitPrice = parseFloat(pMatch[1].replace(',', '.'));
                break;
              }
            }
            
            if (unitPrice > 0) {
              items.push({
                id: 'item_' + Date.now() + '_' + idCounter++,
                name: name,
                totalUnits: Math.max(1, Math.round(qty)),
                unitPrice: unitPrice
              });
            }
          });
          sendLog("   -> Produtos encontrados usando Fallback Secundário: " + items.length);
        }
        
        // --- LÓGICA DE SALVAMENTO AJUSTADA ---
        // Se houver um horário capturado (ex: "17:06:01"), extrai apenas os 5 primeiros caracteres ("17:06")
        let finalHorario = horarioCompra ? horarioCompra.trim().slice(0, 5) : "";

        sendLog("4. Extração concluída. Enviando dados ao React Native...");
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'ITEMS_FOUND', 
          data: items,
          marketName: marketName,
          dateCompra: dateCompra,
          horarioCompra: finalHorario
        }));
      } catch(err) {
        sendLog("ERRO CRÍTICO: " + err.toString());
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: err.toString() }));
      }
    }, 4000); // 4s para garantir que o portal carregue
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
            {/* 1. BOTÃO DA LANTERNA (Topo Esquerdo) */}
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
                // 🔥 ALTERADO: Quando desligada, o fundo fica mais escuro (0.6) para igualar ao outro botão
                backgroundColor: isTorchOn
                  ? "rgba(255, 255, 255, 0.3)"
                  : "rgba(0, 0, 0, 0.6)",
                zIndex: 10,
              }}
            >
              <Zap size={24} color={isTorchOn ? "#FFCC00" : "#FFFFFF"} />
            </TouchableOpacity>

            {/* 2. BOTÃO DE FECHAR (Topo Direito) */}
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

            {/* Componentes centrais */}
            <ScanArea />
            <ScanText>Aponte para o QR Code da nota fiscal</ScanText>
          </CameraOverlay>
        </CameraView>
      </View>
    );
  }

  return (
    <Container>
      {scannedUrl && (
        <View
          style={{
            position: "absolute",
            zIndex: 100,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(9, 9, 11, 0.7)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              width: "100%",
              maxWidth: 340,
              borderRadius: 24,
              padding: 32,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            {/* Definir uma largura e altura numéricas fixas resolve o bug do espaço fantasma. 
        Ajuste o height abaixo proporcionalmente ao design do seu LogoSvg2 (ex: se for mais horizontal, algo entre 40 e 60 funciona perfeitamente).
      */}
            <LogoSvg2
              width={180}
              height={50}
              style={{
                marginBottom: 24,
              }}
            />

            <ActivityIndicator
              size="large"
              color="#6C63FF"
              style={{ transform: [{ scale: 1.2 }] }}
            />

            <ScanText
              style={{
                color: "#18181B",
                marginTop: 20,
                fontSize: 16,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Processando nota fiscal
            </ScanText>

            <ScanText
              style={{
                color: "#71717A",
                marginTop: 6,
                fontSize: 13,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              Aguarde enquanto extraímos os produtos do cupom...
            </ScanText>

            <TouchableOpacity
              onPress={() => setScannedUrl(null)}
              style={{
                marginTop: 28,
                width: "100%",
                height: 48,
                backgroundColor: "#F4F4F5",
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#E4E4E7",
              }}
              activeOpacity={0.7}
            >
              <ScanText
                style={{ color: "#EF4444", fontSize: 14, fontWeight: "600" }}
              >
                Cancelar Leitura
              </ScanText>
            </TouchableOpacity>

            <View
              style={{ height: 0, width: 0, opacity: 0, position: "absolute" }}
            >
              <WebView
                source={{ uri: scannedUrl }}
                injectedJavaScript={INJECTED_JS}
                onMessage={handleWebViewMessage}
                javaScriptEnabled
              />
            </View>
          </View>
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
          <LogoSvg
            width={34}
            height={34}
            style={{ position: "absolute", right: 4, top: -15 }}
          />
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
          <ProfilesRow>
            {profiles.map((p) => (
              <ProfileBadge key={p.id}>
                <Avatar name={p.name} color={p.color} size="sm" />
                <ProfileName numberOfLines={1}>
                  {p.name.split(" ")[0]}
                </ProfileName>
              </ProfileBadge>
            ))}
          </ProfilesRow>
        </Footer>
      </ScrollContent>
    </Container>
  );
}

// --- Styled Components ---

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #f4f6f9;
`;

const ScrollContent = styled.ScrollView.attrs({
  contentContainerStyle: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
})`
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
  color: #18181b;
  letter-spacing: -0.5px;
  line-height: 38px;
`;

const Subtitle = styled.Text`
  font-size: 15px;
  color: #71717a;
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
  background-color: #ffffff;
  border-radius: 24px;
  padding: 32px 24px;
  align-items: center;
  border-width: 1px;
  border-color: #f4f4f5;

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
  background-color: #10b981;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;

  shadow-color: #10b981;
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
  color: #18181b;
  margin-bottom: 8px;
`;

const CardDescription = styled.Text`
  font-size: 14px;
  color: #a1a1aa;
  text-align: center;
  line-height: 20px;
  font-weight: 500;
`;

const PrimaryButton = styled.TouchableOpacity`
  width: 100%;
  padding-vertical: 18px;
  background-color: #10b981;
  border-radius: 16px;
  align-items: center;
  justify-content: center;

  shadow-color: #10b981;
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
  color: #d4d4d8;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
`;

const ProfilesRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
`;

const ProfileBadge = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const ProfileName = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: #52525b;
  max-width: 80px;
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
