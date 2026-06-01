-- V118: 모든 연간 계획 더미에 4행 목표 데이터 주입
--   - V116 으로 첫 plan 에만 들어가 있던 task/kpi/prev_result/target_value/owner/q?/q?_status 를
--     나머지 모든 plan 에도 동일 템플릿(Ⅰ/Ⅱ/MSDS/Ⅲ)으로 채워넣는다.
--   - 이미 goal row 가 존재하는 plan 은 건너뛴다(WHERE NOT EXISTS).

IF OBJECT_ID('tb_ehs_annual_plan', 'U') IS NULL OR
   OBJECT_ID('tb_ehs_annual_plan_goal', 'U') IS NULL
    RETURN;

INSERT INTO tb_ehs_annual_plan_goal
    (plan_id, goal_text, sub_goal, task, kpi, prev_result, target_value,
     owner_team, owner_name,
     q1, q2, q3, q4,
     q1_status, q2_status, q3_status, q4_status,
     sort_order)
SELECT
    p.id,
    t.goal_text, t.sub_goal, t.task, t.kpi, t.prev_result, t.target_value,
    t.owner_team, t.owner_name,
    t.q1, t.q2, t.q3, t.q4,
    t.q1_status, t.q2_status, t.q3_status, t.q4_status,
    t.sort_order
FROM tb_ehs_annual_plan p
CROSS JOIN (
    VALUES
        (N'Ⅰ. 재해율 0.5% 미만',
         N'외근 중 교통사고,' + CHAR(10) + N'안전사고 발생 zero화',
         N'1. 교통 안전교육 실시' + CHAR(10) + N'2. 작업 전 보호구 착용(안전모, 안전화)',
         N'• 교통 안전교육 실시여부' + CHAR(10) + N'• 보호구 착용여부',
         N'실행', N'실행',
         N'노경지원팀', N'팀원',
         CAST(1 AS BIT), CAST(1 AS BIT), CAST(1 AS BIT), CAST(1 AS BIT),
         N'ACHIEVED', N'ACHIEVED', N'IN_PROGRESS', N'REVIEW',
         10),
        (N'Ⅱ. 산업안전보건교육 이수율 100%',
         N'근로자 정기 안전보건교육' + CHAR(10) + N'100% 달성',
         N'1. 안전보건 교육 실시 요청' + CHAR(10) + N'2. 팀별 안전보건 교육 진행',
         N'◆ 년4회이상 요청' + CHAR(10) + N'◆ 교육대상자 전원 이수',
         N'1. 4회(분기교육)' + CHAR(10) + N'2. 전원이수',
         N'1. 4회(분기교육)' + CHAR(10) + N'2. 전원이수',
         N'노경지원팀', N'팀원',
         CAST(1 AS BIT), CAST(1 AS BIT), CAST(1 AS BIT), CAST(1 AS BIT),
         N'ACHIEVED', N'ACHIEVED', N'ACHIEVED', N'IN_PROGRESS',
         20),
        (NULL,
         N'MSDS 확인 및 교육 시행',
         N'1. MSDS 업데이트에 따른 교육',
         N'◆ MSDS 기본교육 실행',
         N'1. MSDS 기본교육 재실시',
         N'1. MSDS 기본/특별교육 실시',
         N'노경지원팀', N'김인정',
         CAST(1 AS BIT), CAST(0 AS BIT), CAST(0 AS BIT), CAST(0 AS BIT),
         N'ACHIEVED', NULL, NULL, NULL,
         30),
        (N'Ⅲ. 구성원 건강검진 수검률 99% 이상',
         N'구성원 건강검진 수검률' + CHAR(10) + N'100% 달성',
         N'1. 전 임직원 건강검진 매년 실시',
         N'◆ 수검율 100% 달성',
         N'100%', N'100%',
         N'노경지원팀', N'팀원',
         CAST(1 AS BIT), CAST(1 AS BIT), CAST(0 AS BIT), CAST(0 AS BIT),
         N'ACHIEVED', N'IN_PROGRESS', NULL, NULL,
         40)
) AS t(goal_text, sub_goal, task, kpi, prev_result, target_value,
       owner_team, owner_name,
       q1, q2, q3, q4,
       q1_status, q2_status, q3_status, q4_status,
       sort_order)
WHERE NOT EXISTS (
    SELECT 1 FROM tb_ehs_annual_plan_goal g WHERE g.plan_id = p.id
);
