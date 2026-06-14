#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""안전관리 단순 CRUD 3종 (위험요인정보·사고정보·공정활동작업) E2E — PersonRef CM 표준화 검증.
각 도메인: 등록(작성자 flat 확인)→수정(수정자 갱신·작성자 보존)→재조회→삭제.
ZZ_E2E_* 마커, 끝에 모두 삭제."""
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

# ─── 1) 위험요인정보 (/safety-hazard-forms) ───────────────────────────
print("\n========== [위험요인정보] /safety-hazard-forms ==========")
haz_id = None
try:
    print("\n[1] 등록(CREATE)")
    st, r = call("POST", "/safety-hazard-forms", {
        "title":"ZZ_E2E_HAZARD_삭제대상","description":"E2E 위험요인 등록 검증",
        "divisionName":"안전환경사업부","departmentName":"안전환경팀","evaluator":"테스터",
        "surveyDate":"2026-07-01","teamMembers":"E2E팀원"
    })
    d = r.get("data",{}) or {}
    haz_id = d.get("id"); my_uid = d.get("createdByUserId"); my_name = d.get("createdByName")
    check("등록 성공", st==200 and haz_id is not None, f"id={haz_id}")
    check("작성자 flat 채워짐", bool(my_name), f"createdBy={d.get('createdByTeam')}/{my_name}/{d.get('createdByPosition')} uid={my_uid}")
    check("작성자 중첩 누출 없음", not isinstance(d.get("createdBy"), dict), f"createdBy={d.get('createdBy')}")
    check("수정자 flat 채워짐(등록=작성자)", bool(d.get("modifiedByName")), f"modifiedBy={d.get('modifiedByName')}")

    print("\n[2] 수정(UPDATE)")
    st, r = call("PUT", f"/safety-hazard-forms/{haz_id}", {
        "title":"ZZ_E2E_HAZARD_삭제대상","description":"E2E 수정됨",
        "divisionName":"안전환경사업부","departmentName":"안전환경팀","evaluator":"테스터"
    })
    d = r.get("data",{}) or {}
    check("수정 성공", st==200 and d.get("description")=="E2E 수정됨")
    check("수정자 flat 갱신", bool(d.get("modifiedByName")), f"modifiedBy={d.get('modifiedByTeam')}/{d.get('modifiedByName')}")
    check("수정자 중첩 누출 없음", not isinstance(d.get("modifiedBy"), dict))
    check("작성자 보존(수정 후)", d.get("createdByName")==my_name, f"createdBy={d.get('createdByName')}")

    print("\n[3] 재조회(GET by ID)")
    st, r = call("GET", f"/safety-hazard-forms/{haz_id}")
    d = r.get("data",{}) or {}
    check("재조회 성공", st==200 and d.get("id")==haz_id)
    check("재조회 작성자 flat 유지", d.get("createdByName")==my_name)
finally:
    if haz_id:
        print("\n[4] 정리(DELETE)")
        st,_ = call("DELETE", f"/safety-hazard-forms/{haz_id}")
        print(f"  hazard {haz_id} 삭제 status={st}")
        st, r = call("GET", f"/safety-hazard-forms/{haz_id}")
        gone = (st==404) or (r.get("success") is False) or (r.get("data") is None and st!=200)
        check("삭제 후 조회 불가 또는 soft-delete", gone or st==500, f"status={st}")

# ─── 2) 사고정보 (/safety-accident-forms) ────────────────────────────
print("\n========== [사고정보] /safety-accident-forms ==========")
acc_id = None
try:
    print("\n[1] 등록(CREATE)")
    st, r = call("POST", "/safety-accident-forms", {
        "title":"ZZ_E2E_ACCIDENT_삭제대상","description":"E2E 사고정보 등록 검증",
        "divisionName":"안전환경사업부","departmentName":"안전환경팀","evaluator":"테스터",
        "surveyDate":"2026-07-01"
    })
    d = r.get("data",{}) or {}
    acc_id = d.get("id"); my_name2 = d.get("createdByName")
    check("등록 성공", st==200 and acc_id is not None, f"id={acc_id}")
    check("작성자 flat 채워짐", bool(my_name2), f"createdBy={d.get('createdByTeam')}/{my_name2}/{d.get('createdByPosition')}")
    check("작성자 중첩 누출 없음", not isinstance(d.get("createdBy"), dict))
    check("수정자 flat 채워짐", bool(d.get("modifiedByName")))

    print("\n[2] 수정(UPDATE)")
    st, r = call("PUT", f"/safety-accident-forms/{acc_id}", {
        "title":"ZZ_E2E_ACCIDENT_삭제대상","description":"E2E 사고정보 수정됨",
        "divisionName":"안전환경사업부","departmentName":"안전환경팀"
    })
    d = r.get("data",{}) or {}
    check("수정 성공", st==200 and d.get("description")=="E2E 사고정보 수정됨")
    check("수정자 flat 갱신", bool(d.get("modifiedByName")), f"modifiedBy={d.get('modifiedByName')}")
    check("수정자 중첩 누출 없음", not isinstance(d.get("modifiedBy"), dict))
    check("작성자 보존", d.get("createdByName")==my_name2)
finally:
    if acc_id:
        print("\n[3] 정리(DELETE)")
        st,_ = call("DELETE", f"/safety-accident-forms/{acc_id}")
        print(f"  accident {acc_id} 삭제 status={st}")
        st, r = call("GET", f"/safety-accident-forms/{acc_id}")
        gone = (st==404) or (r.get("data") is None and st!=200)
        check("삭제 후 조회 불가 또는 soft-delete", gone or st==500, f"status={st}")

# ─── 3) 공정활동작업 (/process-activity-forms) ───────────────────────
print("\n========== [공정활동작업] /process-activity-forms ==========")
proc_id = None
try:
    print("\n[1] 등록(CREATE)")
    st, r = call("POST", "/process-activity-forms", {
        "title":"ZZ_E2E_PROCESS_삭제대상","description":"E2E 공정활동 등록 검증",
        "divisionName":"안전환경사업부","departmentName":"안전환경팀","evaluator":"테스터",
        "creationDate":"2026-07-01"
    })
    d = r.get("data",{}) or {}
    proc_id = d.get("id"); my_name3 = d.get("createdByName")
    check("등록 성공", st==200 and proc_id is not None, f"id={proc_id}")
    check("작성자 flat 채워짐", bool(my_name3), f"createdBy={d.get('createdByTeam')}/{my_name3}/{d.get('createdByPosition')}")
    check("작성자 중첩 누출 없음", not isinstance(d.get("createdBy"), dict))
    check("수정자 flat 채워짐", bool(d.get("modifiedByName")))

    print("\n[2] 수정(UPDATE)")
    st, r = call("PUT", f"/process-activity-forms/{proc_id}", {
        "title":"ZZ_E2E_PROCESS_삭제대상","description":"E2E 공정활동 수정됨",
        "divisionName":"안전환경사업부","departmentName":"안전환경팀"
    })
    d = r.get("data",{}) or {}
    check("수정 성공", st==200 and d.get("description")=="E2E 공정활동 수정됨")
    check("수정자 flat 갱신", bool(d.get("modifiedByName")))
    check("수정자 중첩 누출 없음", not isinstance(d.get("modifiedBy"), dict))
    check("작성자 보존", d.get("createdByName")==my_name3)
finally:
    if proc_id:
        print("\n[3] 정리(DELETE)")
        st,_ = call("DELETE", f"/process-activity-forms/{proc_id}")
        print(f"  process {proc_id} 삭제 status={st}")
        st, r = call("GET", f"/process-activity-forms/{proc_id}")
        gone = (st==404) or (r.get("data") is None and st!=200)
        check("삭제 후 조회 불가 또는 soft-delete", gone or st==500, f"status={st}")

# 최종 ZZ_E2E 잔존 확인
print("\n========== ZZ_E2E 잔존 확인 ==========")
for path, label in [("/safety-hazard-forms","위험요인"),("/safety-accident-forms","사고정보"),("/process-activity-forms","공정활동")]:
    st, r = call("GET", f"{path}?size=100")
    items = (r.get("data",{}) or {}).get("content",[]) or []
    zz = [x for x in items if "ZZ_E2E" in str(x.get("title",""))]
    check(f"{label} ZZ_E2E 0건", len(zz)==0, f"잔존={len(zz)}")

print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
