# Eksido Simple Web Agent

Standalone chat API + widget snippet. Built as a single, independent service.

## One-click Heroku deploy

1) Confirm `app.json` uses your GitHub repo URL.
2) Commit and push to GitHub.
3) Click the button:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/eksido/SimpleWebAgent)

## Install (local)
Prerequisites:
- Node.js 18+
- npm

1) Install dependencies:

```bash
npm install
```

2) Create environment file:

```bash
cp .env.example .env
```

3) Fill in required env vars in `.env` (see below).

4) Start the server:

```bash
npm start
```

5) Verify health:

```bash
curl http://localhost:3000/health
```

## GitHub (public repo) setup
1) Create a new public repo in GitHub.
2) Update `app.json` with your repo URL.
3) Push code:

```bash
git init
git add .
git commit -m "Initial Eksido Simple Web Agent"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_ORG>/<YOUR_REPO>.git
git push -u origin main
```
4) Update the Heroku button link in this README to:

```
https://heroku.com/deploy?template=https://github.com/<YOUR_GITHUB_ORG>/<YOUR_REPO>
```

## Indexing script
1) Put content files in `content/` (.md, .txt, .pdf only).
2) Run:

```bash
npm run index:content
```

3) Copy the printed `VECTOR_STORE_ID` into `.env` as `VECTOR_STORE_ID_SITE_1`.

## Heroku deploy
1) Create app:

```bash
heroku create <YOUR_APP_NAME>
```

2) Set config vars (required):

```bash
heroku config:set OPENAI_API_KEY=sk-... \
  OPENAI_MODEL=gpt-5-mini \
  VECTOR_STORE_ID_SITE_1=vs_... \
  ALLOWED_ORIGINS=https://your-site.com,https://www.your-site.com
```

Optional (token protection):

```bash
heroku config:set REQUIRE_TOKEN=true CONCIERGE_TOKEN_SITE_1=your-token
```

3) Deploy:

```bash
git push heroku main
```

4) Health check:

```bash
curl https://<YOUR_APP_NAME>.herokuapp.com/health
```

## Required env vars
- `OPENAI_API_KEY`
- `VECTOR_STORE_ID_SITE_1`
- `ALLOWED_ORIGINS`

Optional:
- `OPENAI_MODEL` (default `gpt-5-mini`)
- `REQUIRE_TOKEN` (`true` or `false`)
- `CONCIERGE_TOKEN_SITE_1` (required if `REQUIRE_TOKEN=true`)
- `PORT` (Heroku sets this automatically)

## GTM install and verify
1) In Google Tag Manager, add a **Custom HTML** tag.
2) Paste the snippet below and set the trigger to **All Pages**.
3) Replace `<HEROKU_APP>` with your Heroku app name.
4) (Optional) If `REQUIRE_TOKEN=true`, add a request header in the snippet (see note below).
5) Publish the container.

Verify:
- Visit your site and click **Chat with Eksido**.
- Send a message and confirm the `/chat?site=eksidocom` request returns `200`.

### GTM chat widget snippet
```html
<script>
(function () {
  if (window.EksidoChatWidgetLoaded) return;
  window.EksidoChatWidgetLoaded = true;
  if (document.getElementById("eksido-chat-widget")) return;

  var apiBase = "https://<HEROKU_APP>.herokuapp.com";
  var siteParam = "eksidocom";

  // --- Config ---
  var BRAND_NAME = "Eksido";
  var TITLE = "Eksido Concierge";
  var GREETING = "Hi! I'm the Eksido Concierge. Ask me about services, Culture360, pricing, or how to contact us.";
  var STORAGE_KEY = "eksido_chat_history_v1";

  // --- Styles ---
  var style = document.createElement("style");
  style.textContent = "\
:root{--eksido-navy:#0b4d7a;--eksido-ink:#0b1220;--eksido-bg:#f6f8fb;--eksido-card:#ffffff;--eksido-border:#e6edf5;--eksido-muted:#6b7280;}\
#eksido-chat-widget{position:fixed;right:18px;bottom:18px;z-index:999999;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;letter-spacing:.1px}\
#eksido-launcher{display:flex;align-items:center;gap:10px;border:none;border-radius:999px;padding:12px 14px;background:var(--eksido-navy);color:#fff;cursor:pointer;\
box-shadow:0 18px 45px rgba(11,77,122,.28),0 2px 8px rgba(0,0,0,.12);transition:transform .15s ease, box-shadow .15s ease;position:relative}\
#eksido-launcher:hover{transform:translateY(-1px);box-shadow:0 22px 55px rgba(11,77,122,.32),0 2px 10px rgba(0,0,0,.14)}\
#eksido-launcher:active{transform:translateY(0)}\
#eksido-launcher .dot{width:10px;height:10px;border-radius:999px;background:#7dd3fc;box-shadow:0 0 0 6px rgba(125,211,252,.18)}\
#eksido-launcher .label{font-weight:700;font-size:14px;line-height:1}\
#eksido-launcher .sub{font-size:12px;opacity:.9;line-height:1.1}\
#eksido-badge{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 6px;border-radius:999px;background:#ef4444;color:#fff;font-size:12px;font-weight:700;\
display:none;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(0,0,0,.2)}\
#eksido-panel{width:380px;max-width:calc(100vw - 36px);height:540px;max-height:calc(100vh - 120px);\
background:var(--eksido-card);border:1px solid var(--eksido-border);border-radius:18px;overflow:hidden;\
box-shadow:0 30px 90px rgba(2,6,23,.25),0 10px 30px rgba(2,6,23,.12);\
display:none;flex-direction:column;transform-origin:bottom right;animation:eksidoIn .18s ease-out}\
@keyframes eksidoIn{from{transform:scale(.98) translateY(6px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}\
#eksido-panel.open{display:flex}\
#eksido-header{background:linear-gradient(135deg, #0b4d7a 0%, #083b5f 100%);color:#fff;padding:12px 14px;display:flex;align-items:center;justify-content:space-between}\
#eksido-header .left{display:flex;align-items:center;gap:10px}\
#eksido-avatar{width:34px;height:34px;border-radius:12px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center}\
#eksido-avatar svg{opacity:.95}\
#eksido-title{display:flex;flex-direction:column;gap:2px}\
#eksido-title .h1{font-weight:800;font-size:14px;line-height:1.1}\
#eksido-title .h2{font-size:12px;opacity:.9;line-height:1.1;display:flex;align-items:center;gap:6px}\
#eksido-statusDot{width:7px;height:7px;border-radius:999px;background:#34d399;box-shadow:0 0 0 5px rgba(52,211,153,.15)}\
#eksido-actions{display:flex;align-items:center;gap:8px}\
.eksido-iconbtn{width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;cursor:pointer}\
.eksido-iconbtn:hover{background:rgba(255,255,255,.12)}\
#eksido-body{flex:1;background:var(--eksido-bg);padding:12px;overflow:auto}\
.eksido-row{display:flex;margin:10px 0}\
.eksido-row.user{justify-content:flex-end}\
.eksido-row.assistant{justify-content:flex-start}\
.eksido-bubble{max-width:85%;padding:10px 12px;border-radius:14px;border:1px solid transparent;font-size:14px;line-height:1.35;white-space:pre-wrap;word-wrap:break-word}\
.eksido-row.user .eksido-bubble{background:var(--eksido-navy);color:#fff;border-bottom-right-radius:6px}\
.eksido-row.assistant .eksido-bubble{background:#fff;color:var(--eksido-ink);border-color:#e5e7eb;border-bottom-left-radius:6px}\
.eksido-meta{margin-top:6px;font-size:11px;color:var(--eksido-muted);display:flex;gap:8px;align-items:center}\
.eksido-row.user .eksido-meta{justify-content:flex-end}\
#eksido-footer{border-top:1px solid var(--eksido-border);background:#fff;padding:10px 10px 12px}\
#eksido-hint{font-size:12px;color:var(--eksido-muted);padding:0 2px 8px}\
#eksido-form{display:flex;gap:8px;align-items:flex-end}\
#eksido-input{flex:1;min-height:44px;max-height:120px;resize:none;padding:10px 12px;border:1px solid #d7e1ec;border-radius:14px;font-size:14px;line-height:1.25;outline:none}\
#eksido-input:focus{border-color:#9cc7e5;box-shadow:0 0 0 4px rgba(156,199,229,.25)}\
#eksido-send{height:44px;padding:0 14px;border:none;border-radius:14px;background:var(--eksido-navy);color:#fff;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px}\
#eksido-send:disabled{opacity:.6;cursor:default}\
#eksido-send svg{opacity:.95}\
.eksido-thinking{display:inline-flex;gap:5px;align-items:center}\
.eksido-thinking span{width:7px;height:7px;border-radius:999px;background:#9ca3af;display:inline-block;animation:eksidoDot 1.2s infinite ease-in-out}\
.eksido-thinking span:nth-child(2){animation-delay:.15s}\
.eksido-thinking span:nth-child(3){animation-delay:.3s}\
@keyframes eksidoDot{0%,80%,100%{transform:translateY(0);opacity:.45}40%{transform:translateY(-3px);opacity:1}}\
@media (max-width:480px){#eksido-chat-widget{right:10px;bottom:10px}#eksido-panel{width:92vw;height:72vh}}\
";
  document.head.appendChild(style);

  // --- DOM ---
  var wrapper = document.createElement("div");
  wrapper.id = "eksido-chat-widget";
  wrapper.innerHTML =
    '\
<button id="eksido-launcher" type="button" aria-label="Open chat">\
  <span class="dot" aria-hidden="true"></span>\
  <span style="display:flex;flex-direction:column;align-items:flex-start;gap:2px">\
    <span class="label">Chat with ' + BRAND_NAME + '</span>\
    <span class="sub">Ask about services & pricing</span>\
  </span>\
  <span id="eksido-badge">1</span>\
</button>\
<div id="eksido-panel" role="dialog" aria-label="' + TITLE + '">\
  <div id="eksido-header">\
    <div class="left">\
      <div id="eksido-avatar" aria-hidden="true">\
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">\
          <path d="M12 2a7 7 0 0 1 7 7c0 2.2-1 4.1-2.6 5.4A9.5 9.5 0 0 1 21 22H3a9.5 9.5 0 0 1 4.6-7.6A6.96 6.96 0 0 1 5 9a7 7 0 0 1 7-7Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\
        </svg>\
      </div>\
      <div id="eksido-title">\
        <div class="h1">' + TITLE + '</div>\
        <div class="h2"><span id="eksido-statusDot"></span><span id="eksido-statusText">Online</span></div>\
      </div>\
    </div>\
    <div id="eksido-actions">\
      <button class="eksido-iconbtn" id="eksido-clear" type="button" aria-label="Clear chat">\
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">\
          <path d="M3 6h18M8 6V4h8v2M6 6l1 16h10l1-16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\
        </svg>\
      </button>\
      <button class="eksido-iconbtn" id="eksido-close" type="button" aria-label="Close">\
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">\
          <path d="M18 6 6 18M6 6l12 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\
        </svg>\
      </button>\
    </div>\
  </div>\
  <div id="eksido-body"></div>\
  <div id="eksido-footer">\
    <div id="eksido-hint">Tip: Press <b>Enter</b> to send, <b>Shift+Enter</b> for a new line.</div>\
    <form id="eksido-form">\
      <textarea id="eksido-input" rows="1" placeholder="Type your message..."></textarea>\
      <button id="eksido-send" type="submit">\
        <span>Send</span>\
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">\
          <path d="M22 2 11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\
          <path d="M22 2 15 22l-4-9-9-4 20-7Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\
        </svg>\
      </button>\
    </form>\
  </div>\
</div>';
  document.body.appendChild(wrapper);

  var launcher = wrapper.querySelector("#eksido-launcher");
  var badge = wrapper.querySelector("#eksido-badge");
  var panel = wrapper.querySelector("#eksido-panel");
  var closeBtn = wrapper.querySelector("#eksido-close");
  var clearBtn = wrapper.querySelector("#eksido-clear");
  var body = wrapper.querySelector("#eksido-body");
  var form = wrapper.querySelector("#eksido-form");
  var input = wrapper.querySelector("#eksido-input");
  var sendBtn = wrapper.querySelector("#eksido-send");
  var statusText = wrapper.querySelector("#eksido-statusText");

  var history = [];
  var isOpen = false;
  var sending = false;
  var unread = 0;

  // --- Helpers ---
  function nowTime() {
    var d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function setUnread(n) {
    unread = n;
    if (unread > 0) {
      badge.style.display = "inline-flex";
      badge.textContent = String(unread);
    } else {
      badge.style.display = "none";
    }
  }

  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function addBubble(role, text, meta) {
    var row = document.createElement("div");
    row.className = "eksido-row " + role;

    var bubble = document.createElement("div");
    bubble.className = "eksido-bubble";
    bubble.textContent = text;

    row.appendChild(bubble);

    var metaEl = document.createElement("div");
    metaEl.className = "eksido-meta";
    metaEl.textContent = (meta || nowTime());

    var wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.maxWidth = "100%";
    wrap.appendChild(row);
    wrap.appendChild(metaEl);

    body.appendChild(wrap);
    scrollToBottom();
    return { bubbleEl: bubble, metaEl: metaEl };
  }

  function addThinking() {
    var row = document.createElement("div");
    row.className = "eksido-row assistant";
    var bubble = document.createElement("div");
    bubble.className = "eksido-bubble";
    bubble.innerHTML = '<span class="eksido-thinking" aria-label="Thinking"><span></span><span></span><span></span></span>';
    row.appendChild(bubble);

    var metaEl = document.createElement("div");
    metaEl.className = "eksido-meta";
    metaEl.textContent = "Thinking...";

    var wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.maxWidth = "100%";
    wrap.appendChild(row);
    wrap.appendChild(metaEl);

    body.appendChild(wrap);
    scrollToBottom();

    return { wrapEl: wrap, metaEl: metaEl };
  }

  function persist() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch (e) {}
  }

  function restore() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return;
      history = arr.slice(0, 50);
      body.innerHTML = "";
      for (var i = 0; i < history.length; i++) {
        var h = history[i];
        addBubble(h.role === "assistant" ? "assistant" : "user", h.content, h.meta || "");
      }
      scrollToBottom();
    } catch (e) {}
  }

  function greetIfEmpty() {
    if (history.length === 0) {
      addBubble("assistant", GREETING, "Just now");
      history.push({ role: "assistant", content: GREETING, meta: "Just now" });
      persist();
    }
  }

  function open() {
    panel.classList.add("open");
    isOpen = true;
    setUnread(0);
    restore();
    greetIfEmpty();
    setTimeout(function(){ input.focus(); }, 50);
  }

  function close() {
    panel.classList.remove("open");
    isOpen = false;
  }

  function setSending(state) {
    sending = state;
    sendBtn.disabled = state;
    input.disabled = state;
    statusText.textContent = state ? "Responding..." : "Online";
  }

  function normalizeAssistantAnswer(data) {
    if (data && typeof data.answer === "string" && data.answer.trim()) return data.answer.trim();
    return "I'm not sure based on what I have. Please contact support.";
  }

  // --- Events ---
  launcher.addEventListener("click", function () {
    if (panel.classList.contains("open")) close();
    else open();
  });
  closeBtn.addEventListener("click", close);

  clearBtn.addEventListener("click", function () {
    history = [];
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
    body.innerHTML = "";
    greetIfEmpty();
    input.focus();
  });

  function autosize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }
  input.addEventListener("input", autosize);

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;

    var text = (input.value || "").trim();
    if (!text) return;

    autosize();

    addBubble("user", text);
    history.push({ role: "user", content: text, meta: nowTime() });
    persist();

    input.value = "";
    autosize();

    var thinking = addThinking();

    setSending(true);

    var historyForRequest = history
      .filter(function(h){ return h && (h.role === "user" || h.role === "assistant"); })
      .slice(-12)
      .map(function(h){ return { role: h.role, content: h.content }; });

    fetch(apiBase + "/chat?site=" + encodeURIComponent(siteParam), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: historyForRequest })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then(function (data) {
        var answer = normalizeAssistantAnswer(data);

        thinking.wrapEl.remove();
        addBubble("assistant", answer);

        history.push({ role: "assistant", content: answer, meta: nowTime() });
        persist();

        if (!isOpen) setUnread(unread + 1);
      })
      .catch(function () {
        thinking.wrapEl.remove();
        var errMsg = "Sorry - I couldn't reach the server. Please try again in a moment.";
        addBubble("assistant", errMsg);
        history.push({ role: "assistant", content: errMsg, meta: nowTime() });
        persist();
        if (!isOpen) setUnread(unread + 1);
      })
      .finally(function () {
        setSending(false);
        input.focus();
      });
  });

})();
</script>
```

### Optional token header
If you set `REQUIRE_TOKEN=true`, add the header below in the `fetch` call:

```js
headers: {
  "Content-Type": "application/json",
  "X-Concierge-Token": "YOUR_TOKEN_HERE"
},
```

## Troubleshooting
- **CORS errors**: Ensure `ALLOWED_ORIGINS` matches the exact site origin
  (e.g., `https://your-site.com` and `https://www.your-site.com`, no trailing slash).
- **Vector store missing**: Run the indexing script and set
  `VECTOR_STORE_ID_SITE_1` in your environment. Confirm you are calling
  `/chat?site=eksidocom`.

## Configuration overview
Environment variables:
- `OPENAI_API_KEY`: OpenAI API key used by the server and indexing script.
- `OPENAI_MODEL`: (Optional) Model name. Defaults to `gpt-5-mini`.
- `ALLOWED_ORIGINS`: Comma-separated list of allowed browser origins. Requests with no origin (curl/server-to-server) are allowed.
- `VECTOR_STORE_ID_SITE_1`: Vector store ID created by the indexing script.
- `REQUIRE_TOKEN`: Set to `true` to require `X-Concierge-Token` header.
- `CONCIERGE_TOKEN_SITE_1`: Token value expected when `REQUIRE_TOKEN=true`.

Multi-tenant routing:
- Requests must include `?site=eksidocom`.
- Additional sites can be added in `server.js` under the `SITES` map with different vector store IDs and tokens.
