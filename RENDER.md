# DMC Foods on Render — setup & M-Pesa checklist

```
 Customer phone/browser
        │  https://order.yourdomain.co.ke          (Render Static Site: React shop + /dmc-console)
        │  https://api.yourdomain.co.ke/api/...    (Render Web Service: Express, always on, Frankfurt)
        │                       │                 └─ disk: menu photos
        │                       ├─ MongoDB Atlas (AWS Frankfurt)
        │                       └─ Safaricom Daraja  ⇄  callback → /api/v1/mpesa/callback?key=…
```

## 1. One-time setup

1. **Code on GitHub** — push the `munch-clone` folder to a private GitHub repo (it contains `render.yaml`).
2. **MongoDB Atlas** — create a cluster on **AWS Frankfurt (eu-central-1)**, a database user, and under
   *Network Access* allow `0.0.0.0/0` (Render's outgoing addresses change). Copy the connection string.
3. **Render** — *New → Blueprint* → choose the repo. Render reads `render.yaml` and creates
   `dmc-foods-api` and `dmc-foods-shop`. Fill in every value it asks for (see `server/.env.render.example`).
4. **Domains** (recommended) — in Render add `api.yourdomain.co.ke` to *dmc-foods-api* and
   `order.yourdomain.co.ke` to *dmc-foods-shop*, then add the CNAME records Render shows at your registrar.
   HTTPS certificates are automatic.
5. **Point things at each other**, then redeploy both services:
   - API: `CLIENT_ORIGIN=https://order.yourdomain.co.ke`, `PUBLIC_API_URL=https://api.yourdomain.co.ke`,
     `MPESA_CALLBACK_URL=https://api.yourdomain.co.ke/api/v1/mpesa/callback`
   - Shop: `VITE_API_URL=https://api.yourdomain.co.ke/api`
6. **First admin** — Render dashboard → *dmc-foods-api → Shell*:
   `npm run admin -- create 0793935384 "Admin" 0793935384`, then sign in and change the password.
7. **Copy your local data (optional)** — on your computer:
   `mongodump --db munch --archive | mongorestore --uri "<Atlas URI>" --archive --nsFrom 'munch.*' --nsTo 'dmcfoods.*'`

## 2. How the M-Pesa flow works

1. Checkout creates the order, then calls `POST /api/v1/mpesa/stkpush` with `{ orderId, phone }`.
   The **amount is read from the order on the server** — the browser never sends it.
2. The API gets a Daraja token (cached ~1 hour), builds `Password = base64(ShortCode + PassKey + Timestamp)`
   with the timestamp in **Kenya time** (`YYYYMMDDHHmmss`), and calls `mpesa/stkpush/v1/processrequest`.
3. The customer sees the PIN prompt; the shop shows **"Check your phone"** and polls
   `GET /api/payments/mpesa/status/:orderId` every 3 s.
4. Safaricom posts the result to `/api/v1/mpesa/callback?key=…`. The API checks the key, **confirms the
   result with `stkpushquery`**, saves `ResultCode`, `ResultDesc`, `MpesaReceiptNumber`, `TransactionDate`,
   `Amount`, and marks the order PAID (once — repeats are ignored).
5. If the callback is late or lost, the status check asks Safaricom directly after ~20 s.

## 3. Troubleshooting checklist

| Symptom | Cause / fix |
|---|---|
| Prompt never arrives, logs say `M-Pesa login failed (400/401)` | Wrong consumer key/secret, or `DARAJA_ENVIRONMENT` doesn't match the keys (sandbox keys only work on sandbox). |
| `Bad Request - Invalid BusinessShortCode` / `Invalid PartyB` | Till: `DARAJA_SHORTCODE` must be the **store number**, `DARAJA_TILL_NUMBER` the till. Paybill: both are the paybill. `DARAJA_TYPE` must match. |
| `Bad Request - Invalid Timestamp` / wrong password | Server clock or timezone. The code always uses Kenya time — don't change `timestamp()`. Passkey must belong to that shortcode. |
| Customer pays but order stays "waiting" | Callback can't reach you: `MPESA_CALLBACK_URL` must be **public HTTPS** (no localhost, no ngrok in production), exactly `/api/v1/mpesa/callback`. The status check will still catch it after ~20 s. |
| Logs: `callback refused: wrong key` | `MPESA_CALLBACK_SECRET` changed after the prompt was sent, or someone is sending fake callbacks. |
| Callback body is empty / `undefined` | JSON body parser must run before the routes — `app.use(express.json())` is in `index.js`. Don't put a raw/text parser on `/api`. |
| Callbacks missed while idle | Free Render instances sleep after inactivity and can't receive callbacks. Use a paid (always-on) instance — `plan: starter` in `render.yaml`. |
| Browser: `CORS blocked: https://…` | Add the exact shop address (with `https://`, no trailing `/`) to `CLIENT_ORIGIN`, then redeploy the API. CORS does **not** affect Safaricom's callback (server-to-server). |
| Logged out after every refresh | Cookies: shop and API on the same domain → `COOKIE_SAMESITE=strict`. Testing on two `*.onrender.com` addresses → `COOKIE_SAMESITE=none`. |
| Menu photos disappear after a deploy | The disk in `render.yaml` must be attached; its `mountPath` must be `…/server/public/uploads`. |
| Shop shows old version | `VITE_API_URL` is read at build time — change it, then *Manual Deploy → Clear build cache & deploy*. |
| Sandbox works, live doesn't | Live needs: Daraja app approved for **M-Pesa Express** on your till/paybill (go-live), the **live passkey** emailed by Safaricom, live consumer key/secret, `DARAJA_ENVIRONMENT=production`. |
| Amount rejected | M-Pesa needs whole shillings ≥ 1. The app rounds and never sends 0. |

## 4. Sandbox test values

- `DARAJA_ENVIRONMENT=sandbox`, `DARAJA_TYPE=paybill`, `DARAJA_SHORTCODE=174379`
- Passkey: the one shown on the Daraja *M-Pesa Express* simulator page for 174379
- Use your own Safaricom number for the prompt; sandbox payments don't move real money.

## 5. Things to know about Render

- **No Africa region** — Frankfurt is closest; pages still load fast from Render's CDN.
- **The disk ties the API to one instance** (no horizontal scaling, short pause during deploys).
  One starter/standard instance handles a restaurant's traffic comfortably; if you outgrow it,
  move photos to Supabase Storage and the disk can go.
