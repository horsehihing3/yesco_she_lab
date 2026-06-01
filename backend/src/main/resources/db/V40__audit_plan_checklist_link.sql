-- V40: 감사 계획에 체크리스트 템플릿 연결 컬럼 추가
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_plan' AND COLUMN_NAME='checklist_template_id')
    ALTER TABLE tb_audit_plan ADD checklist_template_id BIGINT NULL;

-- 기존 더미데이터에 체크리스트 연결
EXEC('
DECLARE @tpl1 BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE category_type = ''AUDIT'' AND template_name LIKE N''%전기설비%'');
DECLARE @tpl2 BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE category_type = ''AUDIT'' AND template_name LIKE N''%화재%'');
IF @tpl1 IS NOT NULL
    UPDATE tb_audit_plan SET checklist_template_id = @tpl1 WHERE plan_id = ''AP-2026-001'';
IF @tpl2 IS NOT NULL
    UPDATE tb_audit_plan SET checklist_template_id = @tpl2 WHERE plan_id = ''AP-2026-002'';
');
