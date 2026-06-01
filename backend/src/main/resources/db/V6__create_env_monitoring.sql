-- ===== Code Group: ENV_MONITOR_TYPE (환경측정 유형) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'ENV_MONITOR_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('ENV_MONITOR_TYPE', N'환경측정 유형', N'환경 모니터링 측정 유형 코드', 1, 600, GETDATE(), GETDATE());
END;

DECLARE @envMonTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'ENV_MONITOR_TYPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @envMonTypeId AND code = 'AIR_QUALITY')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@envMonTypeId, 'AIR_QUALITY',   'AIR_QUALITY',   N'대기질',  'Air Quality',    N'大气质量', 1, 1, GETDATE(), GETDATE()),
    (@envMonTypeId, 'WATER_QUALITY', 'WATER_QUALITY', N'수질',    'Water Quality',  N'水质',     1, 2, GETDATE(), GETDATE()),
    (@envMonTypeId, 'SOIL',          'SOIL',          N'토양',    'Soil',           N'土壤',     1, 3, GETDATE(), GETDATE()),
    (@envMonTypeId, 'NOISE',         'NOISE',         N'소음',    'Noise',          N'噪音',     1, 4, GETDATE(), GETDATE()),
    (@envMonTypeId, 'ODOR',          'ODOR',          N'악취',    'Odor',           N'恶臭',     1, 5, GETDATE(), GETDATE());
END;

-- ===== Code Group: ENV_MONITOR_STATUS (환경측정 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'ENV_MONITOR_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('ENV_MONITOR_STATUS', N'환경측정 상태', N'환경 모니터링 측정 결과 상태 코드', 1, 601, GETDATE(), GETDATE());
END;

DECLARE @envMonStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'ENV_MONITOR_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @envMonStatusId AND code = 'NORMAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@envMonStatusId, 'NORMAL',   'NORMAL',   N'정상',  'Normal',   N'正常', 1, 1, GETDATE(), GETDATE()),
    (@envMonStatusId, 'CAUTION',  'CAUTION',  N'주의',  'Caution',  N'注意', 1, 2, GETDATE(), GETDATE()),
    (@envMonStatusId, 'WARNING',  'WARNING',  N'경고',  'Warning',  N'警告', 1, 3, GETDATE(), GETDATE()),
    (@envMonStatusId, 'DANGER',   'DANGER',   N'위험',  'Danger',   N'危险', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Table: tb_env_monitoring =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_env_monitoring')
BEGIN
    CREATE TABLE tb_env_monitoring (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        monitor_id          NVARCHAR(30)    NOT NULL,
        monitor_type        NVARCHAR(30)    NOT NULL,
        status              NVARCHAR(30)    NOT NULL,
        location            NVARCHAR(200),
        measurement_date    DATETIME        NOT NULL,
        parameter_name      NVARCHAR(100)   NOT NULL,
        measured_value      DECIMAL(10,4)   NOT NULL,
        unit                NVARCHAR(20)    NOT NULL,
        standard_value      DECIMAL(10,4),
        standard_name       NVARCHAR(100),
        exceed_yn           BIT             NOT NULL DEFAULT 0,
        exceed_rate         DECIMAL(5,2),
        measurer_name       NVARCHAR(100),
        measurer_dept       NVARCHAR(100),
        equipment_name      NVARCHAR(100),
        equipment_model     NVARCHAR(100),
        corrective_action   NVARCHAR(2000),
        notes               NVARCHAR(500),
        deleted             BIT             NOT NULL DEFAULT 0,
        created_at          DATETIME        NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME        NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== Dummy Data =====
DELETE FROM tb_env_monitoring;

INSERT INTO tb_env_monitoring (monitor_id, monitor_type, status, location, measurement_date, parameter_name, measured_value, unit, standard_value, standard_name, exceed_yn, exceed_rate, measurer_name, measurer_dept, equipment_name, equipment_model, corrective_action, notes) VALUES
('ENV-MON-2026-001', 'AIR_QUALITY',   'NORMAL',  N'A동 1층 배출구',      '2026-03-15 09:00:00', N'PM2.5',           18.5000,  N'ug/m3',   35.0000,  N'대기환경기준',        0, NULL,   N'김환경', N'환경안전팀', N'미세먼지 측정기',   N'BAM-1020',        NULL,                                       N'정상 범위 내'),
('ENV-MON-2026-002', 'AIR_QUALITY',   'CAUTION', N'B동 옥상 배출구',     '2026-03-16 10:30:00', N'PM10',            72.3000,  N'ug/m3',   80.0000,  N'대기환경기준',        0, NULL,   N'김환경', N'환경안전팀', N'미세먼지 측정기',   N'BAM-1020',        N'배출시설 필터 점검 예정',                  N'기준 근접 주의 필요'),
('ENV-MON-2026-003', 'WATER_QUALITY', 'NORMAL',  N'폐수처리시설 방류구', '2026-03-17 14:00:00', N'BOD',             8.2000,   N'mg/L',    20.0000,  N'수질오염물질 배출허용기준', 0, NULL,   N'박수질', N'환경안전팀', N'BOD 분석기',        N'BODTrak II',      NULL,                                       N'방류수 수질 양호'),
('ENV-MON-2026-004', 'WATER_QUALITY', 'WARNING', N'공정배수 집수조',     '2026-03-18 11:00:00', N'COD',             38.5000,  N'mg/L',    40.0000,  N'수질오염물질 배출허용기준', 0, 96.25,  N'박수질', N'환경안전팀', N'COD 분석기',        N'DR6000',          N'공정배수 재처리 투입',                     N'기준치 96% 도달 경고'),
('ENV-MON-2026-005', 'WATER_QUALITY', 'DANGER',  N'폐수처리시설 방류구', '2026-03-19 15:30:00', N'pH',              5.2000,   N'pH',      6.0000,   N'수질환경기준 (하한)',       1, 86.67,  N'박수질', N'환경안전팀', N'pH 측정기',         N'HQ40d',           N'중화제 투입량 증가 및 배출 중단 조치',     N'pH 하한 기준 미달 위험'),
('ENV-MON-2026-006', 'NOISE',         'NORMAL',  N'공장 경계 북측',      '2026-03-20 08:00:00', N'소음(주간)',       58.0000,  N'dB(A)',   70.0000,  N'소음환경기준(공업지역)', 0, NULL,   N'이소음', N'환경안전팀', N'소음측정기',        N'NL-52',           NULL,                                       N'경계소음 정상'),
('ENV-MON-2026-007', 'NOISE',         'CAUTION', N'공장 경계 남측',      '2026-03-20 22:00:00', N'소음(야간)',       57.5000,  N'dB(A)',   60.0000,  N'소음환경기준(공업지역)', 0, 95.83,  N'이소음', N'환경안전팀', N'소음측정기',        N'NL-52',           N'야간 작업 시간 조정 검토',                 N'야간 기준 근접 주의'),
('ENV-MON-2026-008', 'SOIL',          'NORMAL',  N'원료저장소 주변',     '2026-03-21 13:00:00', N'납(Pb)',           85.0000,  N'mg/kg',   200.0000, N'토양오염우려기준(1지역)', 0, NULL,   N'정토양', N'환경안전팀', N'토양분석기',        N'AA-7000',         NULL,                                       N'정기 토양 측정 결과 정상'),
('ENV-MON-2026-009', 'ODOR',          'WARNING', N'폐기물 보관장',       '2026-03-22 16:00:00', N'복합악취(희석배수)', 800.0000, N'배',      500.0000, N'악취방지법 배출허용기준',  1, 160.00, N'김환경', N'환경안전팀', N'악취측정기',        N'OMS-500',         N'탈취시설 활성탄 교체 및 밀폐 강화',        N'기준 초과 시정 조치 진행'),
('ENV-MON-2026-010', 'AIR_QUALITY',   'DANGER',  N'도장공정 배출구',     '2026-03-23 10:00:00', N'톨루엔(Toluene)', 25.8000,  N'ppm',     20.0000,  N'특정대기유해물질 배출허용기준', 1, 129.00, N'김환경', N'환경안전팀', N'VOC 측정기',       N'ppbRAE 3000',     N'배출시설 가동 중단 및 방지시설 긴급 점검', N'즉시 조치 완료, 재측정 예정');
