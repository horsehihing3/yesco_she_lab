#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""현장안전관리(/site-safety-plans) E2E — PersonRef(createdBy·planApprover·completionApprover) + 결재 사이클.
note: modified_by 는 레거시 flat(username 문자열), modifiedByName/Team/Position 은 flat 유지.
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

plan_id = None
try:
    # 1) 등록 — 서버가 createdBy를 JWT에서 자동 세팅
    print("\n[1] 등록(CREATE)")
    st, r = call("POST", "/site-safety-plans", {
        "planType":"INTERNAL",
        "title":"ZZ_E2E_SITESAFETY_삭제대상",
        "workType":"E2E테스트작업",
        "riskLevel":"LOW",
        "workLocation":"E2E테스트현장",
        "workDescription":"E2E 현장안전관리 등록 검증"
    })
    d = r.get("data",{}) or {}
    plan_id = d.get("id"); my_uid = d.get("createdByUserId"); my_name = d.get("createdByName")
    my_team = d.get("createdByTeam"); my_pos = d.get("createdByPosition")
    check("등록 성공", st==200 and plan_id is not None, f"id={plan_id}")
    check("작성자(createdBy) flat 채워짐", bool(my_name), f"createdBy={my_team}/{my_name}/{my_pos} uid={my_uid}")
    check("createdBy 중첩 누출 없음", not isinstance(d.get("createdBy"), dict), f"type={type(d.get('createdBy'))}")
    check("status=DRAFT", d.get("status") in ("DRAFT","draft"), f"status={d.get('status')}")

    # 2) 수정 — 승인자=본인
    print("\n[2] 수정(UPDATE) — planApprover·completionApprover=본인")
    st, r = call("PUT", f"/site-safety-plans/{plan_id}", {
        "planType":"INTERNAL","title":"ZZ_E2E_SITESAFETY_삭제대상",
        "workType":"E2E테스트작업","riskLevel":"LOW","workLocation":"E2E테스트현장",
        "workDescription":"E2E 수정됨",
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
    check("createdBy flat 보존(수정 후)", d.get("createdByName")==my_name, f"createdBy={d.get('createdByName')}")
    check("modifiedByName flat 갱신", bool(d.get("modifiedByName")), f"modifiedByName={d.get('modifiedByName')}")

    # 3) 상신
    print("\n[3] 상신(submit)")
    st, r = call("PATCH", f"/site-safety-plans/{plan_id}/transition", {"action":"submit"})
    d = r.get("data",{}) or {}
    check("상신 성공·status=PENDING_APPROVAL", st==200 and d.get("status")=="PENDING_APPROVAL", f"status={d.get('status')}")

    # 4) 반려
    print("\n[4] 반려(reject)")
    st, r = call("PATCH", f"/site-safety-plans/{plan_id}/transition", {"action":"reject","rejectReason":"E2E반려테스트"})
    d = r.get("data",{}) or {}
    check("반려 성공·status=REJECTED", st==200 and d.get("status")=="REJECTED", f"status={d.get('status')}")
    check("반려사유 저장", d.get("rejectReason")=="E2E반려테스트")
    check("createdBy flat 보존(반려 후)", d.get("createdByName")==my_name)

    # 5) 재상신
    print("\n[5] 재상신")
    st, r = call("PATCH", f"/site-safety-plans/{plan_id}/transition", {"action":"submit"})
    d = r.get("data",{}) or {}
    check("재상신 성공·status=PENDING_APPROVAL", st==200 and d.get("status")=="PENDING_APPROVAL", f"status={d.get('status')}")

    # 6) 승인
    print("\n[6] 계획승인(approve)")
    st, r = call("PATCH", f"/site-safety-plans/{plan_id}/transition", {"action":"approve"})
    d = r.get("data",{}) or {}
    check("승인 성공·status=APPROVED", st==200 and d.get("status")=="APPROVED", f"status={d.get('status')}")
    check("planApprovedAt 기록", bool(d.get("planApprovedAt")), f"at={d.get('planApprovedAt')}")
    check("planApprover flat 보존(승인 후)", d.get("planApproverName")==my_name)
    check("createdBy flat 보존(승인 후)", d.get("createdByName")==my_name)

    # 7) 완료 상신
    print("\n[7] 완료상신(completionSubmit)")
    st, r = call("PATCH", f"/site-safety-plans/{plan_id}/transition", {"action":"completionSubmit"})
    d = r.get("data",{}) or {}
    check("완료상신 성공·status=COMPLETION_PENDING", st==200 and d.get("status")=="COMPLETION_PENDING", f"status={d.get('status')}")

    # 8) 완료 승인
    print("\n[8] 완료승인(complete)")
    st, r = call("PATCH", f"/site-safety-plans/{plan_id}/transition", {"action":"complete"})
    d = r.get("data",{}) or {}
    check("완료승인·status=DONE", st==200 and d.get("status")=="DONE", f"status={d.get('status')}")
    check("completionApprovedAt 기록", bool(d.get("completionApprovedAt")), f"at={d.get('completionApprovedAt')}")
    check("completionApprover flat 보존", d.get("completionApproverName")==my_name)

finally:
    print("\n[9] 정리(DELETE)")
    if plan_id:
        st,_ = call("DELETE", f"/site-safety-plans/{plan_id}")
        print(f"  siteSafetyPlan {plan_id} 삭제 status={st}")
        st, r = call("GET", f"/site-safety-plans/{plan_id}")
        gone = (st==404) or (r.get("success") is False) or (r.get("data") is None and st!=200)
        check("삭제 후 조회 불가", gone or st==500, f"status={st}")

# ZZ_E2E 잔존 확인
print("\n========== ZZ_E2E 잔존 확인 ==========")
st, r = call("GET", "/site-safety-plans?size=100")
items = (r.get("data",{}) or {}).get("content",[]) or []
zz = [x for x in items if "ZZ_E2E" in str(x.get("title",""))]
check("ZZ_E2E 0건", len(zz)==0, f"잔존={len(zz)}")

print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]} =====")
sys.exit(1 if FAIL_N[0] else 0)
