-- =====================================================
-- V22: 체크리스트 구조 개편
-- tb_checklist_template에 category_type 컬럼 추가
-- 중대재해처벌법, 법규준수, 공사현장 템플릿+카테고리+항목 추가
-- =====================================================

-- 1. 컬럼 추가
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_checklist_template' AND COLUMN_NAME='category_type')
    ALTER TABLE tb_checklist_template ADD category_type NVARCHAR(30) NULL;

-- 2. 기존 데이터 산업안전보건법으로 분류
EXEC('UPDATE tb_checklist_template SET category_type = ''INDUSTRIAL_SAFETY'' WHERE category_type IS NULL');

-- 3. 새 템플릿 INSERT (EXEC 안에서 실행)
EXEC('
-- 중대재해처벌법
IF NOT EXISTS (SELECT 1 FROM tb_checklist_template WHERE template_name = N''중대재해처벌법 안전보건관리체계 점검'')
    INSERT INTO tb_checklist_template (template_name, description, is_active, category_type)
    VALUES (N''중대재해처벌법 안전보건관리체계 점검'', N''중대재해처벌법 제4조에 따른 안전보건관리체계 구축 및 이행 점검'', 1, ''SERIOUS_DISASTER'');

IF NOT EXISTS (SELECT 1 FROM tb_checklist_template WHERE template_name = N''중대재해처벌법 도급인 안전조치 점검'')
    INSERT INTO tb_checklist_template (template_name, description, is_active, category_type)
    VALUES (N''중대재해처벌법 도급인 안전조치 점검'', N''중대재해처벌법 제5조 도급, 용역, 위탁 시 안전보건 확보 조치 점검'', 1, ''SERIOUS_DISASTER'');

-- 법규 준수
IF NOT EXISTS (SELECT 1 FROM tb_checklist_template WHERE template_name = N''환경법규 준수 점검 체크리스트'')
    INSERT INTO tb_checklist_template (template_name, description, is_active, category_type)
    VALUES (N''환경법규 준수 점검 체크리스트'', N''환경 관련 법규 준수 사항 정기 점검'', 1, ''COMPLIANCE'');

IF NOT EXISTS (SELECT 1 FROM tb_checklist_template WHERE template_name = N''산업안전보건법 준수 점검'')
    INSERT INTO tb_checklist_template (template_name, description, is_active, category_type)
    VALUES (N''산업안전보건법 준수 점검'', N''산업안전보건법 주요 조항 준수 여부 점검'', 1, ''COMPLIANCE'');

-- 공사 현장
IF NOT EXISTS (SELECT 1 FROM tb_checklist_template WHERE template_name = N''공사 착공 전 안전 점검'')
    INSERT INTO tb_checklist_template (template_name, description, is_active, category_type)
    VALUES (N''공사 착공 전 안전 점검'', N''건설공사 착공 전 안전관리 사항 점검'', 1, ''CONSTRUCTION'');

IF NOT EXISTS (SELECT 1 FROM tb_checklist_template WHERE template_name = N''공사 현장 일일 안전 점검'')
    INSERT INTO tb_checklist_template (template_name, description, is_active, category_type)
    VALUES (N''공사 현장 일일 안전 점검'', N''건설공사 현장 일일 안전 점검 체크리스트'', 1, ''CONSTRUCTION'');
');

-- 4. 카테고리 + 항목 추가 (중대재해)
DECLARE @sdT1 BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE template_name = N'중대재해처벌법 안전보건관리체계 점검');
IF @sdT1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tb_checklist_category WHERE template_id = @sdT1)
BEGIN
    INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES
    (@sdT1, N'안전보건 목표', 1), (@sdT1, N'전담 조직', 2), (@sdT1, N'예산 편성', 3), (@sdT1, N'안전보건 교육', 4);

    DECLARE @sc1 BIGINT=(SELECT id FROM tb_checklist_category WHERE template_id=@sdT1 AND category_name=N'안전보건 목표');
    DECLARE @sc2 BIGINT=(SELECT id FROM tb_checklist_category WHERE template_id=@sdT1 AND category_name=N'전담 조직');
    DECLARE @sc3 BIGINT=(SELECT id FROM tb_checklist_category WHERE template_id=@sdT1 AND category_name=N'예산 편성');
    DECLARE @sc4 BIGINT=(SELECT id FROM tb_checklist_category WHERE template_id=@sdT1 AND category_name=N'안전보건 교육');

    INSERT INTO tb_checklist_item (category_id, item_no, check_item, legal_basis, sort_order) VALUES
    (@sc1, 1, N'안전보건 경영방침 수립 여부', N'중대재해처벌법 제4조제1항제1호', 1),
    (@sc1, 2, N'안전보건 목표 설정 및 공표 여부', N'중대재해처벌법 제4조제1항제1호', 2),
    (@sc2, 3, N'안전보건 전담 조직 설치 여부', N'중대재해처벌법 제4조제1항제2호', 3),
    (@sc2, 4, N'전담 인력 배치 적정성', N'중대재해처벌법 제4조제1항제2호', 4),
    (@sc3, 5, N'안전보건 예산 편성 여부', N'중대재해처벌법 제4조제1항제3호', 5),
    (@sc3, 6, N'예산 집행 현황 관리', N'중대재해처벌법 제4조제1항제3호', 6),
    (@sc4, 7, N'경영책임자 안전보건 교육 이수', N'중대재해처벌법 제4조제1항제4호', 7),
    (@sc4, 8, N'근로자 정기 안전보건 교육 실시', N'중대재해처벌법 제4조제1항제4호', 8);
END;

-- 5. 카테고리 + 항목 (법규 준수)
DECLARE @cpT1 BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE template_name = N'환경법규 준수 점검 체크리스트');
IF @cpT1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tb_checklist_category WHERE template_id = @cpT1)
BEGIN
    INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES
    (@cpT1, N'대기환경보전법', 1), (@cpT1, N'물환경보전법', 2), (@cpT1, N'폐기물관리법', 3);

    DECLARE @cc1 BIGINT=(SELECT id FROM tb_checklist_category WHERE template_id=@cpT1 AND category_name=N'대기환경보전법');
    DECLARE @cc2 BIGINT=(SELECT id FROM tb_checklist_category WHERE template_id=@cpT1 AND category_name=N'물환경보전법');
    DECLARE @cc3 BIGINT=(SELECT id FROM tb_checklist_category WHERE template_id=@cpT1 AND category_name=N'폐기물관리법');

    INSERT INTO tb_checklist_item (category_id, item_no, check_item, legal_basis, sort_order) VALUES
    (@cc1, 1, N'대기오염물질 배출허용기준 준수 여부', N'대기환경보전법 제16조', 1),
    (@cc1, 2, N'자가측정 실시 및 기록 관리', N'대기환경보전법 제39조', 2),
    (@cc2, 3, N'수질오염물질 배출허용기준 준수 여부', N'물환경보전법 제32조', 3),
    (@cc2, 4, N'폐수처리시설 정상 가동 여부', N'물환경보전법 제35조', 4),
    (@cc3, 5, N'폐기물 적정 처리 여부', N'폐기물관리법 제13조', 5),
    (@cc3, 6, N'폐기물 인계서 작성·보관 여부', N'폐기물관리법 제18조', 6);
END;

-- 6. 카테고리 + 항목 (공사 현장)
DECLARE @ctT1 BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE template_name = N'공사 착공 전 안전 점검');
IF @ctT1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tb_checklist_category WHERE template_id = @ctT1)
BEGIN
    INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES
    (@ctT1, N'서류 확인', 1), (@ctT1, N'현장 안전시설', 2), (@ctT1, N'근로자 관리', 3);

    DECLARE @ct1 BIGINT=(SELECT id FROM tb_checklist_category WHERE template_id=@ctT1 AND category_name=N'서류 확인');
    DECLARE @ct2 BIGINT=(SELECT id FROM tb_checklist_category WHERE template_id=@ctT1 AND category_name=N'현장 안전시설');
    DECLARE @ct3 BIGINT=(SELECT id FROM tb_checklist_category WHERE template_id=@ctT1 AND category_name=N'근로자 관리');

    INSERT INTO tb_checklist_item (category_id, item_no, check_item, legal_basis, sort_order) VALUES
    (@ct1, 1, N'유해위험방지계획서 제출 여부', N'산안법 제42조', 1),
    (@ct1, 2, N'안전관리계획서 작성 여부', N'건설기술진흥법 제62조', 2),
    (@ct1, 3, N'건설업 산재보험 가입 확인', N'산재보험법 제6조', 3),
    (@ct2, 4, N'안전난간 설치 여부', N'산안법 제38조', 4),
    (@ct2, 5, N'추락방지망 설치 여부', N'산안법 제38조', 5),
    (@ct2, 6, N'안전통로 확보 여부', N'산안법 제38조', 6),
    (@ct3, 7, N'안전보건교육 실시 여부', N'산안법 제29조', 7),
    (@ct3, 8, N'보호구 지급 및 착용 확인', N'산안법 제38조', 8);
END;

-- 7. 코드 그룹
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CHECKLIST_CATEGORY_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CHECKLIST_CATEGORY_TYPE', N'체크리스트 분류', N'체크리스트 법규 분류 유형', 1, 760, GETDATE(), GETDATE());
END;
DECLARE @clCatTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKLIST_CATEGORY_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @clCatTypeId AND code = 'INDUSTRIAL_SAFETY')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@clCatTypeId, 'INDUSTRIAL_SAFETY', 'INDUSTRIAL_SAFETY', N'산업안전보건법', 'Occupational Safety Act', N'产业安全法', 1, 1, GETDATE(), GETDATE()),
    (@clCatTypeId, 'SERIOUS_DISASTER', 'SERIOUS_DISASTER', N'중대재해처벌법', 'Serious Disaster Act', N'重大灾害法', 1, 2, GETDATE(), GETDATE()),
    (@clCatTypeId, 'COMPLIANCE', 'COMPLIANCE', N'법규 준수', 'Compliance', N'法规遵守', 1, 3, GETDATE(), GETDATE()),
    (@clCatTypeId, 'CONSTRUCTION', 'CONSTRUCTION', N'공사 현장', 'Construction Site', N'施工现场', 1, 4, GETDATE(), GETDATE());
END;
