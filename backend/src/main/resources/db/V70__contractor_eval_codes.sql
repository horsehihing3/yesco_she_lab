-- V70: 협력사 위험성 평가 코드 그룹 (평가구분, 재해형태)

-- 평가구분
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'EVAL_CATEGORY')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('EVAL_CATEGORY', N'평가구분', N'위험성 평가 구분(4M)', 1, 320, GETDATE(), GETDATE());
END;
DECLARE @evalCatGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'EVAL_CATEGORY');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @evalCatGroupId AND code = 'MECHANICAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@evalCatGroupId, 'MECHANICAL',  'MECHANICAL',  N'기계적 요인',  'Mechanical',   N'机械因素', 1, 1, GETDATE(), GETDATE()),
    (@evalCatGroupId, 'ENVIRONMENT', 'ENVIRONMENT', N'작업 환경',    'Environment',  N'作业环境', 1, 2, GETDATE(), GETDATE()),
    (@evalCatGroupId, 'HUMAN',       'HUMAN',       N'인적 요인',    'Human',        N'人为因素', 1, 3, GETDATE(), GETDATE()),
    (@evalCatGroupId, 'MANAGEMENT',  'MANAGEMENT',  N'관리적 요인',  'Management',   N'管理因素', 1, 4, GETDATE(), GETDATE());
END;

-- 재해형태
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'DISASTER_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('DISASTER_TYPE', N'재해형태', N'산업재해 유형', 1, 321, GETDATE(), GETDATE());
END;
DECLARE @disasterGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'DISASTER_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @disasterGroupId AND code = 'FALL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@disasterGroupId, 'FALL',        'FALL',        N'추락',          'Fall',              N'坠落',     1, 1, GETDATE(), GETDATE()),
    (@disasterGroupId, 'DROP',        'DROP',        N'낙하',          'Drop',              N'落下',     1, 2, GETDATE(), GETDATE()),
    (@disasterGroupId, 'SLIP',        'SLIP',        N'전도',          'Slip',              N'摔倒',     1, 3, GETDATE(), GETDATE()),
    (@disasterGroupId, 'COLLISION',   'COLLISION',   N'충돌',          'Collision',         N'碰撞',     1, 4, GETDATE(), GETDATE()),
    (@disasterGroupId, 'COLLAPSE',    'COLLAPSE',    N'붕괴',          'Collapse',          N'坍塌',     1, 5, GETDATE(), GETDATE()),
    (@disasterGroupId, 'CAUGHT',      'CAUGHT',      N'끼임',          'Caught',            N'夹伤',     1, 6, GETDATE(), GETDATE()),
    (@disasterGroupId, 'PINCH',       'PINCH',       N'협착',          'Pinch',             N'挤压',     1, 7, GETDATE(), GETDATE()),
    (@disasterGroupId, 'CUT',         'CUT',         N'절단',          'Cut',               N'切割',     1, 8, GETDATE(), GETDATE()),
    (@disasterGroupId, 'ELECTRIC',    'ELECTRIC',    N'감전',          'Electric Shock',    N'触电',     1, 9, GETDATE(), GETDATE()),
    (@disasterGroupId, 'FIRE',        'FIRE',        N'화재',          'Fire',              N'火灾',     1, 10, GETDATE(), GETDATE()),
    (@disasterGroupId, 'BURN',        'BURN',        N'화상',          'Burn',              N'烧伤',     1, 11, GETDATE(), GETDATE()),
    (@disasterGroupId, 'SUFFOCATION', 'SUFFOCATION', N'질식',          'Suffocation',       N'窒息',     1, 12, GETDATE(), GETDATE()),
    (@disasterGroupId, 'CHEMICAL',    'CHEMICAL',    N'유해물질접촉',  'Chemical Contact',  N'化学接触', 1, 13, GETDATE(), GETDATE()),
    (@disasterGroupId, 'OVERWORK',    'OVERWORK',    N'무리한동작',    'Overexertion',      N'过度用力', 1, 14, GETDATE(), GETDATE()),
    (@disasterGroupId, 'FLYING',      'FLYING',      N'비래',          'Flying Object',     N'飞来物',   1, 15, GETDATE(), GETDATE()),
    (@disasterGroupId, 'BRUISE',      'BRUISE',      N'타박상',        'Bruise',            N'挫伤',     1, 16, GETDATE(), GETDATE()),
    (@disasterGroupId, 'SCRATCH',     'SCRATCH',     N'베임/찰과상',   'Scratch',           N'划伤',     1, 17, GETDATE(), GETDATE()),
    (@disasterGroupId, 'HEARING',     'HEARING',     N'청력장애',      'Hearing Disorder',  N'听力障碍', 1, 18, GETDATE(), GETDATE()),
    (@disasterGroupId, 'VISION',      'VISION',      N'시력장애',      'Vision Disorder',   N'视力障碍', 1, 19, GETDATE(), GETDATE()),
    (@disasterGroupId, 'RESPIRATORY', 'RESPIRATORY', N'호흡기',        'Respiratory',       N'呼吸道',   1, 20, GETDATE(), GETDATE()),
    (@disasterGroupId, 'OTHER',       'OTHER',       N'기타',          'Other',             N'其他',     1, 99, GETDATE(), GETDATE());
END;

-- 기존 데이터 평가구분 코드화
UPDATE tb_contractor_eval_item SET eval_category = 'MECHANICAL' WHERE eval_category IN (N'기계적', N'기계적 요인', N'기계적요인', N'요인');
UPDATE tb_contractor_eval_item SET eval_category = 'ENVIRONMENT' WHERE eval_category IN (N'작업 환경', N'작업', N'환경');
UPDATE tb_contractor_eval_item SET eval_category = 'HUMAN' WHERE eval_category IN (N'인적', N'인적 요인', N'인적요인', N'인적.');
UPDATE tb_contractor_eval_item SET eval_category = 'MANAGEMENT' WHERE eval_category IN (N'관리적', N'관리적 요인', N'관리적요인', N'/관리적');

-- 기존 데이터 재해형태 코드화
UPDATE tb_contractor_eval_item SET disaster_type = 'FALL' WHERE disaster_type = N'추락';
UPDATE tb_contractor_eval_item SET disaster_type = 'DROP' WHERE disaster_type IN (N'낙하', N'낙하/비래');
UPDATE tb_contractor_eval_item SET disaster_type = 'SLIP' WHERE disaster_type = N'전도';
UPDATE tb_contractor_eval_item SET disaster_type = 'COLLISION' WHERE disaster_type = N'충돌';
UPDATE tb_contractor_eval_item SET disaster_type = 'COLLAPSE' WHERE disaster_type = N'붕괴';
UPDATE tb_contractor_eval_item SET disaster_type = 'CAUGHT' WHERE disaster_type = N'끼임';
UPDATE tb_contractor_eval_item SET disaster_type = 'PINCH' WHERE disaster_type = N'협착';
UPDATE tb_contractor_eval_item SET disaster_type = 'CUT' WHERE disaster_type = N'절단';
UPDATE tb_contractor_eval_item SET disaster_type = 'ELECTRIC' WHERE disaster_type = N'감전';
UPDATE tb_contractor_eval_item SET disaster_type = 'FIRE' WHERE disaster_type IN (N'화재', N'화재,중독');
UPDATE tb_contractor_eval_item SET disaster_type = 'BURN' WHERE disaster_type IN (N'화상', N'고온접촉');
UPDATE tb_contractor_eval_item SET disaster_type = 'SUFFOCATION' WHERE disaster_type = N'질식';
UPDATE tb_contractor_eval_item SET disaster_type = 'CHEMICAL' WHERE disaster_type IN (N'유해물질접촉', N'유해물질 접촉');
UPDATE tb_contractor_eval_item SET disaster_type = 'OVERWORK' WHERE disaster_type IN (N'무리한동작', N'무리한 동작', N'무리 동작');
UPDATE tb_contractor_eval_item SET disaster_type = 'FLYING' WHERE disaster_type = N'비래';
UPDATE tb_contractor_eval_item SET disaster_type = 'BRUISE' WHERE disaster_type = N'타박상';
UPDATE tb_contractor_eval_item SET disaster_type = 'SCRATCH' WHERE disaster_type IN (N'배임', N'배임/찰과상', N'베임', N'찰과상');
UPDATE tb_contractor_eval_item SET disaster_type = 'HEARING' WHERE disaster_type = N'청력장애';
UPDATE tb_contractor_eval_item SET disaster_type = 'VISION' WHERE disaster_type = N'시력장애';
UPDATE tb_contractor_eval_item SET disaster_type = 'RESPIRATORY' WHERE disaster_type = N'호흡기';
UPDATE tb_contractor_eval_item SET disaster_type = 'OTHER' WHERE disaster_type IN (N'기타', N'질환', N'삐임', N'상해', N'찔림');
