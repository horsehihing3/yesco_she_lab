-- ===== Code Group: EMERGENCY_TYPE (비상사태 유형) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'EMERGENCY_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('EMERGENCY_TYPE', N'비상사태 유형', N'비상대응 유형 코드', 1, 500, GETDATE(), GETDATE());
END;

DECLARE @emTypeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_TYPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @emTypeGroupId AND code = 'FIRE')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@emTypeGroupId, 'FIRE',          'FIRE',          N'화재',           'Fire',              N'火灾',         1, 1, GETDATE(), GETDATE()),
    (@emTypeGroupId, 'CHEMICAL_LEAK', 'CHEMICAL_LEAK', N'화학물질누출',   'Chemical Leak',     N'化学品泄漏',   1, 2, GETDATE(), GETDATE()),
    (@emTypeGroupId, 'NATURAL',       'NATURAL',       N'자연재해',       'Natural Disaster',  N'自然灾害',     1, 3, GETDATE(), GETDATE()),
    (@emTypeGroupId, 'MEDICAL',       'MEDICAL',       N'의료응급',       'Medical Emergency', N'医疗紧急',     1, 4, GETDATE(), GETDATE()),
    (@emTypeGroupId, 'GAS_LEAK',      'GAS_LEAK',      N'가스누출',       'Gas Leak',          N'气体泄漏',     1, 5, GETDATE(), GETDATE()),
    (@emTypeGroupId, 'EXPLOSION',     'EXPLOSION',     N'폭발',           'Explosion',         N'爆炸',         1, 6, GETDATE(), GETDATE()),
    (@emTypeGroupId, 'POWER_OUTAGE',  'POWER_OUTAGE',  N'정전',           'Power Outage',      N'停电',         1, 7, GETDATE(), GETDATE()),
    (@emTypeGroupId, 'OTHER',         'OTHER',         N'기타',           'Other',             N'其他',         1, 8, GETDATE(), GETDATE());
END;

-- ===== Code Group: EMERGENCY_STATUS (비상대응 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'EMERGENCY_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('EMERGENCY_STATUS', N'비상대응 상태', N'비상대응 상태 코드', 1, 501, GETDATE(), GETDATE());
END;

DECLARE @emStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'EMERGENCY_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @emStatusGroupId AND code = 'STANDBY')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@emStatusGroupId, 'STANDBY',     'STANDBY',     N'대기',     'Standby',     N'待命',   1, 1, GETDATE(), GETDATE()),
    (@emStatusGroupId, 'ISSUED',      'ISSUED',      N'발령',     'Issued',      N'发布',   1, 2, GETDATE(), GETDATE()),
    (@emStatusGroupId, 'RESPONDING',  'RESPONDING',  N'대응중',   'Responding',  N'响应中', 1, 3, GETDATE(), GETDATE()),
    (@emStatusGroupId, 'RESOLVED',    'RESOLVED',    N'종료',     'Resolved',    N'已解除', 1, 4, GETDATE(), GETDATE()),
    (@emStatusGroupId, 'DRILL',       'DRILL',       N'훈련',     'Drill',       N'演练',   1, 5, GETDATE(), GETDATE());
END;

-- ===== Table: tb_emergency_response =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_emergency_response')
BEGIN
    CREATE TABLE tb_emergency_response (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        response_id         NVARCHAR(30) NOT NULL,
        emergency_type      NVARCHAR(30) NOT NULL,              -- EMERGENCY_TYPE code
        status              NVARCHAR(20) NOT NULL DEFAULT 'STANDBY', -- EMERGENCY_STATUS code
        title               NVARCHAR(200) NOT NULL,
        description         NVARCHAR(2000),
        location            NVARCHAR(200),
        reported_at         DATETIME,
        responded_at        DATETIME,
        resolved_at         DATETIME,
        reporter_name       NVARCHAR(50),
        reporter_dept       NVARCHAR(100),
        commander_name      NVARCHAR(50),
        commander_dept      NVARCHAR(100),
        casualties_count    INT DEFAULT 0,
        damage_description  NVARCHAR(2000),
        actions_taken       NVARCHAR(2000),
        lessons_learned     NVARCHAR(2000),
        drill_yn            BIT NOT NULL DEFAULT 0,
        notes               NVARCHAR(1000),
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== Dummy Data =====
DELETE FROM tb_emergency_response;

INSERT INTO tb_emergency_response (response_id, emergency_type, status, title, description, location, reported_at, responded_at, resolved_at, reporter_name, reporter_dept, commander_name, commander_dept, casualties_count, damage_description, actions_taken, lessons_learned, drill_yn, notes)
SELECT 'ER-2026-001', 'FIRE', 'RESOLVED',
    N'A동 2층 전기실 화재 발생', N'전기실 배전반 과부하로 인한 소규모 화재 발생', N'A동 2층 전기실',
    '2026-01-15 09:30:00', '2026-01-15 09:35:00', '2026-01-15 10:15:00',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'시설관리팀',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'안전환경팀',
    0, N'배전반 1개 소실, 일부 회로 손상', N'초기 소화기 진화, 전력 차단, 소방서 신고',
    N'배전반 정기점검 주기 단축 필요', 0, NULL;

INSERT INTO tb_emergency_response (response_id, emergency_type, status, title, description, location, reported_at, responded_at, resolved_at, reporter_name, reporter_dept, commander_name, commander_dept, casualties_count, damage_description, actions_taken, lessons_learned, drill_yn, notes)
SELECT 'ER-2026-002', 'CHEMICAL_LEAK', 'RESOLVED',
    N'화학물질 저장소 소량 누출 사고', N'황산 저장탱크 배관 연결부 누출', N'화학물질 저장소 B구역',
    '2026-02-03 14:20:00', '2026-02-03 14:25:00', '2026-02-03 16:00:00',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'생산팀',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'안전환경팀',
    0, N'소량 누출, 환경 피해 없음', N'누출 차단, 중화 작업, 해당 구역 출입 통제',
    N'배관 연결부 정기 점검 강화', 0, NULL;

INSERT INTO tb_emergency_response (response_id, emergency_type, status, title, description, location, reported_at, responded_at, resolved_at, reporter_name, reporter_dept, commander_name, commander_dept, casualties_count, damage_description, actions_taken, lessons_learned, drill_yn, notes)
SELECT 'ER-2026-003', 'FIRE', 'RESOLVED',
    N'2026년 상반기 화재 대피 훈련', N'전 사업장 대상 화재 대피 훈련 실시', N'전 사업장',
    '2026-02-20 10:00:00', '2026-02-20 10:05:00', '2026-02-20 11:00:00',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'안전환경팀',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'안전환경팀',
    0, NULL, N'대피 훈련 실시, 소화기 사용법 교육, 응급처치 교육',
    N'대피 경로 안내 표지판 보강 필요', 1, N'참여 인원 250명';

INSERT INTO tb_emergency_response (response_id, emergency_type, status, title, description, location, reported_at, responded_at, resolved_at, reporter_name, reporter_dept, commander_name, commander_dept, casualties_count, damage_description, actions_taken, lessons_learned, drill_yn, notes)
SELECT 'ER-2026-004', 'MEDICAL', 'RESOLVED',
    N'생산라인 근로자 열사병 발생', N'하절기 고온 환경에서 근로자 열사병 증세 발생', N'생산동 C라인',
    '2026-02-28 15:45:00', '2026-02-28 15:50:00', '2026-02-28 17:30:00',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'생산 1팀',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'보건관리팀',
    1, NULL, N'응급처치 후 인근 병원 이송, 작업 중단',
    N'고온 작업 시 휴식 시간 확대, 냉방설비 보강', 0, N'경미 증상, 당일 퇴원';

INSERT INTO tb_emergency_response (response_id, emergency_type, status, title, description, location, reported_at, responded_at, resolved_at, reporter_name, reporter_dept, commander_name, commander_dept, casualties_count, damage_description, actions_taken, lessons_learned, drill_yn, notes)
SELECT 'ER-2026-005', 'GAS_LEAK', 'RESPONDING',
    N'배관 가스 누출 감지', N'공정동 2층 질소 배관 미세 누출 감지', N'공정동 2층 배관실',
    '2026-03-25 11:10:00', '2026-03-25 11:15:00', NULL,
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'설비팀',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'안전환경팀',
    0, N'배관 연결부 미세 균열', N'해당 구역 출입 통제, 가스 차단 밸브 폐쇄, 배관 교체 진행중',
    NULL, 0, N'현재 대응 진행중';

INSERT INTO tb_emergency_response (response_id, emergency_type, status, title, description, location, reported_at, responded_at, resolved_at, reporter_name, reporter_dept, commander_name, commander_dept, casualties_count, damage_description, actions_taken, lessons_learned, drill_yn, notes)
SELECT 'ER-2026-006', 'CHEMICAL_LEAK', 'RESOLVED',
    N'2026년 화학물질 누출 대응 훈련', N'화학물질 누출 시나리오 기반 비상대응 훈련', N'화학물질 저장소',
    '2026-03-10 09:00:00', '2026-03-10 09:10:00', '2026-03-10 11:00:00',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'안전환경팀',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'안전환경팀',
    0, NULL, N'누출 차단, 중화 작업, 오염 방지 훈련',
    N'개인보호구 착용 시간 단축 필요', 1, N'참여 인원 45명';

INSERT INTO tb_emergency_response (response_id, emergency_type, status, title, description, location, reported_at, responded_at, resolved_at, reporter_name, reporter_dept, commander_name, commander_dept, casualties_count, damage_description, actions_taken, lessons_learned, drill_yn, notes)
SELECT 'ER-2026-007', 'POWER_OUTAGE', 'RESOLVED',
    N'변전소 사고로 인한 정전 발생', N'외부 변전소 사고로 사업장 전체 정전', N'전 사업장',
    '2026-03-18 08:30:00', '2026-03-18 08:35:00', '2026-03-18 12:00:00',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'시설관리팀',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'시설관리팀',
    0, N'생산라인 중단 약 3시간', N'비상발전기 가동, 한전 복구 요청, 생산라인 순차 재가동',
    N'비상발전기 용량 확대 검토', 0, NULL;

INSERT INTO tb_emergency_response (response_id, emergency_type, status, title, description, location, reported_at, responded_at, resolved_at, reporter_name, reporter_dept, commander_name, commander_dept, casualties_count, damage_description, actions_taken, lessons_learned, drill_yn, notes)
SELECT 'ER-2026-008', 'NATURAL', 'ISSUED',
    N'태풍 접근에 따른 비상 대비', N'태풍 제7호 접근으로 인한 사전 비상 대비 발령', N'전 사업장',
    '2026-03-28 16:00:00', NULL, NULL,
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'안전환경팀',
    (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
    N'안전환경팀',
    0, NULL, NULL,
    NULL, 0, N'3월 30일 최접근 예상, 야외 시설물 고정 조치 진행';
