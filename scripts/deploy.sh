#!/usr/bin/env bash
#
# 서버에서 실행되는 배포 스크립트 (SSM 이 앱 유저로 호출).
# 사용법: deploy.sh <APP_ROOT> <RELEASE_ID> <TARBALL_S3_URI> [PM2_APP_NAME] [PORT]
#
# 전제:
#  - node/npm/pm2 는 nvm 아래 설치됨 -> 아래에서 nvm 을 source 함
#  - aws cli, 인스턴스 IAM 롤에 해당 S3 버킷 읽기 권한 + SSM 권한
#
set -euo pipefail

APP_ROOT="$1"
RELEASE_ID="$2"
TARBALL="$3"
PM2_APP_NAME="${4:-TaaS_gov-admin}"
PORT="${5:-2101}"

# nvm 으로 설치된 node/npm/pm2 를 PATH 에 올림 (sudo -iu 로도 누락될 수 있어 명시적으로 로드)
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

RELEASE_DIR="$APP_ROOT/releases/$RELEASE_ID"
KEEP_RELEASES=3

mkdir -p "$RELEASE_DIR" "$APP_ROOT/releases"

echo "[deploy] downloading $TARBALL"
aws s3 cp "$TARBALL" "/tmp/$RELEASE_ID.tar.gz"
tar -xzf "/tmp/$RELEASE_ID.tar.gz" -C "$RELEASE_DIR"
rm -f "/tmp/$RELEASE_ID.tar.gz"

# 런타임 env(.env.production)는 산출물에 동봉되어 이미 RELEASE_DIR 에 있음.
# standalone 서버가 cwd(.../current)의 .env.production 을 런타임에 로드함.

# pm2 ecosystem 을 APP_ROOT 에 고정 생성.
# cwd 를 current 심볼릭링크로 두면, reload 시 새 릴리스 코드가 반영됨.
cat > "$APP_ROOT/ecosystem.config.js" <<EOF
module.exports = {
  apps: [{
    name: "$PM2_APP_NAME",
    script: "server.js",
    cwd: "$APP_ROOT/current",
    exec_mode: "fork",
    instances: 1,
    env: {
      NODE_ENV: "production",
      PORT: $PORT,
      HOSTNAME: "0.0.0.0"
    }
  }]
};
EOF

# 원자적 전환
ln -sfn "$RELEASE_DIR" "$APP_ROOT/current"

# 무중단 리로드(없으면 최초 기동)
pm2 startOrReload "$APP_ROOT/ecosystem.config.js" --update-env
pm2 save

# 오래된 릴리스 정리 (최근 N개 유지)
cd "$APP_ROOT/releases"
ls -1dt */ 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

echo "[deploy] done: $RELEASE_ID"