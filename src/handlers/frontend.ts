import { CONFIG } from '../config';

export const HTML_FRONTEND = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prompt Polisher | AI Upgrader</title>
<style>
:root{--bg:#0a0e1a;--card:#111827;--card2:#0d1424;--ink:#e5e7eb;--mut:#9ca3af;--line:#27324a;--brand:#6366f1;--brand2:#22d3ee;--ok:#34d399;--warn:#fbbf24;--bad:#f87171;--r:16px}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:radial-gradient(1200px 600px at 80% -10%,rgba(99,102,241,.25),transparent),radial-gradient(900px 500px at -10% 110%,rgba(34,211,238,.18),transparent),var(--bg);display:flex;align-items:center;justify-content:center;padding:16px}
.card{width:100%;max-width:760px;background:linear-gradient(180deg,rgba(255,255,255,.03),transparent),var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:0 30px 80px rgba(0,0,0,.5);padding:22px}
.head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}
h1{font-size:24px;margin:0;background:linear-gradient(90deg,var(--brand),var(--brand2));-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{color:var(--mut);font-size:13px;margin-top:4px}
.badge{font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:rgba(99,102,241,.12);color:#c7d2fe;white-space:nowrap}
.badge.zero{background:rgba(248,113,113,.14);border-color:rgba(248,113,113,.4);color:#fecaca}
.badge.pro{background:rgba(52,211,153,.14);border-color:rgba(52,211,153,.4);color:#bbf7d0}
label{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);margin:14px 0 6px;font-weight:700}
textarea,input{width:100%;background:var(--card2);border:1px solid var(--line);color:var(--ink);border-radius:12px;padding:14px;font-size:14px;outline:none;transition:border .2s,box-shadow .2s;font-family:inherit}
textarea:focus,input:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(99,102,241,.25)}
textarea{resize:vertical;min-height:120px}
.out{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.55;color:#d1fae5;min-height:160px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:14px;border:none;cursor:pointer;font-weight:700;font-size:15px;padding:14px 16px;border-radius:12px;color:#fff;background:linear-gradient(90deg,var(--brand),#4f46e5);box-shadow:0 10px 30px rgba(79,70,229,.35);transition:transform .08s,filter .2s}
.btn:hover{filter:brightness(1.08)}.btn:active{transform:translateY(1px)}.btn:disabled{opacity:.6;cursor:not-allowed}
.btn.ghost{width:auto;background:transparent;border:1px solid var(--line);color:var(--mut);box-shadow:none;font-size:12px;padding:8px 12px}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-top:14px}
.hidden{display:none!important}
.spin{width:18px;height:18px;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:sp .8s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.sec{margin-top:18px;border:1px solid var(--line);border-radius:12px;background:var(--card2);padding:14px}
.sec h3{margin:0 0 8px;font-size:13px;color:var(--brand2);text-transform:uppercase;letter-spacing:.06em}
.sec.ok h3{color:var(--ok)}.sec.warn h3{color:var(--warn)}.sec.bad h3{color:var(--bad)}
ul{margin:0;padding-left:18px}li{margin:6px 0;font-size:13px;color:var(--ink);line-height:1.5}
.meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.chip{font-size:11px;color:var(--mut);border:1px solid var(--line);border-radius:999px;padding:4px 10px;background:rgba(255,255,255,.02)}
.chip b{color:var(--ink)}
details{margin-top:12px;border:1px solid var(--line);border-radius:12px;background:var(--card2);padding:10px 14px}
summary{cursor:pointer;font-size:13px;font-weight:700;color:#c7d2fe}
details p,details li{color:var(--mut);font-size:13px;line-height:1.6}
.foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}
.foot a,.foot button{color:var(--brand2);text-decoration:none;font-size:12px;background:none;border:none;cursor:pointer}
.foot a:hover{text-decoration:underline}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;z-index:50}
.modal .box{max-width:420px;width:100%;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:26px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.modal .gem{font-size:46px}
.modal h2{margin:8px 0;font-size:20px}
.modal p{color:var(--mut);font-size:14px;margin:0 0 18px;line-height:1.6}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);background:#052e16;color:#bbf7d0;border:1px solid #14532d;padding:10px 16px;border-radius:10px;font-size:13px;opacity:0;transition:.25s;z-index:60;pointer-events:none}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
@media(max-width:520px){.head{flex-direction:column}.card{padding:16px}}
</style>
</head>
<body>
<div class="card">
  <div class="head">
    <div><h1>Prompt Polisher &#128142;</h1><div class="sub">Turn rough ideas into production-grade AI prompts, with a built-in rationale.</div></div>
    <span id="trialBadge" class="badge">Free trial active</span>
  </div>

  <input type="text" id="website" name="website" style="position:absolute;left:-9999px;opacity:0" tabindex="-1" autocomplete="off">

  <label for="roughPrompt">Rough prompt</label>
  <textarea id="roughPrompt" maxlength="3000" placeholder="e.g. help me write a cold email to a SaaS founder about my analytics tool"></textarea>
  <div class="row">
    <button class="btn ghost" onclick="seedExample()">Try an example &#10024;</button>
    <button class="btn ghost" onclick="toggleHow()">How it works &#9432;</button>
  </div>

  <details id="howBox" class="hidden">
    <summary>What is a &ldquo;meta-prompt&rdquo; and why does this help?</summary>
    <p>Prompt Polisher does <b>not</b> answer your question. It writes a precise, structured prompt that <i>another</i> AI (ChatGPT, Claude, etc.) will execute. Each result ships with the anatomy: <b>Role &rarr; Objective &rarr; Context &rarr; Workflow &rarr; Output contract &rarr; Verification</b>, plus a &ldquo;why this works&rdquo; breakdown so you learn the craft while you use it.</p>
    <ul><li>Be specific about the deliverable and audience.</li><li>State constraints and the exact output format.</li><li>Ask for a self-check to reduce hallucination.</li></ul>
  </details>

  <button id="polishBtn" class="btn" onclick="polishPrompt()"><span id="btnText">Polish Prompt &#10024;</span><span id="spinner" class="spin hidden"></span></button>

  <div id="resultWrap" class="hidden">
    <div id="metaBar" class="meta"></div>

    <div id="polishedSec" class="sec ok">
      <div class="row" style="margin-top:0"><h3 style="margin:0">Polished Masterpiece</h3><button class="btn ghost" onclick="copyOut()">Copy</button></div>
      <textarea id="polishedOutput" class="out" readonly></textarea>
    </div>

    <div id="clarifySec" class="sec warn hidden">
      <h3>Clarifying questions</h3>
      <ul id="clarifyList"></ul>
      <label for="answers">Your answers (optional &mdash; improves the result)</label>
      <textarea id="answers" placeholder="Answer any of the questions above, then click Refine."></textarea>
      <button class="btn" onclick="refine()"><span id="refineText">Refine prompt &#128260;</span><span id="refineSpin" class="spin hidden"></span></button>
    </div>

    <div id="unsafeSec" class="sec bad hidden"><h3>Can&rsquo;t polish this</h3><p id="unsafeMsg" style="color:var(--mut);font-size:13px"></p></div>

    <div id="whySec" class="sec"><h3>Why this works</h3><ul id="whyList"></ul></div>
    <div id="assumpSec" class="sec"><h3>Assumptions</h3><ul id="assumpList"></ul></div>
    <div id="upgradeSec" class="sec"><h3>Optional upgrades</h3><ul id="upgradeList"></ul></div>
    <div id="safetySec" class="sec warn"><h3>Safety notes</h3><ul id="safetyList"></ul></div>
  </div>

  <div class="foot">
    <button onclick="toggleKey()">&#128273; Have a license key?</button>
    <a href="${CONFIG.PAYMENT_LINK}" target="_blank" rel="noopener noreferrer">Get 3 months access ($3.50) &#8599;</a>
  </div>
  <div id="keyBox" class="hidden"><input type="password" id="licenseKey" placeholder="Enter license key..."></div>
</div>

<div id="paywallModal" class="modal hidden">
  <div class="box"><div class="gem">&#128142;</div><h2>Access limit reached</h2><p id="paywallMsg">Unlock 3 months (up to 600 prompts) for $3.50.</p>
  <a class="btn" style="text-decoration:none" href="${CONFIG.PAYMENT_LINK}" target="_blank" rel="noopener noreferrer">Unlock 3 Months ($3.50)</a>
  <div class="row" style="justify-content:center"><button class="btn ghost" onclick="closePaywall()">I have a key</button></div></div>
</div>
<div id="toast" class="toast"></div>

<script>
var lastPrompt = '';
var fpCache = null;
function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},2200);}
function esc(s){return (s==null?'':String(s));}
function setList(id,items){var ul=document.getElementById(id);ul.innerHTML='';(items||[]).forEach(function(x){var li=document.createElement('li');li.textContent=x;ul.appendChild(li);});}
function show(id,on){document.getElementById(id).classList.toggle('hidden',!on);}
function toggleKey(){show('keyBox',document.getElementById('keyBox').classList.contains('hidden'));}
function toggleHow(){show('howBox',document.getElementById('howBox').classList.contains('hidden'));}
function closePaywall(){show('paywallModal',false);show('keyBox',true);}
function seedExample(){document.getElementById('roughPrompt').value='I want a 5-tweet thread that explains why small SaaS founders should care about unit economics, in a punchy but credible voice.';toast('Example loaded \\u2014 hit Polish \\u2728');}
function updateBadge(rem,pro){var b=document.getElementById('trialBadge');if(pro){b.className='badge pro';b.textContent='Pro: '+rem+' left \\ud83d\\udc8e';}else if(rem===undefined){b.className='badge';b.textContent='Free trial active';}else{b.className='badge'+(rem<=0?' zero':'');b.textContent=rem+' free left';}}
function getTextWidth(t,f){var c=document.createElement('canvas'),x=c.getContext('2d');if(!x)return 0;x.font=f;return x.measureText(t).width;}
function computeFp(){if(fpCache)return Promise.resolve(fpCache);var p=[];try{var c=document.createElement('canvas'),x=c.getContext('2d');if(x){x.textBaseline='alphabetic';x.fillStyle='#f60';x.fillRect(2,2,40,20);x.fillStyle='#069';x.font='16px "Courier New"';x.fillText('PromptPolisher v2',4,18);p.push(c.toDataURL('image/png'));}}catch(e){p.push('nc');}try{var g=document.createElement('canvas'),gl=g.getContext('webgl');if(gl){var d=gl.getExtension('WEBGL_debug_renderer_info');if(d){p.push(gl.getParameter(d.UNMASKED_VENDOR_WEBGL));p.push(gl.getParameter(d.UNMASKED_RENDERER_WEBGL));}}}catch(e){p.push('nw');}p.push(navigator.hardwareConcurrency||'u');p.push(navigator.language||'u');p.push(new Date().getTimezoneOffset());p.push(screen.width+'x'+screen.height);p.push(window.devicePixelRatio||1);var raw=p.join('||'),h=0;for(var i=0;i<raw.length;i++){h=((h<<5)-h)+raw.charCodeAt(i);h|=0;}fpCache='D-'+Math.abs(h).toString(36);return Promise.resolve(fpCache);}
function copyOut(){var v=document.getElementById('polishedOutput').value;if(!v)return;var done=function(){toast('Copied to clipboard \\u2705');};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(v).then(done).catch(function(){var t=document.getElementById('polishedOutput');t.select();document.execCommand('copy');done();});}else{var t=document.getElementById('polishedOutput');t.select();document.execCommand('copy');done();}}
function render(d){
  show('resultWrap',true);
  var mb=document.getElementById('metaBar');mb.innerHTML='';
  function chip(k,v){var s=document.createElement('span');s.className='chip';s.innerHTML='<b>'+k+':</b> '+esc(v);mb.appendChild(s);}
  if(d.detected_domain)chip('domain',d.detected_domain);
  if(d.task_type)chip('task',d.task_type);
  if(typeof d.confidence==='number')chip('confidence',Math.round(d.confidence*100)+'%');
  if(d.metadata&&d.metadata.model)chip('model',d.metadata.model.split('/').pop());
  var st=d.status||'polished';
  show('polishedSec',!!d.polished_prompt);document.getElementById('polishedOutput').value=d.polished_prompt||'';
  show('clarifySec',st==='needs_clarification'&&(d.clarifying_questions||[]).length>0);setList('clarifyList',d.clarifying_questions);
  show('unsafeSec',st==='unsafe_or_unsupported');document.getElementById('unsafeMsg').textContent=st==='unsafe_or_unsupported'?'This request can\\u2019t be safely polished. Try reframing it within safety and professional boundaries.':'';
  show('whySec',(d.why_this_works||[]).length>0);setList('whyList',d.why_this_works);
  show('assumpSec',(d.assumptions||[]).length>0);setList('assumpList',d.assumptions);
  show('upgradeSec',(d.optional_upgrades||[]).length>0);setList('upgradeList',d.optional_upgrades);
  show('safetySec',(d.safety_notes||[]).length>0);setList('safetyList',d.safety_notes);
  if(d.remainingPrompts!==undefined)updateBadge(d.remainingPrompts,!!document.getElementById('licenseKey').value.trim());
  var el=document.getElementById('polishedOutput');el.style.height='auto';el.style.height=Math.min(600,el.scrollHeight+20)+'px';
}
function callApi(prompt,context,btnId,spinId,textId){
  var btn=document.getElementById(btnId);btn.disabled=true;document.getElementById(spinId).classList.remove('hidden');document.getElementById(textId).textContent='Polishing...';
  return computeFp().then(function(fp){
    return fetch('/api/v1/polish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:prompt,licenseKey:document.getElementById('licenseKey').value.trim(),deviceHash:fp,context:context||''})});
  }).then(function(r){return r.json().then(function(j){return {ok:r.ok,status:r.status,data:j};});})
   .then(function(res){
     if(!res.ok||res.data.error){
       if(res.status===402||res.status===401){document.getElementById('paywallMsg').textContent=res.data.error||'Access limit reached.';show('paywallModal',true);}
       else toast(res.data.error||'Something went wrong.');
       return;
     }
     render(res.data);
   })
   .catch(function(e){toast('Network error: '+e);})
   .finally(function(){btn.disabled=false;document.getElementById(spinId).classList.add('hidden');document.getElementById(textId).textContent=(btnId==='polishBtn'?'Polish Prompt \\u2728':'Refine prompt \\ud83d\\udd01');});
}
function polishPrompt(){var p=document.getElementById('roughPrompt').value.trim();if(document.getElementById('website').value)return;if(!p){toast('Enter a prompt first.');return;}lastPrompt=p;callApi(p,'','polishBtn','spinner','btnText');}
function refine(){var a=document.getElementById('answers').value.trim();callApi(lastPrompt,a,'','refineSpin','refineText');}
document.addEventListener('DOMContentLoaded',function(){updateBadge(undefined);});
</script>
</body>
</html>`;
