#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""보호구 E2E — PPE 재고(/ppe-equipment) + 지급신청(/ppe-request).
PersonRef 없음. 재고: CRUD. 신청: 등록→승인→지급→삭제."""
import json, urllib.request, urllib.error, urllib.parse, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

BASE = "http://localhost:7501/api"
USER, PASS = "yujeong.jung", "com4in!!"
PASS_N = [0]; FAIL_N = [0]
TOKEN = None

def call(method, path, body=None, params=None, auth=True):
    url = BASE+path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
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

# ─── 1) PPE 재고 (/ppe-equipment) ────────────────────────────────────
print("\n========== [PPE 재고] /ppe-equipment ==========")
eq_id = None
try:
    print("\n[1] 등록(CREATE)")
    st, r = call("POST", "/ppe-equipment", {
        "name":"ZZ_E2E_보호구_삭제대상","category":"안전모","model":"E2E-TEST-001",
        "stockQuantity":10,"minStock":2,"maxStock":50,
        "department":"안전환경팀","status":"ACTIVE",
        "notes":"E2E 테스트용 재고 — 자동삭제"
    })
    d = r.get("data",{}) or {}
    eq_id = d.get("id")
    check("재고 등록 성공", st==200 and eq_id is not None, f"id={eq_id}")
    check("name 저장", d.get("name")=="ZZ_E2E_보호구_삭제대상")
    check("category 저장", d.get("category")=="안전모")
    check("stockQuantity 저장", d.get("stockQuantity")==10, f"qty={d.get('stockQuantity')}")
    check("PersonRef 중첩 없음", not isinstance(d.get("createdBy"), dict))

    print("\n[2] 수정(UPDATE)")
    st, r = call("PUT", f"/ppe-equipment/{eq_id}", {
        "name":"ZZ_E2E_보호구_삭제대상","category":"안전모","model":"E2E-TEST-001",
        "stockQuantity":20,"minStock":2,"maxStock":50,
        "department":"안전환경팀","status":"ACTIVE","notes":"E2E 수정됨"
    })
    d = r.get("data",{}) or {}
    check("수정 성공", st==200 and d.get("stockQuantity")==20, f"qty={d.get('stockQuantity')}")
    check("notes 수정", d.get("notes")=="E2E 수정됨")

    print("\n[3] 재조회(GET by ID)")
    st, r = call("GET", f"/ppe-equipment/{eq_id}")
    d = r.get("data",{}) or {}
    check("재조회 성공", st==200 and d.get("id")==eq_id)
    check("수정된 stockQuantity 유지", d.get("stockQuantity")==20)

finally:
    if eq_id:
        print("\n[4] 재고 정리(DELETE)")
        st,_ = call("DELETE", f"/ppe-equipment/{eq_id}")
        print(f"  ppeEquipment {eq_id} 삭제 status={st}")
        st, r = call("GET", f"/ppe-equipment/{eq_id}")
        gone = (st==404) or (r.get("data") is None and st!=200)
        check("삭제 후 조회 불가", gone or st==500, f"status={st}")

# ─── 2) PPE 지급신청 (/ppe-request) ─────────────────────────────────
print("\n========== [PPE 지급신청] /ppe-request ==========")
req_id = None
try:
    print("\n[1] 신청(CREATE)")
    st, r = call("POST", "/ppe-request", {
        "itemName":"ZZ_E2E_보호구신청_삭제대상","itemCategory":"안전모",
        "quantity":2,"reason":"E2E 테스트 신청",
        "requesterName":"E2E테스터","requesterDept":"안전환경팀",
        "requesterId":USER,"notes":"자동삭제예정"
    })
    d = r.get("data",{}) or {}
    req_id = d.get("id")
    check("신청 등록 성공", st==200 and req_id is not None, f"id={req_id}")
    check("itemName 저장", d.get("itemName")=="ZZ_E2E_보호구신청_삭제대상")
    check("quantity 저장", d.get("quantity")==2, f"qty={d.get('quantity')}")
    check("status 유효", bool(d.get("status")), f"status={d.get('status')}")
    check("PersonRef 중첩 없음", not isinstance(d.get("createdBy"), dict))

    print("\n[2] 승인(approve)")
    st, r = call("PATCH", f"/ppe-request/{req_id}/approve",
                 params={"approverName":"E2E승인자","approverDept":"안전환경팀"})
    d = r.get("data",{}) or {}
    check("승인 성공", st==200, f"status={d.get('status')}")
    check("status APPROVED", "APPROVED" in str(d.get("status","")), f"status={d.get('status')}")

    print("\n[3] 지급완료(issue)")
    st, r = call("PATCH", f"/ppe-request/{req_id}/issue")
    d = r.get("data",{}) or {}
    check("지급완료 성공", st==200, f"status={d.get('status')}")
    check("status ISSUED", "ISSUED" in str(d.get("status","")), f"status={d.get('status')}")

finally:
    if req_id:
        print("\n[4] 신청 정리(DELETE)")
        st,_ = call("DELETE", f"/ppe-request/{req_id}")
        print(f"  ppeRequest {req_id} 삭제 status={st}")
        st, r = call("GET", f"/ppe-request/{req_id}")
        gone = (st==404) or (r.get("data") is None and st!=200)
        check("삭제 후 조회 불가", gone or st==500, f"status={st}")

# ZZ_E2E 잔존 확인
print("\n========== ZZ_E2E 잔존 확인 ==========")
for path, label, key in [("/ppe-equipment","재고","name"),("/ppe-request","신청","itemName")]:
    st, r = call("GET", f"{path}?size=100")
    items = (r.get("data",{}) or {}).get("content",[]) or []
    zz = [x for x in items if "ZZ_E2E" in str(x.get(key,""))]
    check(f"{label} ZZ_E2E 0건", len(zz)==0, f"잔존={len(zz)}")

print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
