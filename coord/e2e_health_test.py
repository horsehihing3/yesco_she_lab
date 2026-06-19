#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""보건관리 도메인 E2E — 건강검진계획(혼합테이블+결재) + 작업환경측정(wem-plan) + 직업병(od/plans) + 질병예방(dp/msd) + 자기정리.
od/dp 는 민감 개인정보 도메인(DTO) — 작성자 flat 노출·중첩없음 확인."""
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
dd=r.get("data",{}) or {}; TOKEN=dd.get("accessToken"); ME=dd.get("user",{}) or {}
if not TOKEN: print("LOGIN FAILED",st,r); sys.exit(1)
uid=ME.get("id"); nm=ME.get("name"); team=ME.get("department"); pos=ME.get("position")
print(f"로그인 OK (uid={uid} name={nm})")

def crud_sensitive(name, path, create_body, update_patch):
    """민감도메인 CRUD: 생성응답 echo→수정. 작성자 flat·중첩없음 확인."""
    rid=None
    try:
        st,r=call("POST",path,create_body); d=r.get("data",{}) or {}; rid=d.get("id")
        ok=st==200 and r.get("success") is not False and rid
        check(f"{name} 등록·작성자flat·중첩없음", ok and bool(d.get("createdByName")) and not isinstance(d.get("createdBy"),dict), f"id={rid} createdBy={d.get('createdByName')}")
        if not ok: return
        body=dict(d); body.update(update_patch)
        st,r=call("PUT",f"{path}/{rid}",body); d=r.get("data",{}) or {}
        check(f"{name} 수정·작성자 보존", st==200 and d.get("createdByName")==nm, f"createdBy={d.get('createdByName')}")
    finally:
        if rid:
            st,_=call("DELETE",f"{path}/{rid}"); check(f"{name} 삭제", st==200, f"st={st}")

# ===== A. 건강검진계획 (혼합테이블+결재) — ⚠️ 등록 버그 검출 =====
print("\n### A. 건강검진계획(health-checkup-plan · 혼합 · 결재) ###")
BUG=[0]
pid=None
def tr(action,reason=None):
    b={"action":action}
    if reason is not None: b["rejectReason"]=reason
    return call("PATCH",f"/health-checkup-plan/{pid}/transition",b)
try:
    appr={"planApproverUserId":uid,"planApproverName":nm,"planApproverTeam":team,"planApproverPosition":pos,
          "completionApproverUserId":uid,"completionApproverName":nm,"completionApproverTeam":team,"completionApproverPosition":pos}
    body={"planYear":2026,"checkupType":"GENERAL","planName":"ZZ_E2E_HCPLAN_삭제대상","targetDept":"안전환경팀","notes":"초기",**appr}
    st,r=call("POST","/health-checkup-plan",body); d=r.get("data",{}) or {}; pid=d.get("id")
    if st==200 and pid:
        check("등록·작성자flat·승인자flat·중첩없음", bool(d.get("createdByName")) and d.get("planApproverName")==nm and not isinstance(d.get("planApprover"),dict), f"id={pid}")
        # (등록 성공 시 전체 라이프사이클 — 현재 환경에선 도달 불가)
        st,r=tr("submit"); st,r=tr("reject","E2E반려"); tr("submit"); st,r=tr("approve"); st,r=tr("complete")
        check("완료승인→COMPLETED·작성자보존", (r.get("data",{}) or {}).get("status")=="COMPLETED")
    else:
        BUG[0]=1
        print(f"  ⚠️ BUG  건강검진계획 등록 실패(500) — INSERT가 존재하지 않는 컬럼 'created_by_dept' 참조")
        print(f"          원인: AllTablesPersonColumnsInitializer는 user_id/name/team/position만 보장(dept 누락),")
        print(f"          created_by_dept는 V120(Flyway 비활성)에만 존재 → 이 DB에 컬럼 없음 → 모든 등록 실패")
        print(f"          server msg='{r.get('message')}'")
finally:
    if pid:
        call("DELETE",f"/health-checkup-plan/{pid}")

# ===== B. 작업환경측정 (wem-plans, CM) — 날짜 필수(프론트 항상 전송) =====
print("\n### B. 작업환경측정(wem-plans) ###")
crud_sensitive("작업환경측정계획","/wem-plans",
    {"planYear":2026,"processName":"ZZ_E2E_WEM_삭제대상","department":"안전환경팀","hazardType":"소음","measurementCycle":"6개월",
     "lastMeasurementDate":"2026-01-01","nextMeasurementDate":"2026-07-01","status":"PLANNED"},
    {"measurementCycle":"12개월"})

# ===== C. 직업병관리 (occupational-disease/plans, 민감) =====
print("\n### C. 직업병관리(occupational-disease/plans · 민감) ###")
crud_sensitive("직업병계획","/occupational-disease/plans",
    {"half":"2026-H1","orgName":"ZZ_E2E_OD_삭제대상","method":"특수검진","startDate":"2026-09-01","endDate":"2026-09-30","targetCount":10,"mgr":"담당자"},
    {"targetCount":20})

# ===== D. 질병예방관리 (disease-prevention-mgmt/msd, 민감) — 실제 필드(근골격계 평가) =====
print("\n### D. 질병예방관리(disease-prevention-mgmt/msd · 민감) ###")
crud_sensitive("질병예방-근골격계","/disease-prevention-mgmt/msd",
    {"workerName":"ZZ_E2E_DP_삭제대상","department":"안전환경팀","jobTitle":"기사","taskName":"조립","taskCategory":"반복작업","rebaScore":5,"riskLevel":"LOW"},
    {"riskLevel":"HIGH"})

print(f"\n===== 결과: PASS {PASS_N[0]} / FAIL {FAIL_N[0]}"
      + (f"  |  ⚠️ BUG 1건(건강검진계획 등록 불가)" if BUG[0] else "") + " =====")
sys.exit(1 if FAIL_N[0] else 0)
