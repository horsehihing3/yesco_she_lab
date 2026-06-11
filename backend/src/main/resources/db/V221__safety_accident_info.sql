-- V221: 보건안전 재해발생 정보 (양식3) 메뉴 스키마
-- 안전관리 > 보건안전 재해발생 정보. 양식 3: 보건안전재해발생정보조사서

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_safety_accident_form', 'U') IS NULL
BEGIN
    CREATE TABLE tb_safety_accident_form (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        title           NVARCHAR(500) NOT NULL,
        description     NVARCHAR(MAX) NULL,
        division_name   NVARCHAR(200) NULL,
        department_name NVARCHAR(200) NULL,
        evaluator       NVARCHAR(500) NULL,
        survey_date     DATE NULL,
        team_members    NVARCHAR(MAX) NULL,
        created_by_user_id   BIGINT NULL,
        created_by_name      NVARCHAR(200) NULL,
        created_by_team      NVARCHAR(200) NULL,
        created_by_position  NVARCHAR(200) NULL,
        modified_by_user_id  BIGINT NULL,
        modified_by_name     NVARCHAR(200) NULL,
        modified_by_team     NVARCHAR(200) NULL,
        modified_by_position NVARCHAR(200) NULL,
        created_at      DATETIME2 DEFAULT GETDATE(),
        modified_at     DATETIME2 DEFAULT GETDATE()
    );
END
GO

IF OBJECT_ID('tb_safety_accident_item', 'U') IS NULL
BEGIN
    CREATE TABLE tb_safety_accident_item (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        form_id         BIGINT NOT NULL,
        item_no         INT NULL,                  -- No
        accident_case   NVARCHAR(1000) NULL,       -- 발생사례
        accident_type   NVARCHAR(100) NULL,        -- 재해형태
        near_miss       BIT DEFAULT 0,             -- 사고형태: 아차사고
        fatal_accident  BIT DEFAULT 0,             -- 사망재해: 사망자 발생
        leave_over_1month  BIT DEFAULT 0,          -- 휴업재해: 1개월 이상
        leave_under_1month BIT DEFAULT 0,          -- 휴업재해: 1개월 미만
        no_leave        BIT DEFAULT 0,             -- 휴업재해: 없음
        frequency       NVARCHAR(100) NULL,        -- 발생주기 (예: 1회/년)
        process_activity NVARCHAR(500) NULL,       -- 해당 공정/활동 및 작업
        sort_order      INT DEFAULT 0,
        created_at      DATETIME2 DEFAULT GETDATE(),
        modified_at     DATETIME2 DEFAULT GETDATE()
    );
    CREATE INDEX idx_safety_accident_item_form ON tb_safety_accident_item(form_id);
END
GO
