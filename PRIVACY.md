# Privacy Policy — ZhOrtho Local Chinese & Cantonese Checker

**Last Updated:** 2026-11-25

## Core Privacy Commitment: 100% Local Processing

ZhOrtho is designed from the ground up as a **strictly local, offline-capable Chrome extension**:

1. **Zero Data Collection or Transmission**: Text you type or inspect in web fields, the popup, or the side panel **never leaves your device**. The extension makes **no external HTTP, HTTPS, or WebSocket network requests**.
2. **Enforced by Browser Content Security Policy**: `manifest.json` sets `content_security_policy.extension_pages` to `script-src 'self'; object-src 'self'; connect-src 'self';` and requests **no external `host_permissions`**.
3. **Optional On-Device Gemini Nano AI**: When you opt in to **Use Local Gemini Nano**, contextual checks run exclusively through Chrome's built-in on-device `LanguageModel` API (Gemini Nano). Once Chrome downloads the browser-managed model locally, inference runs entirely on your local GPU/CPU with zero cloud egress.
4. **Local Storage Only**: Your preferences (selected BCP-47 profile, normative standard, ignored words, and paused hostnames) are stored solely in `chrome.storage.local` on your device.
5. **No Analytics, Telemetry, or Tracking**: No cookies, usage beacons, crash reporters, or third-party SDKs are included.
