-- ════════════════════════════════════════════════════════════════════
-- V228 — 보호구·장비(PPE) 신규 8개 테이블 생성
-- ════════════════════════════════════════════════════════════════════
-- 공통 메타 컬럼: created_by/modified_by NVARCHAR(MAX, PersonRef JSON),
--                created_at/modified_at DATETIME2, is_deleted BIT.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. 품목 마스터 ──────────────────────────────────────────────
IF OBJECT_ID('tb_ppe_item', 'U') IS NULL
CREATE TABLE tb_ppe_item (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    item_code       NVARCHAR(50)  NULL,
    name            NVARCHAR(200) NOT NULL,
    category        NVARCHAR(100) NULL,
    model_no        NVARCHAR(100) NULL,
    kc_cert_no      NVARCHAR(100) NULL,
    grade           NVARCHAR(50)  NULL,
    supplier        NVARCHAR(200) NULL,
    unit_price      INT           NULL,
    replace_cycle   INT           NULL,
    cert_expiry     DATE          NULL,
    min_stock       INT           NULL,
    note            NVARCHAR(MAX) NULL,
    created_by      NVARCHAR(MAX) NULL,
    modified_by     NVARCHAR(MAX) NULL,
    created_at      DATETIME2     NULL DEFAULT SYSDATETIME(),
    modified_at     DATETIME2     NULL DEFAULT SYSDATETIME(),
    is_deleted      BIT           NOT NULL DEFAULT 0
);
GO

-- ── 2. 창고별 재고 ──────────────────────────────────────────────
IF OBJECT_ID('tb_ppe_stock', 'U') IS NULL
CREATE TABLE tb_ppe_stock (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    item_id         BIGINT        NULL,
    item_name       NVARCHAR(200) NULL,
    location        NVARCHAR(100) NULL,
    quantity        INT           NULL,
    min_qty         INT           NULL,
    opt_qty         INT           NULL,
    expiry_date     DATE          NULL,
    note            NVARCHAR(MAX) NULL,
    created_by      NVARCHAR(MAX) NULL,
    modified_by     NVARCHAR(MAX) NULL,
    created_at      DATETIME2     NULL DEFAULT SYSDATETIME(),
    modified_at     DATETIME2     NULL DEFAULT SYSDATETIME(),
    is_deleted      BIT           NOT NULL DEFAULT 0
);
GO

-- ── 3. 입출고 이력 ──────────────────────────────────────────────
IF OBJECT_ID('tb_ppe_inout', 'U') IS NULL
CREATE TABLE tb_ppe_inout (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    inout_date      DATE          NULL,
    item_id         BIGINT        NULL,
    item_name       NVARCHAR(200) NULL,
    inout_type      NVARCHAR(20)  NULL,
    quantity        INT           NULL,
    location        NVARCHAR(100) NULL,
    expiry_date     DATE          NULL,
    manager         NVARCHAR(100) NULL,
    note            NVARCHAR(MAX) NULL,
    created_by      NVARCHAR(MAX) NULL,
    modified_by     NVARCHAR(MAX) NULL,
    created_at      DATETIME2     NULL DEFAULT SYSDATETIME(),
    modified_at     DATETIME2     NULL DEFAULT SYSDATETIME(),
    is_deleted      BIT           NOT NULL DEFAULT 0
);
GO

-- ── 4. 지급·반납 ───────────────────────────────────────────────
IF OBJECT_ID('tb_ppe_issue', 'U') IS NULL
CREATE TABLE tb_ppe_issue (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    issue_date      DATE          NULL,
    worker_name     NVARCHAR(100) NULL,
    emp_id          NVARCHAR(50)  NULL,
    department      NVARCHAR(100) NULL,
    item_id         BIGINT        NULL,
    item_name       NVARCHAR(200) NULL,
    quantity        INT           NULL,
    issue_reason    NVARCHAR(50)  NULL,
    return_date     DATE          NULL,
    status          NVARCHAR(20)  NULL,
    signed          BIT           NULL DEFAULT 0,
    signature_image NVARCHAR(MAX) NULL,
    note            NVARCHAR(MAX) NULL,
    created_by      NVARCHAR(MAX) NULL,
    modified_by     NVARCHAR(MAX) NULL,
    created_at      DATETIME2     NULL DEFAULT SYSDATETIME(),
    modified_at     DATETIME2     NULL DEFAULT SYSDATETIME(),
    is_deleted      BIT           NOT NULL DEFAULT 0
);
GO

-- ── 5. 검사·점검 ───────────────────────────────────────────────
IF OBJECT_ID('tb_ppe_inspection', 'U') IS NULL
CREATE TABLE tb_ppe_inspection (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    inspection_date  DATE          NULL,
    item_id          BIGINT        NULL,
    item_name        NVARCHAR(200) NULL,
    item_code        NVARCHAR(50)  NULL,
    inspection_type  NVARCHAR(20)  NULL,
    inspector        NVARCHAR(100) NULL,
    result           NVARCHAR(20)  NULL,
    next_date        DATE          NULL,
    note             NVARCHAR(MAX) NULL,
    created_by       NVARCHAR(MAX) NULL,
    modified_by      NVARCHAR(MAX) NULL,
    created_at       DATETIME2     NULL DEFAULT SYSDATETIME(),
    modified_at      DATETIME2     NULL DEFAULT SYSDATETIME(),
    is_deleted       BIT           NOT NULL DEFAULT 0
);
GO

-- ── 6. 착용 이행 ───────────────────────────────────────────────
IF OBJECT_ID('tb_ppe_wear', 'U') IS NULL
CREATE TABLE tb_ppe_wear (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    check_datetime  DATETIME2     NULL,
    worker_name     NVARCHAR(100) NULL,
    department      NVARCHAR(100) NULL,
    work_zone       NVARCHAR(200) NULL,
    required_ppe    NVARCHAR(500) NULL,
    wear_status     NVARCHAR(20)  NULL,
    checker         NVARCHAR(100) NULL,
    action_taken    NVARCHAR(MAX) NULL,
    note            NVARCHAR(MAX) NULL,
    created_by      NVARCHAR(MAX) NULL,
    modified_by     NVARCHAR(MAX) NULL,
    created_at      DATETIME2     NULL DEFAULT SYSDATETIME(),
    modified_at     DATETIME2     NULL DEFAULT SYSDATETIME(),
    is_deleted      BIT           NOT NULL DEFAULT 0
);
GO

-- ── 7. 성능 평가 ───────────────────────────────────────────────
IF OBJECT_ID('tb_ppe_performance', 'U') IS NULL
CREATE TABLE tb_ppe_performance (
    id                    BIGINT IDENTITY(1,1) PRIMARY KEY,
    evaluation_date       DATE          NULL,
    item_id               BIGINT        NULL,
    item_name             NVARCHAR(200) NULL,
    performance_standard  NVARCHAR(200) NULL,
    standard_value        NVARCHAR(100) NULL,
    measured_value        NVARCHAR(100) NULL,
    result                NVARCHAR(20)  NULL,
    evaluator             NVARCHAR(100) NULL,
    note                  NVARCHAR(MAX) NULL,
    created_by            NVARCHAR(MAX) NULL,
    modified_by           NVARCHAR(MAX) NULL,
    created_at            DATETIME2     NULL DEFAULT SYSDATETIME(),
    modified_at           DATETIME2     NULL DEFAULT SYSDATETIME(),
    is_deleted            BIT           NOT NULL DEFAULT 0
);
GO

-- ── 8. 비용·예산 ───────────────────────────────────────────────
IF OBJECT_ID('tb_ppe_budget', 'U') IS NULL
CREATE TABLE tb_ppe_budget (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    budget_year     INT           NULL,
    department      NVARCHAR(100) NULL,
    budget_amount   BIGINT        NULL,
    spent_amount    BIGINT        NULL,
    note            NVARCHAR(MAX) NULL,
    created_by      NVARCHAR(MAX) NULL,
    modified_by     NVARCHAR(MAX) NULL,
    created_at      DATETIME2     NULL DEFAULT SYSDATETIME(),
    modified_at     DATETIME2     NULL DEFAULT SYSDATETIME(),
    is_deleted      BIT           NOT NULL DEFAULT 0
);
GO
