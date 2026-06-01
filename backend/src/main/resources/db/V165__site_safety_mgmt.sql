-- V165: 현장 안전 관리 (Site Safety Management)
--   협력사 관리(tb_contractor_plan)와 동일한 구조를 가지되,
--   체크리스트는 CONTRACTOR_MOBILE 카테고리만 연결, 점검자 단일 서명만 사용.

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_site_safety_worker', 'U') IS NOT NULL DROP TABLE tb_site_safety_worker;
IF OBJECT_ID('tb_site_safety_plan',   'U') IS NOT NULL DROP TABLE tb_site_safety_plan;
GO

CREATE TABLE tb_site_safety_plan (
    id                       BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_id                  NVARCHAR(30)  NOT NULL,
    title                    NVARCHAR(200) NOT NULL,
    work_type                NVARCHAR(30)  NULL,
    risk_level               NVARCHAR(20)  NULL,
    work_location            NVARCHAR(200) NULL,
    workers_count            INT           DEFAULT 0,
    work_start_date          DATE          NULL,
    work_end_date            DATE          NULL,
    work_description         NVARCHAR(2000) NULL,
    safety_measures          NVARCHAR(2000) NULL,
    required_ppe             NVARCHAR(500) NULL,
    hazard_factors           NVARCHAR(1000) NULL,
    emergency_contact        NVARCHAR(100) NULL,
    notes                    NVARCHAR(500) NULL,
    checklist_template_id    BIGINT        NULL,
    approver_name            NVARCHAR(50)  NULL,

    -- 계획 승인자
    plan_approver_user_id    BIGINT        NULL,
    plan_approver_team       NVARCHAR(100) NULL,
    plan_approver_position   NVARCHAR(100) NULL,
    plan_approver_name       NVARCHAR(100) NULL,
    plan_approved_at         DATETIME2     NULL,
    plan_approved_by         NVARCHAR(50)  NULL,

    -- 점검자 (단일 서명자) — 협력사 관리의 완료 승인자 대신
    inspector_user_id        BIGINT        NULL,
    inspector_team           NVARCHAR(100) NULL,
    inspector_position       NVARCHAR(100) NULL,
    inspector_name           NVARCHAR(100) NULL,
    inspector_signature      NVARCHAR(MAX) NULL,                -- base64 PNG data URI
    inspector_signed_at      DATETIME2     NULL,                -- 서명 날짜 자동 지정

    repeat_type              NVARCHAR(20)  DEFAULT 'NONE',
    repeat_interval          INT           DEFAULT 1,
    repeat_days              NVARCHAR(20)  NULL,
    status                   NVARCHAR(20)  DEFAULT 'DRAFT',
    approved_by              NVARCHAR(50)  NULL,
    approved_at              DATETIME2     NULL,
    reject_reason            NVARCHAR(500) NULL,
    total_checklist          INT           DEFAULT 0,
    completed_checklist      INT           DEFAULT 0,
    finding_count            INT           DEFAULT 0,
    modified_by              NVARCHAR(50)  NULL,
    deleted                  BIT           DEFAULT 0,
    created_at               DATETIME2     DEFAULT GETDATE(),
    modified_at              DATETIME2     DEFAULT GETDATE(),
    editing_user_id          BIGINT        NULL,
    editing_user_name        NVARCHAR(100) NULL,
    editing_started_at       DATETIME2     NULL
);
GO

CREATE TABLE tb_site_safety_worker (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_id       BIGINT        NOT NULL,
    worker_name   NVARCHAR(50)  NOT NULL,
    worker_phone  NVARCHAR(30)  NULL,
    company_name  NVARCHAR(100) NULL,
    notes         NVARCHAR(200) NULL,
    created_at    DATETIME2     DEFAULT GETDATE(),
    CONSTRAINT FK_site_safety_worker_plan FOREIGN KEY (plan_id) REFERENCES tb_site_safety_plan(id) ON DELETE CASCADE
);
GO

-- ===== 더미 =====
INSERT INTO tb_site_safety_plan
    (plan_id, title, work_type, risk_level, work_location, workers_count,
     work_start_date, work_end_date, work_description, safety_measures,
     required_ppe, hazard_factors, emergency_contact, notes,
     checklist_template_id, status,
     plan_approver_name, plan_approver_team, plan_approver_position,
     inspector_name, inspector_team, inspector_position)
VALUES
    ('SS-2026-001', N'생산동A 2층 배관 누수 보수',  N'유지보수', 'MEDIUM', N'생산동A 2F 배관실',     3,
     '2026-05-15', '2026-05-15', N'급수 배관 누수 부위 절단·교체 작업', N'안전모·안전화·차단 장갑·작업 전 차단',
     N'안전모, 안전화, 보안경, 절연장갑', N'고소작업·누수·미끄럼', N'010-1111-2222', N'점검 완료 후 서명 필요',
     NULL, 'DRAFT',
     N'이안전', N'안전관리팀', N'팀장',
     N'박점검', N'환경안전팀', N'대리'),
    ('SS-2026-002', N'화학창고 천장 누수 긴급 점검', N'점검',      'HIGH',   N'화학창고 천장',           2,
     '2026-05-14', '2026-05-14', N'우천 후 천장 누수 의심 부위 긴급 점검', N'화학물질 접근 차단·고소 안전벨트',
     N'안전모, 화학복, 안전벨트',     N'화학물질 누출·고소작업',     N'010-3333-4444', NULL,
     NULL, 'APPROVED',
     N'이안전', N'안전관리팀', N'팀장',
     N'박점검', N'환경안전팀', N'대리'),
    ('SS-2026-003', N'사무동 옥상 방수공사',         N'공사',      'LOW',    N'사무동 옥상',             4,
     '2026-04-20', '2026-04-25', N'우레탄 방수 도장 공사', N'안전난간 확인·낙하방지망',
     N'안전모, 안전화, 안전벨트', N'고소작업·VOC',                N'010-5555-6666', N'완료',
     NULL, 'DONE',
     N'이안전', N'안전관리팀', N'팀장',
     N'박점검', N'환경안전팀', N'대리');
GO

INSERT INTO tb_site_safety_worker (plan_id, worker_name, worker_phone, company_name) VALUES
    (1, N'김작업', '010-1234-5678', N'(주)한국설비'),
    (1, N'이용접', '010-2345-6789', N'(주)한국설비'),
    (2, N'정점검', '010-4321-8765', N'(주)대한안전'),
    (3, N'홍방수', '010-9876-5432', N'(주)대한방수'),
    (3, N'박페인', '010-8765-4321', N'(주)대한방수');
GO
