-- ============================================================
-- V168: 사고 대응 관리 (Incident Response)
-- 비상대응 관리 — 화재/폭발/가스누출/화학물질누출/자연재해/폭염/한파/지진/정전/인명사고
-- ============================================================

-- ===== Code Group: INCIDENT_RESP_TYPE (사고 대응 유형) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'INCIDENT_RESP_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('INCIDENT_RESP_TYPE', N'사고 대응 유형', N'사고 대응 비상 유형', 1, 5100, GETDATE(), GETDATE());
END;
DECLARE @irTypeGrp BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'INCIDENT_RESP_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @irTypeGrp AND code = 'FIRE')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@irTypeGrp, 'FIRE',         'FIRE',         N'화재',         'Fire',                N'火灾',     1, 1,  GETDATE(), GETDATE()),
    (@irTypeGrp, 'EXPLOSION',    'EXPLOSION',    N'폭발',         'Explosion',           N'爆炸',     1, 2,  GETDATE(), GETDATE()),
    (@irTypeGrp, 'GAS_LEAK',     'GAS_LEAK',     N'가스 누출',    'Gas Leak',            N'气体泄漏', 1, 3,  GETDATE(), GETDATE()),
    (@irTypeGrp, 'CHEM_LEAK',    'CHEM_LEAK',    N'화학물질 누출', 'Chemical Leak',       N'化学品泄漏', 1, 4,  GETDATE(), GETDATE()),
    (@irTypeGrp, 'NAT_DISASTER', 'NAT_DISASTER', N'자연재해',     'Natural Disaster',    N'自然灾害', 1, 5,  GETDATE(), GETDATE()),
    (@irTypeGrp, 'HEAT_WAVE',    'HEAT_WAVE',    N'폭염',         'Heat Wave',           N'高温',     1, 6,  GETDATE(), GETDATE()),
    (@irTypeGrp, 'COLD_WAVE',    'COLD_WAVE',    N'한파',         'Cold Wave',           N'寒潮',     1, 7,  GETDATE(), GETDATE()),
    (@irTypeGrp, 'EARTHQUAKE',   'EARTHQUAKE',   N'지진',         'Earthquake',          N'地震',     1, 8,  GETDATE(), GETDATE()),
    (@irTypeGrp, 'POWER_OUT',    'POWER_OUT',    N'정전',         'Power Outage',        N'停电',     1, 9,  GETDATE(), GETDATE()),
    (@irTypeGrp, 'CASUALTY',     'CASUALTY',     N'인명사고',     'Casualty Incident',   N'人员事故', 1, 10, GETDATE(), GETDATE());
END;
GO

-- ===== Code Group: INCIDENT_RESP_STATUS (사고 대응 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'INCIDENT_RESP_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('INCIDENT_RESP_STATUS', N'사고 대응 상태', N'사고 대응 진행 상태', 1, 5101, GETDATE(), GETDATE());
END;
DECLARE @irStGrp BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'INCIDENT_RESP_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @irStGrp AND code = 'ISSUED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@irStGrp, 'ISSUED',     'ISSUED',     N'발령',    'Issued',     N'已发布',  1, 1, GETDATE(), GETDATE()),
    (@irStGrp, 'RESPONDING', 'RESPONDING', N'대응중',  'Responding', N'响应中',  1, 2, GETDATE(), GETDATE()),
    (@irStGrp, 'CLOSED',     'CLOSED',     N'종료',    'Closed',     N'已结束',  1, 3, GETDATE(), GETDATE());
END;
GO

-- ===== Code Group: INCIDENT_RESP_SEVERITY (심각도) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'INCIDENT_RESP_SEVERITY')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('INCIDENT_RESP_SEVERITY', N'사고 대응 심각도', N'사고 대응 심각도', 1, 5102, GETDATE(), GETDATE());
END;
DECLARE @irSvGrp BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'INCIDENT_RESP_SEVERITY');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @irSvGrp AND code = 'MINOR')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@irSvGrp, 'MINOR',    'MINOR',    N'경미', 'Minor',    N'轻微', 1, 1, GETDATE(), GETDATE()),
    (@irSvGrp, 'MODERATE', 'MODERATE', N'보통', 'Moderate', N'一般', 1, 2, GETDATE(), GETDATE()),
    (@irSvGrp, 'SEVERE',   'SEVERE',   N'중대', 'Severe',   N'严重', 1, 3, GETDATE(), GETDATE());
END;
GO

-- ===== Table: tb_incident_response =====
IF OBJECT_ID('tb_incident_response', 'U') IS NULL
BEGIN
    CREATE TABLE tb_incident_response (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        response_id     NVARCHAR(50)   NOT NULL UNIQUE,
        title           NVARCHAR(500)  NOT NULL,
        incident_type   NVARCHAR(30)   NOT NULL,
        status          NVARCHAR(30)   NOT NULL DEFAULT 'ISSUED',
        severity        NVARCHAR(30)            DEFAULT 'MODERATE',
        location        NVARCHAR(500)  NOT NULL,
        reported_at     DATETIME2      NOT NULL,
        is_drill        BIT            NOT NULL DEFAULT 0,
        reporter        NVARCHAR(200),
        description     NVARCHAR(MAX),
        action_taken    NVARCHAR(MAX),
        casualty_info   NVARCHAR(500),
        deleted         BIT            NOT NULL DEFAULT 0,
        created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at     DATETIME2      NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX ix_ir_reported_at ON tb_incident_response(reported_at DESC);
    CREATE INDEX ix_ir_status      ON tb_incident_response(status);
    CREATE INDEX ix_ir_type        ON tb_incident_response(incident_type);
END;
GO

-- ===== Dummy Data =====
IF NOT EXISTS (SELECT 1 FROM tb_incident_response)
BEGIN
    INSERT INTO tb_incident_response (response_id, title, incident_type, status, severity, location, reported_at, is_drill, reporter, description, action_taken, casualty_info, deleted, created_at, modified_at) VALUES
    ('ER-2026-001', N'A동 2층 전기실 화재 발생',          'FIRE',         'CLOSED',     'SEVERE',   N'A동 2층 전기실',          '2026-01-15 09:30:00', 0, N'시설팀 한과장',
        N'배전반 단락으로 전기실 화재. 자체 초기 진화 후 119 출동.',
        N'소화기 초기 진화 / 119 신고 / 전원 차단 / 사업장 일부 정전 / 노동청 보고',
        N'경상 1명 (1도 화상, 당일 귀가)', 0, GETDATE(), GETDATE()),
    ('ER-2026-002', N'화학물질 저장소 소량 누출 사고',    'CHEM_LEAK',    'CLOSED',     'MINOR',    N'화학물질 저장소 B구역',   '2026-02-03 14:20:00', 0, N'환경팀 박과장',
        N'MEK 5L 용기 파손으로 소량 누출. 즉시 회수.',
        N'즉시 흡착재 회수 / 환기 강화 / 작업자 보호구 점검 / 화학물질안전원 신고',
        N'없음', 0, GETDATE(), GETDATE()),
    ('ER-2026-003', N'2026년 상반기 화재 대피 훈련',      'FIRE',         'CLOSED',     'MINOR',    N'전 사업장',               '2026-02-20 10:00:00', 1, N'소방안전관리자',
        N'반기 정기 화재 대피 훈련. 전 사업장 참여.',
        N'비상벨 / 대피로 이동 / 집결지 인원확인 / 소화기 사용 실습',
        N'훈련 — 인명피해 없음', 0, GETDATE(), GETDATE()),
    ('ER-2026-004', N'생산라인 근로자 열사병 발생',      'CASUALTY',     'CLOSED',     'MODERATE', N'생산동 C라인',            '2026-02-28 15:45:00', 0, N'보건관리자 이주임',
        N'용접작업 중 작업자 1명 열사병 증상 호소. 응급실 이송.',
        N'응급처치 / 119 후송 / 작업장 환기 점검 / 휴식주기 재조정',
        N'중등도 1명 (응급실 이송 후 3일 휴식)', 0, GETDATE(), GETDATE()),
    ('ER-2026-005', N'배관 가스 누출 감지',              'GAS_LEAK',     'RESPONDING', 'SEVERE',   N'공정동 2층 배관실',       '2026-03-25 11:10:00', 0, N'시설팀 한과장',
        N'배관 플랜지 부근 가스 누설 감지기 작동. 누설량 미미하나 정밀 점검 진행 중.',
        N'해당 구역 출입통제 / 가스 차단밸브 폐쇄 / 환기 강화 / 배관 정밀검사 진행',
        N'없음 (대응 중)', 0, GETDATE(), GETDATE()),
    ('ER-2026-006', N'2026년 화학물질 누출 대응 훈련',   'CHEM_LEAK',    'CLOSED',     'MINOR',    N'화학물질 저장소',         '2026-03-10 09:00:00', 1, N'안전관리팀 정차장',
        N'톨루엔 누출 시나리오 모의훈련. 분기 1회 정기 훈련.',
        N'비상대응 매뉴얼 가동 / 출입통제 / 흡착재 회수 / 119 모의 신고 / 작업자 대피',
        N'훈련 — 인명피해 없음', 0, GETDATE(), GETDATE()),
    ('ER-2026-007', N'변전소 사고로 인한 정전 발생',      'POWER_OUT',    'CLOSED',     'MODERATE', N'전 사업장',               '2026-03-18 08:30:00', 0, N'시설팀 한과장',
        N'한전 변전소 사고로 약 45분간 정전. 비상발전기 자동 가동.',
        N'UPS 자동 절체 확인 / 생산라인 안전정지 / 비상조명 가동 / 한전 복구 후 정상 운영',
        N'없음 / 일부 라인 재가동 지연', 0, GETDATE(), GETDATE()),
    ('ER-2026-008', N'태풍 접근에 따른 비상 대비',        'NAT_DISASTER', 'ISSUED',     'SEVERE',   N'전 사업장',               '2026-03-28 16:00:00', 0, N'안전관리팀 정차장',
        N'태풍 OO호 (강풍반경 300km) 사업장 직접 영향권 진입. 풍속 25m/s 예상.',
        N'옥외작업 전면 중지 / 크레인·가설구조물 결박 / 비상발전기 점검 / 야간 비상연락 체계 가동',
        N'대비 단계', 0, GETDATE(), GETDATE()),
    ('ER-2026-009', N'한파주의보 한랭질환 예방',          'COLD_WAVE',    'CLOSED',     'MINOR',    N'냉동창고·옥외작업장',     '2026-04-05 07:00:00', 0, N'안전보건팀 김주임',
        N'한파주의보 발령(-15℃). 냉동창고·옥외작업자 한랭질환 예방.',
        N'방한복 6종 추가 지급 / 작업시간 30분 단축 / 따뜻한 음료 / 일산화탄소 측정기 비치',
        N'경증 1명 (손가락 동상 1도, 당일 회복)', 0, GETDATE(), GETDATE()),
    ('ER-2026-010', N'봄철 산불 인접 비상경계',           'FIRE',         'CLOSED',     'MODERATE', N'제5공장 인근 야산',       '2026-04-22 16:45:00', 0, N'시설팀 한과장',
        N'공장 인근 야산 산불 발생. 풍향 변경 시 공장 영향 가능.',
        N'소방서 협조 요청 / 외부 가연물 격리 / 사업장 출입 통제 / 비상연락망 가동',
        N'없음', 0, GETDATE(), GETDATE()),
    ('ER-2026-011', N'집중호우 침수 우려 비상대응',       'NAT_DISASTER', 'CLOSED',     'MODERATE', N'제3공장 저지대',          '2026-05-08 08:20:00', 0, N'시설팀 한과장',
        N'시간당 50mm 폭우로 제3공장 저지대 침수 우려.',
        N'배수펌프 추가 가동 / 모래주머니 설치 / 야적장 자재 고지대 이동 / 우수관 청소',
        N'인명피해 없음 / 시설 침수 약 10cm', 0, GETDATE(), GETDATE()),
    ('ER-2026-012', N'폭염 경보 발령 - 옥외작업 중지',    'HEAT_WAVE',    'RESPONDING', 'MODERATE', N'전 옥외작업장',           '2026-05-15 14:30:00', 0, N'안전보건팀 김주임',
        N'체감온도 35℃ 이상으로 폭염경보 발령. 옥외작업자 작업중지·휴게시간 추가 부여.',
        N'오후 2~5시 옥외작업 전면 중지 / 그늘막·휴게실 가동 / 이온음료·아이스조끼 지급 / 매시간 15분 휴식',
        N'없음', 0, GETDATE(), GETDATE());
END;
GO
