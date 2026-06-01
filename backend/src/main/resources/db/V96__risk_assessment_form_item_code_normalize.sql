-- V96: tb_risk_assessment_form_item 의 risk_4m / expected_disaster 값을 코드로 정규화
--   기존 값에 포함된 기호/공백(예: '인적.', '/관리적', '낙하/비래') 제거하고 EVAL_CATEGORY / DISASTER_TYPE 코드로 변환
--   미존재 코드(골절, 중독, 물질/환경적)는 code_detail 에 추가

SET NOCOUNT ON;
GO

-- =============================================
-- 1) 누락 코드 추가
-- =============================================

DECLARE @evalCatGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'EVAL_CATEGORY');
IF @evalCatGroupId IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @evalCatGroupId AND code = 'MATERIAL_ENV')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@evalCatGroupId, 'MATERIAL_ENV', 'MATERIAL_ENV', N'물질/환경적', 'Material & Environment', N'物质/环境', 1, 5, GETDATE(), GETDATE());
END
GO

DECLARE @disasterGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'DISASTER_TYPE');
IF @disasterGroupId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @disasterGroupId AND code = 'FRACTURE')
        INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
        VALUES (@disasterGroupId, 'FRACTURE', 'FRACTURE', N'골절', 'Fracture', N'骨折', 1, 21, GETDATE(), GETDATE());

    IF NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @disasterGroupId AND code = 'POISONING')
        INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
        VALUES (@disasterGroupId, 'POISONING', 'POISONING', N'중독', 'Poisoning', N'中毒', 1, 22, GETDATE(), GETDATE());
END
GO

-- =============================================
-- 2) tb_risk_assessment_form_item.risk_4m 정규화
--    원본에 존재하던 기호/변형: '/관리적', '인적.', '요인', '기계적 요인', '인적 요인', '작업 환경', '작업', '환경', '환경적', '물질 환경적'
-- =============================================

IF OBJECT_ID('tb_risk_assessment_form_item', 'U') IS NOT NULL
BEGIN
    UPDATE tb_risk_assessment_form_item SET risk_4m = 'MECHANICAL'
        WHERE risk_4m IN (N'기계적', N'기계적 요인', N'기계적요인');

    UPDATE tb_risk_assessment_form_item SET risk_4m = 'ENVIRONMENT'
        WHERE risk_4m IN (N'환경', N'환경적', N'작업', N'작업 환경', N'작업환경');

    UPDATE tb_risk_assessment_form_item SET risk_4m = 'HUMAN'
        WHERE risk_4m IN (N'인적', N'인적 요인', N'인적요인', N'인적.');

    UPDATE tb_risk_assessment_form_item SET risk_4m = 'MANAGEMENT'
        WHERE risk_4m IN (N'관리적', N'관리적 요인', N'관리적요인', N'/관리적', N'관리적.');

    UPDATE tb_risk_assessment_form_item SET risk_4m = 'MATERIAL_ENV'
        WHERE risk_4m IN (N'물질 환경적', N'물질환경적', N'물질/환경적', N'물질·환경적');

    -- 애매한 '요인' (앞/뒤 단어 소실) — MECHANICAL 로 몰기보단 비워두지 않고 HUMAN 으로 두는 것이 안전
    UPDATE tb_risk_assessment_form_item SET risk_4m = 'HUMAN'
        WHERE LTRIM(RTRIM(risk_4m)) IN (N'요인');
END
GO

-- =============================================
-- 3) tb_risk_assessment_form_item.expected_disaster 정규화
-- =============================================

IF OBJECT_ID('tb_risk_assessment_form_item', 'U') IS NOT NULL
BEGIN
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'FALL' WHERE expected_disaster = N'추락';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'DROP' WHERE expected_disaster IN (N'낙하', N'낙하/비래', N'낙하,비래', N'낙하 비래');
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'SLIP' WHERE expected_disaster = N'전도';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'COLLISION' WHERE expected_disaster = N'충돌';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'COLLAPSE' WHERE expected_disaster = N'붕괴';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'CAUGHT' WHERE expected_disaster = N'끼임';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'PINCH' WHERE expected_disaster = N'협착';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'CUT' WHERE expected_disaster = N'절단';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'ELECTRIC' WHERE expected_disaster = N'감전';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'FIRE' WHERE expected_disaster IN (N'화재', N'화재,중독');
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'BURN' WHERE expected_disaster IN (N'화상', N'고온접촉');
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'SUFFOCATION' WHERE expected_disaster = N'질식';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'CHEMICAL' WHERE expected_disaster IN (N'유해물질접촉', N'유해물질 접촉', N'유해물질');
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'OVERWORK' WHERE expected_disaster IN (N'무리한동작', N'무리한 동작', N'무리 동작');
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'FLYING' WHERE expected_disaster = N'비래';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'BRUISE' WHERE expected_disaster = N'타박상';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'SCRATCH' WHERE expected_disaster IN (N'배임', N'배임/찰과상', N'베임', N'베임/찰과상', N'찰과상');
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'HEARING' WHERE expected_disaster = N'청력장애';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'VISION' WHERE expected_disaster = N'시력장애';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'RESPIRATORY' WHERE expected_disaster = N'호흡기';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'FRACTURE' WHERE expected_disaster = N'골절';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'POISONING' WHERE expected_disaster = N'중독';
    UPDATE tb_risk_assessment_form_item SET expected_disaster = 'OTHER' WHERE expected_disaster IN (N'기타', N'질환', N'삐임', N'상해', N'찔림');
END
GO

-- =============================================
-- 4) tb_risk_assessment_detail 도 동일 정규화 (엑셀 파싱된 값 저장 가능성)
-- =============================================

IF OBJECT_ID('tb_risk_assessment_detail', 'U') IS NOT NULL
BEGIN
    UPDATE tb_risk_assessment_detail SET risk_4m = 'MECHANICAL'   WHERE risk_4m IN (N'기계적', N'기계적 요인', N'기계적요인');
    UPDATE tb_risk_assessment_detail SET risk_4m = 'ENVIRONMENT'  WHERE risk_4m IN (N'환경', N'환경적', N'작업', N'작업 환경', N'작업환경');
    UPDATE tb_risk_assessment_detail SET risk_4m = 'HUMAN'        WHERE risk_4m IN (N'인적', N'인적 요인', N'인적요인', N'인적.', N'요인');
    UPDATE tb_risk_assessment_detail SET risk_4m = 'MANAGEMENT'   WHERE risk_4m IN (N'관리적', N'관리적 요인', N'관리적요인', N'/관리적', N'관리적.');
    UPDATE tb_risk_assessment_detail SET risk_4m = 'MATERIAL_ENV' WHERE risk_4m IN (N'물질 환경적', N'물질환경적', N'물질/환경적', N'물질·환경적');

    UPDATE tb_risk_assessment_detail SET expected_disaster = 'FALL'        WHERE expected_disaster = N'추락';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'DROP'        WHERE expected_disaster IN (N'낙하', N'낙하/비래', N'낙하,비래');
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'SLIP'        WHERE expected_disaster = N'전도';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'COLLISION'   WHERE expected_disaster = N'충돌';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'COLLAPSE'    WHERE expected_disaster = N'붕괴';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'CAUGHT'      WHERE expected_disaster = N'끼임';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'PINCH'       WHERE expected_disaster = N'협착';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'CUT'         WHERE expected_disaster = N'절단';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'ELECTRIC'    WHERE expected_disaster = N'감전';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'FIRE'        WHERE expected_disaster IN (N'화재', N'화재,중독');
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'BURN'        WHERE expected_disaster IN (N'화상', N'고온접촉');
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'SUFFOCATION' WHERE expected_disaster = N'질식';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'CHEMICAL'    WHERE expected_disaster IN (N'유해물질접촉', N'유해물질 접촉', N'유해물질');
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'OVERWORK'    WHERE expected_disaster IN (N'무리한동작', N'무리한 동작', N'무리 동작');
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'FLYING'      WHERE expected_disaster = N'비래';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'BRUISE'      WHERE expected_disaster = N'타박상';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'SCRATCH'     WHERE expected_disaster IN (N'배임', N'배임/찰과상', N'베임', N'베임/찰과상', N'찰과상');
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'HEARING'     WHERE expected_disaster = N'청력장애';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'VISION'      WHERE expected_disaster = N'시력장애';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'RESPIRATORY' WHERE expected_disaster = N'호흡기';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'FRACTURE'    WHERE expected_disaster = N'골절';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'POISONING'   WHERE expected_disaster = N'중독';
    UPDATE tb_risk_assessment_detail SET expected_disaster = 'OTHER'       WHERE expected_disaster IN (N'기타', N'질환', N'삐임', N'상해', N'찔림');
END
GO
