#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""감사 실시(tb_audit) 라이프사이클 API E2E — PersonRef(혼합: JSON 작성/승인자 + flat 수정자) 검증 + 자기정리.
계획 등록(승인자·완료승인자=본인) → 계획승인(감사 자동생성) → 감사 수정 → 완료반려 → 완료승인 → cleanup.
공유 DB에 테스트 레코드(ZZ_E2E_EXEC_삭제대상)를 잠깐 쓰고 끝에 모두 삭제."""
import json, urllib.request, urllib.error, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

BASE = "http://localhost:7501/api"
USER, PASS = "yujeong.jung", "com4in!!"
PASS_N=[0]; FAIL_N=[0]; TOKEN=None

def call(method, path, body=None, auth=True):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE+path, data=data, method=method)
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

st, r = call("POST","/auth/login",{"username":USER,"password":PASS},auth=False)
TOKEN = r.get("data",{}).get("accessToken")
if not TOKEN: print("LOGIN FAILED",st,r); sys.exit(1)
print("로그인 OK")

plan_id=None; audit_id=None
try:
    # 0) 계획 등록 + 승인자/완료승인자=본인 → 승인 → 감사 자동생성
    print("\n[0] 사전준비: 계획 등록(승인자·완료승인자=본인) → 승인 → 감사 자동생성")
    st,r = call("POST","/audit-plan",{"auditName":"ZZ_E2E_EXEC_삭제대상","auditType":"INTERNAL",
        "targetDept":"안전환경팀","auditorName":"테스트감사자","planStartDate":"2026-07-01",
        "planEndDate":"2026-07-31","purpose":"감사실시 E2E","notes":"초기"})
    d=r.get("data",{}) or {}; plan_id=d.get("id"); my_uid=d.get("createdByUserId"); my_name=d.get("createdByName")
    call("PUT",f"/audit-plan/{plan_id}",{**d,
        "planApproverUserId":my_uid,"planApproverName":my_name,"planApproverTeam":d.get("createdByTeam"),"planApproverPosition":d.get("createdByPosition"),
        "completionApproverUserId":my_uid,"completionApproverName":my_name,"completionApproverTeam":d.get("createdByTeam"),"completionApproverPosition":d.get("createdByPosition")})
    call("PATCH",f"/audit-plan/{plan_id}/submit")
    st,r = call("PATCH",f"/audit-plan/{plan_id}/approve")
    check("계획 승인 성공", st==200 and (r.get("data",{}) or {}).get("status")=="APPROVED")

    # 1) 자동생성 감사 조회 + 상속값 검증
    print("\n[1] 자동생성 감사 조회 + 상속 검증")
    st,r = call("GET","/audit?size=50")
    items=(r.get("data",{}) or {}).get("content",[]) or []
    audit=next((a for a in items if a.get("planId")==plan_id),None)
    check("감사 자동생성", audit is not None, f"auditId={audit.get('auditId') if audit else None} status={audit.get('status') if audit else None}")
    if not audit: raise SystemExit("감사 미생성 — 중단")
    audit_id=audit.get("id")
    check("작성자 flat 상속", audit.get("createdByName")==my_name, f"createdBy={audit.get('createdByName')}")
    check("계획승인자 flat 상속", audit.get("planApproverName")==my_name)
    check("완료승인자 flat 상속", audit.get("completionApproverName")==my_name, f"completionApprover={audit.get('completionApproverName')}")
    check("중첩 누출 없음", not isinstance(audit.get("createdBy"),dict) and not isinstance(audit.get("completionApprover"),dict))

    # 2) 감사 수정 — 전체 객체 echo + summary 변경 (modifiedBy 는 flat 레거시)
    print("\n[2] 감사 수정(UPDATE) — 혼합: 수정자 flat + 승인자 JSON 보존")
    body=dict(audit); body["summary"]="E2E 수정 요약"; body["notes"]="수정됨"
    st,r = call("PUT",f"/audit/{audit_id}",body)
    d=r.get("data",{}) or {}
    check("수정 성공", st==200 and d.get("summary")=="E2E 수정 요약", f"summary={d.get('summary')}")
    check("수정자 flat 채워짐(레거시)", bool(d.get("modifiedByName")), f"modifiedBy={d.get('modifiedByName')}")
    check("작성자 보존", d.get("createdByName")==my_name, f"createdBy={d.get('createdByName')}")
    check("완료승인자 JSON 보존(수정 시 null 안됨)", d.get("completionApproverName")==my_name, f"completionApprover={d.get('completionApproverName')}")
    check("수정 후 중첩 누출 없음", not isinstance(d.get("completionApprover"),dict))

    # 3) 완료 반려(REJECT) — 사유 저장, 상태 IN_PROGRESS
    print("\n[3] 완료반려(REJECT)")
    st,r = call("PATCH",f"/audit/{audit_id}/reject",{"rejectReason":"E2E완료반려"})
    d=r.get("data",{}) or {}
    check("반려 성공·상태=IN_PROGRESS", st==200 and d.get("status")=="IN_PROGRESS", f"status={d.get('status')}")
    check("반려사유 저장", d.get("rejectReason")=="E2E완료반려", f"reason={d.get('rejectReason')}")
    check("반려 시 완료승인자(by) 없음", not d.get("completionApprovedBy"))
    check("반려 후 완료승인자 지정 보존", d.get("completionApproverName")==my_name)

    # 4) 완료 승인(COMPLETE) — 상태 COMPLETED, 완료승인자 기록, 사유 클리어, 지정 보존
    print("\n[4] 완료승인(COMPLETE)")
    st,r = call("PATCH",f"/audit/{audit_id}/complete")
    d=r.get("data",{}) or {}
    check("완료 성공·상태=COMPLETED", st==200 and d.get("status")=="COMPLETED", f"status={d.get('status')}")
    check("완료승인자(completion_approved_by) 기록", bool(d.get("completionApprovedBy")), f"by={d.get('completionApprovedBy')}")
    check("완료승인일시 기록", bool(d.get("completionApprovedAt")), f"at={d.get('completionApprovedAt')}")
    check("완료 시 반려사유 클리어", not d.get("rejectReason"), f"reason={d.get('rejectReason')}")
    check("완료 후 작성자 보존", d.get("createdByName")==my_name)
    check("완료 후 완료승인자 지정 보존", d.get("completionApproverName")==my_name)
    check("완료 후 중첩 누출 없음", not isinstance(d.get("createdBy"),dict) and not isinstance(d.get("completionApprover"),dict))
finally:
    print("\n[5] 정리(CLEANUP)")
    if audit_id:
        st,_=call("DELETE",f"/audit/{audit_id}"); print(f"  audit {audit_id} 삭제 status={st}")
    if plan_id:
        st,_=call("DELETE",f"/audit-plan/{plan_id}"); print(f"  plan {plan_id} 삭제 status={st}")

print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
