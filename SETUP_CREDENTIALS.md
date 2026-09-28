# Setup Credentials untuk @ipin_pm_bot & @guntur_dev_bot

## Konteks

Dua bot ini — `@ipin_pm_bot` (product management / Notion) dan `@guntur_dev_bot` (developer / GitHub) — butuh akses ke credential tertentu kalau pekerjaan mereka melibatkan repo GitHub atau integrasi Notion.

File `.env.example` di root repo sudah mendokumentasikan apa yang dibutuhkan. 이 가이드를 따라 setup.

---

## 1. GitHub Token (untuk @guntur_dev_bot)

### Cara A: Personal Access Token (PAT) + `gh` CLI

1. **Generate token** di GitHub:
   - Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Atau (lebih recommended) → Fine-grained tokens
   - Pilih scope `repo` (untuk repo pribadi) atau `public_repo` (kalau cuma publik)
   - Salin token (format: `ghp_...` atau `github_pat_...`)

2. **Pasang di mesin lokal** (di mana repo berada, `/home/ubuntu/cardify`):

   ```bash
   # Copy template dan isi
   cp .env.example .env
   # Edit .env: isi GITHUB_TOKEN dan GITHUB_USER
   nano .env
   ```

3. **Auth `gh` CLI** (kalau `gh` terinstall):

   ```bash
   # Kalau pakai token dari .env:
   gh auth login --with-token < .env   # actually: gh auth login --with-token <(grep GITHUB_TOKEN .env | cut -d= -f2)
   # Atau lebih aman: pass via file
   gh auth login --with-token <<< "$(grep '^GITHUB_TOKEN=' .env | cut -d= -f2-)"
   ```

   Atau kalau `gh` belum terinstall:
   ```bash
   sudo apt install gh   # Debian/Ubuntu
   gh auth login          # lalu follow prompt (browser atau paste token)
   ```

4. **Verifikasi**:
   ```bash
   gh auth status
   gh repo view azukhrufy/cardify
   ```

### Cara B: SSH Key (alternate)

Kalau lebih suka SSH:
1. Generate key: `ssh-keygen -t ed25519 -C "guntur@cardify"`
2. Add ke GitHub Settings → SSH and GPG keys
3. Di repo: `git remote set-url origin git@github.com:azukhrufy/cardify.git`
4. Pastikan `ssh-agent` jalan dan key ter-add: `ssh-add ~/.ssh/id_ed25519`
5. Tidak butuh `.env` — cukup ssh-agent.

---

## 2. Notion API Key (untuk @ipin_pm_bot)

1. **Buat integration** di Notion:
   - Buka https://www.notion.so/my-integrations
   - Klik "Add integration" → beri nama (misal: "Cardify Bot")
   - Pilih capabilities: minimal **Read content** + **Write content** (dan **Insert content** kalau perlu append ke database)

2. **Salin Internal Integration Token** (format: `secret_xxx...`)

3. **Pasang di `.env`**:
   ```bash
   # Di .env, isi:
   NOTION_API_KEY=secret_xxx...
   ```

4. (Opsional) Jika ada Notion database khusus untuk task/tracking:
   - Buka database di Notion → salin ID dari URL: `https://notion.so/<database-id>`
   - Isi `NOTION_DATABASE_ID` di `.env`

5. **Share database ke integration**:
   - Di Notion, buka database/page yang ingin diakses
   - Klik "..." → "Add connection" → pilih integration "Cardify Bot"
   - Tanpa langkah ini, integration tidak bisa melihat database tersebut.

---

## 3. Verifikasi gabungan

Setelah kedua credential terpasang dan `.env` diisi:

```bash
# Source .env
set -a; source .env; set +a

# Cek GitHub
gh auth status

# Cek Notion (kalau ada Notion SDK/tool yang dipakai)
# curl -H "Authorization: Bearer $NOTION_API_KEY" \
#   https://api.notion.com/v1/users/me
```

---

## Keamanan

- **Jangan pernah push `.env` ke repo** — sudah di-ignore oleh `.gitignore`.
- Kalau perlu share ke agent lain, passing melalui environment variable lokal, bukan copy-paste di chat.
- Kalau token sogong, rotate di GitHub/Notion settings dan update `.env` lokal.
