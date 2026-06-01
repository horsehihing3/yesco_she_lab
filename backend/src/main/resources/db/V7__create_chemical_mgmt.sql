-- ===== Code Group: CHEMICAL_HAZARD_CLASS (화학물질 유해위험성 분류) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CHEMICAL_HAZARD_CLASS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CHEMICAL_HAZARD_CLASS', N'화학물질 유해위험성 분류', N'화학물질 유해위험성 분류 코드', 1, 700, GETDATE(), GETDATE());
END;

DECLARE @hazardClassId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHEMICAL_HAZARD_CLASS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @hazardClassId AND code = 'FLAMMABLE')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@hazardClassId, 'FLAMMABLE',       'FLAMMABLE',       N'인화성',     'Flammable',              N'易燃性',     1, 1, GETDATE(), GETDATE()),
    (@hazardClassId, 'CORROSIVE',       'CORROSIVE',       N'부식성',     'Corrosive',              N'腐蚀性',     1, 2, GETDATE(), GETDATE()),
    (@hazardClassId, 'TOXIC',           'TOXIC',           N'독성',       'Toxic',                  N'毒性',       1, 3, GETDATE(), GETDATE()),
    (@hazardClassId, 'OXIDIZING',       'OXIDIZING',       N'산화성',     'Oxidizing',              N'氧化性',     1, 4, GETDATE(), GETDATE()),
    (@hazardClassId, 'EXPLOSIVE',       'EXPLOSIVE',       N'폭발성',     'Explosive',              N'爆炸性',     1, 5, GETDATE(), GETDATE()),
    (@hazardClassId, 'CARCINOGENIC',    'CARCINOGENIC',    N'발암성',     'Carcinogenic',           N'致癌性',     1, 6, GETDATE(), GETDATE()),
    (@hazardClassId, 'ENV_HAZARDOUS',   'ENV_HAZARDOUS',   N'환경유해성', 'Environmentally Hazardous', N'环境危害性', 1, 7, GETDATE(), GETDATE());
END;

-- ===== Code Group: CHEMICAL_STATUS (화학물질 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CHEMICAL_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CHEMICAL_STATUS', N'화학물질 상태', N'화학물질 관리 상태 코드', 1, 701, GETDATE(), GETDATE());
END;

DECLARE @chemStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHEMICAL_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @chemStatusId AND code = 'IN_USE')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@chemStatusId, 'IN_USE',           'IN_USE',           N'사용중',     'In Use',               N'使用中',     1, 1, GETDATE(), GETDATE()),
    (@chemStatusId, 'IN_STORAGE',       'IN_STORAGE',       N'보관중',     'In Storage',           N'储存中',     1, 2, GETDATE(), GETDATE()),
    (@chemStatusId, 'PENDING_DISPOSAL', 'PENDING_DISPOSAL', N'폐기예정',   'Pending Disposal',     N'待处置',     1, 3, GETDATE(), GETDATE()),
    (@chemStatusId, 'DISPOSED',         'DISPOSED',         N'폐기완료',   'Disposed',             N'已处置',     1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: CHEMICAL_UNIT (화학물질 단위) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CHEMICAL_UNIT')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CHEMICAL_UNIT', N'화학물질 단위', N'화학물질 보관량 단위 코드', 1, 703, GETDATE(), GETDATE());
END;

DECLARE @chemUnitId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHEMICAL_UNIT');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @chemUnitId AND code = 'L')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@chemUnitId, 'L',   'L',   N'리터(L)',     'Liter(L)',     N'升(L)',      1, 1, GETDATE(), GETDATE()),
    (@chemUnitId, 'mL',  'mL',  N'밀리리터(mL)', 'Milliliter(mL)', N'毫升(mL)', 1, 2, GETDATE(), GETDATE()),
    (@chemUnitId, 'kg',  'kg',  N'킬로그램(kg)', 'Kilogram(kg)', N'千克(kg)',   1, 3, GETDATE(), GETDATE()),
    (@chemUnitId, 'g',   'g',   N'그램(g)',     'Gram(g)',       N'克(g)',      1, 4, GETDATE(), GETDATE()),
    (@chemUnitId, 'ton', 'ton', N'톤(ton)',     'Ton(ton)',      N'吨(ton)',    1, 5, GETDATE(), GETDATE()),
    (@chemUnitId, 'ea',  'ea',  N'개(EA)',      'Each(EA)',      N'个(EA)',     1, 6, GETDATE(), GETDATE());
END;

-- ===== Table: tb_chemical =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_chemical')
BEGIN
    CREATE TABLE tb_chemical (
        id                          BIGINT IDENTITY(1,1) PRIMARY KEY,
        chemical_id                 NVARCHAR(30) NOT NULL,
        chemical_name_ko            NVARCHAR(200) NOT NULL,
        chemical_name_en            NVARCHAR(200),
        cas_number                  NVARCHAR(30),
        hazard_class                NVARCHAR(30),
        status                      NVARCHAR(30) NOT NULL DEFAULT 'IN_USE',
        msds_file_id                BIGINT,
        storage_location            NVARCHAR(200),
        storage_quantity            DECIMAL(10,2),
        unit                        NVARCHAR(20),
        max_storage_limit           DECIMAL(10,2),
        supplier                    NVARCHAR(100),
        department                  NVARCHAR(100),
        handler_name                NVARCHAR(50),
        emergency_procedure         NVARCHAR(2000),
        last_inspection_date        DATE,
        next_inspection_date        DATE,
        ghs_pictogram               NVARCHAR(200),
        signal_word                 NVARCHAR(20),
        hazard_statements           NVARCHAR(1000),
        precautionary_statements    NVARCHAR(1000),
        notes                       NVARCHAR(2000),
        deleted                     BIT NOT NULL DEFAULT 0,
        created_at                  DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at                 DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== Dummy Data =====
DELETE FROM tb_chemical;

INSERT INTO tb_chemical (chemical_id, chemical_name_ko, chemical_name_en, cas_number, hazard_class, status, storage_location, storage_quantity, unit, max_storage_limit, supplier, department, handler_name, emergency_procedure, last_inspection_date, next_inspection_date, ghs_pictogram, signal_word, hazard_statements, precautionary_statements) VALUES
('CHEM-2026-001', N'아세톤',           'Acetone',             '67-64-1',    'FLAMMABLE',     'IN_USE',      N'A동 화학물질 보관실 1',  200.00, 'L',  500.00,  N'삼성화학',    N'생산부',     N'김안전', N'화재 시 이산화탄소 소화기 사용. 환기 실시. 피부접촉 시 비누와 물로 세척.',            '2026-03-01', '2026-06-01', 'GHS02,GHS07',     N'위험',   N'고인화성 액체 및 증기. 졸음 또는 현기증을 일으킬 수 있음.',                        N'열, 스파크, 화염으로부터 멀리하시오. 환기가 잘 되는 곳에서만 사용하시오.'),
('CHEM-2026-002', N'황산',             'Sulfuric Acid',       '7664-93-9',  'CORROSIVE',     'IN_USE',      N'B동 산류 보관실',        150.00, 'L',  300.00,  N'LG화학',      N'품질관리부', N'이화학', N'누출 시 중화제 투입. 피부접촉 시 즉시 다량의 물로 15분 이상 세척. 흡입 시 신선한 공기로 이동.', '2026-02-15', '2026-05-15', 'GHS05',           N'위험',   N'심한 피부 화상과 눈 손상을 일으킴.',                                               N'보호장갑/보호의/보안경/안면보호구를 착용하시오.'),
('CHEM-2026-003', N'톨루엔',           'Toluene',             '108-88-3',   'FLAMMABLE',     'IN_STORAGE',  N'A동 화학물질 보관실 2',  80.00,  'L',  200.00,  N'한화솔루션',  N'연구개발부', N'박연구', N'화재 시 분말소화기 또는 이산화탄소 소화기 사용. 증기 흡입 방지. 환기 실시.',        '2026-03-10', '2026-06-10', 'GHS02,GHS07,GHS08', N'위험', N'고인화성 액체 및 증기. 흡입하면 유해함. 생식능 또는 태아에 손상을 일으킬 수 있음.', N'열, 스파크, 화염으로부터 멀리하시오. 적절한 개인 보호구를 착용하시오.'),
('CHEM-2026-004', N'수산화나트륨',     'Sodium Hydroxide',    '1310-73-2',  'CORROSIVE',     'IN_USE',      N'B동 알칼리 보관실',      100.00, 'kg', 250.00,  N'OCI',         N'생산부',     N'최생산', N'피부접촉 시 오염된 의복을 벗기고 다량의 물로 세척. 눈 접촉 시 즉시 세안.',          '2026-01-20', '2026-04-20', 'GHS05',           N'위험',   N'심한 피부 화상과 눈 손상을 일으킴.',                                               N'보호장갑/보호의/보안경/안면보호구를 착용하시오. 물과 접촉 시 발열 주의.'),
('CHEM-2026-005', N'염산',             'Hydrochloric Acid',   '7647-01-0',  'CORROSIVE',     'IN_USE',      N'B동 산류 보관실',        120.00, 'L',  250.00,  N'롯데정밀화학', N'품질관리부', N'이화학', N'누출 시 중화 처리. 흡입 시 즉시 신선한 공기로 이동. 호흡곤란 시 산소 공급.',        '2026-02-28', '2026-05-28', 'GHS05,GHS07',     N'위험',   N'심한 피부 화상과 눈 손상을 일으킴. 흡입하면 유해함.',                               N'증기를 흡입하지 마시오. 보호장갑/보호의/보안경을 착용하시오.'),
('CHEM-2026-006', N'메탄올',           'Methanol',            '67-56-1',    'TOXIC',         'IN_USE',      N'A동 화학물질 보관실 1',  60.00,  'L',  150.00,  N'SK케미칼',    N'연구개발부', N'박연구', N'경구 섭취 시 즉시 의료기관 이송. 화재 시 알코올 저항성 포말소화기 사용.',            '2026-03-05', '2026-06-05', 'GHS02,GHS06,GHS08', N'위험', N'고인화성 액체 및 증기. 삼키면 유독함. 피부와 접촉하면 유독함.',                     N'취급 후 철저히 씻으시오. 이 제품을 사용할 때에는 먹거나 마시거나 흡연하지 마시오.'),
('CHEM-2026-007', N'이소프로필알코올', 'Isopropyl Alcohol',   '67-63-0',    'FLAMMABLE',     'IN_STORAGE',  N'A동 화학물질 보관실 2',  300.00, 'L',  500.00,  N'금호석유화학', N'생산부',     N'김안전', N'화재 시 분말, CO2, 알코올 저항성 포말 사용. 환기 실시.',                            '2026-03-15', '2026-06-15', 'GHS02,GHS07',     N'위험',   N'고인화성 액체 및 증기. 심한 눈 자극을 일으킴. 졸음 또는 현기증을 일으킬 수 있음.', N'열, 스파크, 화염으로부터 멀리하시오. 환기가 잘 되는 곳에서만 사용하시오.'),
('CHEM-2026-008', N'과산화수소',       'Hydrogen Peroxide',   '7722-84-1',  'OXIDIZING',     'PENDING_DISPOSAL', N'C동 위험물 임시보관소', 25.00, 'L', 100.00, N'한화솔루션',  N'시설관리부', N'정관리', N'누출 시 불활성 물질로 흡수. 피부접촉 시 즉시 다량의 물로 세척. 가연물과 격리 보관.', '2026-03-20', '2026-04-20', 'GHS03,GHS05,GHS07', N'위험', N'화재를 강렬하게 함. 산화제. 심한 피부 화상과 눈 손상을 일으킴.',                   N'열로부터 멀리하시오. 가연성 물질로부터 멀리하시오. 보호장갑/보안경을 착용하시오.');
