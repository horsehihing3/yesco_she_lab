#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""EHS경영 잔여 메뉴 CRUD 스모크 — EHS소통(ehs-manager·PersonRef) / EHS예산 / 사고대응 / 교육관리 + 자기정리.
대부분 비-PersonRef 단순 CRUD. PersonRef인 ehs-manager는 중첩누출 없음까지 확인(작성자 wire 미노출 설계)."""
import json, urllib.request, urllib.error, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
BASE="http://localhost:7501/api"; USER,PASS="yujeong.jung","com4in!!"; PASS_N=[0]; FAIL_N=[0]; TOKEN=None
def call(m,p,b=None,auth=True):
    data=json.dumps(b).encode() if b is not None else None
    req=urllib.request.Request(BASE+p,data=data,method=m); req.add_header("Content-Type","application/json")
    if auth and TOKEN: req.add_header("Authorization","Bearer "+TOKEN)
    try:
        with urllib.request.urlopen(req) as r: return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode())
        except Exception: return e.code,{}
def check(l,c,d=""):
    if c: PASS_N[0]+=1; print(f"  PASS  {l}  {d}")
    else: FAIL_N[0]+=1; print(f"  FAIL  {l}  {d}")
st,r=call("POST","/auth/login",{"username":USER,"password":PASS},auth=False)
TOKEN=r.get("data",{}).get("accessToken")
if not TOKEN: print("LOGIN FAILED",st,r); sys.exit(1)
print("로그인 OK")

def crud(name, path, create_body, update_patch, idkey="id"):
    """등록→수정→삭제 왕복. 반환 응답 dict 콜백으로 추가검증."""
    rid=None
    try:
        st,r=call("POST",path,create_body); d=r.get("data",{}) or {}; rid=d.get(idkey)
        ok=st==200 and rid is not None
        check(f"{name} 등록", ok, f"id={rid} st={st}")
        if not ok: return None, d
        d2=dict(create_body); d2.update(update_patch)
        st,r=call("PUT",f"{path}/{rid}",d2); d=r.get("data",{}) or {}
        check(f"{name} 수정", st==200, f"st={st}")
        return rid, d
    finally:
        if rid:
            st,_=call("DELETE",f"{path}/{rid}"); check(f"{name} 삭제", st==200, f"st={st}")

print("\n### #5 EHS소통 — ehs-managers (PersonRef 작성자) ###")
rid,d=crud("EHS담당자","/ehs-managers",
    {"roleCategory":"SAFETY","userName":"ZZ_E2E_MGR_삭제대상","userDept":"안전환경팀"},
    {"userDept":"수정팀"})
if d is not None: check("담당자 중첩 누출 없음", not isinstance(d.get("createdBy"),dict))

print("\n### #7 EHS예산 — ehs-budget-expenses ###")
crud("EHS예산","/ehs-budget-expenses",
    {"budgetYear":2026,"category":"교육","itemName":"ZZ_E2E_BUDGET_삭제대상","amount":1000,"expenseDate":"2026-07-01"},
    {"amount":2000})

print("\n### #8 사고대응 — incident-response ###")
crud("사고대응","/incident-response",
    {"title":"ZZ_E2E_INCIDENT_삭제대상","incidentType":"FIRE","status":"REPORTED","severity":"LOW","location":"테스트","reportedAt":"2026-07-01T09:00:00"},
    {"status":"CLOSED"})

print("\n### #6 교육관리 — training-application (상위 과정 의존) ###")
st,r=call("GET","/training-course?size=1")
courses=(r.get("data",{}) or {}).get("content",[]) or []
if courses:
    cid=courses[0].get("id")
    crud("교육신청","/training-application",
        {"courseId":cid,"applicantName":"ZZ_E2E_TRAIN_삭제대상","applicantDept":"안전환경팀","reason":"E2E"},
        {"reason":"수정됨"})
else:
    print("  SKIP  교육신청 — 등록된 교육과정 없음 → 수동확인 필요(과정 생성 후 신청)")

print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
