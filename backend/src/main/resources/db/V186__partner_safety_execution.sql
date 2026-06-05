-- ============================================================
-- V186: 협력 업체 안전 관리 실행 / 조회 흐름 재설계
--   1) tb_partner_safety_execution 테이블 신규 — 파라미터 입력 + URL + 체크리스트 결과 저장
--   2) 관리/실행/조회 탭에 노출되던 기존 PARTNER plan 데이터 전부 삭제 (더미 없음)
-- ============================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_partner_safety_execution', 'U') IS NULL
BEGIN
    CREATE TABLE tb_partner_safety_execution (
        id                     BIGINT IDENTITY(1,1) PRIMARY KEY,
        plan_id                BIGINT NULL,                            -- 연결된 안전관리 계획 (관리 탭 plan.id)
        name                   NVARCHAR(100) NOT NULL,                 -- 이름
        company_code           NVARCHAR(50)  NOT NULL,                 -- 사업장코드 (협력업체코드)
        phone                  NVARCHAR(20)  NULL,                     -- 휴대폰번호
        system_code            NVARCHAR(50)  NOT NULL,                 -- 호출할 시스템명 (코드)
        system_uid             NVARCHAR(100) NOT NULL,                 -- UID (각 시스템 코드)
        called_at              DATETIME      NOT NULL,                 -- 호출된 시간 (자동 입력)
        execution_token        NVARCHAR(40)  NOT NULL,                 -- 실행 URL 식별 토큰
        signature              NVARCHAR(MAX) NULL,                     -- 서명 (data URL)
        checklist_template_id  BIGINT        NULL,                     -- 체크리스트 템플릿 (plan 에서 상속)
        checklist_data         NVARCHAR(MAX) NULL,                     -- 체크리스트 결과 JSON
        completed              BIT           NOT NULL DEFAULT 0,       -- 완료 여부
        completed_at           DATETIME      NULL,                     -- 완료 시각
        created_at             DATETIME      NOT NULL DEFAULT GETDATE(),
        modified_at            DATETIME      NOT NULL DEFAULT GETDATE()
    );

    CREATE UNIQUE INDEX UX_partner_safety_execution_token ON tb_partner_safety_execution(execution_token);
    CREATE INDEX IX_partner_safety_execution_plan ON tb_partner_safety_execution(plan_id);
    CREATE INDEX IX_partner_safety_execution_completed ON tb_partner_safety_execution(completed);
END;
GO

-- 관리/실행/조회 탭 데이터 초기화 — PARTNER plan + 관련 worker / execution 모두 삭제
IF OBJECT_ID('tb_site_safety_worker', 'U') IS NOT NULL
BEGIN
    DELETE FROM tb_site_safety_worker
    WHERE plan_id IN (SELECT id FROM tb_site_safety_plan WHERE plan_type = 'PARTNER');
END
GO

IF OBJECT_ID('tb_site_safety_plan', 'U') IS NOT NULL
BEGIN
    DELETE FROM tb_site_safety_plan WHERE plan_type = 'PARTNER';
END
GO

DELETE FROM tb_partner_safety_execution;
GO
