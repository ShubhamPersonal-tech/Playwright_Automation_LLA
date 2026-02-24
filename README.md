# Salesforce login with session persistence (Playwright)

Logs into [Salesforce Test](https://test.salesforce.com/) using **non-private Chromium** and **saves session cookies** so you are not asked to log in (or for OTP) on every run. OTP is only triggered when Salesforce sees a new session, new IP, or private window—reusing the saved session avoids that.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
   The script uses your **installed Chrome or Edge** (no Playwright browser download). If you see a certificate error when running `npx playwright install chromium`, skip that step—Chrome/Edge is enough.

2. Copy `.env.example` to `.env` and set your credentials:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` in the project root (no spaces around `=`):
   ```
   SF_USERNAME=your_salesforce_username
   SF_PASSWORD=your_salesforce_password
   ```
   The script loads this file and fills the login form automatically.

## Usage

**Credentials** come from `.env` (SF_USERNAME, SF_PASSWORD). The script fills them automatically on the login page—you do **not** type username/password in the browser. You only type the **OTP** in the browser if Salesforce asks for it (e.g. code from Gmail).

- **First run (or after clearing .auth):**  
  Use the **headed** browser so you can complete OTP in the browser if Salesforce asks for it. The browser profile keeps your session automatically.
  ```bash
  npm run login:headed
  ```

- **Later runs:**  
  Script loads saved cookies; you should land already logged in (no login, no OTP).
  ```bash
  npm run login
  ```
  Or with visible browser:
  ```bash
  npm run login:headed
  ```

Session is stored in **`.auth/salesforce-auth.json`** (and optionally a browser profile in `.auth/browser-profile/`). Delete the `.auth` folder to start over (fresh login).

## Running from another machine

If you run the script on a **different computer** (or different user account):

| What you do | What happens |
|-------------|--------------|
| **Copy the whole project including `.auth/`** | The script loads the saved session and tries to open the dashboard. **Salesforce may still ask for login or OTP** because it often treats a new machine/IP as a new session. If it does, complete login (and OTP) once on that machine; the script will then save a new session there. |
| **Copy only the code (no `.auth/`)** | No saved session. The script will show the login page, fill username/password from `.env`, and you complete OTP if asked. After you press Enter on the dashboard, it saves a new session in `.auth/` on that machine. |

**You need on the other machine:** the project (or at least the script + `package.json`), **`.env`** with `SF_USERNAME` and `SF_PASSWORD`, and Chrome or Edge. Copying `.auth/salesforce-auth.json` is optional; it might work (same session) or Salesforce may require login again for security.

## Corporate network / certificate errors

If `npx playwright install chromium` fails with **self-signed certificate in certificate chain**: the script uses your **system Chrome or Edge** by default, so you can skip the install and run `npm run login:headed` directly. If you have no Chrome/Edge and must use Playwright's Chromium, run the install once with:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED=0; npx playwright install chromium
```

Use that env var only for this install; do not leave it set for normal use.

## Project structure

```
SalesForce/
  .env.example
  .gitignore
  README.md
  package.json
  src/
    config/
      constants.js      # shared config
    scripts/
      salesforce-login.js
  .auth/                # created at runtime; session state (gitignored)
```
