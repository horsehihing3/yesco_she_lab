#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""작업허가(PTW, /permit-to-work) E2E — PersonRef(createdBy·planApprover·completionApprover) + 2단계 결재.
actions: submit → approve → completionSubmit → complete (반려도 검증).
ZZ_E2E_* 마커, 끝에 삭제."""
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

ptw_id = None
try:
    # 1) 등록 — 서버가 createdBy를 JWT에서 자동 세팅
    print("\n[1] 등록(CREATE)")
    st, r = call("POST", "/permit-to-work", {
        "permitType":"GENERAL","riskLevel":"LOW",
        "title":"ZZ_E2E_PTW_삭제대상",
        "description":"E2E 작업허가 등록 검증",
        "workLocation":"E2E테스트현장",
        "workStartDate":"2026-07-01T09:00:00","workEndDate":"2026-07-01T18:00:00",
        "requesterName":"E2E신청자","requesterDept":"안전환경팀",
        "safetyMeasures":"E2E안전조치","workersCount":2
    })
    d = r.get("data",{}) or {}
    ptw_id = d.get("id"); my_uid = d.get("createdByUserId"); my_name = d.get("createdByName")
    my_team = d.get("createdByTeam"); my_pos = d.get("createdByPosition")
    check("등록 성공", st==200 and ptw_id is not None, f"id={ptw_id}")
    check("작성자(createdBy) flat 채워짐", bool(my_name), f"createdBy={my_team}/{my_name}/{my_pos} uid={my_uid}")
    check("createdBy 중첩 누출 없음", not isinstance(d.get("createdBy"), dict))
    check("planApprover 중첩 누출 없음(초기)", not isinstance(d.get("planApprover"), dict))
    status_initial = d.get("status")
    check("초기status 유효", status_initial in ("DRAFT","draft","PENDING","pending","OPEN","open"), f"status={status_initial}")

    # 2) 수정 — 승인자=본인 (status는 현재 상태 유지)
    print("\n[2] 수정(UPDATE) — planApprover·completionApprover=본인")
    st, r = call("PUT", f"/permit-to-work/{ptw_id}", {
        "permitType":"GENERAL","riskLevel":"LOW",
        "status": status_initial,
        "title":"ZZ_E2E_PTW_삭제대상","description":"E2E 수정됨",
        "workLocation":"E2E테스트현장",
        "workStartDate":"2026-07-01T09:00:00","workEndDate":"2026-07-01T18:00:00",
        "requesterName":"E2E신청자","requesterDept":"안전환경팀",
        "planApproverUserId":my_uid,"planApproverName":my_name,
        "planApproverTeam":my_team,"planApproverPosition":my_pos,
        "completionApproverUserId":my_uid,"completionApproverName":my_name,
        "completionApproverTeam":my_team,"completionApproverPosition":my_pos
    })
    d = r.get("data",{}) or {}
    check("수정 성공", st==200, f"status={st}")
    check("planApprover flat 저장", d.get("planApproverName")==my_name, f"planApproverName={d.get('planApproverName')}")
    check("planApprover 중첩 누출 없음", not isinstance(d.get("planApprover"), dict))
    check("completionApprover flat 저장", d.get("completionApproverName")==my_name)
    check("completionApprover 중첩 누출 없음", not isinstance(d.get("completionApprover"), dict))
    check("createdBy flat 보존(수정 후)", d.get("createdByName")==my_name, f"createdByName={d.get('createdByName')}")

    # 3) 상신
    print("\n[3] 상신(submit)")
    st, r = call("PATCH", f"/permit-to-work/{ptw_id}/transition", {"action":"submit"})
    d = r.get("data",{}) or {}
    submitted_status = d.get("status")
    check("상신 성공", st==200, f"status={submitted_status}")
    check("상신 후 status in SUBMITTED/PENDING_APPROVAL", submitted_status in ("SUBMITTED","PENDING_APPROVAL"), f"status={submitted_status}")

    # 4) 반려
    print("\n[4] 반려(reject)")
    st, r = call("PATCH", f"/permit-to-work/{ptw_id}/transition", {"action":"reject","rejectReason":"E2E반려테스트"})
    d = r.get("data",{}) or {}
    check("반려 성공", st==200, f"status={d.get('status')}")
    check("createdBy flat 보존(반려 후)", d.get("createdByName")==my_name)

    # 5) 재상신
    print("\n[5] 재상신")
    st, r = call("PATCH", f"/permit-to-work/{ptw_id}/transition", {"action":"submit"})
    d = r.get("data",{}) or {}
    check("재상신 성공", st==200, f"status={d.get('status')}")

    # 6) 계획 승인
    print("\n[6] 계획승인(approve)")
    st, r = call("PATCH", f"/permit-to-work/{ptw_id}/transition", {"action":"approve"})
    d = r.get("data",{}) or {}
    check("계획승인 성공·status=APPROVED", st==200 and "APPROVED" in str(d.get("status","")), f"status={d.get('status')}")
    check("planApprovedAt 기록", bool(d.get("planApprovedAt")), f"at={d.get('planApprovedAt')}")
    check("planApprover flat 보존", d.get("planApproverName")==my_name)
    check("createdBy flat 보존(승인 후)", d.get("createdByName")==my_name)

    # 7) 완료 상신
    print("\n[7] 완료상신(completionSubmit)")
    st, r = call("PATCH", f"/permit-to-work/{ptw_id}/transition", {"action":"completionSubmit"})
    d = r.get("data",{}) or {}
    check("완료상신 성공", st==200, f"status={d.get('status')}")

    # 8) 완료 승인
    print("\n[8] 완료승인(complete)")
    st, r = call("PATCH", f"/permit-to-work/{ptw_id}/transition", {"action":"complete"})
    d = r.get("data",{}) or {}
    check("완료승인 성공·status=COMPLETED or DONE", st==200 and d.get("status") in ("COMPLETED","DONE"), f"status={d.get('status')}")
    check("completionApprovedAt 기록", bool(d.get("completionApprovedAt")), f"at={d.get('completionApprovedAt')}")
    check("completionApprover flat 보존", d.get("completionApproverName")==my_name)

finally:
    print("\n[9] 정리(DELETE)")
    if ptw_id:
        st,_ = call("DELETE", f"/permit-to-work/{ptw_id}")
        print(f"  permitToWork {ptw_id} 삭제 status={st}")
        st, r = call("GET", f"/permit-to-work/{ptw_id}")
        gone = (st==404) or (r.get("success") is False) or (r.get("data") is None and st!=200)
        check("삭제 후 조회 불가", gone or st==500, f"status={st}")

# ZZ_E2E 잔존 확인
print("\n========== ZZ_E2E 잔존 확인 ==========")
st, r = call("GET", "/permit-to-work/search?title=ZZ_E2E&size=50")
if st == 200:
    items = (r.get("data",{}) or {}).get("content",[]) or []
    zz = [x for x in items if "ZZ_E2E" in str(x.get("title",""))]
else:
    st2, r2 = call("GET", "/permit-to-work?size=100")
    items = (r2.get("data",{}) or {}).get("content",[]) or []
    zz = [x for x in items if "ZZ_E2E" in str(x.get("title",""))]
check("ZZ_E2E 0건", len(zz)==0, f"잔존={len(zz)}")

print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
