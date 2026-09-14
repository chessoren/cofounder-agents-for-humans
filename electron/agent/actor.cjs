// Escalation brain — woken ONLY when the deterministic matcher can't confidently
// resolve a target. Two tiers of help, both rare:
//   pickElement   : text-only, pick the best element from the live list
//   locateByVision: last resort, strong tiers only (screenshot -> coordinates)
// Both return objects carrying `error`/`unreachable` so the orchestrator can stop
// with a truthful message when Bedrock can't be used.
const { complete, parseJSON } = require('./model.cjs');

// Text-only disambiguation. Returns { index } (-1 if none) plus error info.
async function pickElement(model, target, elements) {
  const list = elements.slice(0, 120)
    .map((e, i) => `${i}: [${String(e.role || '').replace('ControlType.', '').replace(/^AX/, '')}] ${e.name}`)
    .join('\n');
  const res = await complete(
    model,
    'You are Cofounder, operating a Mac. Map an intent to the single best on-screen element from a macOS accessibility list. Reply ONLY JSON: {"index": <number>} (-1 if none fits).',
    `Target: "${target}"\nElements:\n${list}`,
    { json: true, maxTokens: 50 }
  );
  if (!res.ok) return { index: -1, error: res.error, unreachable: !!res.unreachable };
  const o = parseJSON(res.text);
  if (o && Number.isInteger(o.index) && o.index >= -1 && o.index < Math.min(elements.length, 120)) return { index: o.index };
  return { index: -1 };
}

// Width/height from a base64 PNG's IHDR chunk, or null.
function pngSize(b64) {
  try {
    const head = Buffer.from(String(b64 || '').slice(0, 64), 'base64');
    if (head.length < 24 || head.readUInt32BE(12) !== 0x49484452) return null; // 'IHDR'
    const width = head.readUInt32BE(16);
    const height = head.readUInt32BE(20);
    return width && height ? { width, height } : null;
  } catch (_) {
    return null;
  }
}

// Image pixel -> logical screen point (nut.js space). Clamped to the screen.
function scaleToScreen(pt, image, screen) {
  const sx = screen.width / image.width;
  const sy = screen.height / image.height;
  const clamp = (v, max) => Math.max(0, Math.min(max - 1, v));
  return { x: Math.round(clamp(pt.x * sx, screen.width)), y: Math.round(clamp(pt.y * sy, screen.height)) };
}

// Vision fallback (strong tiers only). `screen` = logical screen size in points.
// The model answers in screenshot pixel space (what it actually sees); we convert.
// Returns { point } | { point:null, error?, unreachable? }.
async function locateByVision(model, target, screenshotB64, screen) {
  if (!screenshotB64) return { point: null, error: 'no screenshot' };
  const image = pngSize(screenshotB64) || { width: screen.width, height: screen.height };
  const res = await complete(
    model,
    'You are Cofounder, operating a Mac. You are given a screenshot of the macOS screen. Return the pixel coordinates, in the screenshot image itself, of the center of the requested target. Reply ONLY JSON: {"x":<int>,"y":<int>} or {"x":-1,"y":-1} if it is not visible.',
    `Target: "${target}"\nScreenshot size: ${image.width}x${image.height} pixels. Answer in that pixel space.`,
    { json: true, images: [screenshotB64], maxTokens: 60 }
  );
  if (!res.ok) return { point: null, error: res.error, unreachable: !!res.unreachable };
  const o = parseJSON(res.text);
  if (o && typeof o.x === 'number' && typeof o.y === 'number' && o.x >= 0 && o.y >= 0 && o.x <= image.width && o.y <= image.height) {
    return { point: scaleToScreen(o, image, screen) };
  }
  return { point: null };
}

module.exports = { pickElement, locateByVision, pngSize, scaleToScreen };
