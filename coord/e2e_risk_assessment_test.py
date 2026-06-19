#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""위험성평가(/risk-assessments) E2E — PersonRef(planApprover/completionApprover) + 결재 사이클 검증.
author_* 는 flat 컬럼(비PersonRef). planApprover/completionApprover 는 PersonRef.
등록→수정(승인자=본인)→상신→반려→재상신→승인→완료상신→완료승인→cleanup."""
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

ra_id = None; risk_id_str = None
try:
    # 1) 등록
    print("\n[1] 등록(CREATE)")
    st, r = call("POST", "/risk-assessments", {
        "title":"ZZ_E2E_RISK_삭제대상",
        "site":"E2E테스트사업장",
        "authorName":"E2E테스터"
    })
    d = r.get("data",{}) or {}
    ra_id = d.get("id"); risk_id_str = d.get("riskId")
    my_uid = d.get("authorUserId"); my_name = d.get("authorName")
    my_team = d.get("authorTeam"); my_pos = d.get("authorPosition")
    check("등록 성공", st==200 and ra_id is not None, f"id={ra_id} riskId={risk_id_str}")
    check("작성자(author) flat 채워짐", bool(my_uid), f"authorTeam={my_team}/{my_name}/{my_pos} uid={my_uid}")
    check("author 중첩 누출 없음", not isinstance(d.get("author"), dict), f"author={type(d.get('author'))}")
    check("planApprover 중첩 누출 없음(초기)", not isinstance(d.get("planApprover"), dict))
    check("status=PLAN or DRAFT", d.get("status") in ("PLAN","DRAFT","plan","draft"), f"status={d.get('status')}")

    # 2) 수정 — 계획승인자·완료승인자=본인
    print("\n[2] 수정(UPDATE) — 승인자=본인 지정")
    st, r = call("PUT", f"/risk-assessments/{ra_id}", {
        "title":"ZZ_E2E_RISK_삭제대상","site":"E2E테스트사업장","authorName":my_name,
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

    # 3) 상신
    print("\n[3] 상신(submit)")
    st, r = call("PATCH", f"/risk-assessments/{ra_id}/transition", {"action":"submit"})
    d = r.get("data",{}) or {}
    check("상신 성공·status=SUBMITTED", st==200 and d.get("status")=="SUBMITTED", f"status={d.get('status')}")

    # 4) 반려
    print("\n[4] 반려(reject)")
    st, r = call("PATCH", f"/risk-assessments/{ra_id}/transition", {"action":"reject","rejectReason":"E2E반려테스트"})
    d = r.get("data",{}) or {}
    check("반려 성공·status=REJECTED", st==200 and d.get("status")=="REJECTED", f"status={d.get('status')}")
    check("반려사유 저장", d.get("rejectReason")=="E2E반려테스트", f"reason={d.get('rejectReason')}")
    check("반려 후 planApprover flat 보존", d.get("planApproverName")==my_name)

    # 5) 재상신
    print("\n[5] 재상신(re-submit)")
    st, r = call("PATCH", f"/risk-assessments/{ra_id}/transition", {"action":"submit"})
    d = r.get("data",{}) or {}
    check("재상신 성공·status=SUBMITTED", st==200 and d.get("status")=="SUBMITTED", f"status={d.get('status')}")

    # 6) 계획 승인
    print("\n[6] 계획승인(approve)")
    st, r = call("PATCH", f"/risk-assessments/{ra_id}/transition", {"action":"approve"})
    d = r.get("data",{}) or {}
    check("승인 성공·status=APPROVED", st==200 and d.get("status")=="APPROVED", f"status={d.get('status')}")
    check("planApprovedAt 기록", bool(d.get("planApprovedAt")), f"at={d.get('planApprovedAt')}")
    check("planApprover flat 보존(승인 후)", d.get("planApproverName")==my_name)
    check("author flat 보존(승인 후)", d.get("authorName")==my_name or bool(d.get("authorUserId")), f"author={d.get('authorName')}")

    # 7) 완료 상신
    print("\n[7] 완료상신(completionSubmit)")
    st, r = call("PATCH", f"/risk-assessments/{ra_id}/transition", {"action":"completionSubmit"})
    d = r.get("data",{}) or {}
    check("완료상신 성공·status=COMPLETION_SUBMITTED", st==200 and d.get("status")=="COMPLETION_SUBMITTED", f"status={d.get('status')}")

    # 8) 완료 승인
    print("\n[8] 완료승인(complete)")
    st, r = call("PATCH", f"/risk-assessments/{ra_id}/transition", {"action":"complete"})
    d = r.get("data",{}) or {}
    check("완료승인·status=COMPLETED", st==200 and d.get("status")=="COMPLETED", f"status={d.get('status')}")
    check("completionApprovedAt 기록", bool(d.get("completionApprovedAt")), f"at={d.get('completionApprovedAt')}")
    check("completionApprover flat 보존", d.get("completionApproverName")==my_name)

finally:
    # 9) 정리
    print("\n[9] 정리(DELETE)")
    if ra_id:
        st,_ = call("DELETE", f"/risk-assessments/{ra_id}")
        print(f"  riskAssessment {ra_id} 삭제 status={st}")
        st, r = call("GET", f"/risk-assessments/{ra_id}")
        gone = (st==404) or (r.get("success") is False) or (r.get("data") is None and st!=200)
        check("삭제 후 조회 불가", gone or st==500, f"status={st}")

# ZZ_E2E 잔존 확인
print("\n========== ZZ_E2E 잔존 확인 ==========")
st, r = call("GET", "/risk-assessments?size=50")
items = (r.get("data",{}) or {}).get("content",[]) or []
zz = [x for x in items if "ZZ_E2E" in str(x.get("title",""))]
check("ZZ_E2E 0건", len(zz)==0, f"잔존={len(zz)}")

print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
