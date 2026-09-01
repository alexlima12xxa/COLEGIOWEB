/**
 * Generación de mensajes y enlaces de WhatsApp para leads.
 *
 * El número debe estar en formato internacional sin espacios ni símbolos
 * (ej. +573101234567). Se limpia antes de construir la URL.
 */

export interface WhatsAppMessageData {
  parentName: string;
  phone: string;
  email: string;
  level: string;
  message: string;
  schoolName: string;
}

export function buildWhatsAppMessage(data: WhatsAppMessageData): string {
  const lines = [
    `Hola, soy ${data.parentName}.`,
    `Me interesa información de admisiones para ${data.level} en ${data.schoolName}.`,
  ];

  if (data.message.trim()) {
    lines.push(`Mensaje: ${data.message.trim()}`);
  }

  lines.push(`Email: ${data.email}`);

  if (data.phone.trim()) {
    lines.push(`Teléfono: ${data.phone.trim()}`);
  }

  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
