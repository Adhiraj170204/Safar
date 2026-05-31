#!/usr/bin/env bash
# =============================================================================
#  scripts/update-ip.sh — Re-point IP-dependent env values after EC2 stop/start
#
#  Run manually:
#    bash ~/safar/scripts/update-ip.sh
#
#  Install as a boot-time systemd service (auto-runs on every start):
#    bash ~/safar/scripts/update-ip.sh --install
#
#  What it updates:
#    - backend/.env  →  APP_BASE_URL
#    - GitHub secret →  EC2_HOST  (only if gh CLI is installed + authenticated)
#
#  Then recreates the backend container to pick up the new APP_BASE_URL.
# =============================================================================
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/safar}"
GITHUB_REPO="Adhiraj170204/Safar"
SERVICE_NAME="safar-update-ip"

# ── Colours ───────────────────────────────────────────────────────────────────
G='\033[0;32m' Y='\033[1;33m' R='\033[0;31m' B='\033[0;34m' N='\033[0m' W='\033[1m'

ok()   { echo -e "${G}✓${N}  $*"; }
warn() { echo -e "${Y}!${N}  $*"; }
die()  { echo -e "${R}✗ FATAL:${N} $*" >&2; exit 1; }
log()  { echo -e "${B}»${N} $*"; }

# =============================================================================
# --install: register as a systemd service and exit
# =============================================================================
if [[ "${1:-}" == "--install" ]]; then
  SCRIPT_PATH="$(realpath "$0")"
  REPO_ABS="$(realpath "$REPO_DIR")"
  RUN_USER="${SUDO_USER:-$USER}"

  cat > /tmp/${SERVICE_NAME}.service <<EOF
[Unit]
Description=Update Safar IP-dependent config on boot
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
User=$RUN_USER
Environment=REPO_DIR=$REPO_ABS
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
  ok "Service installed: /etc/systemd/system/${SERVICE_NAME}.service"
  ok "Enabled — will run automatically on every boot"
  echo
  echo -e "  Check logs after next boot:  ${B}journalctl -u ${SERVICE_NAME} -n 50${N}"
  echo
  exit 0
fi

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

# ── 4. Update GitHub secret EC2_HOST (requires gh CLI) ────────────────────────
echo
if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
  gh secret set EC2_HOST --body "$NEW_IP" --repo "$GITHUB_REPO"
  ok "GitHub secret  EC2_HOST  →  $NEW_IP"
else
  warn "gh CLI not available — update EC2_HOST manually:"
  echo
  echo -e "     ${W}EC2_HOST = $NEW_IP${N}"
  echo -e "     ${B}https://github.com/$GITHUB_REPO/settings/secrets/actions${N}"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo
echo -e "${G}${W}Done.${N}  App is live at: ${W}http://$NEW_IP${N}"
echo
