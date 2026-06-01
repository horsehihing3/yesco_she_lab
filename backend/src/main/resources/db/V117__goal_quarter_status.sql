-- V117: 목표 추진일정 분기별 KPI 달성상태 (ACHIEVED / IN_PROGRESS / REVIEW / NOT_ACHIEVED)
--   체크된(q? = 1) 분기마다 KPI 현황 탭에서 별도로 상태값을 지정할 수 있도록 컬럼 추가
--
-- 참고: SQL Server 는 배치 단위로 컴파일하므로 ALTER TABLE 후 같은 배치의 UPDATE 가
--       새 컬럼을 인식하지 못한다. UPDATE 는 EXEC 동적 SQL 로 분리해 실행한다.

IF OBJECT_ID('tb_ehs_annual_plan_goal', 'U') IS NULL
    RETURN;

IF COL_LENGTH('tb_ehs_annual_plan_goal', 'q1_status') IS NULL
    ALTER TABLE tb_ehs_annual_plan_goal ADD q1_status NVARCHAR(20) NULL;
IF COL_LENGTH('tb_ehs_annual_plan_goal', 'q2_status') IS NULL
    ALTER TABLE tb_ehs_annual_plan_goal ADD q2_status NVARCHAR(20) NULL;
IF COL_LENGTH('tb_ehs_annual_plan_goal', 'q3_status') IS NULL
    ALTER TABLE tb_ehs_annual_plan_goal ADD q3_status NVARCHAR(20) NULL;
IF COL_LENGTH('tb_ehs_annual_plan_goal', 'q4_status') IS NULL
    ALTER TABLE tb_ehs_annual_plan_goal ADD q4_status NVARCHAR(20) NULL;

-- 기존 더미 데이터에 적당한 상태값 시드 (체크된 분기에만)
EXEC sp_executesql N'
    UPDATE tb_ehs_annual_plan_goal
       SET q1_status = CASE WHEN q1 = 1 AND q1_status IS NULL THEN ''ACHIEVED''    ELSE q1_status END,
           q2_status = CASE WHEN q2 = 1 AND q2_status IS NULL THEN ''ACHIEVED''    ELSE q2_status END,
           q3_status = CASE WHEN q3 = 1 AND q3_status IS NULL THEN ''IN_PROGRESS'' ELSE q3_status END,
           q4_status = CASE WHEN q4 = 1 AND q4_status IS NULL THEN ''REVIEW''      ELSE q4_status END;
';
