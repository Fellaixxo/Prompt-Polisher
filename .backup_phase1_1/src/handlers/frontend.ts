import { CONFIG } from '../config';

export const HTML_FRONTEND = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prompt Polisher | AI Upgrader</title>
    <!-- FIX: Restored Tailwind Loader -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .no-select { user-select: none; -webkit-user-select: none; }
        .honeypot { position: absolute; left: -9999px; opacity: 0; pointer-events: none; }
        textarea { resize: vertical; }
        /* Custom scrollbar for better UX */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #1f2937; }
        ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #6b7280; }
    </style>
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen flex items-center justify-center p-4 font-sans">
    <div class="max-w-2xl w-full bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 relative transition-all duration-300">
        <div class="flex justify-between items-start mb-6">
            <div>
                <h1 class="text-3xl font-bold text-blue-400 no-select flex items-center gap-2">
                    Prompt Polisher <span class="text-2xl">💎</span>
                </h1>
                <p class="text-gray-400 text-sm mt-1">Turn rough ideas into structured AI prompts instantly.</p>
            </div>
            <span id="trialBadge" class="bg-blue-900/50 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-700/50 font-semibold whitespace-nowrap">Checking...</span>
        </div>

        <input type="text" id="website" name="website" class="honeypot" tabindex="-1" autocomplete="off">
        
        <label class="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Rough Prompt</label>
        <textarea id="roughPrompt" rows="5" maxlength="3000" placeholder="Paste your rough prompt here and click Polish..." 
            class="w-full bg-gray-700 border border-gray-600 rounded-lg p-4 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y text-sm transition-all shadow-inner"></textarea>
        
        <button id="polishBtn" onclick="polishPrompt()" 
            class="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
            <span id="btnText">Polish Prompt ✨</span>
            <!-- FIX: Added missing Spinner Element -->
            <svg id="spinner" class="animate-spin h-5 w-5 text-white hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </button>

        <div id="outputContainer" class="mt-6 hidden animate-fade-in-up">
            <div class="flex justify-between items-center mb-2">
                <h3 class="font-semibold text-green-400 flex items-center gap-2">
                    <span class="text-lg">✅</span> Polished Masterpiece:
                </h3>
                <button onclick="copyToClipboard()" id="copyBtn" class="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded transition-all flex items-center gap-1 border border-gray-600">
                    <span>Copy</span>
                </button>
            </div>
            <textarea id="polishedOutput" rows="12" readonly 
                class="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-green-300 outline-none resize-y text-sm font-mono leading-relaxed shadow-inner"></textarea>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-700/60 flex justify-between items-center gap-4">
            <button onclick="toggleKeyInput()" class="text-xs text-gray-400 hover:text-blue-400 transition-all flex items-center gap-1">
                🔑 Have a License Key?
            </button>
            <a href="${CONFIG.PAYMENT_LINK}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-400 hover:underline flex items-center gap-1">
                Get 3 Months Access ($3.50) ↗
            </a>
        </div>
        
        <div id="keyBox" class="mt-3 hidden">
            <input type="password" id="licenseKey" placeholder="Enter license key..." 
                class="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"></input>
        </div>
    </div>

    <!-- Paywall Modal -->
    <div id="paywallModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 hidden transition-opacity">
        <div class="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-transform scale-95">
            <div class="text-5xl mb-4">💎</div>
            <h2 class="text-2xl font-bold text-white mb-2">Access Limit Reached</h2>
            <p id="paywallMsg" class="text-gray-300 text-sm mb-6 leading-relaxed">Unlock 3 months of access (up to 600 prompts) for just $3.50!</p>
            <a href="${CONFIG.PAYMENT_LINK}" target="_blank" rel="noopener noreferrer" 
                class="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition-all mb-3 shadow-lg shadow-blue-600/30">
                Unlock 3 Months Access ($3.50)
            </a>
            <button onclick="closePaywall()" class="text-xs text-gray-400 hover:text-white underline transition-colors">I have a key / Enter key</button>
        </div>
    </div>

    <script>
        // FIX: All JS is now inline and functional. No external /frontend.js dependency.
        
        let deviceFingerprintCache = null;

        async function computeDeviceFingerprint() {
            if (deviceFingerprintCache) return deviceFingerprintCache;
            
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
            } catch (e) { parts.push('no-canvas'); }

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
            } catch (e) { parts.push('no-webgl'); }

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
            deviceFingerprintCache = 'D-' + Math.abs(hash).toString(36);
            return deviceFingerprintCache;
        }

        function getTextWidth(text, font) {
            const c = document.createElement('canvas');
            const ctx = c.getContext('2d');
            if (!ctx) return 0;
            ctx.font = font;
            return ctx.measureText(text).width;
        }

        function updateTrialBadge(remaining) {
            const badge = document.getElementById('trialBadge');
            if (badge) {
                if (remaining !== undefined) {
                    badge.innerText = remaining + ' Free Prompts Left';
                    badge.className = remaining <= 0 
                        ? 'bg-red-900/50 text-red-300 text-xs px-3 py-1 rounded-full border border-red-700/50 font-semibold'
                        : 'bg-blue-900/50 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-700/50 font-semibold';
                } else {
                    badge.innerText = 'Checking...';
                }
            }
        }

        async function polishPrompt() {
            const btn = document.getElementById('polishBtn');
            const btnText = document.getElementById('btnText');
            const spinner = document.getElementById('spinner');
            const roughPrompt = document.getElementById('roughPrompt').value.trim();
            const licenseKey = document.getElementById('licenseKey').value.trim();
            const honeypot = document.getElementById('website').value;
            const outputContainer = document.getElementById('outputContainer');
            const polishedOutput = document.getElementById('polishedOutput');

            if (honeypot) { console.warn('Honeypot triggered'); return; }
            if (!roughPrompt) { alert('Please enter a prompt.'); return; }

            // UI Loading State
            btn.disabled = true;
            btnText.textContent = 'Polishing...';
            spinner.classList.remove('hidden');
            outputContainer.classList.add('hidden');

            try {
                const deviceHash = await computeDeviceFingerprint();
                
                const response = await fetch('/api/v1/polish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: roughPrompt,
                        licenseKey: licenseKey,
                        deviceHash: deviceHash
                    })
                });

                const data = await response.json();

                if (!response.ok || data.error) {
                    if (response.status === 402 || response.status === 401) {
                        document.getElementById('paywallMsg').textContent = data.error || 'Access limit reached.';
                        document.getElementById('paywallModal').classList.remove('hidden');
                    } else {
                        alert(data.error || 'An unexpected error occurred.');
                    }
                    return;
                }

                // Success
                polishedOutput.value = data.polished;
                outputContainer.classList.remove('hidden');
                
                // Auto-grow textarea slightly based on content length
                polishedOutput.style.height = 'auto';
                polishedOutput.style.height = (polishedOutput.scrollHeight + 20) + 'px';

                if (data.remainingPrompts !== undefined) {
                    updateTrialBadge(data.remainingPrompts);
                }

            } catch (error) {
                console.error(error);
                alert('Network Error: Could not reach server.');
            } finally {
                btn.disabled = false;
                btnText.textContent = 'Polish Prompt ✨';
                spinner.classList.add('hidden');
            }
        }

        async function copyToClipboard() {
            const output = document.getElementById('polishedOutput');
            const btn = document.getElementById('copyBtn');
            const originalText = btn.innerHTML;
            
            try {
                await navigator.clipboard.writeText(output.value);
                btn.innerHTML = '<span>Copied!</span>';
                btn.classList.replace('bg-gray-700', 'bg-green-600');
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.replace('bg-green-600', 'bg-gray-700');
                }, 2000);
            } catch (err) {
                // Fallback
                output.select();
                document.execCommand('copy');
                btn.innerHTML = '<span>Copied!</span>';
                setTimeout(() => { btn.innerHTML = originalText; }, 2000);
            }
        }

        function toggleKeyInput() {
            const keyBox = document.getElementById('keyBox');
            keyBox.classList.toggle('hidden');
        }

        function closePaywall() {
            document.getElementById('paywallModal').classList.add('hidden');
            document.getElementById('keyBox').classList.remove('hidden');
        }

        document.addEventListener("DOMContentLoaded", () => {
            // Initial check handled by server on first polish attempt
            updateTrialBadge(undefined);
        });
    </script>
</body>
</html>`;
