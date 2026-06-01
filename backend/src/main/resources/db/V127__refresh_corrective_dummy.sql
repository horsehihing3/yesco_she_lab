-- V127: 시정조치 더미데이터 재구성 (다건 입력 패턴)
-- 새 화면: 감사 선택 → 모든 부적합 사항을 일괄로 등록
-- 새 4종 상태(IN_PROGRESS/COMPLETED/DEMONSTRATION/NA) 만 사용
--
-- 주의: tb_audit / tb_audit_finding 행이 없으면 INSERT 자체를 skip 하도록 INNER JOIN 사용.
--      finding.audit_id 가 NULL 이거나 finding 이 없으면 해당 행 누락.

-- 1) 기존 더미 전부 삭제 (재실행 안전)
IF OBJECT_ID('tb_audit_corrective', 'U') IS NOT NULL
BEGIN
    DELETE FROM tb_audit_corrective WHERE corrective_id LIKE 'AUD-CA-2026-%';
END;

-- 2) 기본 사용자 (담당자 채우기용) 1명 캐시
DECLARE @uName NVARCHAR(100) = (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID);
DECLARE @uDept NVARCHAR(100) = (SELECT TOP 1 DeptCode  FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID);

-- 3) 새 더미: 감사별 모든 finding 에 대해 시정조치 1:1 등록 (다건 입력 결과)

-- AUD-2026-001 (3건 finding): COMPLETED / COMPLETED / IN_PROGRESS
INSERT INTO tb_audit_corrective (corrective_id, finding_id, audit_id, finding_description, severity, action_description, responsible_name, responsible_dept, due_date, completion_rate, status, notes, deleted, created_at, modified_at)
SELECT 'AUD-CA-2026-001', f.id, a.id,
       N'분전반 3호기 누전차단기 동작 불량', 'CRITICAL',
       N'누전차단기 교체 및 전기설비 전수 점검 실시. 동일 제조사 차단기 전체 교체.',
       @uName, @uDept,
       '2026-03-21', 100, 'COMPLETED', N'3월 18일 교체 완료, 전수 점검 3월 20일 완료',
       0, GETDATE(), GETDATE()
FROM tb_audit_finding f
INNER JOIN tb_audit a ON f.audit_id = a.id
WHERE f.finding_id = 'AUD-FD-2026-001';

INSERT INTO tb_audit_corrective (corrective_id, finding_id, audit_id, finding_description, severity, action_description, responsible_name, responsible_dept, due_date, completion_rate, status, notes, deleted, created_at, modified_at)
SELECT 'AUD-CA-2026-002', f.id, a.id,
       N'B동 2층 소화기 유효기간 초과', 'MINOR',
       N'소화기 교체 및 전 건물 소화기 유효기간 일괄 점검.',
       @uName, @uDept,
       '2026-03-25', 100, 'COMPLETED', N'3월 22일 완료',
       0, GETDATE(), GETDATE()
FROM tb_audit_finding f
INNER JOIN tb_audit a ON f.audit_id = a.id
WHERE f.finding_id = 'AUD-FD-2026-002';

INSERT INTO tb_audit_corrective (corrective_id, finding_id, audit_id, finding_description, severity, action_description, responsible_name, responsible_dept, due_date, completion_rate, status, notes, deleted, created_at, modified_at)
SELECT 'AUD-CA-2026-003', f.id, a.id,
       N'A동 1층 전기실 주변 정리정돈 미흡', 'OBSERVATION',
       N'정기 점검 항목에 정리정돈 추가, 시설관리팀 주간 라운드 확대.',
       @uName, @uDept,
       '2026-04-15', 50, 'IN_PROGRESS', N'주간 라운드 시작, 차주부터 본격 적용',
       0, GETDATE(), GETDATE()
FROM tb_audit_finding f
INNER JOIN tb_audit a ON f.audit_id = a.id
WHERE f.finding_id = 'AUD-FD-2026-003';

-- AUD-2026-002 (2건 finding): IN_PROGRESS / DEMONSTRATION
INSERT INTO tb_audit_corrective (corrective_id, finding_id, audit_id, finding_description, severity, action_description, responsible_name, responsible_dept, due_date, completion_rate, status, notes, deleted, created_at, modified_at)
SELECT 'AUD-CA-2026-004', f.id, a.id,
       N'밀폐공간 산소농도 측정 미실시', 'CRITICAL',
       N'휴대용 산소농도 측정기 2대 추가 구매. 밀폐공간 작업 절차서 개정 및 교육 실시.',
       @uName, @uDept,
       '2026-04-05', 60, 'IN_PROGRESS', N'측정기 발주 완료, 4월 2일 입고 예정',
       0, GETDATE(), GETDATE()
FROM tb_audit_finding f
INNER JOIN tb_audit a ON f.audit_id = a.id
WHERE f.finding_id = 'AUD-FD-2026-004';

INSERT INTO tb_audit_corrective (corrective_id, finding_id, audit_id, finding_description, severity, action_description, responsible_name, responsible_dept, due_date, completion_rate, status, notes, deleted, created_at, modified_at)
SELECT 'AUD-CA-2026-005', f.id, a.id,
       N'안전밸브 점검 기록 미갱신', 'MINOR',
       N'안전밸브 점검 절차 시연 후 기록 양식 통합 적용. 2026년 5월 본격 운영.',
       @uName, @uDept,
       '2026-05-15', 30, 'DEMONSTRATION', N'시연 일정 조율 중',
       0, GETDATE(), GETDATE()
FROM tb_audit_finding f
INNER JOIN tb_audit a ON f.audit_id = a.id
WHERE f.finding_id = 'AUD-FD-2026-005';

-- AUD-2026-004 (1건 finding): NA
INSERT INTO tb_audit_corrective (corrective_id, finding_id, audit_id, finding_description, severity, action_description, responsible_name, responsible_dept, due_date, completion_rate, status, notes, deleted, created_at, modified_at)
SELECT 'AUD-CA-2026-006', f.id, a.id,
       N'MSDS 비치 위치 표시 미흡', 'MINOR',
       N'설계 변경으로 해당 작업장이 폐쇄되어 시정조치 대상 아님.',
       @uName, @uDept,
       NULL, 0, 'NA', N'작업장 폐쇄로 N/A 처리',
       0, GETDATE(), GETDATE()
FROM tb_audit_finding f
INNER JOIN tb_audit a ON f.audit_id = a.id
WHERE f.finding_id = 'AUD-FD-2026-006';
