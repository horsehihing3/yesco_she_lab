#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""협력업체관리 PersonRef 핵심 E2E — 협력사계획(contractor-plans·ALL4·2단계결재) + 협력사등록(contractor-registrations·작성·민감개인정보) + 자기정리."""
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

pid=None
def tr(action,reason=None):
    b={"action":action}
    if reason is not None: b["rejectReason"]=reason
    return call("PATCH",f"/contractor-plans/{pid}/transition",b)
try:
    print("\n### A. 협력사계획(contractor-plans · ALL4 · 2단계결재) ###")
    st,r=call("POST","/contractor-plans",{"title":"ZZ_E2E_CONPLAN_삭제대상","workType":"전기","riskLevel":"HIGH",
        "workLocation":"테스트현장","workStartDate":"2026-09-01","workEndDate":"2026-09-30","workDescription":"E2E"})
    d=r.get("data",{}) or {}; pid=d.get("id"); uid=d.get("createdByUserId"); nm=d.get("createdByName")
    check("계획 등록·작성자flat·중첩없음", st==200 and pid and bool(nm) and not isinstance(d.get("createdBy"),dict), f"id={pid} createdBy={nm}")
    st,r=call("PUT",f"/contractor-plans/{pid}",{"title":"ZZ_E2E_CONPLAN_삭제대상","workType":"전기","riskLevel":"HIGH",
        "workLocation":"테스트현장","workStartDate":"2026-09-01","workEndDate":"2026-09-30","workDescription":"수정됨",
        "planApproverUserId":uid,"planApproverName":nm,"planApproverTeam":d.get("createdByTeam"),"planApproverPosition":d.get("createdByPosition"),
        "completionApproverUserId":uid,"completionApproverName":nm,"completionApproverTeam":d.get("createdByTeam"),"completionApproverPosition":d.get("createdByPosition")})
    d=r.get("data",{}) or {}
    check("수정자갱신·작성자보존", d.get("modifiedByName") and d.get("createdByName")==nm)
    check("계획/완료 승인자 flat 저장", d.get("planApproverName")==nm and d.get("completionApproverName")==nm)
    st,r=tr("submit"); check("상신→PENDING_APPROVAL", (r.get("data",{}) or {}).get("status")=="PENDING_APPROVAL", f"status={(r.get('data',{}) or {}).get('status')}")
    st,r=tr("reject","E2E계획반려"); d=r.get("data",{}) or {}
    check("반려→REJECTED·사유저장", d.get("status")=="REJECTED" and d.get("rejectReason")=="E2E계획반려", f"status={d.get('status')}")
    tr("submit")
    st,r=tr("approve"); d=r.get("data",{}) or {}
    check("계획승인→APPROVED·작성자보존", d.get("status")=="APPROVED" and d.get("createdByName")==nm, f"status={d.get('status')}")
    check("계획승인자 지정 보존", d.get("planApproverName")==nm)
    st,r=tr("completionSubmit"); check("완료상신→COMPLETION_PENDING", (r.get("data",{}) or {}).get("status")=="COMPLETION_PENDING", f"status={(r.get('data',{}) or {}).get('status')}")
    st,r=tr("complete"); d=r.get("data",{}) or {}
    check("완료승인→DONE·작성자/완료승인자 보존", d.get("status")=="DONE" and d.get("createdByName")==nm and d.get("completionApproverName")==nm, f"status={d.get('status')}")
    check("완료 후 중첩 누출 없음", not isinstance(d.get("createdBy"),dict) and not isinstance(d.get("completionApprover"),dict))

    print("\n### B. 협력사등록(contractor-registrations · 작성 · 민감 개인정보) ###")
    rid=None
    try:
        st,r=call("POST","/contractor-registrations",{"companyName":"ZZ_E2E_CONREG_삭제대상","bizNum":"123-45-67890",
            "ceoName":"홍길동","bizType":"건설","tel":"02-000-0000","email":"e2e@test.com"})
        d=r.get("data",{}) or {}; rid=d.get("id")
        check("등록·작성자flat 노출·중첩없음", st==200 and rid and bool(d.get("createdByName")) and not isinstance(d.get("createdBy"),dict), f"id={rid} createdBy={d.get('createdByName')}")
        if rid:
            # 프론트와 동일하게: 생성된 레코드 전체를 echo 하고 ceoName 만 변경(서버생성 regNo 등 보존)
            upbody=dict(d); upbody["ceoName"]="김철수"
            st,r=call("PUT",f"/contractor-registrations/{rid}",upbody)
            d=r.get("data",{}) or {}
            check("등록 수정·작성자 보존", st==200 and d.get("ceoName")=="김철수" and d.get("createdByName"), f"ceo={d.get('ceoName')} ok={r.get('success')}")
            st,r=call("PATCH",f"/contractor-registrations/{rid}/status",{"regStatus":"APPROVED"}); d=r.get("data",{}) or {}
            check("등록상태 변경", st==200 and d.get("regStatus")=="APPROVED", f"regStatus={d.get('regStatus')}")
    finally:
        if rid:
            st,_=call("DELETE",f"/contractor-registrations/{rid}"); check("등록 삭제", st==200, f"st={st}")
finally:
    print("\n### 정리(CLEANUP) ###")
    if pid:
        st,_=call("DELETE",f"/contractor-plans/{pid}"); print(f"  plan {pid} 삭제 status={st}")
print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
