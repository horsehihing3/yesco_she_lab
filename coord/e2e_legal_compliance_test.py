#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""법규준수 도메인 E2E — 계획(submit/approve/reject·실시자동생성) + 실시(혼합테이블:grade/reject/complete) + 법령(CRUD) + 자기정리."""
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

pid=None; eid=None
try:
    # A. 계획
    print("\n### A. 법규대응계획(legal-compliance-plan) ###")
    st,r=call("POST","/legal-compliance-plan",{"auditName":"ZZ_E2E_LCPLAN_삭제대상","auditType":"LEGAL_COMPLIANCE",
        "targetDept":"안전환경팀","planStartDate":"2026-09-01","planEndDate":"2026-09-30"})
    d=r.get("data",{}) or {}; pid=d.get("id"); uid=d.get("createdByUserId"); nm=d.get("createdByName")
    check("계획 등록·작성자flat·중첩없음", st==200 and pid and bool(nm) and not isinstance(d.get("createdBy"),dict), f"id={pid} createdBy={nm}")
    st,r=call("PUT",f"/legal-compliance-plan/{pid}",{"auditName":"ZZ_E2E_LCPLAN_삭제대상","auditType":"LEGAL_COMPLIANCE",
        "targetDept":"안전환경팀","planStartDate":"2026-09-01","planEndDate":"2026-09-30","notes":"수정됨",
        "planApproverUserId":uid,"planApproverName":nm,"planApproverTeam":d.get("createdByTeam"),"planApproverPosition":d.get("createdByPosition"),
        "completionApproverUserId":uid,"completionApproverName":nm,"completionApproverTeam":d.get("createdByTeam"),"completionApproverPosition":d.get("createdByPosition")})
    d=r.get("data",{}) or {}
    check("계획 수정자갱신·작성자보존", d.get("modifiedByName") and d.get("createdByName")==nm)
    check("계획 승인자 flat 저장", d.get("planApproverName")==nm and d.get("completionApproverName")==nm)
    st,r=call("PATCH",f"/legal-compliance-plan/{pid}/submit"); check("상신→PENDING_APPROVAL", (r.get("data",{}) or {}).get("status")=="PENDING_APPROVAL", f"status={(r.get('data',{}) or {}).get('status')}")
    st,r=call("PATCH",f"/legal-compliance-plan/{pid}/reject",{"rejectReason":"E2E계획반려"}); d=r.get("data",{}) or {}
    check("계획반려→PLAN·사유저장", d.get("status")=="PLAN" and d.get("rejectReason")=="E2E계획반려", f"status={d.get('status')}")
    call("PATCH",f"/legal-compliance-plan/{pid}/submit")
    st,r=call("PATCH",f"/legal-compliance-plan/{pid}/approve"); d=r.get("data",{}) or {}
    check("계획승인→APPROVED·승인자기록·작성자보존", d.get("status")=="APPROVED" and bool(d.get("planApprovedBy")) and d.get("createdByName")==nm, f"status={d.get('status')} by={d.get('planApprovedBy')}")

    # B. 실시(자동생성, 혼합테이블)
    print("\n### B. 법규대응실시(legal-compliance, 혼합테이블) ###")
    st,r=call("GET","/legal-compliance?size=100")
    items=(r.get("data",{}) or {}).get("content",[]) or []
    exec_=next((x for x in items if x.get("planId")==pid),None)
    check("계획승인 시 실시 자동생성", exec_ is not None, f"execId={exec_.get('auditId') if exec_ else None}")
    if exec_:
        eid=exec_.get("id")
        check("실시 작성자/승인자 flat 상속·중첩없음", exec_.get("createdByName")==nm and exec_.get("completionApproverName")==nm and not isinstance(exec_.get("createdBy"),dict))
        body=dict(exec_); body["notes"]="실시수정"
        st,r=call("PUT",f"/legal-compliance/{eid}",body); d=r.get("data",{}) or {}
        check("실시 수정자 flat(레거시)·작성자보존·완료승인자보존", bool(d.get("modifiedByName")) and d.get("createdByName")==nm and d.get("completionApproverName")==nm, f"mod={d.get('modifiedByName')}")
        st,r=call("PATCH",f"/legal-compliance/{eid}/grade?grade=A"); check("등급 부여", st==200, f"status={st}")
        st,r=call("PATCH",f"/legal-compliance/{eid}/reject",{"rejectReason":"E2E실시반려"}); d=r.get("data",{}) or {}
        check("실시반려→IN_PROGRESS·사유저장", d.get("status")=="IN_PROGRESS" and d.get("rejectReason")=="E2E실시반려", f"status={d.get('status')}")
        st,r=call("PATCH",f"/legal-compliance/{eid}/complete"); d=r.get("data",{}) or {}
        check("실시 완료승인→COMPLETED·승인자기록·작성자보존", d.get("status")=="COMPLETED" and bool(d.get("completionApprovedBy")) and d.get("createdByName")==nm, f"status={d.get('status')} by={d.get('completionApprovedBy')}")
        check("완료 후 중첩 누출 없음", not isinstance(d.get("createdBy"),dict) and not isinstance(d.get("completionApprover"),dict))

    # C. 법령(legal/laws, 단순 created_by CRUD)
    print("\n### C. 법령(legal/laws) ###")
    lid=None
    try:
        # 주: LegalLawResponse 는 작성자를 wire 에 노출하지 않음(설계 — 화면엔 reviewer 표시). created_by JSON 저장은 정적점검에서 확인됨.
        st,r=call("POST","/legal/laws",{"category":"산업안전","lawName":"ZZ_E2E_LAW_삭제대상","clause":"제1조","reviewStatus":"PENDING","applyYn":"Y"})
        d=r.get("data",{}) or {}; lid=d.get("id")
        check("법령 등록·중첩없음", st==200 and lid and not isinstance(d.get("createdBy"),dict), f"id={lid} st={st}")
        if lid:
            st,r=call("PUT",f"/legal/laws/{lid}",{"category":"산업안전","lawName":"ZZ_E2E_LAW_삭제대상","clause":"제2조","reviewStatus":"DONE","applyYn":"Y"})
            d=r.get("data",{}) or {}
            check("법령 수정", st==200 and d.get("clause")=="제2조", f"clause={d.get('clause')}")
    finally:
        if lid:
            st,_=call("DELETE",f"/legal/laws/{lid}"); check("법령 삭제", st==200, f"status={st}")
finally:
    print("\n### 정리(CLEANUP) ###")
    if eid:
        st,_=call("DELETE",f"/legal-compliance/{eid}"); print(f"  exec {eid} 삭제 status={st}")
    if pid:
        st,_=call("DELETE",f"/legal-compliance-plan/{pid}"); print(f"  plan {pid} 삭제 status={st}")
print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
