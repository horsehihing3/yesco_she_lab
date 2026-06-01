-- V177: 현장 안전 관리 — 점검자 서명 폐기
--   계획 승인자 / 완료 승인자 두 단계로 워크플로우 정리됨에 따라
--   기존 inspector_* 컬럼 (단일 서명자) 전체 제거

SET NOCOUNT ON;
GO

IF COL_LENGTH('tb_site_safety_plan', 'inspector_user_id') IS NOT NULL
BEGIN
    ALTER TABLE tb_site_safety_plan DROP COLUMN inspector_user_id;
END;
GO
IF COL_LENGTH('tb_site_safety_plan', 'inspector_team') IS NOT NULL
BEGIN
    ALTER TABLE tb_site_safety_plan DROP COLUMN inspector_team;
END;
GO
IF COL_LENGTH('tb_site_safety_plan', 'inspector_position') IS NOT NULL
BEGIN
    ALTER TABLE tb_site_safety_plan DROP COLUMN inspector_position;
END;
GO
IF COL_LENGTH('tb_site_safety_plan', 'inspector_name') IS NOT NULL
BEGIN
    ALTER TABLE tb_site_safety_plan DROP COLUMN inspector_name;
END;
GO
IF COL_LENGTH('tb_site_safety_plan', 'inspector_signature') IS NOT NULL
BEGIN
    ALTER TABLE tb_site_safety_plan DROP COLUMN inspector_signature;
END;
GO
IF COL_LENGTH('tb_site_safety_plan', 'inspector_signed_at') IS NOT NULL
BEGIN
    ALTER TABLE tb_site_safety_plan DROP COLUMN inspector_signed_at;
END;
GO
