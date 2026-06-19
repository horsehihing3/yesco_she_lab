#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""협력업체관리 잔여(비-PersonRef) CRUD 스모크 — 협력사평가(/partner/evals) / 노사협의회(/osh-committees) / 협력사안전관리(/partner-safety-executions) + 자기정리.
※ 협력사작업허가(/partner-permit)는 PermitToWorkPage(mode=external) 재사용 = /permit-to-work → 안전관리(HELPER) PTW로 커버, 여기선 제외."""
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

def crud(name, path, create_body, update_patch):
    rid=None
    try:
        st,r=call("POST",path,create_body); d=r.get("data",{}) or {}; rid=d.get("id")
        ok=st==200 and r.get("success") is not False and rid is not None
        check(f"{name} 등록", ok, f"id={rid} st={st} ok={r.get('success')}")
        if not ok: return
        body=dict(d); body.update(update_patch)  # 생성응답 echo 후 일부 변경(서버생성 필드 보존)
        st,r=call("PUT",f"{path}/{rid}",body)
        check(f"{name} 수정", st==200 and r.get("success") is not False, f"st={st}")
    finally:
        if rid:
            st,_=call("DELETE",f"{path}/{rid}"); check(f"{name} 삭제", st==200, f"st={st}")

print("\n### #4 협력사평가 (/partner/evals) ###")
crud("협력사평가","/partner/evals",
     {"companyName":"ZZ_E2E_EVAL_삭제대상","industry":"건설","mgrName":"평가자","evalDate":"2026-09-15","scoreSafety":80,"scoreHealth":75},
     {"scoreSafety":90})

print("\n### #5 협력사노사협의회 (/osh-committees) ###")
crud("노사협의회","/osh-committees",
     {"oshDate":"2026-09-20","oshYear":2026,"oshQuarter":3,"oshLocation":"본사","mainAgenda":"ZZ_E2E_OSH_삭제대상","authorName":"테스트","authorDept":"안전환경팀"},
     {"comment":"수정됨"})

print("\n### #3 협력사안전관리 (/partner-safety-executions) — 토큰 자가점검(수정 미지원: create+complete만) ###")
_pse=None
try:
    st,r=call("POST","/partner-safety-executions",{"name":"ZZ_E2E_PSE_삭제대상","companyCode":"C001","phone":"010-0000-0000","systemCode":"SYS01","systemUid":"SYS-E2E-001"})
    d=r.get("data",{}) or {}; _pse=d.get("id")
    check("협력사안전관리 등록(토큰발급)", st==200 and _pse and bool(d.get("executionToken")), f"id={_pse} token={'O' if d.get('executionToken') else 'X'}")
finally:
    if _pse:
        st,_=call("DELETE",f"/partner-safety-executions/{_pse}"); check("협력사안전관리 삭제", st==200, f"st={st}")

print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
