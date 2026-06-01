-- ===== Code Group: PERMIT_TYPE (작업 허가 유형) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'PERMIT_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('PERMIT_TYPE', N'작업 허가 유형', N'작업 허가서 유형 코드', 1, 200, GETDATE(), GETDATE());
END;

DECLARE @permitTypeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'PERMIT_TYPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @permitTypeGroupId AND code = 'HOT_WORK')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@permitTypeGroupId, 'HOT_WORK',       'HOT_WORK',       N'화기 작업',     'Hot Work',            N'动火作业',     1, 1, GETDATE(), GETDATE()),
    (@permitTypeGroupId, 'CONFINED_SPACE', 'CONFINED_SPACE', N'밀폐공간 작업', 'Confined Space Work', N'密闭空间作业', 1, 2, GETDATE(), GETDATE()),
    (@permitTypeGroupId, 'HEIGHT_WORK',    'HEIGHT_WORK',    N'고소 작업',     'Work at Height',      N'高处作业',     1, 3, GETDATE(), GETDATE()),
    (@permitTypeGroupId, 'ELECTRICAL',     'ELECTRICAL',     N'전기 작업',     'Electrical Work',     N'电气作业',     1, 4, GETDATE(), GETDATE()),
    (@permitTypeGroupId, 'EXCAVATION',     'EXCAVATION',     N'굴착 작업',     'Excavation Work',     N'挖掘作业',     1, 5, GETDATE(), GETDATE()),
    (@permitTypeGroupId, 'LIFTING',        'LIFTING',        N'중량물 작업',   'Heavy Lifting',       N'起重作业',     1, 6, GETDATE(), GETDATE()),
    (@permitTypeGroupId, 'RADIATION',      'RADIATION',      N'방사선 작업',   'Radiation Work',      N'放射线作业',   1, 7, GETDATE(), GETDATE()),
    (@permitTypeGroupId, 'OTHER',          'OTHER',          N'기타',          'Other',               N'其他',         1, 8, GETDATE(), GETDATE());
END;

-- ===== Code Group: PERMIT_STATUS (작업 허가 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'PERMIT_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('PERMIT_STATUS', N'작업 허가 상태', N'작업 허가서 상태 코드', 1, 201, GETDATE(), GETDATE());
END;

DECLARE @permitStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'PERMIT_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @permitStatusGroupId AND code = 'DRAFT')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@permitStatusGroupId, 'DRAFT',      'DRAFT',      N'작성중',     'Draft',       N'草稿',   1, 1, GETDATE(), GETDATE()),
    (@permitStatusGroupId, 'REQUESTED',  'REQUESTED',  N'승인요청',   'Requested',   N'已申请', 1, 2, GETDATE(), GETDATE()),
    (@permitStatusGroupId, 'APPROVED',   'APPROVED',   N'승인완료',   'Approved',    N'已批准', 1, 3, GETDATE(), GETDATE()),
    (@permitStatusGroupId, 'IN_PROGRESS','IN_PROGRESS',N'작업중',     'In Progress', N'进行中', 1, 4, GETDATE(), GETDATE()),
    (@permitStatusGroupId, 'COMPLETED',  'COMPLETED',  N'작업완료',   'Completed',   N'已完成', 1, 5, GETDATE(), GETDATE()),
    (@permitStatusGroupId, 'REJECTED',   'REJECTED',   N'반려',       'Rejected',    N'已驳回', 1, 6, GETDATE(), GETDATE()),
    (@permitStatusGroupId, 'CANCELLED',  'CANCELLED',  N'취소',       'Cancelled',   N'已取消', 1, 7, GETDATE(), GETDATE());
END;

-- ===== Code Group: RISK_LEVEL (위험 등급) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'RISK_LEVEL')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('RISK_LEVEL', N'위험 등급', N'작업 위험 등급 코드', 1, 202, GETDATE(), GETDATE());
END;

DECLARE @riskLevelGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'RISK_LEVEL');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @riskLevelGroupId AND code = 'LOW')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@riskLevelGroupId, 'LOW',      'LOW',      N'저위험', 'Low',      N'低风险', 1, 1, GETDATE(), GETDATE()),
    (@riskLevelGroupId, 'MEDIUM',   'MEDIUM',   N'중위험', 'Medium',   N'中风险', 1, 2, GETDATE(), GETDATE()),
    (@riskLevelGroupId, 'HIGH',     'HIGH',     N'고위험', 'High',     N'高风险', 1, 3, GETDATE(), GETDATE()),
    (@riskLevelGroupId, 'CRITICAL', 'CRITICAL', N'최고위험', 'Critical', N'极高风险', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Table: tb_permit_to_work =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_permit_to_work')
BEGIN
    CREATE TABLE tb_permit_to_work (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        permit_id           NVARCHAR(30) NOT NULL,
        permit_type         NVARCHAR(30) NOT NULL,          -- PERMIT_TYPE code
        risk_level          NVARCHAR(20) NOT NULL,          -- RISK_LEVEL code
        status              NVARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- PERMIT_STATUS code
        title               NVARCHAR(200) NOT NULL,
        description         NVARCHAR(2000),
        work_location       NVARCHAR(200),
        work_start_date     DATETIME,
        work_end_date       DATETIME,
        requester_name      NVARCHAR(50),
        requester_dept      NVARCHAR(100),
        requester_id        NVARCHAR(50),
        approver_name       NVARCHAR(50),
        approver_dept       NVARCHAR(100),
        approver_id         NVARCHAR(50),
        approved_at         DATETIME,
        safety_measures     NVARCHAR(2000),                 -- 안전 조치 사항
        required_ppe        NVARCHAR(500),                  -- 필요 보호구
        hazard_factors      NVARCHAR(1000),                 -- 위험 요인
        emergency_contact   NVARCHAR(100),                  -- 비상 연락처
        workers_count       INT DEFAULT 0,                  -- 작업 인원 수
        rejection_reason    NVARCHAR(500),
        completed_at        DATETIME,
        notes               NVARCHAR(500),
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== Dummy Data =====
DELETE FROM tb_permit_to_work;

INSERT INTO tb_permit_to_work (permit_id, permit_type, risk_level, status, title, description, work_location, work_start_date, work_end_date, requester_name, requester_dept, approver_name, approver_dept, safety_measures, required_ppe, hazard_factors, emergency_contact, workers_count, notes)
SELECT 'PTW-2026-001', 'HOT_WORK', 'HIGH', 'APPROVED',
       N'보일러실 배관 용접 작업', N'보일러실 증기 배관 교체를 위한 아크 용접 작업. TIG 용접 포함.',
       N'보일러실 B-2구역', '2026-04-02 08:00', '2026-04-02 17:00',
       u1.UserName, u1.DeptCode, u2.UserName, u2.DeptCode,
       N'소화기 비치, 화기감시자 배치, 가연물 제거(반경 10m), 용접 방화포 설치',
       N'용접 보안면, 가죽장갑, 방염복, 안전화', N'화재, 화상, 유해가스(용접흄), 감전',
       N'안전팀 내선 119', 4, N'오전 작업 전 TBM 실시'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1,
     (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u2;

INSERT INTO tb_permit_to_work (permit_id, permit_type, risk_level, status, title, description, work_location, work_start_date, work_end_date, requester_name, requester_dept, approver_name, approver_dept, safety_measures, required_ppe, hazard_factors, emergency_contact, workers_count, notes)
SELECT 'PTW-2026-002', 'CONFINED_SPACE', 'CRITICAL', 'IN_PROGRESS',
       N'폐수처리 탱크 내부 점검', N'폐수처리 시설 탱크 내부 슬러지 제거 및 점검 작업',
       N'폐수처리장 T-3 탱크', '2026-04-01 09:00', '2026-04-01 16:00',
       u1.UserName, u1.DeptCode, u2.UserName, u2.DeptCode,
       N'환기 실시(30분 이상), 산소농도 측정(18~23.5%), 유해가스 측정, 감시인 배치, 구조장비 준비',
       N'공기호흡기(SCBA), 안전대, 안전모, 가스감지기', N'산소결핍, 유해가스(H2S, CO), 질식, 추락',
       N'안전팀 내선 119 / 구조대 080-119', 3, N'밀폐공간 출입허가서 별도 첨부'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1,
     (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u2;

INSERT INTO tb_permit_to_work (permit_id, permit_type, risk_level, status, title, description, work_location, work_start_date, work_end_date, requester_name, requester_dept, approver_name, approver_dept, safety_measures, required_ppe, hazard_factors, emergency_contact, workers_count, notes)
SELECT 'PTW-2026-003', 'HEIGHT_WORK', 'HIGH', 'REQUESTED',
       N'옥상 공조기 정기 점검', N'옥상 AHU(공조기) 필터 교체 및 모터 점검. 작업 높이 약 12m',
       N'본관 옥상 공조실', '2026-04-05 09:00', '2026-04-05 15:00',
       u1.UserName, u1.DeptCode, u2.UserName, u2.DeptCode,
       N'안전대 착용, 안전난간 설치, 강풍시 작업 중지(풍속 10m/s 초과), 추락방지망 설치',
       N'안전대(전신식), 안전모, 안전화, 안전장갑', N'추락, 강풍, 감전(전기 배선), 협착',
       N'설비팀 내선 250', 2, NULL
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1,
     (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u2;

INSERT INTO tb_permit_to_work (permit_id, permit_type, risk_level, status, title, description, work_location, work_start_date, work_end_date, requester_name, requester_dept, approver_name, approver_dept, safety_measures, required_ppe, hazard_factors, emergency_contact, workers_count, notes)
SELECT 'PTW-2026-004', 'ELECTRICAL', 'MEDIUM', 'COMPLETED',
       N'MCC 패널 차단기 교체', N'생산동 MCC 패널 내 차단기(MCCB) 2개 교체 작업',
       N'생산동 1층 전기실', '2026-03-28 10:00', '2026-03-28 14:00',
       u1.UserName, u1.DeptCode, u2.UserName, u2.DeptCode,
       N'정전 작업(LOTO 실시), 검전 확인, 절연장갑 착용, 작업 전 무전압 확인',
       N'절연장갑, 안전모(전기용), 절연장화, 보안경', N'감전, 아크 플래시, 단락',
       N'전기안전팀 내선 300', 2, N'작업 완료 후 절연저항 측정 완료'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1,
     (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u2;

INSERT INTO tb_permit_to_work (permit_id, permit_type, risk_level, status, title, description, work_location, work_start_date, work_end_date, requester_name, requester_dept, approver_name, approver_dept, safety_measures, required_ppe, hazard_factors, emergency_contact, workers_count, rejection_reason, notes)
SELECT 'PTW-2026-005', 'EXCAVATION', 'HIGH', 'REJECTED',
       N'주차장 지하 배관 매설', N'주차장 지하 우수관 매설을 위한 굴착 작업 (깊이 2.5m)',
       N'후문 주차장 남측', '2026-04-10 08:00', '2026-04-12 17:00',
       u1.UserName, u1.DeptCode, u2.UserName, u2.DeptCode,
       N'지하매설물 확인, 흙막이 설치, 굴착면 경사 유지, 중장비 안전거리 확보',
       N'안전모, 안전화, 안전조끼(반사)', N'매몰, 지하매설물 파손(가스/전기/수도), 중장비 충돌',
       N'현장소장 내선 400', 6, N'지하매설물 도면 확인 미완료. 한국전력 협의 필요',
       N'반려 사유 해소 후 재요청'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1,
     (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u2;

INSERT INTO tb_permit_to_work (permit_id, permit_type, risk_level, status, title, description, work_location, work_start_date, work_end_date, requester_name, requester_dept, approver_name, approver_dept, safety_measures, required_ppe, hazard_factors, emergency_contact, workers_count, notes)
SELECT 'PTW-2026-006', 'LIFTING', 'HIGH', 'DRAFT',
       N'냉각탑 모터 교체 (크레인)', N'냉각탑 순환 펌프 모터(2.5톤) 교체를 위한 크레인 작업',
       N'유틸리티동 냉각탑', '2026-04-15 08:00', '2026-04-15 17:00',
       u1.UserName, u1.DeptCode, NULL, NULL,
       N'인양 계획서 작성, 작업 반경 통제, 신호수 배치, 와이어로프 점검, 풍속 확인',
       N'안전모, 안전화, 안전장갑, 안전조끼', N'낙하물, 크레인 전도, 협착, 감전(전선 근접)',
       N'안전팀 내선 119', 5, N'크레인 작업 계획서 및 양중기 검사 첨부 필요'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1;

INSERT INTO tb_permit_to_work (permit_id, permit_type, risk_level, status, title, description, work_location, work_start_date, work_end_date, requester_name, requester_dept, approver_name, approver_dept, safety_measures, required_ppe, hazard_factors, emergency_contact, workers_count, notes)
SELECT 'PTW-2026-007', 'HOT_WORK', 'MEDIUM', 'APPROVED',
       N'창고동 철골 보강 용접', N'창고동 2층 철골 보강 부재 용접 작업',
       N'창고동 2층 C열', '2026-04-03 09:00', '2026-04-04 16:00',
       u1.UserName, u1.DeptCode, u2.UserName, u2.DeptCode,
       N'소화기 2대 비치, 화기감시자 배치, 용접 불꽃 비산 방지 차단막 설치, 하부 가연물 제거',
       N'용접 보안면, 가죽장갑, 방염 앞치마, 안전화', N'화재, 화상, 유해가스, 추락(2층)',
       N'안전팀 내선 119', 3, NULL
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1,
     (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u2;

INSERT INTO tb_permit_to_work (permit_id, permit_type, risk_level, status, title, description, work_location, work_start_date, work_end_date, requester_name, requester_dept, approver_name, approver_dept, safety_measures, required_ppe, hazard_factors, emergency_contact, workers_count, notes)
SELECT 'PTW-2026-008', 'CONFINED_SPACE', 'CRITICAL', 'REQUESTED',
       N'저장탱크 내부 도장 작업', N'원료 저장탱크 내부 방청 도장 작업. 유기용제 사용',
       N'원료저장구역 ST-5', '2026-04-08 08:00', '2026-04-09 17:00',
       u1.UserName, u1.DeptCode, u2.UserName, u2.DeptCode,
       N'강제 환기(연속), 유기용제 농도 측정, 방폭형 조명 사용, 감시인 상시 배치, 구조 삼각대 설치',
       N'송기마스크, 안전대, 방독마스크(유기용제용), 방진복', N'산소결핍, 유기용제 중독, 화재/폭발, 질식',
       N'안전팀 119 / 소방서 직통', 4, N'유기용제 MSDS 첨부'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1,
     (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u2;
