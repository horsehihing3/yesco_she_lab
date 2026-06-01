-- V116: 연간 계획 + 목표 더미데이터 새 구조 기준 재구성

IF OBJECT_ID('tb_ehs_annual_plan', 'U') IS NULL
    RETURN;

-- 모든 plan 의 작성/승인/개정일자 기본값 채우기
UPDATE tb_ehs_annual_plan
   SET writer_team     = COALESCE(writer_team,     N'노경지원팀'),
       writer_position = COALESCE(writer_position, N'매니저'),
       writer_name     = COALESCE(writer_name,     N'김윤진'),
       approver_team     = COALESCE(approver_team,     N'노경지원팀'),
       approver_position = COALESCE(approver_position, N'팀장'),
       approver_name     = COALESCE(approver_name,     N'홍성기'),
       revised_date    = COALESCE(revised_date, '2024-01-26');

-- 기존 더미 goal 비우고 다시 채워넣기 (이미 있으면 건너뜀)
IF OBJECT_ID('tb_ehs_annual_plan_goal', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM tb_ehs_annual_plan_goal)
BEGIN
    DECLARE @plan_id BIGINT;
    SELECT TOP 1 @plan_id = id FROM tb_ehs_annual_plan
     WHERE plan_name = N'연간 EHS 계획 수립';

    IF @plan_id IS NOT NULL
    BEGIN
        INSERT INTO tb_ehs_annual_plan_goal
            (plan_id, goal_text, sub_goal, task, kpi, prev_result, target_value, owner_team, owner_name, q1, q2, q3, q4, sort_order)
        VALUES
            (@plan_id, N'Ⅰ. 재해율 0.5% 미만',
                       N'외근 중 교통사고, 안전사고 발생 zero화',
                       N'1. 교통 안전교육 실시' + CHAR(10) + N'2. 작업 전 보호구 착용(안전모, 안전화)',
                       N'• 교통 안전교육 실시여부' + CHAR(10) + N'• 보호구 착용여부',
                       N'실행', N'실행',
                       N'노경지원팀', N'팀원', 1, 1, 1, 1, 10),
            (@plan_id, N'Ⅱ. 산업안전보건교육 이수율 100%',
                       N'근로자 정기 안전보건교육 100% 달성',
                       N'1. 안전보건 교육 실시 요청' + CHAR(10) + N'2. 팀별 안전보건 교육 진행',
                       N'◆ 년4회이상 요청' + CHAR(10) + N'◆ 교육대상자 전원 이수',
                       N'1. 4회(분기교육)' + CHAR(10) + N'2. 전원이수',
                       N'1. 4회(분기교육)' + CHAR(10) + N'2. 전원이수',
                       N'노경지원팀', N'팀원', 1, 1, 1, 1, 20),
            (@plan_id, NULL,
                       N'MSDS 확인 및 교육 시행',
                       N'1. MSDS 업데이트에 따른 교육',
                       N'◆ MSDS 기본교육 실행',
                       N'1. MSDS 기본교육 재실시',
                       N'1. MSDS 기본/특별교육 실시',
                       N'노경지원팀', N'김인정', 1, 0, 0, 0, 30),
            (@plan_id, N'Ⅲ. 구성원 건강검진 수검률 99% 이상',
                       N'구성원 건강검진 수검률 100% 달성',
                       N'1. 전 임직원 건강검진 매년 실시',
                       N'◆ 수검율 100% 달성',
                       N'100%', N'100%',
                       N'노경지원팀', N'팀원', 1, 1, 0, 0, 40);
    END
END
