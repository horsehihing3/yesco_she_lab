#!/usr/bin/env bash
# wire-diff 검증 — raw 엔티티 → Response DTO 전환 전후 GET JSON 동일성 확인.
#
# raw→DTO 전환의 유일한 합격 기준: GET 응답 .data 가 전환 전후 100% 동일.
# (프론트 무변경 보장). ApiResponse 엔벨로프의 timestamp 는 매 요청 바뀌므로 .data 만 비교.
#
# 사용법:
#   coord/verify_wire.sh capture <outdir>   # 현재 구동 서버에서 ENDPOINTS GET → outdir 에 정규화(.data, 키정렬) 저장
#   coord/verify_wire.sh diff <before> <after>
#
# 전형 흐름:
#   1) (raw 코드 구동 중) coord/verify_wire.sh capture coord/wire_before
#   2) DTO 전환 + 재빌드 + 재기동
#   3) coord/verify_wire.sh capture coord/wire_after
#   4) coord/verify_wire.sh diff coord/wire_before coord/wire_after   # 출력 없으면 합격
#
# 검증할 엔드포인트는 전환하는 도메인에 맞게 ENDPOINTS 에 추가한다(GET 목록/상세).
set -euo pipefail

BASE="${WIRE_BASE:-http://localhost:7501/api}"
USER="${WIRE_USER:-yujeong.jung}"
PASS="${WIRE_PASS:-com4in!!}"

ENDPOINTS=(
  "/accident-reports"
  "/disease-prevention-mgmt/msd"
)

norm() { python -c "import sys,json; o=json.load(sys.stdin); print(json.dumps(o.get('data'),sort_keys=True,ensure_ascii=False,indent=2))"; }

capture() {
  local outdir="$1"; mkdir -p "$outdir"
  local token
  token=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
            -d "{\"username\":\"$USER\",\"password\":\"$PASS\"}" \
          | python -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])")
  for ep in "${ENDPOINTS[@]}"; do
    local fname; fname=$(echo "$ep" | sed 's#^/##; s#/#_#g')
    curl -s -H "Authorization: Bearer $token" "$BASE$ep" | norm > "$outdir/$fname.json"
    echo "captured $ep -> $outdir/$fname.json ($(wc -c < "$outdir/$fname.json") bytes)"
  done
}

diff_dirs() {
  local a="$1" b="$2" rc=0
  for f in "$a"/*.json; do
    local base; base=$(basename "$f")
    if ! diff -u "$a/$base" "$b/$base"; then rc=1; fi
  done
  if [ "$rc" = 0 ]; then echo "✅ wire 동일 — 전환 안전"; else echo "❌ wire 차이 발견 — 위 diff 확인"; fi
  return $rc
}

case "${1:-}" in
  capture) capture "$2" ;;
  diff)    diff_dirs "$2" "$3" ;;
  *) echo "usage: $0 capture <outdir> | diff <before> <after>"; exit 2 ;;
esac
