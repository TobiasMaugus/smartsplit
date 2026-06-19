# SmartSplit 🛒💸

O **SmartSplit** é uma aplicação móvel moderna e intuitiva criada para resolver um problema clássico: **dividir a conta do supermercado de forma justa**.

Acabaram-se as dores de cabeça com calculadoras! Com o SmartSplit, podes atribuir itens a pessoas específicas (inteiros ou fracionados) ou dividir itens de uso comum por todos, gerando no final um resumo perfeito com os valores exatos e links diretos para pagamento via PIX.

## ✨ Funcionalidades

- **Divisão Inteligente e Fracionada:** Permite dividir um único item por várias pessoas de forma exata (ex: metade de um bolo para o Tobias, metade para a Maria).
- **Modo Coletivo:** Adiciona itens à lista de "Uso Comum" para dividir o valor por todos os participantes automaticamente.
- **Gestão de Perfis:** Cria perfis temporários ou permanentes com cores personalizadas para facilitar a identificação visual.
- **Integração PIX Completa:** Gera ligações/links diretos de pagamento PIX e QR Codes baseados no valor exato que cada pessoa deve.
- **Partilha Limpa (WhatsApp):** Exporta o resumo da conta com formatação limpa (bullet points `•`) e os links de pagamento diretamente para o WhatsApp ou outros mensageiros.
- **Histórico de Compras:** Guarda o registo das divisões passadas para poderes consultar quem pagou o quê numa data anterior.
- **Suporte a Dark Mode:** Interface totalmente adaptativa (Light/Dark) baseada na preferência do sistema operativo ou escolhida manualmente.

## 🛠️ Tecnologias Utilizadas

A aplicação foi desenvolvida com foco em performance, tipagem estática e componentes reutilizáveis:

- **[React Native](https://reactnative.dev/)** & **[Expo](https://expo.dev/)** (Framework Mobile)
- **[Expo Router](https://docs.expo.dev/router/introduction/)** (Navegação baseada em ficheiros)
- **[TypeScript](https://www.typescriptlang.org/)** (Tipagem forte e segurança no código)
- **[Styled Components](https://styled-components.com/)** (Estilização avançada e gestão dinâmica de temas)
- **[Lucide React Native](https://lucide.dev/)** (Ícones bonitos e consistentes)
- **AsyncStorage** (Persistência de dados locais como histórico e preferências de tema)

## 🚀 Como Executar o Projeto

Segue os passos abaixo para correr a aplicação no teu ambiente local:

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado.
- Aplicação **Expo Go** instalada no teu telemóvel (iOS ou Android) ou um emulador configurado.

### Instalação

1. Clona este repositório:
   ```bash
   git clone [https://github.com/o-teu-utilizador/smartsplit.git](https://github.com/o-teu-utilizador/smartsplit.git)
   ```
