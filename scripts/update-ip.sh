#!/usr/bin/env bash
# =============================================================================
#  scripts/update-ip.sh — Re-point IP-dependent env values after EC2 stop/start
#
#  First-time setup (run once on EC2):
#    sudo bash ~/safar/scripts/update-ip.sh --install
#    → installs gh CLI, prompts for a GitHub PAT, registers a systemd service
#    → from then on runs automatically on every boot — no manual step needed
#
#  Run manually at any time:
#    bash ~/safar/scripts/update-ip.sh
#
#  What it updates every boot:
#    - backend/.env  →  APP_BASE_URL
#    - GitHub secret →  EC2_HOST  (via gh CLI)
#
#  Then recreates the backend container to pick up the new APP_BASE_URL.
# =============================================================================
set -euo pipefail

# Resolve the real user's home even when called via `sudo bash`
_ACTUAL_USER="${SUDO_USER:-$USER}"
_ACTUAL_HOME=$(eval echo "~$_ACTUAL_USER")
REPO_DIR="${REPO_DIR:-$_ACTUAL_HOME/safar}"
GITHUB_REPO="Adhiraj170204/Safar"
SERVICE_NAME="safar-update-ip"

# ── Colours ───────────────────────────────────────────────────────────────────
G='\033[0;32m' Y='\033[1;33m' R='\033[0;31m' B='\033[0;34m' N='\033[0m' W='\033[1m'

ok()   { echo -e "${G}✓${N}  $*"; }
warn() { echo -e "${Y}!${N}  $*"; }
die()  { echo -e "${R}✗ FATAL:${N} $*" >&2; exit 1; }
log()  { echo -e "${B}»${N} $*"; }

_install_gh_cli() {
  log "Installing GitHub CLI (gh)..."
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg 2>/dev/null
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] \
https://cli.github.com/packages stable main" \
    | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq gh
  ok "gh CLI installed: $(gh --version | head -1)"
}

# =============================================================================
# --install: one-time setup — installs gh, stores PAT, registers systemd service
# =============================================================================
if [[ "${1:-}" == "--install" ]]; then
  echo -e "\n${W}${B}Safar — update-ip install${N}\n"

  SCRIPT_PATH="$(realpath "$0")"
  REPO_ABS="$(realpath "$REPO_DIR")"

  # The service will run as the non-root user (ubuntu on EC2)
  RUN_USER="${SUDO_USER:-$USER}"
  RUN_HOME=$(eval echo "~$RUN_USER")

  # ── 1. Install gh CLI if missing ────────────────────────────────────────────
  if command -v gh &>/dev/null; then
    ok "gh CLI already installed: $(gh --version | head -1)"
  else
    _install_gh_cli
  fi

  # ── 2. Authenticate gh for RUN_USER ─────────────────────────────────────────
  if sudo -u "$RUN_USER" -H gh auth status &>/dev/null 2>&1; then
    GH_USER=$(sudo -u "$RUN_USER" -H gh api user -q .login 2>/dev/null || echo "?")
    ok "gh CLI already authenticated as $GH_USER"
  else
    echo
    echo -e "  ${W}A GitHub Personal Access Token (PAT) is needed to update EC2_HOST automatically.${N}"
    echo
    echo    "  Create one here (takes 30 seconds):"
    echo -e "  ${B}https://github.com/settings/tokens/new?scopes=repo&description=Safar+EC2${N}"
    echo
    echo    "  Required scope:  repo  (includes secrets:write)"
    echo
    read -rsp "  Paste your PAT (input hidden): " GH_PAT
    echo
    [[ -z "$GH_PAT" ]] && die "No token provided — re-run --install when ready"
    printf '%s' "$GH_PAT" | sudo -u "$RUN_USER" -H gh auth login --with-token
    GH_USER=$(sudo -u "$RUN_USER" -H gh api user -q .login 2>/dev/null || echo "authenticated")
    ok "gh CLI authenticated as $GH_USER"

    # Verify the token can actually write secrets
    if sudo -u "$RUN_USER" -H gh secret list --repo "$GITHUB_REPO" &>/dev/null 2>&1; then
      ok "Token has secrets access to $GITHUB_REPO"
    else
      warn "Could not list secrets — ensure the PAT has 'repo' scope and access to $GITHUB_REPO"
    fi
  fi

  # ── 3. Install systemd service ───────────────────────────────────────────────
  cat > /tmp/${SERVICE_NAME}.service <<EOF
[Unit]
Description=Update Safar IP-dependent config on boot
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
User=$RUN_USER
Environment=REPO_DIR=$REPO_ABS
Environment=HOME=$RUN_HOME
ExecStartPre=/bin/bash -c 'until docker info >/dev/null 2>&1; do sleep 2; done'
ExecStart=/bin/bash $SCRIPT_PATH
RemainAfterExit=yes
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

  sudo mv /tmp/${SERVICE_NAME}.service /etc/systemd/system/${SERVICE_NAME}.service
  sudo systemctl daemon-reload
  sudo systemctl enable "${SERVICE_NAME}.service"

  echo
  ok "Systemd service installed: /etc/systemd/system/${SERVICE_NAME}.service"
  ok "Enabled — will run automatically on every boot"
  echo
  echo -e "  On every boot:  IP detected → backend/.env patched → EC2_HOST secret updated → backend restarted"
  echo -e "  Check logs:     ${B}journalctl -u ${SERVICE_NAME} -n 50${N}"
  echo -e "  Run now:        ${B}bash $SCRIPT_PATH${N}"
  echo
  exit 0
fi

# =============================================================================
# Main: update IP, patch env, recreate backend, update GitHub secret
# =============================================================================
echo -e "\n${W}${B}Safar — IP update${N}\n"

# ── 1. Detect current public IP ───────────────────────────────────────────────
log "Detecting public IP..."
NEW_IP=$(curl -sf --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null \
      || curl -sf --max-time 8 http://checkip.amazonaws.com                         2>/dev/null \
      || curl -sf --max-time 8 https://api.ipify.org                                2>/dev/null \
      || echo "")
NEW_IP="${NEW_IP// /}"
[[ -z "$NEW_IP" ]] && die "Could not detect public IP. Are you running this on EC2?"
ok "Public IP: ${W}$NEW_IP${N}"

# ── 2. Update backend/.env → APP_BASE_URL ─────────────────────────────────────
ENV_FILE="$REPO_DIR/backend/.env"
[[ -f "$ENV_FILE" ]] || die "$ENV_FILE not found. Set REPO_DIR if your repo is not at ~/safar"

OLD_URL=$(grep "^APP_BASE_URL=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- || echo "(not set)")
sed -i "s|^APP_BASE_URL=.*|APP_BASE_URL=http://$NEW_IP|" "$ENV_FILE"
ok "backend/.env    APP_BASE_URL:  $OLD_URL  →  http://$NEW_IP"

# ── 3. Recreate backend to apply the new env value ────────────────────────────
# docker compose restart does NOT re-read env_file — up -d recreates the container
log "Recreating backend container with new env..."
cd "$REPO_DIR"
sudo docker compose up -d backend
ok "Backend recreated"

# ── 4. Update GitHub secret EC2_HOST ─────────────────────────────────────────
echo
if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
  gh secret set EC2_HOST --body "$NEW_IP" --repo "$GITHUB_REPO"
  ok "GitHub secret  EC2_HOST  →  $NEW_IP"
else
  warn "gh CLI not authenticated — run  sudo bash $(realpath "$0") --install  to enable auto-update"
  echo -e "     Manual update: ${W}EC2_HOST = $NEW_IP${N}"
  echo -e "     ${B}https://github.com/$GITHUB_REPO/settings/secrets/actions${N}"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo
echo -e "${G}${W}Done.${N}  App is live at: ${W}http://$NEW_IP${N}"
echo
