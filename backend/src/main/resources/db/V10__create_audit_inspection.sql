-- ===== DROP existing tables (순서 중요: FK 의존성 역순) =====
IF OBJECT_ID('tb_audit_corrective', 'U') IS NOT NULL DROP TABLE tb_audit_corrective;
IF OBJECT_ID('tb_audit_finding', 'U') IS NOT NULL DROP TABLE tb_audit_finding;
IF OBJECT_ID('tb_audit_checklist_result', 'U') IS NOT NULL DROP TABLE tb_audit_checklist_result;
IF OBJECT_ID('tb_audit_checklist_item', 'U') IS NOT NULL DROP TABLE tb_audit_checklist_item;
IF OBJECT_ID('tb_audit_checklist_template', 'U') IS NOT NULL DROP TABLE tb_audit_checklist_template;
IF OBJECT_ID('tb_audit', 'U') IS NOT NULL DROP TABLE tb_audit;
IF OBJECT_ID('tb_audit_plan', 'U') IS NOT NULL DROP TABLE tb_audit_plan;

-- ===== Code Group: AUDIT_TYPE (감사 유형) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'AUDIT_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('AUDIT_TYPE', N'감사 유형', N'감사·점검 유형 코드', 1, 1000, GETDATE(), GETDATE());
END;

DECLARE @auditTypeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'AUDIT_TYPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @auditTypeGroupId AND code = 'REGULAR')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@auditTypeGroupId, 'REGULAR',   'REGULAR',   N'정기감사', 'Regular Audit',    N'定期审计', 1, 1, GETDATE(), GETDATE()),
    (@auditTypeGroupId, 'SPECIAL',   'SPECIAL',   N'수시감사', 'Special Audit',    N'临时审计', 1, 2, GETDATE(), GETDATE()),
    (@auditTypeGroupId, 'EXPERT',    'EXPERT',    N'전문감사', 'Expert Audit',     N'专业审计', 1, 3, GETDATE(), GETDATE()),
    (@auditTypeGroupId, 'INTERNAL',  'INTERNAL',  N'내부감사', 'Internal Audit',   N'内部审计', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: AUDIT_STATUS (감사 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'AUDIT_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('AUDIT_STATUS', N'감사 상태', N'감사·점검 상태 코드', 1, 1001, GETDATE(), GETDATE());
END;

DECLARE @auditStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'AUDIT_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @auditStatusGroupId AND code = 'PLAN')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@auditStatusGroupId, 'PLAN',           'PLAN',           N'계획',         'Plan',                N'计划',     1, 1, GETDATE(), GETDATE()),
    (@auditStatusGroupId, 'PREPARING',      'PREPARING',      N'준비중',       'Preparing',           N'准备中',   1, 2, GETDATE(), GETDATE()),
    (@auditStatusGroupId, 'IN_PROGRESS',    'IN_PROGRESS',    N'진행중',       'In Progress',         N'进行中',   1, 3, GETDATE(), GETDATE()),
    (@auditStatusGroupId, 'PENDING_CLOSE',  'PENDING_CLOSE',  N'종료확인대기', 'Pending Confirmation',N'待确认',   1, 4, GETDATE(), GETDATE()),
    (@auditStatusGroupId, 'COMPLETED',      'COMPLETED',      N'완료',         'Completed',           N'已完成',   1, 5, GETDATE(), GETDATE());
END;

-- ===== Code Group: AUDIT_GRADE (감사 등급) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'AUDIT_GRADE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('AUDIT_GRADE', N'감사 등급', N'감사·점검 등급 코드', 1, 1002, GETDATE(), GETDATE());
END;

DECLARE @auditGradeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'AUDIT_GRADE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @auditGradeGroupId AND code = 'S')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@auditGradeGroupId, 'S', 'S', N'S등급', 'Grade S', N'S级', 1, 1, GETDATE(), GETDATE()),
    (@auditGradeGroupId, 'A', 'A', N'A등급', 'Grade A', N'A级', 1, 2, GETDATE(), GETDATE()),
    (@auditGradeGroupId, 'B', 'B', N'B등급', 'Grade B', N'B级', 1, 3, GETDATE(), GETDATE()),
    (@auditGradeGroupId, 'C', 'C', N'C등급', 'Grade C', N'C级', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: FINDING_SEVERITY (부적합 심각도) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'FINDING_SEVERITY')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('FINDING_SEVERITY', N'부적합 심각도', N'감사 부적합 심각도 코드', 1, 1003, GETDATE(), GETDATE());
END;

DECLARE @findingSeverityGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'FINDING_SEVERITY');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @findingSeverityGroupId AND code = 'CRITICAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@findingSeverityGroupId, 'CRITICAL',    'CRITICAL',    N'중대',   'Critical',    N'重大', 1, 1, GETDATE(), GETDATE()),
    (@findingSeverityGroupId, 'MINOR',       'MINOR',       N'경미',   'Minor',       N'轻微', 1, 2, GETDATE(), GETDATE()),
    (@findingSeverityGroupId, 'OBSERVATION', 'OBSERVATION', N'관찰',   'Observation', N'观察', 1, 3, GETDATE(), GETDATE());
END;

-- ===== Code Group: FINDING_STATUS (부적합 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'FINDING_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('FINDING_STATUS', N'부적합 상태', N'감사 부적합 상태 코드', 1, 1004, GETDATE(), GETDATE());
END;

DECLARE @findingStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'FINDING_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @findingStatusGroupId AND code = 'PENDING')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@findingStatusGroupId, 'PENDING',     'PENDING',     N'대기',   'Pending',     N'待处理', 1, 1, GETDATE(), GETDATE()),
    (@findingStatusGroupId, 'IN_PROGRESS', 'IN_PROGRESS', N'조치중', 'In Progress', N'处理中', 1, 2, GETDATE(), GETDATE()),
    (@findingStatusGroupId, 'COMPLETED',   'COMPLETED',   N'완료',   'Completed',   N'已完成', 1, 3, GETDATE(), GETDATE()),
    (@findingStatusGroupId, 'OVERDUE',     'OVERDUE',     N'지연',   'Overdue',     N'已逾期', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: CORRECTIVE_STATUS (시정조치 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CORRECTIVE_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CORRECTIVE_STATUS', N'시정조치 상태', N'시정조치 상태 코드', 1, 1005, GETDATE(), GETDATE());
END;

DECLARE @correctiveStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CORRECTIVE_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @correctiveStatusGroupId AND code = 'PENDING')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@correctiveStatusGroupId, 'PENDING',     'PENDING',     N'대기',   'Pending',     N'待处理', 1, 1, GETDATE(), GETDATE()),
    (@correctiveStatusGroupId, 'IN_PROGRESS', 'IN_PROGRESS', N'조치중', 'In Progress', N'处理中', 1, 2, GETDATE(), GETDATE()),
    (@correctiveStatusGroupId, 'COMPLETED',   'COMPLETED',   N'완료',   'Completed',   N'已完成', 1, 3, GETDATE(), GETDATE()),
    (@correctiveStatusGroupId, 'OVERDUE',     'OVERDUE',     N'지연',   'Overdue',     N'已逾期', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Table: tb_audit_plan (감사 계획) =====
CREATE TABLE tb_audit_plan (
        id                BIGINT IDENTITY(1,1) PRIMARY KEY,
        plan_id           NVARCHAR(30) NOT NULL,
        audit_name        NVARCHAR(200) NOT NULL,
        audit_type        NVARCHAR(50) NOT NULL,
        target_dept       NVARCHAR(100),
        target_site       NVARCHAR(100),
        auditor_name      NVARCHAR(50),
        auditor_dept      NVARCHAR(50),
        plan_start_date   DATE,
        plan_end_date     DATE,
        purpose           NVARCHAR(2000),
        status            NVARCHAR(30) NOT NULL DEFAULT 'PLAN',
        notes             NVARCHAR(500),
        deleted           BIT NOT NULL DEFAULT 0,
        created_at        DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at       DATETIME NOT NULL DEFAULT GETDATE()
    );

-- ===== Table: tb_audit (감사 실시/결과) =====
CREATE TABLE tb_audit (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        audit_id            NVARCHAR(30) NOT NULL,
        plan_id             BIGINT,
        audit_name          NVARCHAR(200) NOT NULL,
        audit_type          NVARCHAR(50) NOT NULL,
        target_dept         NVARCHAR(100),
        target_site         NVARCHAR(100),
        auditor_name        NVARCHAR(50),
        auditor_dept        NVARCHAR(50),
        audit_start_date    DATE,
        audit_end_date      DATE,
        grade               NVARCHAR(10),
        total_checklist     INT DEFAULT 0,
        completed_checklist INT DEFAULT 0,
        finding_count       INT DEFAULT 0,
        status              NVARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
        summary             NVARCHAR(2000),
        notes               NVARCHAR(500),
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_audit_plan FOREIGN KEY (plan_id) REFERENCES tb_audit_plan(id)
    );

-- ===== Table: tb_audit_checklist_template (체크리스트 양식) =====
CREATE TABLE tb_audit_checklist_template (
        id            BIGINT IDENTITY(1,1) PRIMARY KEY,
        template_id   NVARCHAR(30) NOT NULL,
        audit_type    NVARCHAR(50) NOT NULL,
        title         NVARCHAR(200) NOT NULL,
        description   NVARCHAR(500),
        is_active     BIT NOT NULL DEFAULT 1,
        deleted       BIT NOT NULL DEFAULT 0,
        created_at    DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at   DATETIME NOT NULL DEFAULT GETDATE()
    );

-- ===== Table: tb_audit_checklist_item (체크리스트 항목) =====
CREATE TABLE tb_audit_checklist_item (
        id            BIGINT IDENTITY(1,1) PRIMARY KEY,
        template_id   BIGINT NOT NULL,
        section       NVARCHAR(100),
        item_text     NVARCHAR(500) NOT NULL,
        legal_ref     NVARCHAR(100),
        is_critical   BIT NOT NULL DEFAULT 0,
        sort_order    INT NOT NULL DEFAULT 0,
        deleted       BIT NOT NULL DEFAULT 0,
        created_at    DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at   DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_audit_cl_item_template FOREIGN KEY (template_id) REFERENCES tb_audit_checklist_template(id)
    );

-- ===== Table: tb_audit_checklist_result (감사별 체크 결과) =====
CREATE TABLE tb_audit_checklist_result (
        id            BIGINT IDENTITY(1,1) PRIMARY KEY,
        audit_id      BIGINT NOT NULL,
        item_id       BIGINT NOT NULL,
        check_status  NVARCHAR(10) NOT NULL DEFAULT 'UNCHECKED',
        checked_by    NVARCHAR(50),
        checked_at    DATETIME,
        remarks       NVARCHAR(500),
        created_at    DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at   DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_audit_cl_result_audit FOREIGN KEY (audit_id) REFERENCES tb_audit(id),
        CONSTRAINT FK_audit_cl_result_item FOREIGN KEY (item_id) REFERENCES tb_audit_checklist_item(id)
    );

-- ===== Table: tb_audit_finding (부적합 사항) =====
CREATE TABLE tb_audit_finding (
        id                BIGINT IDENTITY(1,1) PRIMARY KEY,
        finding_id        NVARCHAR(30) NOT NULL,
        audit_id          BIGINT NOT NULL,
        severity          NVARCHAR(30) NOT NULL,
        description       NVARCHAR(2000) NOT NULL,
        legal_ref         NVARCHAR(100),
        responsible_name  NVARCHAR(50),
        responsible_dept  NVARCHAR(50),
        due_date          DATE,
        status            NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
        notes             NVARCHAR(500),
        deleted           BIT NOT NULL DEFAULT 0,
        created_at        DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at       DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_audit_finding_audit FOREIGN KEY (audit_id) REFERENCES tb_audit(id)
    );

-- ===== Table: tb_audit_corrective (시정 조치) =====
CREATE TABLE tb_audit_corrective (
        id                   BIGINT IDENTITY(1,1) PRIMARY KEY,
        corrective_id        NVARCHAR(30) NOT NULL,
        finding_id           BIGINT NOT NULL,
        audit_id             BIGINT NOT NULL,
        finding_description  NVARCHAR(500),
        severity             NVARCHAR(30),
        action_description   NVARCHAR(2000) NOT NULL,
        responsible_name     NVARCHAR(50),
        responsible_dept     NVARCHAR(50),
        due_date             DATE,
        completion_rate      INT NOT NULL DEFAULT 0,
        status               NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
        notes                NVARCHAR(500),
        deleted              BIT NOT NULL DEFAULT 0,
        created_at           DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at          DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_audit_corrective_finding FOREIGN KEY (finding_id) REFERENCES tb_audit_finding(id),
        CONSTRAINT FK_audit_corrective_audit FOREIGN KEY (audit_id) REFERENCES tb_audit(id)
    );

-- ===== Dummy Data =====

-- Dummy Data Insert

-- ===== Audit Plans (5건) =====
INSERT INTO tb_audit_plan (plan_id, audit_name, audit_type, target_dept, target_site, auditor_name, auditor_dept, plan_start_date, plan_end_date, purpose, status, notes)
SELECT 'AUD-PL-2026-001', N'2026년 상반기 정기 안전감사', 'REGULAR',
       N'생산 1팀', N'본사 공장',
       u.UserName, u.DeptCode,
       '2026-03-01', '2026-03-15',
       N'산업안전보건법 제47조에 따른 정기 안전감사 실시. 전기설비, 소방시설, 위험물 관리 전반 점검.', 'COMPLETED', NULL
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID) u;

INSERT INTO tb_audit_plan (plan_id, audit_name, audit_type, target_dept, target_site, auditor_name, auditor_dept, plan_start_date, plan_end_date, purpose, status, notes)
SELECT 'AUD-PL-2026-002', N'설비팀 수시감사', 'SPECIAL',
       N'설비팀', N'본사 공장',
       u.UserName, u.DeptCode,
       '2026-04-01', '2026-04-03',
       N'설비팀 안전관리 실태 수시 점검. 최근 아차사고 발생에 따른 긴급 감사.', 'IN_PROGRESS', N'아차사고 후속 조치'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID DESC) u;

INSERT INTO tb_audit_plan (plan_id, audit_name, audit_type, target_dept, target_site, auditor_name, auditor_dept, plan_start_date, plan_end_date, purpose, status, notes)
SELECT 'AUD-PL-2026-003', N'화학물질 전문감사', 'EXPERT',
       N'품질팀', N'제2공장',
       u.UserName, u.DeptCode,
       '2026-05-10', '2026-05-14',
       N'화학물질 관리법에 따른 전문 감사. 유해화학물질 취급, 보관, MSDS 관리 점검.', 'PLAN', NULL
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u;

INSERT INTO tb_audit_plan (plan_id, audit_name, audit_type, target_dept, target_site, auditor_name, auditor_dept, plan_start_date, plan_end_date, purpose, status, notes)
SELECT 'AUD-PL-2026-004', N'내부 안전보건 감사', 'INTERNAL',
       N'전체', N'본사',
       u.UserName, u.DeptCode,
       '2026-06-01', '2026-06-10',
       N'ISO 45001 인증 유지를 위한 내부 안전보건 경영시스템 감사.', 'PREPARING', NULL
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u;

INSERT INTO tb_audit_plan (plan_id, audit_name, audit_type, target_dept, target_site, auditor_name, auditor_dept, plan_start_date, plan_end_date, purpose, status, notes)
SELECT 'AUD-PL-2026-005', N'2026년 하반기 정기 안전감사', 'REGULAR',
       N'생산 2팀', N'본사 공장',
       u.UserName, u.DeptCode,
       '2026-09-01', '2026-09-15',
       N'하반기 정기 안전감사 계획. 전기, 소방, 밀폐공간, 위험물 전반.', 'PLAN', NULL
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u;

-- ===== Audits (4건) =====
INSERT INTO tb_audit (audit_id, plan_id, audit_name, audit_type, target_dept, target_site, auditor_name, auditor_dept, audit_start_date, audit_end_date, grade, total_checklist, completed_checklist, finding_count, status, summary, notes)
SELECT 'AUD-2026-001', (SELECT id FROM tb_audit_plan WHERE plan_id = 'AUD-PL-2026-001'),
       N'2026년 상반기 정기 안전감사', 'REGULAR',
       N'생산 1팀', N'본사 공장',
       u.UserName, u.DeptCode,
       '2026-03-01', '2026-03-14', 'A', 15, 15, 3, 'COMPLETED',
       N'전반적으로 양호하나 전기설비 일부 노후화 및 소방시설 점검 미흡 확인. 3건의 부적합 사항 발견.', NULL
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID) u;

INSERT INTO tb_audit (audit_id, plan_id, audit_name, audit_type, target_dept, target_site, auditor_name, auditor_dept, audit_start_date, audit_end_date, grade, total_checklist, completed_checklist, finding_count, status, summary, notes)
SELECT 'AUD-2026-002', (SELECT id FROM tb_audit_plan WHERE plan_id = 'AUD-PL-2026-002'),
       N'설비팀 수시감사', 'SPECIAL',
       N'설비팀', N'본사 공장',
       u.UserName, u.DeptCode,
       '2026-04-01', NULL, NULL, 12, 8, 2, 'IN_PROGRESS',
       NULL, N'진행중 - 4월 3일 완료 예정'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID DESC) u;

INSERT INTO tb_audit (audit_id, plan_id, audit_name, audit_type, target_dept, target_site, auditor_name, auditor_dept, audit_start_date, audit_end_date, grade, total_checklist, completed_checklist, finding_count, status, summary, notes)
SELECT 'AUD-2026-003', NULL,
       N'생산2팀 긴급 안전점검', 'SPECIAL',
       N'생산 2팀', N'제2공장',
       u.UserName, u.DeptCode,
       '2026-02-20', '2026-02-21', 'S', 10, 10, 0, 'COMPLETED',
       N'긴급 점검 결과 모든 항목 적합 판정. 부적합 사항 없음.', NULL
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u;

INSERT INTO tb_audit (audit_id, plan_id, audit_name, audit_type, target_dept, target_site, auditor_name, auditor_dept, audit_start_date, audit_end_date, grade, total_checklist, completed_checklist, finding_count, status, summary, notes)
SELECT 'AUD-2026-004', NULL,
       N'품질팀 내부감사', 'INTERNAL',
       N'품질팀', N'본사',
       u.UserName, u.DeptCode,
       '2026-03-10', '2026-03-12', 'B', 12, 12, 1, 'PENDING_CLOSE',
       N'MSDS 관리 일부 미흡. 시정조치 완료 후 종료 예정.', NULL
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u;

-- ===== Checklist Template 1: 전기안전 (15 items, 3 sections) =====
INSERT INTO tb_audit_checklist_template (template_id, audit_type, title, description, is_active)
VALUES ('AUD-TPL-001', 'REGULAR', N'전기안전 점검 체크리스트', N'전기설비 안전 점검을 위한 표준 체크리스트', 1);

DECLARE @tpl1Id BIGINT = (SELECT id FROM tb_audit_checklist_template WHERE template_id = 'AUD-TPL-001');

INSERT INTO tb_audit_checklist_item (template_id, section, item_text, legal_ref, is_critical, sort_order) VALUES
(@tpl1Id, N'1. 전기설비 일반', N'전기설비 외관 손상 여부 확인',                  N'산안법 제36조', 1, 1),
(@tpl1Id, N'1. 전기설비 일반', N'접지 상태 양호 여부 확인',                      N'산안법 제36조', 1, 2),
(@tpl1Id, N'1. 전기설비 일반', N'전기 배선 피복 손상 여부',                      N'전기사업법 제73조', 0, 3),
(@tpl1Id, N'1. 전기설비 일반', N'분전반 도어 잠금장치 작동 여부',                N'산안법 제36조', 0, 4),
(@tpl1Id, N'1. 전기설비 일반', N'전기설비 주변 정리정돈 상태',                   NULL, 0, 5),
(@tpl1Id, N'2. 누전차단기', N'누전차단기 설치 적정성 확인',                      N'산안법 제304조', 1, 6),
(@tpl1Id, N'2. 누전차단기', N'누전차단기 정격 감도전류 적합 여부',              N'산안법 제304조', 1, 7),
(@tpl1Id, N'2. 누전차단기', N'누전차단기 동작 시험 실시 여부',                  N'산안법 제304조', 1, 8),
(@tpl1Id, N'2. 누전차단기', N'누전차단기 월별 점검 기록 유지 여부',             NULL, 0, 9),
(@tpl1Id, N'2. 누전차단기', N'임시 배선 사용 시 누전차단기 설치 여부',          N'산안법 제304조', 0, 10),
(@tpl1Id, N'3. 안전 표지·경고', N'고압 위험 경고 표지 부착 여부',               N'산안법 제37조', 1, 11),
(@tpl1Id, N'3. 안전 표지·경고', N'전기 작업 시 안전표지판 게시 여부',           N'산안법 제37조', 0, 12),
(@tpl1Id, N'3. 안전 표지·경고', N'비상시 차단 절차 게시 여부',                  N'산안법 제37조', 0, 13),
(@tpl1Id, N'3. 안전 표지·경고', N'전기실 출입 통제 관리 여부',                  NULL, 0, 14),
(@tpl1Id, N'3. 안전 표지·경고', N'절연용 보호구 비치 여부',                     N'산안법 제301조', 1, 15);

-- ===== Checklist Template 2: 화재·소방 (12 items) =====
INSERT INTO tb_audit_checklist_template (template_id, audit_type, title, description, is_active)
VALUES ('AUD-TPL-002', 'REGULAR', N'화재·소방 점검 체크리스트', N'화재 예방 및 소방시설 점검을 위한 표준 체크리스트', 1);

DECLARE @tpl2Id BIGINT = (SELECT id FROM tb_audit_checklist_template WHERE template_id = 'AUD-TPL-002');

INSERT INTO tb_audit_checklist_item (template_id, section, item_text, legal_ref, is_critical, sort_order) VALUES
(@tpl2Id, N'1. 소화설비', N'소화기 비치 적정성 확인',                            N'소방시설법 제9조', 1, 1),
(@tpl2Id, N'1. 소화설비', N'소화기 유효기간 확인',                               N'소방시설법 제9조', 1, 2),
(@tpl2Id, N'1. 소화설비', N'옥내소화전 작동 상태 확인',                          N'소방시설법 제9조', 1, 3),
(@tpl2Id, N'1. 소화설비', N'스프링클러 헤드 장애물 여부 확인',                   N'소방시설법 제9조', 0, 4),
(@tpl2Id, N'2. 경보설비', N'자동화재탐지설비 작동 상태 확인',                    N'소방시설법 제9조', 1, 5),
(@tpl2Id, N'2. 경보설비', N'비상방송설비 작동 여부',                             N'소방시설법 제9조', 0, 6),
(@tpl2Id, N'2. 경보설비', N'감지기 설치 위치 적정성',                            NULL, 0, 7),
(@tpl2Id, N'2. 경보설비', N'수신기 상태 (정상/고장 표시)',                        N'소방시설법 제9조', 0, 8),
(@tpl2Id, N'3. 피난설비', N'비상구 확보 및 개폐 상태',                           N'소방시설법 제10조', 1, 9),
(@tpl2Id, N'3. 피난설비', N'유도등·유도표지 점등 상태',                          N'소방시설법 제10조', 0, 10),
(@tpl2Id, N'3. 피난설비', N'피난계단 장애물 적치 여부',                          N'소방시설법 제10조', 0, 11),
(@tpl2Id, N'3. 피난설비', N'비상조명등 작동 상태',                               N'소방시설법 제10조', 0, 12);

-- ===== Audit Findings (6건) =====
INSERT INTO tb_audit_finding (finding_id, audit_id, severity, description, legal_ref, responsible_name, responsible_dept, due_date, status, notes)
SELECT 'AUD-FD-2026-001',
       (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-001'),
       'CRITICAL',
       N'분전반 3호기 누전차단기 동작 불량 확인. 감도전류 30mA 기준 미달. 즉시 교체 필요.',
       N'산안법 제304조',
       u.UserName, u.DeptCode,
       '2026-03-21', 'COMPLETED', N'3월 18일 교체 완료'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID) u;

INSERT INTO tb_audit_finding (finding_id, audit_id, severity, description, legal_ref, responsible_name, responsible_dept, due_date, status, notes)
SELECT 'AUD-FD-2026-002',
       (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-001'),
       'MINOR',
       N'B동 2층 소화기 2대 유효기간 초과 확인. 교체 필요.',
       N'소방시설법 제9조',
       u.UserName, u.DeptCode,
       '2026-03-25', 'COMPLETED', N'3월 22일 교체 완료'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u;

INSERT INTO tb_audit_finding (finding_id, audit_id, severity, description, legal_ref, responsible_name, responsible_dept, due_date, status, notes)
SELECT 'AUD-FD-2026-003',
       (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-001'),
       'OBSERVATION',
       N'A동 1층 전기실 주변 정리정돈 미흡. 개선 권고.',
       NULL,
       u.UserName, u.DeptCode,
       '2026-04-01', 'COMPLETED', NULL
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u;

INSERT INTO tb_audit_finding (finding_id, audit_id, severity, description, legal_ref, responsible_name, responsible_dept, due_date, status, notes)
SELECT 'AUD-FD-2026-004',
       (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-002'),
       'CRITICAL',
       N'밀폐공간 작업 시 산소농도 측정 미실시 확인. 질식 위험 존재.',
       N'산안법 제618조',
       u.UserName, u.DeptCode,
       '2026-04-05', 'IN_PROGRESS', N'측정장비 추가 구매 진행중'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID DESC) u;

INSERT INTO tb_audit_finding (finding_id, audit_id, severity, description, legal_ref, responsible_name, responsible_dept, due_date, status, notes)
SELECT 'AUD-FD-2026-005',
       (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-002'),
       'MINOR',
       N'안전밸브 점검 기록 3개월 미갱신. 점검 주기 준수 필요.',
       N'산안법 제93조',
       u.UserName, u.DeptCode,
       '2026-04-10', 'PENDING', NULL
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u;

INSERT INTO tb_audit_finding (finding_id, audit_id, severity, description, legal_ref, responsible_name, responsible_dept, due_date, status, notes)
SELECT 'AUD-FD-2026-006',
       (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-004'),
       'MINOR',
       N'MSDS 비치 위치 표시 미흡. 화학물질 취급 장소 인근 비치 필요.',
       N'화관법 제41조',
       u.UserName, u.DeptCode,
       '2026-03-25', 'OVERDUE', N'조치 지연 - 부서 협조 대기'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u;

-- ===== Audit Corrective Actions (5건) =====
INSERT INTO tb_audit_corrective (corrective_id, finding_id, audit_id, finding_description, severity, action_description, responsible_name, responsible_dept, due_date, completion_rate, status, notes)
SELECT 'AUD-CA-2026-001',
       (SELECT id FROM tb_audit_finding WHERE finding_id = 'AUD-FD-2026-001'),
       (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-001'),
       N'분전반 3호기 누전차단기 동작 불량', 'CRITICAL',
       N'누전차단기 교체 및 전기설비 전수 점검 실시. 동일 제조사 차단기 전체 교체.',
       u.UserName, u.DeptCode,
       '2026-03-21', 100, 'COMPLETED', N'3월 18일 교체 완료, 전수 점검 3월 20일 완료'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID) u;

INSERT INTO tb_audit_corrective (corrective_id, finding_id, audit_id, finding_description, severity, action_description, responsible_name, responsible_dept, due_date, completion_rate, status, notes)
SELECT 'AUD-CA-2026-002',
       (SELECT id FROM tb_audit_finding WHERE finding_id = 'AUD-FD-2026-002'),
       (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-001'),
       N'B동 2층 소화기 유효기간 초과', 'MINOR',
       N'소화기 교체 및 전 건물 소화기 유효기간 일괄 점검.',
       u.UserName, u.DeptCode,
       '2026-03-25', 100, 'COMPLETED', N'3월 22일 완료'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u;

INSERT INTO tb_audit_corrective (corrective_id, finding_id, audit_id, finding_description, severity, action_description, responsible_name, responsible_dept, due_date, completion_rate, status, notes)
SELECT 'AUD-CA-2026-003',
       (SELECT id FROM tb_audit_finding WHERE finding_id = 'AUD-FD-2026-004'),
       (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-002'),
       N'밀폐공간 산소농도 측정 미실시', 'CRITICAL',
       N'휴대용 산소농도 측정기 2대 추가 구매. 밀폐공간 작업 절차서 개정 및 교육 실시.',
       u.UserName, u.DeptCode,
       '2026-04-05', 60, 'IN_PROGRESS', N'측정기 발주 완료, 4월 2일 입고 예정'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID DESC) u;

INSERT INTO tb_audit_corrective (corrective_id, finding_id, audit_id, finding_description, severity, action_description, responsible_name, responsible_dept, due_date, completion_rate, status, notes)
SELECT 'AUD-CA-2026-004',
       (SELECT id FROM tb_audit_finding WHERE finding_id = 'AUD-FD-2026-005'),
       (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-002'),
       N'안전밸브 점검 기록 미갱신', 'MINOR',
       N'안전밸브 점검 기록 갱신 및 점검 주기 관리 시스템 도입.',
       u.UserName, u.DeptCode,
       '2026-04-10', 0, 'PENDING', NULL
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u;

INSERT INTO tb_audit_corrective (corrective_id, finding_id, audit_id, finding_description, severity, action_description, responsible_name, responsible_dept, due_date, completion_rate, status, notes)
SELECT 'AUD-CA-2026-005',
       (SELECT id FROM tb_audit_finding WHERE finding_id = 'AUD-FD-2026-006'),
       (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-004'),
       N'MSDS 비치 위치 표시 미흡', 'MINOR',
       N'MSDS 비치함 추가 설치 및 위치 안내 표지판 부착.',
       u.UserName, u.DeptCode,
       '2026-03-25', 30, 'OVERDUE', N'비치함 발주 완료, 설치 지연'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u;

-- ===== Checklist Results: AUD-2026-001 ← 전기안전 체크리스트 (15항목, 전부 체크 완료) =====
INSERT INTO tb_audit_checklist_result (audit_id, item_id, check_status, checked_by, checked_at)
SELECT (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-001'),
       i.id, 'CHECKED',
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID),
       '2026-03-14 16:00:00'
FROM tb_audit_checklist_item i
WHERE i.template_id = (SELECT id FROM tb_audit_checklist_template WHERE template_id = 'AUD-TPL-001') AND i.deleted = 0;

-- AUD-2026-001 total/completed 업데이트
UPDATE tb_audit SET total_checklist = 15, completed_checklist = 15 WHERE audit_id = 'AUD-2026-001';

-- ===== Checklist Results: AUD-2026-002 ← 화재·소방 체크리스트 (12항목, 8항목 체크, 3 미체크, 1 N/A) =====
INSERT INTO tb_audit_checklist_result (audit_id, item_id, check_status, checked_by, checked_at)
SELECT (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-002'),
       i.id,
       CASE
         WHEN i.sort_order <= 8 THEN 'CHECKED'
         WHEN i.sort_order = 12 THEN 'NA'
         ELSE 'UNCHECKED'
       END,
       CASE WHEN i.sort_order <= 8 THEN (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY UID DESC) ELSE NULL END,
       CASE WHEN i.sort_order <= 8 THEN '2026-04-01 14:30:00' ELSE NULL END
FROM tb_audit_checklist_item i
WHERE i.template_id = (SELECT id FROM tb_audit_checklist_template WHERE template_id = 'AUD-TPL-002') AND i.deleted = 0;

-- AUD-2026-002 total/completed 업데이트
UPDATE tb_audit SET total_checklist = 12, completed_checklist = 8 WHERE audit_id = 'AUD-2026-002';

-- ===== Checklist Results: AUD-2026-003 ← 전기안전 체크리스트 (15항목, 전부 체크 완료) =====
INSERT INTO tb_audit_checklist_result (audit_id, item_id, check_status, checked_by, checked_at)
SELECT (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-003'),
       i.id, 'CHECKED',
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       '2026-02-21 15:00:00'
FROM tb_audit_checklist_item i
WHERE i.template_id = (SELECT id FROM tb_audit_checklist_template WHERE template_id = 'AUD-TPL-001') AND i.deleted = 0;

UPDATE tb_audit SET total_checklist = 15, completed_checklist = 15 WHERE audit_id = 'AUD-2026-003';

-- ===== Checklist Results: AUD-2026-004 ← 화재·소방 체크리스트 (12항목, 전부 체크 완료) =====
INSERT INTO tb_audit_checklist_result (audit_id, item_id, check_status, checked_by, checked_at)
SELECT (SELECT id FROM tb_audit WHERE audit_id = 'AUD-2026-004'),
       i.id, 'CHECKED',
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       '2026-03-12 17:00:00'
FROM tb_audit_checklist_item i
WHERE i.template_id = (SELECT id FROM tb_audit_checklist_template WHERE template_id = 'AUD-TPL-002') AND i.deleted = 0;

UPDATE tb_audit SET total_checklist = 12, completed_checklist = 12 WHERE audit_id = 'AUD-2026-004';
