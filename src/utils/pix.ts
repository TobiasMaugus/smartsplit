export function generatePixBRCode(
  pixKey: string,
  amount: number,
  name: string,
  city: string
): string {
  // Format variables (remove accents and respect max length)
  const formatStr = (str: string, maxLen: number) => {
    let s = str.substring(0, maxLen);
    // Remove diacritics
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

  const payloadFormatIndicator = "000201";
  
  // Merchant Account Information
  const gui = "0014br.gov.bcb.pix";
  const keyField = formatField("01", pixKey);
  const maiContent = gui + keyField;
  const merchantAccountInformation = formatField("26", maiContent);
  
  const merchantCategoryCode = "52040000";
  const transactionCurrency = "5303986";
  const transactionAmount = amount > 0 ? formatField("54", formattedAmount) : "";
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
    "6304"; // CRC field start

  // CRC16-CCITT calculation
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

  return payload + crcHex;
}
