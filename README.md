# Eksido Simple Web Agent

Standalone chat API + widget snippet for eksido.com. Built as a single, independent service.

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
  ALLOWED_ORIGINS=https://eksido.com,https://www.eksido.com
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
- Visit `https://eksido.com` and click **Chat with Eksido**.
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

  var style = document.createElement("style");
  style.textContent = "\
#eksido-chat-widget{position:fixed;right:20px;bottom:20px;z-index:999999;font-family:Arial,Helvetica,sans-serif;}\
#eksido-chat-button{background:#0b4d7a;color:#fff;border:none;border-radius:999px;padding:12px 18px;font-size:14px;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,0.2);}\
#eksido-chat-button.eksido-hidden{display:none;}\
#eksido-chat-panel{display:none;flex-direction:column;width:360px;height:460px;background:#fff;border-radius:14px;box-shadow:0 12px 30px rgba(0,0,0,0.25);overflow:hidden;border:1px solid #e7eef5;}\
#eksido-chat-panel.eksido-open{display:flex;}\
.eksido-header{background:#0b4d7a;color:#fff;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;font-weight:bold;}\
#eksido-chat-close{background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;}\
#eksido-chat-messages{flex:1;overflow:auto;padding:12px;background:#f7f9fb;}\
.eksido-msg{margin:8px 0;max-width:85%;padding:10px 12px;border-radius:10px;font-size:14px;line-height:1.35;}\
.eksido-msg.user{margin-left:auto;background:#0b4d7a;color:#fff;border-bottom-right-radius:2px;}\
.eksido-msg.assistant{margin-right:auto;background:#fff;border:1px solid #e2e8f0;color:#1f2937;border-bottom-left-radius:2px;}\
.eksido-input{display:flex;gap:8px;padding:10px;border-top:1px solid #e7eef5;background:#fff;}\
#eksido-chat-input{flex:1;padding:10px;border:1px solid #d6dee6;border-radius:8px;font-size:14px;}\
#eksido-chat-send{background:#0b4d7a;color:#fff;border:none;border-radius:8px;padding:10px 12px;font-size:14px;cursor:pointer;}\
#eksido-chat-send:disabled{opacity:0.6;cursor:default;}\
@media (max-width:480px){#eksido-chat-panel{width:90vw;height:70vh;}#eksido-chat-widget{right:10px;bottom:10px;}}\
";
  document.head.appendChild(style);

  var wrapper = document.createElement("div");
  wrapper.id = "eksido-chat-widget";
  wrapper.innerHTML = '\
<button id="eksido-chat-button">Chat with Eksido</button>\
<div id="eksido-chat-panel">\
  <div class="eksido-header">\
    <span>Eksido Concierge</span>\
    <button id="eksido-chat-close" aria-label="Close">×</button>\
  </div>\
  <div id="eksido-chat-messages"></div>\
  <div class="eksido-input">\
    <input id="eksido-chat-input" type="text" placeholder="Type your message..." />\
    <button id="eksido-chat-send">Send</button>\
  </div>\
</div>';
  document.body.appendChild(wrapper);

  var button = wrapper.querySelector("#eksido-chat-button");
  var panel = wrapper.querySelector("#eksido-chat-panel");
  var closeBtn = wrapper.querySelector("#eksido-chat-close");
  var messagesEl = wrapper.querySelector("#eksido-chat-messages");
  var inputEl = wrapper.querySelector("#eksido-chat-input");
  var sendBtn = wrapper.querySelector("#eksido-chat-send");

  var history = [];
  var greeted = false;
  var sending = false;

  function appendMessage(role, text) {
    var msg = document.createElement("div");
    msg.className = "eksido-msg " + role;
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function openPanel() {
    panel.classList.add("eksido-open");
    button.classList.add("eksido-hidden");
    if (!greeted) {
      appendMessage("assistant", "Hi! Ask me about pricing, features, or docs.");
      greeted = true;
    }
    setTimeout(function () {
      inputEl.focus();
    }, 0);
  }

  function closePanel() {
    panel.classList.remove("eksido-open");
    button.classList.remove("eksido-hidden");
  }

  function sendMessage() {
    if (sending) return;
    var text = inputEl.value.trim();
    if (!text) return;

    var historyForRequest = history.slice(-12);
    appendMessage("user", text);
    history.push({ role: "user", content: text });
    inputEl.value = "";

    sending = true;
    sendBtn.disabled = true;

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
        var answer = (data && data.answer) ? data.answer : "I'm sorry, I don't know. Please contact support.";
        appendMessage("assistant", answer);
        history.push({ role: "assistant", content: answer });
      })
      .catch(function () {
        appendMessage("assistant", "Sorry, something went wrong. Please try again.");
      })
      .finally(function () {
        sending = false;
        sendBtn.disabled = false;
      });
  }

  button.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
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
  (e.g., `https://eksido.com` and `https://www.eksido.com`, no trailing slash).
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
