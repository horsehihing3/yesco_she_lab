#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""비상대응 도메인 E2E — emergency-plan(2단계결재·훈련자동생성) + emergency-contact(단순 created_by CRUD) + 자기정리."""
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

# ========== A. emergency-plan (2단계 결재) ==========
pid=None; drill_id=None
def tr(action,reason=None):
    b={"action":action}
    if reason is not None: b["rejectReason"]=reason
    return call("PATCH",f"/emergency-plan/{pid}/transition",b)
try:
    print("\n### A. 비상대응계획(emergency-plan) ###")
    print("[A1] 등록")
    st,r=call("POST","/emergency-plan",{"planType":"FIRE","planName":"ZZ_E2E_EMRPLAN_삭제대상",
        "description":"E2E","responsibleDept":"안전환경팀","trainingStartDate":"2026-08-01"})
    d=r.get("data",{}) or {}; pid=d.get("id"); uid=d.get("createdByUserId"); nm=d.get("createdByName")
    check("등록 성공", st==200 and pid, f"id={pid} status={d.get('status')}")
    check("작성자 flat·중첩없음", bool(nm) and not isinstance(d.get("createdBy"),dict), f"createdBy={nm}")
    print("[A2] 수정 — 승인자=본인")
    st,r=call("PUT",f"/emergency-plan/{pid}",{"planType":"FIRE","planName":"ZZ_E2E_EMRPLAN_삭제대상","description":"E2E",
        "responsibleDept":"안전환경팀","notes":"수정됨",
        "planApproverUserId":uid,"planApproverName":nm,"planApproverTeam":d.get("createdByTeam"),"planApproverPosition":d.get("createdByPosition"),
        "completionApproverUserId":uid,"completionApproverName":nm,"completionApproverTeam":d.get("createdByTeam"),"completionApproverPosition":d.get("createdByPosition")})
    d=r.get("data",{}) or {}
    check("수정자 갱신·작성자 보존", d.get("modifiedByName") and d.get("createdByName")==nm, f"mod={d.get('modifiedByName')}")
    check("승인자 flat 저장", d.get("planApproverName")==nm and d.get("completionApproverName")==nm)
    print("[A3] 상신→계획반려→재상신→계획승인")
    tr("submit")
    st,r=tr("reject","E2E계획반려"); d=r.get("data",{}) or {}
    check("계획반려→DRAFT·사유저장", d.get("status")=="DRAFT" and d.get("rejectReason")=="E2E계획반려", f"status={d.get('status')}")
    tr("submit")
    st,r=tr("approve"); d=r.get("data",{}) or {}
    check("계획승인→APPROVED", d.get("status")=="APPROVED", f"status={d.get('status')}")
    check("계획승인자 기록·작성자 보존", bool(d.get("planApprovedBy")) and d.get("createdByName")==nm, f"by={d.get('planApprovedBy')}")
    print("[A4] 완료상신→완료반려→재상신→완료승인")
    tr("completionSubmit")
    st,r=tr("reject","E2E완료반려"); d=r.get("data",{}) or {}
    check("완료반려→APPROVED·사유저장", d.get("status")=="APPROVED" and d.get("rejectReason")=="E2E완료반려", f"status={d.get('status')}")
    tr("completionSubmit")
    st,r=tr("complete"); d=r.get("data",{}) or {}
    check("완료승인→DONE", d.get("status")=="DONE", f"status={d.get('status')}")
    check("완료승인자 기록·작성자/완료승인자 보존", bool(d.get("completionApprovedBy")) and d.get("createdByName")==nm and d.get("completionApproverName")==nm, f"by={d.get('completionApprovedBy')}")
    check("완료 후 중첩 누출 없음", not isinstance(d.get("createdBy"),dict) and not isinstance(d.get("completionApprover"),dict))
    # 자동생성 훈련 확인
    st,r=call("GET","/emergency-drill?size=100")
    drills=(r.get("data",{}) or {}).get("content",[]) or []
    drill=next((x for x in drills if x.get("planId")==pid),None)
    check("계획승인 시 훈련 자동생성", drill is not None, f"drillId={drill.get('drillId') if drill else None}")
    if drill: drill_id=drill.get("id")

    # ========== B. emergency-contact (단순 created_by CRUD) ==========
    print("\n### B. 비상연락처(emergency-contact) ###")
    cid=None
    try:
        st,r=call("POST","/emergency-contact",{"organization":"ZZ_E2E_EMRCONTACT_삭제대상","contactName":"테스트",
            "phoneNumber":"010-0000-0000","contactType":"INTERNAL"})
        d=r.get("data",{}) or {}; cid=d.get("id")
        check("연락처 등록·작성자 flat·중첩없음", st==200 and cid and bool(d.get("createdByName")) and not isinstance(d.get("createdBy"),dict), f"id={cid} createdBy={d.get('createdByName')}")
        st,r=call("PUT",f"/emergency-contact/{cid}",{"organization":"ZZ_E2E_EMRCONTACT_삭제대상","contactName":"테스트수정","phoneNumber":"010-1111-1111","contactType":"INTERNAL"})
        d=r.get("data",{}) or {}
        check("연락처 수정·작성자 보존", st==200 and d.get("contactName")=="테스트수정" and d.get("createdByName"), f"name={d.get('contactName')}")
    finally:
        if cid:
            st,_=call("DELETE",f"/emergency-contact/{cid}"); check("연락처 삭제", st==200, f"status={st}")
finally:
    print("\n### 정리(CLEANUP) ###")
    if drill_id:
        st,_=call("DELETE",f"/emergency-drill/{drill_id}"); print(f"  drill {drill_id} 삭제 status={st}")
    if pid:
        st,_=call("DELETE",f"/emergency-plan/{pid}"); print(f"  plan {pid} 삭제 status={st}")
print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
