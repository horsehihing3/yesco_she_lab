#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""EHS 연간계획(tb_ehs_annual_plan) 라이프사이클 API E2E — PersonRef(DTO패턴 레퍼런스) + 2단계결재 + 자기정리.
등록→수정(승인자=본인)→상신→계획반려→재상신→계획승인→완료상신→완료반려→완료재상신→완료승인→cleanup."""
import json, urllib.request, urllib.error, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
BASE="http://localhost:7501/api"; USER,PASS="yujeong.jung","com4in!!"; PASS_N=[0]; FAIL_N=[0]; TOKEN=None

def call(method, path, body=None, auth=True):
    data=json.dumps(body).encode() if body is not None else None
    req=urllib.request.Request(BASE+path, data=data, method=method)
    req.add_header("Content-Type","application/json")
    if auth and TOKEN: req.add_header("Authorization","Bearer "+TOKEN)
    try:
        with urllib.request.urlopen(req) as r: return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode())
        except Exception: return e.code, {}

def check(label, cond, detail=""):
    if cond: PASS_N[0]+=1; print(f"  PASS  {label}  {detail}")
    else: FAIL_N[0]+=1; print(f"  FAIL  {label}  {detail}")

st,r=call("POST","/auth/login",{"username":USER,"password":PASS},auth=False)
TOKEN=r.get("data",{}).get("accessToken")
if not TOKEN: print("LOGIN FAILED",st,r); sys.exit(1)
print("로그인 OK")

pid=None
def tr(action, reason=None):
    b={"action":action}
    if reason is not None: b["rejectReason"]=reason
    return call("PATCH",f"/ehs-plans/{pid}/transition",b)
try:
    print("\n[1] 등록(CREATE)")
    st,r=call("POST","/ehs-plans",{"planYear":2026,"planName":"ZZ_E2E_EHSPLAN_삭제대상","description":"E2E 검증",
        "remarks":"초기","planApproverName":"임시","completionApproverName":"임시"})
    d=r.get("data",{}) or {}; pid=d.get("id"); uid=d.get("createdByUserId"); nm=d.get("createdByName")
    check("등록 성공·상태=DRAFT", st==200 and pid and d.get("status")=="DRAFT", f"id={pid} status={d.get('status')}")
    check("작성자 flat 채워짐", bool(nm), f"createdBy={d.get('createdByTeam')}/{nm} uid={uid}")
    check("중첩 누출 없음", not isinstance(d.get("createdBy"),dict))

    print("\n[2] 수정(UPDATE) — 계획·완료 승인자=본인 지정")
    base={"planYear":2026,"planName":"ZZ_E2E_EHSPLAN_삭제대상","description":"E2E 검증","remarks":"수정됨",
        "planApproverUserId":uid,"planApproverName":nm,"planApproverTeam":d.get("createdByTeam"),"planApproverPosition":d.get("createdByPosition"),
        "completionApproverUserId":uid,"completionApproverName":nm,"completionApproverTeam":d.get("createdByTeam"),"completionApproverPosition":d.get("createdByPosition")}
    st,r=call("PUT",f"/ehs-plans/{pid}",base); d=r.get("data",{}) or {}
    check("수정 성공", st==200 and d.get("remarks")=="수정됨", f"remarks={d.get('remarks')}")
    check("수정자 flat 채워짐", bool(d.get("modifiedByName")), f"modifiedBy={d.get('modifiedByName')}")
    check("작성자 보존", d.get("createdByName")==nm)
    check("계획/완료 승인자 flat 저장", d.get("planApproverName")==nm and d.get("completionApproverName")==nm)

    print("\n[3] 상신(SUBMIT)")
    st,r=tr("submit"); check("상태=PENDING_APPROVAL", (r.get("data",{}) or {}).get("status")=="PENDING_APPROVAL", f"status={(r.get('data',{}) or {}).get('status')}")

    print("\n[4] 계획 반려(REJECT→DRAFT)")
    st,r=tr("reject","E2E계획반려"); d=r.get("data",{}) or {}
    check("상태=DRAFT", d.get("status")=="DRAFT", f"status={d.get('status')}")
    check("반려사유 저장", d.get("rejectReason")=="E2E계획반려", f"reason={d.get('rejectReason')}")
    check("반려 후 작성자 보존", d.get("createdByName")==nm)

    print("\n[5] 재상신 → 계획승인(APPROVE)")
    tr("submit")
    st,r=tr("approve"); d=r.get("data",{}) or {}
    check("상태=APPROVED", d.get("status")=="APPROVED", f"status={d.get('status')}")
    check("계획승인자(by) 기록", bool(d.get("planApprovedBy")), f"by={d.get('planApprovedBy')}")
    check("계획승인일시 기록", bool(d.get("planApprovedAt")))
    check("승인 후 작성자 보존", d.get("createdByName")==nm)
    check("승인 후 계획승인자 지정 보존", d.get("planApproverName")==nm)

    print("\n[6] 완료상신(completionSubmit) → 완료반려(REJECT→APPROVED)")
    st,r=tr("completionSubmit"); check("상태=COMPLETION_PENDING", (r.get("data",{}) or {}).get("status")=="COMPLETION_PENDING", f"status={(r.get('data',{}) or {}).get('status')}")
    st,r=tr("reject","E2E완료반려"); d=r.get("data",{}) or {}
    check("완료반려→상태=APPROVED", d.get("status")=="APPROVED", f"status={d.get('status')}")
    check("완료반려 사유 저장", d.get("rejectReason")=="E2E완료반려", f"reason={d.get('rejectReason')}")

    print("\n[7] 완료재상신 → 완료승인(COMPLETE→DONE)")
    tr("completionSubmit")
    st,r=tr("complete"); d=r.get("data",{}) or {}
    check("상태=DONE", d.get("status")=="DONE", f"status={d.get('status')}")
    check("완료승인자(by) 기록", bool(d.get("completionApprovedBy")), f"by={d.get('completionApprovedBy')}")
    check("완료승인일시 기록", bool(d.get("completionApprovedAt")))
    check("완료 후 작성자 보존", d.get("createdByName")==nm)
    check("완료 후 완료승인자 지정 보존", d.get("completionApproverName")==nm)
    check("완료 후 중첩 누출 없음", not isinstance(d.get("createdBy"),dict) and not isinstance(d.get("completionApprover"),dict))
finally:
    print("\n[8] 정리(CLEANUP)")
    if pid:
        st,_=call("DELETE",f"/ehs-plans/{pid}"); print(f"  plan {pid} 삭제 status={st}")
        st,r=call("GET",f"/ehs-plans/{pid}")
        check("삭제 후 조회 불가", st==404 or r.get("success") is False, f"status={st}")
print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
