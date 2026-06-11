-- V220: 안전보건상 위험정보 (양식2) 메뉴 스키마
-- 안전관리 > 안전보건상 위험정보. 양식 2: 안전보건상 위험정보조사서
--   1) tb_safety_hazard_form  - 작성서 마스터 (제목/상세/부문/부서/평가자/조사일자/팀참여자)
--   2) tb_safety_hazard_item  - 양식 행 (공정/활동, 기계·기구·설비, 유해화학물질, 근로자구성, 교대작업, 중량물, 허가, 특별교육)

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_safety_hazard_form', 'U') IS NULL
BEGIN
    CREATE TABLE tb_safety_hazard_form (
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

IF OBJECT_ID('tb_safety_hazard_item', 'U') IS NULL
BEGIN
    CREATE TABLE tb_safety_hazard_item (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        form_id         BIGINT NOT NULL,
        process_activity NVARCHAR(500) NULL,    -- 공정/활동 (그룹 헤더)
        -- 기계·기구 및 설비
        machine_name    NVARCHAR(300) NULL,    -- 기계·기구, 설비, 운반구
        machine_qty     INT NULL,              -- 수량
        -- 유해화학물질
        chemical_name   NVARCHAR(300) NULL,
        chemical_qty    NVARCHAR(100) NULL,    -- 취급량/일
        exposure_time   NVARCHAR(100) NULL,    -- 노출시간
        -- 근로자 구성 및 경력특성 1~6
        worker_comp_1   BIT DEFAULT 0,
        worker_comp_2   BIT DEFAULT 0,
        worker_comp_3   BIT DEFAULT 0,
        worker_comp_4   BIT DEFAULT 0,
        worker_comp_5   BIT DEFAULT 0,
        worker_comp_6   BIT DEFAULT 0,
        -- 교대작업 유무 및 형태 1~3
        shift_work_1    BIT DEFAULT 0,
        shift_work_2    BIT DEFAULT 0,
        shift_work_3    BIT DEFAULT 0,
        -- 중량물 취급 1~3
        heavy_load_1    BIT DEFAULT 0,
        heavy_load_2    BIT DEFAULT 0,
        heavy_load_3    BIT DEFAULT 0,
        -- 허가작업 / 특별교육
        permit_work     NVARCHAR(50) NULL,
        special_training NVARCHAR(50) NULL,
        sort_order      INT DEFAULT 0,
        created_at      DATETIME2 DEFAULT GETDATE(),
        modified_at     DATETIME2 DEFAULT GETDATE()
    );
    CREATE INDEX idx_safety_hazard_item_form ON tb_safety_hazard_item(form_id);
END
GO
