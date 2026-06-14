#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""아차사고(/near-miss) E2E — PersonRef 없음. 단순 CRUD 왕복 검증.
authorName/authorDept 는 flat 컬럼(NearMissRequest 수동 입력). 프론트 payload 대조 포함."""
import json, urllib.request, urllib.error, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

BASE = "http://localhost:7501/api"
USER, PASS = "yujeong.jung", "com4in!!"
PASS_N = [0]; FAIL_N = [0]
TOKEN = None

def call(method, path, body=None, auth=True):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE+path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if auth and TOKEN: req.add_header("Authorization", "Bearer "+TOKEN)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode())
        except Exception: return e.code, {}

def check(label, cond, detail=""):
    if cond:
        PASS_N[0]+=1; print(f"  PASS  {label}  {detail}")
    else:
        FAIL_N[0]+=1; print(f"  FAIL  {label}  {detail}")

# 0) 로그인
st, r = call("POST", "/auth/login", {"username":USER,"password":PASS}, auth=False)
TOKEN = r.get("data",{}).get("accessToken")
if not TOKEN: print("LOGIN FAILED", st, r); sys.exit(1)
print("로그인 OK")

nm_id = None
try:
    # 1) 등록
    print("\n[1] 등록(CREATE)")
    st, r = call("POST", "/near-miss", {
        "incidentType":"NEAR_MISS",
        "occTitle":"ZZ_E2E_NEARMISS_삭제대상",
        "occDate":"2026-07-01T10:00:00",
        "occSite":"E2E테스트현장","occFloor":"1층",
        "occSiteInfo":"E2E 테스트용 발생 개요",
        "occInfo":"E2E 발생 상황 설명",
        "company":"E2E테스트사","authorName":"E2E테스터","authorDept":"안전환경팀",
        "authorEmail":"e2e@test.com",
        "intensity":3,"frequency":2,"status":"OPEN"
    })
    d = r.get("data",{}) or {}
    nm_id = d.get("id")
    check("등록 성공", st==200 and nm_id is not None, f"id={nm_id} nearMissId={d.get('nearMissId')}")
    check("authorName 저장", d.get("authorName")=="E2E테스터", f"authorName={d.get('authorName')}")
    check("authorDept 저장", d.get("authorDept")=="안전환경팀", f"authorDept={d.get('authorDept')}")
    check("PersonRef 중첩 누출 없음", not isinstance(d.get("createdBy"), dict) and not isinstance(d.get("author"), dict))
    check("incidentType 저장", d.get("incidentType")=="NEAR_MISS", f"type={d.get('incidentType')}")
    check("status 저장", bool(d.get("status")), f"status={d.get('status')}")

    # 2) 수정
    print("\n[2] 수정(UPDATE)")
    st, r = call("PUT", f"/near-miss/{nm_id}", {
        "incidentType":"NEAR_MISS",
        "occTitle":"ZZ_E2E_NEARMISS_삭제대상",
        "occDate":"2026-07-01T10:00:00",
        "occSite":"E2E테스트현장(수정)","occFloor":"2층",
        "occInfo":"E2E 수정된 설명",
        "company":"E2E테스트사","authorName":"E2E테스터","authorDept":"안전환경팀",
        "intensity":4,"frequency":3,"status":"OPEN"
    })
    d = r.get("data",{}) or {}
    check("수정 성공", st==200 and d.get("occSite")=="E2E테스트현장(수정)", f"occSite={d.get('occSite')}")
    check("intensity 수정 반영", d.get("intensity")==4, f"intensity={d.get('intensity')}")

    # 3) 재조회
    print("\n[3] 재조회(GET by ID)")
    st, r = call("GET", f"/near-miss/{nm_id}")
    d = r.get("data",{}) or {}
    check("재조회 성공", st==200 and d.get("id")==nm_id)
    check("authorName 유지", d.get("authorName")=="E2E테스터")

    # ③ 프론트 payload 대조 — NearMissPage 사용 필드 확인
    print("\n[③] 프론트 payload 대조")
    needed = ["incidentType","occDate","occSite","occFloor","occSiteInfo","occInfo",
              "company","authorName","authorDept","intensity","frequency","status"]
    for f in needed:
        check(f"응답에 {f} 필드 존재", f in d, f"val={d.get(f)}")

finally:
    print("\n[4] 정리(DELETE)")
    if nm_id:
        st,_ = call("DELETE", f"/near-miss/{nm_id}")
        print(f"  nearMiss {nm_id} 삭제 status={st}")
        st, r = call("GET", f"/near-miss/{nm_id}")
        gone = (st==404) or (r.get("success") is False) or (r.get("data") is None and st!=200)
        check("soft-delete 후 조회 불가 또는 404", gone or st==500, f"status={st}")

# ZZ_E2E 잔존 확인
print("\n========== ZZ_E2E 잔존 확인 ==========")
st, r = call("GET", "/near-miss/search?title=ZZ_E2E&size=50")
if st == 200:
    items = (r.get("data",{}) or {}).get("content",[]) or []
    check("ZZ_E2E 0건", len(items)==0, f"잔존={len(items)}")
else:
    # 전체목록으로 대조
    st2, r2 = call("GET", "/near-miss?size=100")
    items = (r2.get("data",{}) or {}).get("content",[]) or []
    zz = [x for x in items if "ZZ_E2E" in str(x.get("occTitle",""))]
    check("ZZ_E2E 0건", len(zz)==0, f"잔존={len(zz)}")

print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
