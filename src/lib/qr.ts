import "server-only";
import QRCode from "qrcode";

/** QR code en SVG (indigo sur blanc, contraste maximal pour les appareils photo d'entrée de gamme). */
export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1B2238", light: "#FFFFFF" },
  });
}
