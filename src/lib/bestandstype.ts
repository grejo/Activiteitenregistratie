// Herkent het echte bestandstype aan de eerste bytes (magic bytes).
// Het MIME-type uit de upload (file.type) komt van de client en is niet te vertrouwen:
// sharp kiest zijn decoder op basis van de inhoud, dus een SVG met label image/png
// zou anders toch bij librsvg terechtkomen.

export type Bestandstype = {
  mime: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf'
  extensie: '.jpg' | '.png' | '.gif' | '.webp' | '.pdf'
  isAfbeelding: boolean
}

function begintMet(buffer: Buffer, bytes: number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) return false
  return bytes.every((byte, i) => buffer[offset + i] === byte)
}

export function herkenBestandstype(buffer: Buffer): Bestandstype | null {
  if (begintMet(buffer, [0xff, 0xd8, 0xff])) {
    return { mime: 'image/jpeg', extensie: '.jpg', isAfbeelding: true }
  }
  if (begintMet(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: 'image/png', extensie: '.png', isAfbeelding: true }
  }
  // GIF87a / GIF89a
  if (begintMet(buffer, [0x47, 0x49, 0x46, 0x38]) && (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61) {
    return { mime: 'image/gif', extensie: '.gif', isAfbeelding: true }
  }
  // RIFF....WEBP
  if (begintMet(buffer, [0x52, 0x49, 0x46, 0x46]) && begintMet(buffer, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { mime: 'image/webp', extensie: '.webp', isAfbeelding: true }
  }
  // %PDF-
  if (begintMet(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return { mime: 'application/pdf', extensie: '.pdf', isAfbeelding: false }
  }
  return null
}
