-- 보건안전 재해발생 정보: 팀 참여자(team_members) 컬럼 제거
IF COL_LENGTH('tb_safety_accident_form', 'team_members') IS NOT NULL
BEGIN
    ALTER TABLE tb_safety_accident_form DROP COLUMN team_members;
END
GO
