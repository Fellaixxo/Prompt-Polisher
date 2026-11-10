import { CONFIG } from '../config';

export const HTML_FRONTEND = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prompt Polisher | AI Upgrader</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .no-select { user-select: none; -webkit-user-select: none; }
        .honeypot { position: absolute; left: -9999px; opacity: 0; pointer-events: none; }
    </style>
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-2xl w-full bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 relative">
        <div class="flex justify-between items-start mb-4">
            <div>
                <h1 class="text-3xl font-bold text-blue-400 no-select">Prompt Polisher 💎</h1>
                <p class="text-gray-400 text-sm mt-1">Turn rough ideas into structured AI prompts instantly.</p>
            </div>
            <span id="trialBadge" class="bg-blue-900/50 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-700/50 font-semibold">Checking...</span>
        </div>
        <input type="text" id="website" name="website" class="honeypot" tabindex="-1" autocomplete="off">
        <label class="block text-xs text-gray-400 mb-1 font-semibold uppercase">Rough Prompt</label>
        <textarea id="roughPrompt" rows="5" maxlength="3000" placeholder="Paste your rough prompt here and click Polish..."
            class="w-full bg-gray-700 border border-gray-600 rounded-lg p-4 mb-4 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"></textarea>
        <button id="polishBtn" onclick="polishPrompt()"
            class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition-all flex justify-center items-center shadow-lg shadow-blue-600/20">
            <span id="btnText">Polish Prompt ✨</span>
        </button>
        <div id="outputContainer" class="mt-6 hidden">
            <div class="flex justify-between items-center mb-2">
                <h3 class="font-semibold text-green-400">Polished Masterpiece:</h3>
                <button onclick="copyToClipboard()" class="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-all">Copy</button>
            </div>
            <textarea id="polishedOutput" rows="10" readonly
                class="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-green-300 outline-none resize-none text-sm font-mono"></textarea>
        </div>
        <div class="mt-6 pt-4 border-t border-gray-700/60 flex justify-between items-center">
            <button onclick="toggleKeyInput()" class="text-xs text-gray-400 hover:text-blue-400 transition-all flex items-center gap-1">
                🔑 Have a License Key?
            </button>
            <a href="${CONFIG.PAYMENT_LINK}" target="_blank" class="text-xs text-blue-400 hover:underline">
                Get 3 Months Access ($3.50) ↗
            </a>
        </div>
        <div id="keyBox" class="mt-3 hidden">
            <input type="password" id="licenseKey" placeholder="Enter license key..."
                class="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
    </div>
    <div id="paywallModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div class="text-4xl mb-3">💎</div>
            <h2 class="text-xl font-bold text-white mb-2">Access Limit Reached</h2>
            <p id="paywallMsg" class="text-gray-300 text-sm mb-6">Unlock 3 months of access (up to 600 prompts) for just $3.50!</p>
            <a href="${CONFIG.PAYMENT_LINK}" target="_blank"
                class="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition-all mb-3 shadow-lg shadow-blue-600/30">
                Unlock 3 Months Access ($3.50)
            </a>
            <button onclick="closePaywall()" class="text-xs text-gray-400 hover:text-white underline">I have a key / Enter key</button>
        </div>
    </div>
    <script>
        let deviceFingerprint = '';

        async function computeDeviceFingerprint() {
            const parts = [];

            try {
                const c = document.createElement('canvas');
                const ctx = c.getContext('2d');
                if (ctx) {
                    ctx.textBaseline = 'alphabetic';
                    ctx.fillStyle = '#f60';
                    ctx.fillRect(2, 2, 40, 20);
                    ctx.fillStyle = '#069';
                    ctx.font = '16px "Courier New"';
                    ctx.fillText('PromptPolisher v2', 4, 18);
                    ctx.fillStyle = 'rgba(100, 200, 0, 0.5)';
                    ctx.fillText('\\u272F', 2, 12);
                    parts.push(c.toDataURL('image/png'));
                }
            } catch (e) {
                parts.push('no-canvas');
            }

            try {
                const c = document.createElement('canvas');
                const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
                if (gl) {
                    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
                    if (dbg) {
                        parts.push(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL));
                        parts.push(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL));
                    }
                }
            } catch (e) {
                parts.push('no-webgl');
            }

            parts.push(navigator.hardwareConcurrency || 'unknown');
            parts.push(navigator.deviceMemory || 'unknown');
            parts.push(navigator.platform || 'unknown');
            parts.push(navigator.language || 'unknown');
            parts.push(new Date().getTimezoneOffset());
            parts.push(screen.width + 'x' + screen.height + 'x' + screen.colorDepth);
            parts.push(window.devicePixelRatio || 1);
            parts.push('ontouchstart' in window ? 'touch' : 'no-touch');

            const testFonts = ['Courier New', 'Georgia', 'Times New Roman', 'Arial', 'Verdana', 'Helvetica'];
            const baseFonts = ['monospace', 'sans-serif', 'serif'];
            const testString = 'mmmmmmmmmmlil';
            const defaultWidths = baseFonts.map(f => getTextWidth(testString, '12px ' + f));
            const detected = [];

            for (const font of testFonts) {
                const matched = baseFonts.some((base, i) =>
                    getTextWidth(testString, '12px "' + font + '", ' + base) !== defaultWidths[i]
                );
                if (matched) detected.push(font);
            }

            parts.push(detected.join(','));
            const raw = parts.join('||');

            let hash = 0;
            for (let i = 0; i < raw.length; i++) {
                const ch = raw.charCodeAt(i);
                hash = ((hash << 5) - hash) + ch;
                hash |= 0;
            }

            return 'D-' + Math.abs(hash).toString(36);
        }

        function getTextWidth(text, font) {
            const c = document.createElement('canvas');
            const ctx = c.getContext('2d');
            if (!ctx) return 0;
            ctx.font = font;
            return ctx.measureText(text).width;
        }

        async function initFingerprint() {
            deviceFingerprint = await computeDeviceFingerprint();
        }

        function getSessionToken() {
            let tok = sessionStorage.getItem('pp_session');
            if (!tok) {
                tok = 'S-' + Math.random().toString(36).substring(2, 10);
                sessionStorage.setItem('pp_session', tok);
            }
            return tok;
        }

        function updateTrialBadge() {
            const used = parseInt(localStorage.getItem('prompt_usage_count') || '0', 10);
            const remaining = Math.max(0, 2 - used);
            const badge = document.getElementById('trialBadge');

            if (localStorage.getItem('pro_unlocked') === 'true') {
                const proRem = localStorage.getItem('pro_remaining') || '600';
                badge.innerText = 'Pro: ' + proRem + ' Left 💎';
                badge.className = 'bg-green-900/50 text-green-300 text-xs px-3 py-1 rounded-full border border-green-700/50 font-semibold';
            } else {
                badge.innerText = remaining + ' Free Prompts Left';
                if (remaining === 0) {
                    badge.className = 'bg-red-900/50 text-red-300 text-xs px-3 py-1 rounded-full border border-red-700/50 font-semibold';
                }
            }
        }

        async function polishPrompt() {
            const roughPrompt = document.getElementById('roughPrompt').value.trim();
            const licenseKey = document.getElementById('licenseKey').value.trim();
            const honeypot = document.getElementById('website').value;

            if (honeypot) { console.warn('Honeypot triggered'); return; }

            const btnText = document.getElementById('btnText');
            const spinner = document.getElementById('spinner');
            const outputContainer = document.getElementById('outputContainer');
            const polishedOutput = document.getElementById('polishedOutput');

            btnText.textContent = 'Polishing...';
            spinner.classList.remove('hidden');

            try {
                const response = await fetch('/api/v1/polish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: roughPrompt,
                        licenseKey: licenseKey,
                        deviceHash: deviceFingerprint
                    })
                });

                const data = await response.json();

                if (data.error) {
                    if (data.error.includes('Free trial limit') || data.error.includes('License')) {
                        document.getElementById('paywallMsg').textContent = data.error;
                        document.getElementById('paywallModal').classList.remove('hidden');
                    } else {
                        alert(data.error);
                    }
                    return;
                }

                polishedOutput.value = data.polished;
                outputContainer.classList.remove('hidden');

                if (!licenseKey) {
                    const used = parseInt(localStorage.getItem('prompt_usage_count') || '0', 10);
                    localStorage.setItem('prompt_usage_count', (used + 1).toString());
                    updateTrialBadge();
                }

            } catch (error) {
                alert('Error: ' + error);
            } finally {
                btnText.textContent = 'Polish Prompt ✨';
                spinner.classList.add('hidden');
            }
        }

        function copyToClipboard() {
            const output = document.getElementById('polishedOutput');
            output.select();
            document.execCommand('copy');
            alert('Copied to clipboard!');
        }

        function toggleKeyInput() {
            const keyBox = document.getElementById('keyBox');
            keyBox.classList.toggle('hidden');
        }

        function closePaywall() {
            document.getElementById('paywallModal').classList.add('hidden');
        }

        document.addEventListener("DOMContentLoaded", async () => {
            await initFingerprint();
            updateTrialBadge();
        });
    </script>
</body>
</html>
`;
