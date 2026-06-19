#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""내부감사(audit-plan) 전 라이프사이클 API E2E — PersonRef 표준화 검증 + 자기정리.
등록→수정(승인자=본인)→상신→반려→재상신→승인→자동생성 audit 검증→cleanup.
공유 DB에 테스트 레코드(ZZ_E2E_TEST_삭제대상)를 잠깐 쓰고 끝에 모두 삭제."""
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

plan_id = None; created_audit_id = None
try:
    # 1) 등록
    print("\n[1] 등록(CREATE)")
    st, r = call("POST", "/audit-plan", {
        "auditName":"ZZ_E2E_TEST_삭제대상","auditType":"INTERNAL","targetDept":"안전환경팀",
        "auditorName":"테스트감사자","planStartDate":"2026-07-01","planEndDate":"2026-07-31",
        "purpose":"E2E 표준화 검증","notes":"초기등록"})
    d = r.get("data",{}) or {}
    plan_id = d.get("id"); my_uid = d.get("createdByUserId"); my_name = d.get("createdByName")
    check("등록 성공", st==200 and plan_id is not None, f"id={plan_id} planId={d.get('planId')}")
    check("작성자 flat 채워짐", bool(my_name), f"createdBy={d.get('createdByTeam')}/{my_name}/{d.get('createdByPosition')} uid={my_uid}")
    check("중첩 누출 없음", "createdBy" not in d or not isinstance(d.get("createdBy"),dict))
    check("상태=PLAN", d.get("status")=="PLAN", f"status={d.get('status')}")

    # 2) 수정 — 계획승인자=본인 지정 + 작성자 보존 검증
    print("\n[2] 수정(UPDATE) — 승인자=본인 지정")
    st, r = call("PUT", f"/audit-plan/{plan_id}", {
        "auditName":"ZZ_E2E_TEST_삭제대상","auditType":"INTERNAL","targetDept":"안전환경팀",
        "auditorName":"테스트감사자","planStartDate":"2026-07-01","planEndDate":"2026-07-31",
        "purpose":"E2E 표준화 검증","notes":"수정됨",
        "planApproverUserId":my_uid,"planApproverName":my_name,
        "planApproverTeam":d.get("createdByTeam"),"planApproverPosition":d.get("createdByPosition")})
    d = r.get("data",{}) or {}
    check("수정 성공", st==200 and d.get("notes")=="수정됨", f"notes={d.get('notes')}")
    check("수정자 flat 채워짐", bool(d.get("modifiedByName")), f"modifiedBy={d.get('modifiedByName')}")
    check("작성자 보존(수정자가 덮어쓰지 않음)", d.get("createdByName")==my_name, f"createdBy={d.get('createdByName')}")
    check("계획승인자 flat 저장", d.get("planApproverName")==my_name, f"planApprover={d.get('planApproverName')}")
    check("승인자 중첩 누출 없음", not isinstance(d.get("planApprover"),dict))

    # 3) 상신
    print("\n[3] 상신(SUBMIT)")
    st, r = call("PATCH", f"/audit-plan/{plan_id}/submit")
    d = r.get("data",{}) or {}
    check("상신 성공·상태=PENDING_APPROVAL", st==200 and d.get("status")=="PENDING_APPROVAL", f"status={d.get('status')}")

    # 4) 반려 — 사유 저장(본인=승인자라 권한 통과)
    print("\n[4] 반려(REJECT)")
    st, r = call("PATCH", f"/audit-plan/{plan_id}/reject", {"rejectReason":"E2E반려테스트"})
    d = r.get("data",{}) or {}
    check("반려 성공·상태=PLAN", st==200 and d.get("status")=="PLAN", f"status={d.get('status')}")
    check("반려사유 저장", d.get("rejectReason")=="E2E반려테스트", f"reason={d.get('rejectReason')}")
    check("반려 후 계획승인일시 없음", not d.get("planApprovedAt"))
    check("반려 후에도 작성자 보존", d.get("createdByName")==my_name)

    # 5) 재상신 — 반려사유 클리어 확인
    print("\n[5] 재상신(RE-SUBMIT)")
    st, r = call("PATCH", f"/audit-plan/{plan_id}/submit")
    d = r.get("data",{}) or {}
    check("재상신 성공·상태=PENDING_APPROVAL", st==200 and d.get("status")=="PENDING_APPROVAL", f"status={d.get('status')}")
    check("재상신 시 반려사유 클리어", not d.get("rejectReason"), f"reason={d.get('rejectReason')}")

    # 6) 승인 — 승인자 기록 + 작성자/수정자 보존 + 자동 audit 생성
    print("\n[6] 승인(APPROVE)")
    st, r = call("PATCH", f"/audit-plan/{plan_id}/approve")
    d = r.get("data",{}) or {}
    check("승인 성공·상태=APPROVED", st==200 and d.get("status")=="APPROVED", f"status={d.get('status')}")
    check("계획승인자(plan_approved_by) 기록", bool(d.get("planApprovedBy")), f"by={d.get('planApprovedBy')}")
    check("계획승인일시 기록", bool(d.get("planApprovedAt")), f"at={d.get('planApprovedAt')}")
    check("승인 후 작성자 보존", d.get("createdByName")==my_name, f"createdBy={d.get('createdByName')}")
    check("승인 후 계획승인자 flat 보존", d.get("planApproverName")==my_name)

    # 7) 자동 생성된 감사(tb_audit) PersonRef 왕복 검증
    print("\n[7] 자동생성 감사(AUDIT) PersonRef 검증")
    st, r = call("GET", "/audit?size=50")
    items = (r.get("data",{}) or {}).get("content",[]) or []
    audit = next((a for a in items if a.get("planId")==plan_id), None)
    check("계획→감사 자동생성 확인", audit is not None, f"auditId={audit.get('auditId') if audit else None}")
    if audit:
        created_audit_id = audit.get("id")
        check("감사 작성자 flat 복사", audit.get("createdByName")==my_name, f"createdBy={audit.get('createdByName')}")
        check("감사 계획승인자 flat 복사", audit.get("planApproverName")==my_name, f"planApprover={audit.get('planApproverName')}")
        check("감사 중첩 누출 없음", not isinstance(audit.get("createdBy"),dict) and not isinstance(audit.get("planApprover"),dict))
finally:
    # 8) 정리 — 자동생성 audit + plan 모두 삭제
    print("\n[8] 정리(CLEANUP)")
    if created_audit_id:
        st,_ = call("DELETE", f"/audit/{created_audit_id}")
        print(f"  audit {created_audit_id} 삭제 status={st}")
    if plan_id:
        st,_ = call("DELETE", f"/audit-plan/{plan_id}")
        print(f"  plan {plan_id} 삭제 status={st}")
        st, r = call("GET", f"/audit-plan/{plan_id}")
        gone = (st==404) or (r.get("success") is False)
        check("plan soft-delete 후 조회 불가", gone, f"status={st}")

print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
