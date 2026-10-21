// Images de remplacement pour les documents de démonstration : aucune vraie pièce, aucune vraie photo.

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function fakeDocumentSvg(title: string, person: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <rect width="640" height="400" fill="#F2EADC"/>
  <rect x="16" y="16" width="608" height="368" fill="none" stroke="#8A8172" stroke-width="2" stroke-dasharray="10 8"/>
  <text x="40" y="70" font-family="sans-serif" font-size="22" font-weight="700" fill="#273150">${escapeXml(title)}</text>
  <text x="40" y="104" font-family="sans-serif" font-size="18" fill="#5A554B">${escapeXml(person)}</text>
  <rect x="40" y="140" width="150" height="190" fill="#E4DAC8"/>
  <g fill="#C9BBA2"><rect x="220" y="150" width="340" height="16"/><rect x="220" y="186" width="280" height="16"/><rect x="220" y="222" width="310" height="16"/><rect x="220" y="258" width="200" height="16"/></g>
  <text x="320" y="230" transform="rotate(-18 320 230)" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#9B1C31" fill-opacity="0.55">DOCUMENT FICTIF</text>
  <text x="40" y="364" font-family="sans-serif" font-size="14" fill="#5A554B">Démonstration Dorwar — aucune donnée réelle</text>
</svg>`;
}

export function fakePortraitSvg(initials: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
  <rect width="400" height="500" fill="#E2EDE3"/>
  <circle cx="200" cy="190" r="80" fill="#B7CDB9"/>
  <path d="M60 470c20-110 80-160 140-160s120 50 140 160z" fill="#B7CDB9"/>
  <text x="200" y="215" text-anchor="middle" font-family="serif" font-size="72" fill="#273150">${escapeXml(initials)}</text>
  <text x="200" y="40" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="#9B1C31">PHOTO FICTIVE</text>
</svg>`;
}
