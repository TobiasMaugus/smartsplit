export function generatePixBRCode(
  pixKey: string,
  amount: number,
  name: string,
  city: string,
): string {
  // 1. Funções Auxiliares de Validação Matemática
  const isValidCPF = (cpf: string): boolean => {
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let calc = (n: number) => {
      let sum = 0;
      for (let i = 0; i < n - 1; i++) sum += parseInt(cpf.charAt(i)) * (n - i);
      let rest = (sum * 10) % 11;
      return rest === 10 || rest === 11 ? 0 : rest;
    };
    // 💡 CORREÇÃO AQUI: Passar 10 e 11 para o cálculo matemático dos dígitos
    return (
      calc(10) === parseInt(cpf.charAt(9)) &&
      calc(11) === parseInt(cpf.charAt(10))
    );
  };

  const isValidCNPJ = (cnpj: string): boolean => {
    if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false;
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado === parseInt(digitos.charAt(1));
  };

  // 2. Detecção e Formatação da Chave
  let finalKey = pixKey.trim();
  const numericKey = finalKey.replace(/\D/g, ""); // Extrai apenas os números para testes

  if (numericKey.length === 11 && isValidCPF(numericKey)) {
    // É CPF (deixa apenas números)
    finalKey = numericKey;
  } else if (numericKey.length === 14 && isValidCNPJ(numericKey)) {
    // É CNPJ (deixa apenas números)
    finalKey = numericKey;
  } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalKey)) {
    // É E-mail (mantém como o usuário digitou)
    finalKey = finalKey;
  } else if (finalKey.length > 14) {
    // É Chave Aleatória (UUID normalmente tem 36 caracteres)
    finalKey = finalKey;
  } else {
    // É Telefone!
    // Se já tem 13 dígitos (55 + DDD + 9 + 8 dígitos) ou 12 dígitos (55 + DDD + 8 dígitos fixo)
    if (numericKey.startsWith("55") && numericKey.length >= 12) {
      finalKey = "+" + numericKey;
    } else {
      // Se tem 11 ou 10 dígitos, com certeza NÃO incluíram o código do país
      finalKey = "+55" + numericKey;
    }
  }

  // 3. Formatação das variáveis do recebedor (remove acentos e respeita limite)
  const formatStr = (str: string, maxLen: number) => {
    let s = str.substring(0, maxLen);
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return s.toUpperCase();
  };

  const formattedName = formatStr(name || "NOME", 25);
  const formattedCity = formatStr(city || "CIDADE", 15);
  const formattedAmount = amount.toFixed(2);

  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, "0");
    return `${id}${len}${value}`;
  };

  // 4. Montagem do Payload
  const payloadFormatIndicator = "000201";

  // Agora usamos a `finalKey` que foi identificada e tratada no passo 2
  const gui = "0014br.gov.bcb.pix";
  const keyField = formatField("01", finalKey);
  const maiContent = gui + keyField;
  const merchantAccountInformation = formatField("26", maiContent);

  const merchantCategoryCode = "52040000";
  const transactionCurrency = "5303986";
  const transactionAmount =
    amount > 0 ? formatField("54", formattedAmount) : "";
  const countryCode = "5802BR";
  const merchantName = formatField("59", formattedName);
  const merchantCity = formatField("60", formattedCity);
  const additionalDataFieldTemplate = "62070503***";

  const payload =
    payloadFormatIndicator +
    merchantAccountInformation +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    merchantName +
    merchantCity +
    additionalDataFieldTemplate +
    "6304"; // Início do campo CRC

  // 5. Cálculo do CRC16-CCITT
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }

  crc = crc & 0xffff;
  const crcHex = crc.toString(16).toUpperCase().padStart(4, "0");

  //console.log(`Copia e Cola gerado: ${payload + crcHex}`);
  return payload + crcHex;
}
