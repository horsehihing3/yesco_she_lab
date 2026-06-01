-- V87: 개선실행 계획서 (Improvement Plan) - 양식7 기반
--   - Header: 개선대상(공정/활동)명, 작성일, 담당, 팀장
--   - Items (multi-row): 개선대상 단위작업, 코드번호, 재해형태(코드), 개선대책, 일정, 담당, 실시결과, 확인일자, 비고

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'tb_improvement_plan')
BEGIN
    CREATE TABLE tb_improvement_plan (
        id                 BIGINT IDENTITY(1,1) PRIMARY KEY,
        title              NVARCHAR(300)  NULL,      -- 개선대상(공정/활동)명
        author_date        NVARCHAR(30)   NULL,      -- 작성일 (YYYY-MM-DD)
        manager_name       NVARCHAR(100)  NULL,      -- 담당 이름
        manager_dept       NVARCHAR(200)  NULL,      -- 담당 소속
        team_leader_name   NVARCHAR(100)  NULL,      -- 팀장 이름
        team_leader_dept   NVARCHAR(200)  NULL,      -- 팀장 소속
        created_at         DATETIME2 NOT NULL DEFAULT GETDATE(),
        modified_at        DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'tb_improvement_plan_item')
BEGIN
    CREATE TABLE tb_improvement_plan_item (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        plan_id             BIGINT NOT NULL,
        work_unit           NVARCHAR(500)  NULL,      -- 개선대상 단위작업
        code_number         NVARCHAR(50)   NULL,      -- 코드번호
        disaster_type       NVARCHAR(50)   NULL,      -- 재해형태 (DISASTER_TYPE code)
        improvement_detail  NVARCHAR(MAX)  NULL,      -- 개선대책 (텍스트)
        schedule_date       NVARCHAR(30)   NULL,      -- 일정
        executor            NVARCHAR(100)  NULL,      -- 담당
        execution_result    NVARCHAR(500)  NULL,      -- 실시결과
        confirm_date        NVARCHAR(30)   NULL,      -- 확인일자
        note                NVARCHAR(500)  NULL,      -- 비고
        sort_order          INT NOT NULL DEFAULT 0,
        created_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_tb_improvement_plan_item_plan_id ON tb_improvement_plan_item(plan_id);
END
GO
