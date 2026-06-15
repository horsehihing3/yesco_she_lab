-- 법규 대응 관리: 등록 법령 + 개정 추적 캐시
IF OBJECT_ID('tb_legal_registry','U') IS NULL
BEGIN
CREATE TABLE tb_legal_registry (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    law_id          NVARCHAR(50)  NULL,       -- 법제처 법령일련번호
    law_name        NVARCHAR(300) NOT NULL,
    law_type        NVARCHAR(50)  NULL,       -- 법률/시행령/시행규칙/고시
    category        NVARCHAR(50)  NULL,       -- 안전/보건/환경/화학물질/소방
    competent_org   NVARCHAR(100) NULL,       -- 소관부처
    promulgation_no NVARCHAR(50)  NULL,       -- 공포번호
    promulgation_dt NVARCHAR(10)  NULL,       -- 공포일자 YYYY-MM-DD
    enforce_dt      NVARCHAR(10)  NULL,       -- 시행일자
    status          NVARCHAR(20)  NULL,       -- ACTIVE/PENDING/ABOLISHED
    detail_link     NVARCHAR(500) NULL,       -- 법제처 상세 URL
    memo            NVARCHAR(1000) NULL,
    created_by_user_id BIGINT NULL,
    created_by_name    NVARCHAR(100) NULL,
    created_by_team    NVARCHAR(200) NULL,
    created_by_position NVARCHAR(100) NULL,
    modified_by_user_id BIGINT NULL,
    modified_by_name    NVARCHAR(100) NULL,
    modified_by_team    NVARCHAR(200) NULL,
    modified_by_position NVARCHAR(100) NULL,
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME NOT NULL DEFAULT GETDATE()
);
CREATE INDEX IX_legal_registry_law_id ON tb_legal_registry(law_id);
CREATE INDEX IX_legal_registry_category ON tb_legal_registry(category);
END
GO

IF OBJECT_ID('tb_legal_revision_log','U') IS NULL
BEGIN
CREATE TABLE tb_legal_revision_log (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    law_id          NVARCHAR(50)  NULL,
    law_name        NVARCHAR(300) NOT NULL,
    revision_type   NVARCHAR(30)  NULL,      -- 일부개정/전부개정/신규제정/폐지/입법예고
    revision_no     NVARCHAR(50)  NULL,
    revision_dt     NVARCHAR(10)  NULL,
    enforce_dt      NVARCHAR(10)  NULL,
    summary         NVARCHAR(2000) NULL,
    detail_link     NVARCHAR(500) NULL,
    review_status   NVARCHAR(20)  NULL,      -- PENDING/IN_REVIEW/DONE/NEED_ACTION/NO_IMPACT
    impact_level    NVARCHAR(10)  NULL,      -- HIGH/MID/LOW
    fetched_at      DATETIME      NOT NULL DEFAULT GETDATE(),
    created_at      DATETIME      NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME      NOT NULL DEFAULT GETDATE()
);
CREATE INDEX IX_legal_revision_log_law_id ON tb_legal_revision_log(law_id);
CREATE INDEX IX_legal_revision_log_review_status ON tb_legal_revision_log(review_status);
END
GO
