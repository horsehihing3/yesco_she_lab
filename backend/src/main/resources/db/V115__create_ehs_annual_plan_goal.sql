-- V115: 연간 계획 목표/세부목표 + 추진일정 라인 테이블

IF OBJECT_ID('tb_ehs_annual_plan_goal', 'U') IS NOT NULL
    RETURN;

CREATE TABLE tb_ehs_annual_plan_goal (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_id         BIGINT NOT NULL,
    goal_text       NVARCHAR(500) NULL,        -- 목표
    sub_goal        NVARCHAR(500) NULL,        -- 세부목표
    task            NVARCHAR(MAX) NULL,        -- 실행과제
    kpi             NVARCHAR(MAX) NULL,        -- 성과지표
    prev_result     NVARCHAR(MAX) NULL,        -- 전년실적
    target_value    NVARCHAR(MAX) NULL,        -- 목표(값)
    owner_user_id   BIGINT NULL,
    owner_team      NVARCHAR(100) NULL,
    owner_name      NVARCHAR(100) NULL,
    q1              BIT NOT NULL DEFAULT 0,
    q2              BIT NOT NULL DEFAULT 0,
    q3              BIT NOT NULL DEFAULT 0,
    q4              BIT NOT NULL DEFAULT 0,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    modified_at     DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX ix_ehs_annual_plan_goal_plan ON tb_ehs_annual_plan_goal(plan_id);
