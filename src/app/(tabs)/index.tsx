import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { QrCode, X } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import styled from "styled-components/native";
import { Avatar } from "../../components/Avatar";
import { useAppContext } from "../../context/AppContext";

export default function MainScreen() {
  const { profiles, loadMockData, items, setItems } = useAppContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);

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
      if (msg.type === "ITEMS_FOUND") {
        if (msg.data.length > 0) {
          setItems(msg.data);
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
        Alert.alert(
          "Erro de Leitura",
          "Falha ao ler os produtos: " + msg.message,
        );
        setScannedUrl(null);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Ocorreu um erro ao processar os dados da nota.");
      setScannedUrl(null);
    }
  };

  const INJECTED_JS = `
    setTimeout(() => {
      try {
        const items = [];
        let idCounter = 1;
        
        // Formato atual (MG e outros estados que usam o mesmo sistema)
        const rows = document.querySelectorAll('tr');
        rows.forEach(row => {
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

            // Se for unidade exata (UN, CX, PT) e for um número inteiro, 
            // rateamos a quantidade. Caso contrário (KG, L ou quantidade quebrada), 
            // tratamos como "1 pacote" daquele peso no valor total.
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
        
        // Fallback para formato antigo (txtTit2)
        if (items.length === 0) {
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
        }
        
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ITEMS_FOUND', data: items }));
      } catch(err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: err.toString() }));
      }
    }, 4000); // Aumentado para 4s para garantir que o portal carregue
    true;
  `;

  if (isScanning) {
    return (
      <Container>
        <CameraView
          style={{ flex: 1 }}
          onBarcodeScanned={scannedUrl ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        >
          <CameraOverlay>
            <CloseCameraButton onPress={() => setIsScanning(false)}>
              <X size={24} color="#FFFFFF" />
            </CloseCameraButton>
            <ScanArea />
            <ScanText>Aponte para o QR Code da nota fiscal</ScanText>
          </CameraOverlay>
        </CameraView>
      </Container>
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
            backgroundColor: "rgba(9, 9, 11, 0.7)", // Backdrop escuro moderno (zinc-950 com opacidade)
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          {/* Card do Modal Centralizado */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              width: "100%",
              maxWidth: 340, // Garante que não fique gigante em telas largas
              borderRadius: 24,
              padding: 32,
              alignItems: "center",
              justifyContent: "center",
              // Sombras elegantes para dar profundidade (iOS & Android)
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <ActivityIndicator
              size="large"
              color="#10B981"
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

            {/* Botão de Cancelar Reformulado */}
            <TouchableOpacity
              onPress={() => setScannedUrl(null)}
              style={{
                marginTop: 28,
                width: "100%",
                height: 48, // Tamanho ideal para toque
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

            {/* WebView Invisível de processamento mantido intacto */}
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
        {/* Cabeçalho */}
        <Header>
          <HeaderTextGroup>
            <Title>Nova Compra</Title>
            <Subtitle>
              Automatize a leitura da nota fiscal e divida o valor rapidamente.
            </Subtitle>
          </HeaderTextGroup>
        </Header>

        {/* Área Central (Ações Principais) */}
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

        {/* Rodapé (Perfis Ativos) */}
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

const SecondaryButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-vertical: 16px;
  background-color: #ffffff;
  border-radius: 16px;
  border-width: 1px;
  border-color: #e4e4e7;
  gap: 8px;

  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.03;
  shadow-radius: 4px;
  elevation: 2;
`;

const SecondaryButtonText = styled.Text`
  font-weight: 700;
  font-size: 15px;
  color: #52525b;
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
