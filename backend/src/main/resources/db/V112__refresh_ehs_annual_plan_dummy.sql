-- V112: 연간 계획 더미데이터를 새 상태 코드(작성중/승인대기/승인완료/작업완료)로 갱신
--   - DRAFT, PENDING_APPROVAL, APPROVED, DONE 분포
--   - APPROVED / DONE 행은 is_approved = 1, approved_at 셋팅
--   - 그 외는 is_approved = 0

IF OBJECT_ID('tb_ehs_annual_plan', 'U') IS NULL
    RETURN;

-- 일단 모든 더미 row 의 is_approved 초기화
UPDATE tb_ehs_annual_plan SET is_approved = 0, approved_at = NULL, approved_by = NULL;

-- 기존 더미 row 별 새 status 매핑 (plan_name 기반 정확 매칭)
UPDATE tb_ehs_annual_plan SET status = 'DONE',             progress_rate = 100, is_approved = 1, approved_at = '2025-02-05', approved_by = N'관리자' WHERE plan_name = N'연간 EHS 계획 수립';
UPDATE tb_ehs_annual_plan SET status = 'DONE',             progress_rate = 100, is_approved = 1, approved_at = '2025-02-10', approved_by = N'관리자' WHERE plan_name = N'전직원 EHS 교육';
UPDATE tb_ehs_annual_plan SET status = 'DONE',             progress_rate = 100, is_approved = 1, approved_at = '2025-02-20', approved_by = N'관리자' WHERE plan_name = N'1분기 위험성평가';
UPDATE tb_ehs_annual_plan SET status = 'APPROVED',         progress_rate = 70,  is_approved = 1, approved_at = '2025-04-05', approved_by = N'관리자' WHERE plan_name = N'상반기 EHS 감사';
UPDATE tb_ehs_annual_plan SET status = 'DONE',             progress_rate = 100, is_approved = 1, approved_at = '2025-03-15', approved_by = N'관리자' WHERE plan_name = N'작업환경측정 상반기';
UPDATE tb_ehs_annual_plan SET status = 'APPROVED',         progress_rate = 55,  is_approved = 1, approved_at = '2025-01-15', approved_by = N'관리자' WHERE plan_name = N'온실가스 감축 활동';
UPDATE tb_ehs_annual_plan SET status = 'DONE',             progress_rate = 100, is_approved = 1, approved_at = '2025-02-25', approved_by = N'관리자' WHERE plan_name = N'화학물질 MSDS 갱신';
UPDATE tb_ehs_annual_plan SET status = 'APPROVED',         progress_rate = 40,  is_approved = 1, approved_at = '2025-01-10', approved_by = N'관리자' WHERE plan_name = N'비상대응 훈련';
UPDATE tb_ehs_annual_plan SET status = 'PENDING_APPROVAL', progress_rate = 30                                                                              WHERE plan_name = N'법규 변경사항 반영';
UPDATE tb_ehs_annual_plan SET status = 'DRAFT',            progress_rate = 0                                                                                WHERE plan_name = N'하반기 특수건강검진';

-- 안전망: 위 매칭에서 누락된 row 가 있으면 status 정규화
UPDATE tb_ehs_annual_plan
   SET status = 'DRAFT'
 WHERE status IS NULL
    OR status NOT IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DONE');
