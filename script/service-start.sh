#!/bin/bash

# 설정
PROCESS_NAME="TaaS_gov-admin"
TARGET_PORT=2901

# 프로젝트 루트로 이동 (script 폴더 기준)
cd "$(dirname "$0")/.." || exit 1

echo ">>> [1/2] 환경변수 동기화 중..."
cp -pr .prod.env .env

echo ">>> [2/2] PM2 프로세스 반영 중..."
# 프로세스 존재 여부 확인 후 분기 처리
if pm2 describe "$PROCESS_NAME" > /dev/null 2>&1; then
    # 존재하면 재시작 (포트 환경변수 반영을 위해 --update-env 사용)
    PORT=$TARGET_PORT pm2 reload "$PROCESS_NAME" --update-env
else
    # 없으면 새로 실행
    PORT=$TARGET_PORT pm2 start npm --name "$PROCESS_NAME" -- start
fi

# 상태 저장
pm2 save
echo "✅ 배포 완료: $PROCESS_NAME ($TARGET_PORT 포트)"