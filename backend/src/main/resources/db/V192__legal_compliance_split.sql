-- ============================================================
-- V192: 법규 대응 백엔드 분리 — tb_audit_* 구조를 그대로 복제한 별도 테이블 6종 생성
--   tb_legal_compliance_plan        (← tb_audit_plan)
--   tb_legal_compliance_exec        (← tb_audit)
--   tb_legal_compliance_finding     (← tb_audit_finding)
--   tb_legal_compliance_corrective  (← tb_audit_corrective)
--   tb_legal_compliance_log         (← tb_audit_log)
--   tb_legal_compliance_log_item    (← tb_audit_log_item)
-- 기존 audit_type='LEGAL_COMPLIANCE' 행은 새 테이블로 옮긴다 (원본은 보존).
-- ============================================================

SET NOCOUNT ON;
GO

-- ===== 1) Schema clone (SELECT * INTO; LEGAL_COMPLIANCE 매칭 데이터 동시 이관) =====

-- 1-1) plan
IF OBJECT_ID('tb_legal_compliance_plan', 'U') IS NULL
BEGIN
    SELECT * INTO tb_legal_compliance_plan FROM tb_audit_plan WHERE audit_type = 'LEGAL_COMPLIANCE';
    ALTER TABLE tb_legal_compliance_plan ADD CONSTRAINT PK_lc_plan PRIMARY KEY (id);
END
GO

-- 1-2) exec (← tb_audit)
IF OBJECT_ID('tb_legal_compliance_exec', 'U') IS NULL
BEGIN
    SELECT * INTO tb_legal_compliance_exec FROM tb_audit WHERE audit_type = 'LEGAL_COMPLIANCE';
    ALTER TABLE tb_legal_compliance_exec ADD CONSTRAINT PK_lc_exec PRIMARY KEY (id);
    CREATE INDEX IX_lc_exec_plan_id ON tb_legal_compliance_exec(plan_id);
END
GO

-- 1-3) finding (exec.id 참조)
IF OBJECT_ID('tb_legal_compliance_finding', 'U') IS NULL
BEGIN
    SELECT f.* INTO tb_legal_compliance_finding
    FROM tb_audit_finding f
    WHERE f.audit_id IN (SELECT id FROM tb_audit WHERE audit_type = 'LEGAL_COMPLIANCE');
    ALTER TABLE tb_legal_compliance_finding ADD CONSTRAINT PK_lc_finding PRIMARY KEY (id);
    CREATE INDEX IX_lc_finding_exec_id ON tb_legal_compliance_finding(audit_id);
END
GO

-- 1-4) corrective
IF OBJECT_ID('tb_legal_compliance_corrective', 'U') IS NULL
BEGIN
    SELECT c.* INTO tb_legal_compliance_corrective
    FROM tb_audit_corrective c
    WHERE c.audit_id IN (SELECT id FROM tb_audit WHERE audit_type = 'LEGAL_COMPLIANCE');
    ALTER TABLE tb_legal_compliance_corrective ADD CONSTRAINT PK_lc_corrective PRIMARY KEY (id);
    CREATE INDEX IX_lc_corrective_finding_id ON tb_legal_compliance_corrective(finding_id);
    CREATE INDEX IX_lc_corrective_exec_id ON tb_legal_compliance_corrective(audit_id);
END
GO

-- 1-5) log
IF OBJECT_ID('tb_legal_compliance_log', 'U') IS NULL
BEGIN
    SELECT l.* INTO tb_legal_compliance_log
    FROM tb_audit_log l
    WHERE l.audit_id IN (SELECT id FROM tb_audit WHERE audit_type = 'LEGAL_COMPLIANCE');
    ALTER TABLE tb_legal_compliance_log ADD CONSTRAINT PK_lc_log PRIMARY KEY (id);
    CREATE INDEX IX_lc_log_exec_id ON tb_legal_compliance_log(audit_id);
END
GO

-- 1-6) log_item
IF OBJECT_ID('tb_legal_compliance_log_item', 'U') IS NULL
BEGIN
    SELECT li.* INTO tb_legal_compliance_log_item
    FROM tb_audit_log_item li
    WHERE li.log_id IN (SELECT id FROM tb_legal_compliance_log);
    ALTER TABLE tb_legal_compliance_log_item ADD CONSTRAINT PK_lc_log_item PRIMARY KEY (id);
    CREATE INDEX IX_lc_log_item_log_id ON tb_legal_compliance_log_item(log_id);
END
GO

-- ===== 2) 기존 audit 테이블에서 LEGAL_COMPLIANCE 행 정리 — 원본 보존(롤백 대비)
-- 옮긴 후 자동 삭제하지 않음. 운영자가 확인 후 수동으로
--   DELETE FROM tb_audit WHERE audit_type='LEGAL_COMPLIANCE';
--   DELETE FROM tb_audit_plan WHERE audit_type='LEGAL_COMPLIANCE';
-- 등을 실행하도록 안내.

-- ===== 3) 더미 데이터 — 빈 테이블이면 샘플 1세트 삽입 =====
IF NOT EXISTS (SELECT 1 FROM tb_legal_compliance_plan)
BEGIN
    DECLARE @lcUser NVARCHAR(100) = (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID);
    DECLARE @lcDept NVARCHAR(100) = (SELECT TOP 1 DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID);

    -- plan 3건
    INSERT INTO tb_legal_compliance_plan
        (plan_id, audit_name, audit_type, target_dept, target_site, auditor_name, auditor_dept,
         plan_start_date, plan_end_date, purpose, status, notes, deleted, created_at, modified_at)
    VALUES
    ('LC-PL-2026-001', N'2026년 상반기 산업안전보건법 준수 점검', 'LEGAL_COMPLIANCE',
     N'생산 1팀', N'본사 공장', @lcUser, @lcDept,
     '2026-03-01', '2026-03-10',
     N'산업안전보건법 제29조·제36조·제125조 준수 여부 정기 점검 (보건교육·기계위험·작업환경)',
     'DRAFT', NULL, 0, GETDATE(), GETDATE()),
    ('LC-PL-2026-002', N'화학물질관리법 정기 점검', 'LEGAL_COMPLIANCE',
     N'환경팀', N'제2공장', @lcUser, @lcDept,
     '2026-04-15', '2026-04-22',
     N'화관법 제15조·제41조 (취급시설 점검·MSDS 비치) 준수 점검', 'DRAFT', NULL, 0, GETDATE(), GETDATE()),
    ('LC-PL-2026-003', N'중대재해처벌법 안전보건확보의무 점검', 'LEGAL_COMPLIANCE',
     N'전사', N'전 사업장', @lcUser, @lcDept,
     '2026-05-10', '2026-05-20',
     N'중대재해처벌법 제4조 안전보건확보의무 이행 여부 종합 점검',
     'DRAFT', N'경영책임자 보고 대상', 0, GETDATE(), GETDATE());

    -- exec 2건 (plan 1, 2 와 매핑)
    DECLARE @lcPid1 BIGINT = (SELECT id FROM tb_legal_compliance_plan WHERE plan_id='LC-PL-2026-001');
    DECLARE @lcPid2 BIGINT = (SELECT id FROM tb_legal_compliance_plan WHERE plan_id='LC-PL-2026-002');

    INSERT INTO tb_legal_compliance_exec
        (audit_id, plan_id, audit_name, audit_type, target_dept, target_site, auditor_name, auditor_dept,
         audit_start_date, audit_end_date, grade, total_checklist, completed_checklist, finding_count,
         status, summary, notes, deleted, created_at, modified_at)
    VALUES
    ('LC-2026-001', @lcPid1, N'2026년 상반기 산업안전보건법 준수 점검', 'LEGAL_COMPLIANCE',
     N'생산 1팀', N'본사 공장', @lcUser, @lcDept,
     '2026-03-01', '2026-03-09', NULL, 12, 12, 2, 'IN_PROGRESS',
     N'전반적 준수 양호. 위험기계 정기점검 일부 누락 확인.', NULL, 0, GETDATE(), GETDATE()),
    ('LC-2026-002', @lcPid2, N'화학물질관리법 정기 점검', 'LEGAL_COMPLIANCE',
     N'환경팀', N'제2공장', @lcUser, @lcDept,
     '2026-04-15', NULL, NULL, 8, 4, 1, 'IN_PROGRESS',
     NULL, N'진행중', 0, GETDATE(), GETDATE());

    -- finding 3건
    DECLARE @lcEid1 BIGINT = (SELECT id FROM tb_legal_compliance_exec WHERE audit_id='LC-2026-001');
    DECLARE @lcEid2 BIGINT = (SELECT id FROM tb_legal_compliance_exec WHERE audit_id='LC-2026-002');

    INSERT INTO tb_legal_compliance_finding
        (finding_id, audit_id, severity, description, legal_ref, responsible_name, responsible_dept,
         due_date, status, notes, deleted, created_at, modified_at)
    VALUES
    ('LC-FD-2026-001', @lcEid1, 'MINOR',
     N'프레스 기계 정기점검 주기(6개월) 1회 누락. 3월 18일까지 자체점검 완료 필요.',
     N'산안법 제93조', @lcUser, @lcDept, '2026-03-18', 'IN_PROGRESS', NULL, 0, GETDATE(), GETDATE()),
    ('LC-FD-2026-002', @lcEid1, 'OBSERVATION',
     N'근로자 안전보건교육 이수율 88% (목표 95% 미달). 미이수자 대상 교육 일정 수립 권고.',
     N'산안법 제29조', @lcUser, @lcDept, '2026-04-15', 'PENDING', NULL, 0, GETDATE(), GETDATE()),
    ('LC-FD-2026-003', @lcEid2, 'CRITICAL',
     N'화학물질 취급시설 정기검사(2년) 만료 임박. 4월 30일 이전 검사 완료 필요.',
     N'화관법 제24조', @lcUser, @lcDept, '2026-04-30', 'IN_PROGRESS',
     N'검사기관 예약 완료', 0, GETDATE(), GETDATE());

    -- corrective 2건
    DECLARE @lcFid1 BIGINT = (SELECT id FROM tb_legal_compliance_finding WHERE finding_id='LC-FD-2026-001');
    DECLARE @lcFid3 BIGINT = (SELECT id FROM tb_legal_compliance_finding WHERE finding_id='LC-FD-2026-003');

    INSERT INTO tb_legal_compliance_corrective
        (corrective_id, finding_id, audit_id, finding_description, severity, action_description,
         responsible_name, responsible_dept, due_date, status, notes,
         deleted, created_at, modified_at)
    VALUES
    ('LC-CA-2026-001', @lcFid1, @lcEid1,
     N'프레스 기계 정기점검 누락', 'MINOR',
     N'프레스 1·2호기 자체점검 실시 + 점검 주기 캘린더 등록',
     @lcUser, @lcDept, '2026-03-18', 'IN_PROGRESS',
     N'1호기 완료, 2호기 진행중', 0, GETDATE(), GETDATE()),
    ('LC-CA-2026-002', @lcFid3, @lcEid2,
     N'화학물질 취급시설 정기검사 만료 임박', 'CRITICAL',
     N'검사기관(한국화학물질관리협회) 검사 진행 + 검사 결과서 보관',
     @lcUser, @lcDept, '2026-04-30', 'IN_PROGRESS',
     N'검사 일정 4월 25일 확정', 0, GETDATE(), GETDATE());
END
GO
