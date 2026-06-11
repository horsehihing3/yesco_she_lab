-- ContractorRegistration 수정자 상세 컬럼 추가
IF COL_LENGTH('tb_contractor_registration', 'modified_by_name') IS NULL
    ALTER TABLE tb_contractor_registration
        ADD modified_by_name     NVARCHAR(100) NULL,
            modified_by_team     NVARCHAR(100) NULL,
            modified_by_position NVARCHAR(100) NULL,
            modified_by_user_id  BIGINT        NULL;

-- ContractorPlan 수정자 상세 컬럼 추가
IF COL_LENGTH('tb_contractor_plan', 'modified_by_name') IS NULL
    ALTER TABLE tb_contractor_plan
        ADD modified_by_name     NVARCHAR(100) NULL,
            modified_by_team     NVARCHAR(100) NULL,
            modified_by_position NVARCHAR(100) NULL,
            modified_by_user_id  BIGINT        NULL;

-- SiteSafetyPlan 수정자 상세 컬럼 추가
IF COL_LENGTH('tb_site_safety_plan', 'modified_by_name') IS NULL
    ALTER TABLE tb_site_safety_plan
        ADD modified_by_name     NVARCHAR(100) NULL,
            modified_by_team     NVARCHAR(100) NULL,
            modified_by_position NVARCHAR(100) NULL,
            modified_by_user_id  BIGINT        NULL;
