-- ============================================================
-- V172: 법규 대응을 감사 시스템 위에 얹기 위한 코드값 추가
-- 1) AUDIT_TYPE 코드 그룹에 LEGAL_COMPLIANCE 추가 → 감사 데이터에서 법규대응 건을 구분
-- 2) CHECKLIST_CATEGORY_TYPE 에 LEGAL_COMPLIANCE 추가 → 법규대응 전용 체크리스트 분류
-- ============================================================

-- (1) AUDIT_TYPE: LEGAL_COMPLIANCE
IF EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'AUDIT_TYPE')
BEGIN
    DECLARE @auditTypeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'AUDIT_TYPE');
    IF NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @auditTypeGroupId AND code = 'LEGAL_COMPLIANCE')
    BEGIN
        INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
        VALUES (@auditTypeGroupId, 'LEGAL_COMPLIANCE', 'LEGAL_COMPLIANCE', N'법규 대응', 'Legal Compliance', N'法规对应', 1, 90, GETDATE(), GETDATE());
    END;
END;
GO

-- (2) CHECKLIST_CATEGORY_TYPE: LEGAL_COMPLIANCE
IF EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'CHECKLIST_CATEGORY_TYPE')
BEGIN
    DECLARE @clCatTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKLIST_CATEGORY_TYPE');
    IF NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @clCatTypeId AND code = 'LEGAL_COMPLIANCE')
    BEGIN
        INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
        VALUES (@clCatTypeId, 'LEGAL_COMPLIANCE', 'LEGAL_COMPLIANCE', N'법규 대응', 'Legal Compliance', N'法规对应', 1, 95, GETDATE(), GETDATE());
    END;
END;
GO

-- (3) 법규 대응 체크리스트 템플릿 샘플 1건
IF OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM tb_checklist_template WHERE category_type = 'LEGAL_COMPLIANCE')
BEGIN
    INSERT INTO tb_checklist_template (template_name, description, category_type, result_options, sort_order, is_active, created_at, modified_at)
    VALUES (
        N'법규 준수 점검표 (샘플)',
        N'법규 검토 결과 적용 대상 법규에 대한 준수 여부 점검 (대기·수질·폐기물·소방·산안)',
        'LEGAL_COMPLIANCE',
        'PASS,FAIL,NA',
        100, 1, GETDATE(), GETDATE()
    );
END;
GO
