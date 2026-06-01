-- ===================================================================
-- V17: 체크리스트 테이블 생성 + 더미 데이터
-- ===================================================================

IF OBJECT_ID('tb_checklist_template_item', 'U') IS NOT NULL DROP TABLE tb_checklist_template_item;
IF OBJECT_ID('tb_checklist_template_master', 'U') IS NOT NULL DROP TABLE tb_checklist_template_master;
IF OBJECT_ID('tb_checklist_result_item', 'U') IS NOT NULL DROP TABLE tb_checklist_result_item;
IF OBJECT_ID('tb_checklist_result_master', 'U') IS NOT NULL DROP TABLE tb_checklist_result_master;

-- ===== TABLE: tb_checklist_template_master =====
CREATE TABLE tb_checklist_template_master (
    id                BIGINT IDENTITY(1,1) PRIMARY KEY,
    title             NVARCHAR(200)  NOT NULL,
    check_date        NVARCHAR(20),
    checker           NVARCHAR(50),
    check_manager     NVARCHAR(50),
    facility_manager  NVARCHAR(50),
    reg_user          NVARCHAR(50),
    mod_user          NVARCHAR(50),
    created_at        DATETIME2      NOT NULL DEFAULT GETDATE(),
    modified_at       DATETIME2      NOT NULL DEFAULT GETDATE()
);

-- ===== TABLE: tb_checklist_template_item =====
CREATE TABLE tb_checklist_template_item (
    id                BIGINT IDENTITY(1,1) PRIMARY KEY,
    master_id         BIGINT         NOT NULL,
    category          NVARCHAR(200),
    check_item        NVARCHAR(500),
    check_content     NVARCHAR(MAX),
    is_normal         NVARCHAR(200),
    is_abnormal       NVARCHAR(200),
    remarks           NVARCHAR(MAX),
    check_standard    NVARCHAR(MAX),
    action_taken      NVARCHAR(MAX),
    confirm           NVARCHAR(200),
    CONSTRAINT FK_checklist_item_master FOREIGN KEY (master_id) REFERENCES tb_checklist_template_master(id) ON DELETE CASCADE
);

-- ===== DUMMY DATA: 소방시설 점검 체크리스트 =====
INSERT INTO tb_checklist_template_master (title, check_date, checker, check_manager, facility_manager, reg_user) VALUES
(N'소방시설 월간 점검 체크리스트', '2026-04-01', N'김민수', N'이상호', N'박진호', 'com4in');

DECLARE @fireId BIGINT = SCOPE_IDENTITY();

INSERT INTO tb_checklist_template_item (master_id, category, check_item, check_content, is_normal, is_abnormal, remarks, check_standard, action_taken, confirm) VALUES
(@fireId, N'소화기', N'소화기 비치 상태', N'지정 위치에 소화기가 비치되어 있는지 확인', '', '', '', N'각 층 복도 2개 이상', '', ''),
(@fireId, N'소화기', N'소화기 압력 게이지', N'압력 게이지가 정상 범위(녹색)인지 확인', '', '', '', N'녹색 범위 내', '', ''),
(@fireId, N'소화기', N'소화기 외관 상태', N'부식, 파손, 변형 여부 확인', '', '', '', N'외관 이상 없음', '', ''),
(@fireId, N'소화전', N'소화전함 접근성', N'소화전함 앞 장애물 여부 확인', '', '', '', N'1m 이내 장애물 없음', '', ''),
(@fireId, N'소화전', N'호스 상태', N'호스 연결 상태 및 노후 여부 확인', '', '', '', N'균열·누수 없음', '', ''),
(@fireId, N'경보설비', N'감지기 작동', N'감지기 시험 버튼으로 작동 확인', '', '', '', N'정상 경보 발생', '', ''),
(@fireId, N'경보설비', N'비상벨 작동', N'비상벨 수동 작동 확인', '', '', '', N'전 층 경보 확인', '', ''),
(@fireId, N'피난설비', N'비상구 표시등', N'비상구 유도등 점등 상태 확인', '', '', '', N'전체 점등', '', ''),
(@fireId, N'피난설비', N'비상구 개폐', N'비상구 문 개폐 원활 여부 확인', '', '', '', N'원활하게 개폐', '', '');

-- ===== DUMMY DATA: 전기설비 점검 체크리스트 =====
INSERT INTO tb_checklist_template_master (title, check_date, checker, check_manager, facility_manager, reg_user) VALUES
(N'전기설비 정기 점검 체크리스트', '2026-03-15', N'이철호', N'박진호', N'김민수', 'com4in');

DECLARE @elecId BIGINT = SCOPE_IDENTITY();

INSERT INTO tb_checklist_template_item (master_id, category, check_item, check_content, is_normal, is_abnormal, remarks, check_standard, action_taken, confirm) VALUES
(@elecId, N'분전반', N'분전반 외관', N'분전반 문짝 잠금 상태 및 외관 손상 여부', '', '', '', N'잠금 정상, 손상 없음', '', ''),
(@elecId, N'분전반', N'차단기 상태', N'각 차단기 ON/OFF 상태 및 이상 발열 확인', '', '', '', N'정상 작동, 발열 없음', '', ''),
(@elecId, N'분전반', N'접지 상태', N'접지선 연결 상태 확인', '', '', '', N'접지 저항 10Ω 이하', '', ''),
(@elecId, N'조명', N'조명 점등', N'사무실·복도·비상 조명 점등 상태 확인', '', '', '', N'전체 정상 점등', '', ''),
(@elecId, N'조명', N'비상 조명', N'정전 시 비상 조명 자동 점등 확인', '', '', '', N'30분 이상 점등 유지', '', ''),
(@elecId, N'콘센트', N'콘센트 상태', N'콘센트 파손, 과열 흔적 확인', '', '', '', N'변색·발열 없음', '', ''),
(@elecId, N'UPS', N'UPS 상태', N'UPS 정상 작동 및 배터리 잔량 확인', '', '', '', N'배터리 80% 이상', '', '');

-- ===== DUMMY DATA: 작업장 안전 일일 점검 =====
INSERT INTO tb_checklist_template_master (title, check_date, checker, check_manager, facility_manager, reg_user) VALUES
(N'작업장 안전 일일 점검표', '2026-04-03', N'전도현', N'김민수', N'이상호', 'com4in');

DECLARE @dailyId BIGINT = SCOPE_IDENTITY();

INSERT INTO tb_checklist_template_item (master_id, category, check_item, check_content, is_normal, is_abnormal, remarks, check_standard, action_taken, confirm) VALUES
(@dailyId, N'정리정돈', N'통행로 확보', N'통행로에 장애물이 없는지 확인', '', '', '', N'통행로 폭 1.2m 이상 확보', '', ''),
(@dailyId, N'정리정돈', N'자재 적재', N'자재가 안전하게 적재되어 있는지 확인', '', '', '', N'적재 높이 2m 이하', '', ''),
(@dailyId, N'보호구', N'안전모 착용', N'작업자 안전모 착용 여부 확인', '', '', '', N'전원 착용', '', ''),
(@dailyId, N'보호구', N'안전화 착용', N'작업자 안전화 착용 여부 확인', '', '', '', N'전원 착용', '', ''),
(@dailyId, N'보호구', N'보호안경 착용', N'연삭·절단 작업 시 보호안경 착용 확인', '', '', '', N'해당 작업자 전원', '', ''),
(@dailyId, N'설비', N'기계 방호장치', N'기계 방호 덮개 설치 상태 확인', '', '', '', N'전체 설치 확인', '', ''),
(@dailyId, N'설비', N'비상정지 장치', N'비상정지 버튼 작동 여부 확인', '', '', '', N'즉시 정지 확인', '', ''),
(@dailyId, N'환경', N'환기장치 작동', N'국소배기장치 가동 상태 확인', '', '', '', N'정상 가동', '', ''),
(@dailyId, N'환경', N'소음 수준', N'작업장 소음 수준 확인', '', '', '', N'90dB 이하', '', '');
