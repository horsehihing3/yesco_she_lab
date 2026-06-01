-- V137: 체크리스트 관리 - 사무업무 신규 3개 탭 샘플 템플릿 시드
--   사용자가 위험성 평가 - 사무업무 등록 시 셀렉트에서 바로 선택할 수 있도록
--   각 카테고리에 의미있는 항목들이 들어있는 샘플 템플릿을 1개씩 시드.
--   동일 template_name 이 이미 있으면 skip (idempotent).

SET NOCOUNT ON;
GO

-- ===== 1) CHECKLIST_CATEGORY_TYPE 코드 그룹에 새 코드 3개 추가 =====
IF EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'CHECKLIST_CATEGORY_TYPE')
BEGIN
    DECLARE @clCatTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHECKLIST_CATEGORY_TYPE');
    IF NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @clCatTypeId AND code = 'OFFICE_WORK')
        INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
        VALUES (@clCatTypeId, 'OFFICE_WORK', 'OFFICE_WORK', N'사무업무', 'Office Work', N'办公业务', 1, 20, GETDATE(), GETDATE());
    IF NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @clCatTypeId AND code = 'OFFICE_SANUP')
        INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
        VALUES (@clCatTypeId, 'OFFICE_SANUP', 'OFFICE_SANUP', N'산업안전보건법 예방 사무업무', 'Office - Industrial Safety Prevention', N'办公业务-工业安全卫生法预防', 1, 21, GETDATE(), GETDATE());
    IF NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @clCatTypeId AND code = 'OFFICE_JUNGDAE')
        INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
        VALUES (@clCatTypeId, 'OFFICE_JUNGDAE', 'OFFICE_JUNGDAE', N'중대재해처벌법 예방 사무업무', 'Office - Severe Disaster Prevention', N'办公业务-重大灾害处罚法预防', 1, 22, GETDATE(), GETDATE());
END
GO

-- ===== 2) 템플릿 시드 =====
IF OBJECT_ID('tb_checklist_template', 'U') IS NOT NULL
BEGIN
    -- A) 사무업무 (OFFICE_WORK)
    IF NOT EXISTS (SELECT 1 FROM tb_checklist_template WHERE template_name = N'사무실 일반 안전 점검표')
        INSERT INTO tb_checklist_template (template_name, description, is_active, category_type, result_options, sort_order, created_at, modified_at)
        VALUES (N'사무실 일반 안전 점검표', N'사무업무 환경 일반 안전 점검 (전기·소방·인간공학·정리정돈)', 1, 'OFFICE_WORK', N'적합,부적합', 1, GETDATE(), GETDATE());

    IF NOT EXISTS (SELECT 1 FROM tb_checklist_template WHERE template_name = N'PC·VDT 작업 환경 점검표')
        INSERT INTO tb_checklist_template (template_name, description, is_active, category_type, result_options, sort_order, created_at, modified_at)
        VALUES (N'PC·VDT 작업 환경 점검표', N'장시간 PC 사용 사무직 근골격계·시각 관련 점검', 1, 'OFFICE_WORK', N'적합,부적합', 2, GETDATE(), GETDATE());

    -- B) 산업안전보건법 예방 사무업무 (OFFICE_SANUP)
    IF NOT EXISTS (SELECT 1 FROM tb_checklist_template WHERE template_name = N'산업안전보건법 사무직 예방 점검표')
        INSERT INTO tb_checklist_template (template_name, description, is_active, category_type, result_options, sort_order, created_at, modified_at)
        VALUES (N'산업안전보건법 사무직 예방 점검표', N'산업안전보건법상 사무직 사업장에 적용되는 의무 사항 점검', 1, 'OFFICE_SANUP', N'적합,부적합', 1, GETDATE(), GETDATE());

    -- C) 중대재해처벌법 예방 사무업무 (OFFICE_JUNGDAE)
    IF NOT EXISTS (SELECT 1 FROM tb_checklist_template WHERE template_name = N'중대재해처벌법 사무직 예방 점검표')
        INSERT INTO tb_checklist_template (template_name, description, is_active, category_type, result_options, sort_order, created_at, modified_at)
        VALUES (N'중대재해처벌법 사무직 예방 점검표', N'중대시민재해 등 사무직 사업장에 적용되는 안전보건확보의무 점검', 1, 'OFFICE_JUNGDAE', N'적합,부적합', 1, GETDATE(), GETDATE());
END
GO

-- ===== 3) 카테고리 + 항목 시드 =====
-- A-1) 사무실 일반 안전 점검표
DECLARE @owT1 BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE template_name = N'사무실 일반 안전 점검표' ORDER BY id);
IF @owT1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tb_checklist_category WHERE template_id = @owT1)
BEGIN
    INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES
    (@owT1, N'전기·소방',   1),
    (@owT1, N'일반 환경',   2),
    (@owT1, N'인간공학·정리정돈', 3);

    DECLARE @ow1c1 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@owT1 AND category_name=N'전기·소방');
    DECLARE @ow1c2 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@owT1 AND category_name=N'일반 환경');
    DECLARE @ow1c3 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@owT1 AND category_name=N'인간공학·정리정돈');

    INSERT INTO tb_checklist_item (category_id, item_no, check_item, legal_basis, sort_order) VALUES
    (@ow1c1, 1, N'멀티탭/콘센트 과부하 여부 (문어발 배선)', N'전기설비기술기준', 1),
    (@ow1c1, 2, N'노후 전선·접속부 점검 상태',           N'전기안전관리법',   2),
    (@ow1c1, 3, N'소화기 비치 위치·압력 게이지 정상',     N'화재예방법',       3),
    (@ow1c1, 4, N'비상구·대피로 적재물 차단 여부',         N'소방시설법 제10조', 4),
    (@ow1c2, 5, N'실내 공기질·환기 상태 (이산화탄소·미세먼지)', N'실내공기질법',     5),
    (@ow1c2, 6, N'조도 적정성 (사무 500 lux 이상)',        N'산업안전보건기준규칙', 6),
    (@ow1c2, 7, N'정수기·탕비 가전 위생/누전 점검',         N'식품위생법·전기안전법', 7),
    (@ow1c3, 8, N'모니터·키보드·의자 인체공학 적합성',     N'산안법 제39조',     8),
    (@ow1c3, 9, N'복도·통로 적재·돌출물 제거 상태',         N'산안법 제38조',     9),
    (@ow1c3, 10, N'문서·서류 정리정돈 (낙하·미끄럼 위험)',  N'산안법 제38조',    10);
END;
GO

-- A-2) PC·VDT 작업 환경 점검표
DECLARE @owT2 BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE template_name = N'PC·VDT 작업 환경 점검표' ORDER BY id);
IF @owT2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tb_checklist_category WHERE template_id = @owT2)
BEGIN
    INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES
    (@owT2, N'근골격계 부담', 1),
    (@owT2, N'시각·조명',      2),
    (@owT2, N'휴식·교육',      3);

    DECLARE @ow2c1 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@owT2 AND category_name=N'근골격계 부담');
    DECLARE @ow2c2 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@owT2 AND category_name=N'시각·조명');
    DECLARE @ow2c3 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@owT2 AND category_name=N'휴식·교육');

    INSERT INTO tb_checklist_item (category_id, item_no, check_item, legal_basis, sort_order) VALUES
    (@ow2c1, 1, N'의자 높이·등받이 조절 적정성',           N'산업안전보건기준규칙 제657조', 1),
    (@ow2c1, 2, N'책상·키보드 높이 인체공학 적합성',       N'산업안전보건기준규칙 제657조', 2),
    (@ow2c1, 3, N'마우스·키보드 손목 받침대 사용',          N'근골격계부담작업 기준', 3),
    (@ow2c2, 4, N'모니터 거리·시선 각도 (50~70cm, 약간 아래)', N'VDT 작업 가이드',      4),
    (@ow2c2, 5, N'모니터 밝기·반사광 차단 상태',            N'VDT 작업 가이드',      5),
    (@ow2c3, 6, N'1시간 작업 후 10분 휴식 권장 안내',         N'산업안전보건법 제5조',  6),
    (@ow2c3, 7, N'VDT 증후군 예방 교육 실시 여부',           N'산안법 제29조',         7);
END;
GO

-- B) 산업안전보건법 사무직 예방 점검표
DECLARE @osT1 BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE template_name = N'산업안전보건법 사무직 예방 점검표' ORDER BY id);
IF @osT1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tb_checklist_category WHERE template_id = @osT1)
BEGIN
    INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES
    (@osT1, N'안전보건교육',     1),
    (@osT1, N'위험성평가',       2),
    (@osT1, N'작업환경·건강',    3),
    (@osT1, N'안전보건체계',     4);

    DECLARE @os1c1 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@osT1 AND category_name=N'안전보건교육');
    DECLARE @os1c2 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@osT1 AND category_name=N'위험성평가');
    DECLARE @os1c3 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@osT1 AND category_name=N'작업환경·건강');
    DECLARE @os1c4 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@osT1 AND category_name=N'안전보건체계');

    INSERT INTO tb_checklist_item (category_id, item_no, check_item, legal_basis, sort_order) VALUES
    (@os1c1, 1, N'정기 안전보건교육 (분기 3시간) 실시',       N'산안법 제29조',          1),
    (@os1c1, 2, N'신규 채용 시 안전보건교육 실시',           N'산안법 제29조',          2),
    (@os1c2, 3, N'사무업무 위험성평가 정기 실시·기록',       N'산안법 제36조',          3),
    (@os1c2, 4, N'위험성평가 결과 게시·전파',                N'산안법 제36조',          4),
    (@os1c3, 5, N'사무실 작업환경측정 (필요 시)',             N'산안법 제125조',         5),
    (@os1c3, 6, N'근로자 일반건강진단 실시 여부',             N'산안법 제129조',         6),
    (@os1c3, 7, N'특수건강진단 대상자 식별 및 실시',          N'산안법 제130조',         7),
    (@os1c4, 8, N'안전보건관리책임자 선임 여부',              N'산안법 제15조',          8),
    (@os1c4, 9, N'산업안전보건위원회 구성·운영',              N'산안법 제24조',          9),
    (@os1c4, 10, N'안전보건관리규정 작성·게시',                N'산안법 제25조',         10);
END;
GO

-- C) 중대재해처벌법 사무직 예방 점검표
DECLARE @ojT1 BIGINT = (SELECT TOP 1 id FROM tb_checklist_template WHERE template_name = N'중대재해처벌법 사무직 예방 점검표' ORDER BY id);
IF @ojT1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tb_checklist_category WHERE template_id = @ojT1)
BEGIN
    INSERT INTO tb_checklist_category (template_id, category_name, sort_order) VALUES
    (@ojT1, N'안전보건 경영방침', 1),
    (@ojT1, N'전담조직·예산',    2),
    (@ojT1, N'유해위험요인 점검', 3),
    (@ojT1, N'비상대응·교육',     4);

    DECLARE @oj1c1 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@ojT1 AND category_name=N'안전보건 경영방침');
    DECLARE @oj1c2 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@ojT1 AND category_name=N'전담조직·예산');
    DECLARE @oj1c3 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@ojT1 AND category_name=N'유해위험요인 점검');
    DECLARE @oj1c4 BIGINT = (SELECT id FROM tb_checklist_category WHERE template_id=@ojT1 AND category_name=N'비상대응·교육');

    INSERT INTO tb_checklist_item (category_id, item_no, check_item, legal_basis, sort_order) VALUES
    (@oj1c1, 1, N'안전보건 경영방침 수립·서명·공표',         N'중대재해법 제4조제1항제1호', 1),
    (@oj1c1, 2, N'안전보건 목표·추진계획 매년 수립',          N'중대재해법 제4조제1항제1호', 2),
    (@oj1c2, 3, N'안전보건 전담 조직 설치 여부',              N'중대재해법 제4조제1항제2호', 3),
    (@oj1c2, 4, N'안전보건 예산 편성·집행 점검',              N'중대재해법 제4조제1항제3호', 4),
    (@oj1c3, 5, N'사무실 유해·위험요인 반기 1회 점검',         N'중대재해법 제4조제1항제3호', 5),
    (@oj1c3, 6, N'개선 조치 이행 여부 확인',                  N'중대재해법 제4조제1항제3호', 6),
    (@oj1c4, 7, N'비상대응 매뉴얼 (화재·정전) 비치·교육',      N'중대재해법 제4조제1항제8호', 7),
    (@oj1c4, 8, N'경영책임자 안전보건 교육 이수',              N'중대재해법 제4조제1항제4호', 8),
    (@oj1c4, 9, N'중대재해 발생 시 보고체계 수립',             N'중대재해법 제4조제1항제5호', 9);
END;
GO
