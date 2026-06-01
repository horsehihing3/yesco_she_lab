-- ===== Code Group: PPE_CATEGORY (보호구 분류) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'PPE_CATEGORY')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('PPE_CATEGORY', N'보호구 분류', N'보호구·장비 분류 코드', 1, 100, GETDATE(), GETDATE());
END;

DECLARE @ppeCatGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'PPE_CATEGORY');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @ppeCatGroupId AND code = 'RESPIRATORY')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@ppeCatGroupId, 'RESPIRATORY', 'RESPIRATORY', N'호흡 보호구', 'Respiratory Protection', N'呼吸防护', 1, 1, GETDATE(), GETDATE()),
    (@ppeCatGroupId, 'FALL_PROTECTION', 'FALL_PROTECTION', N'추락 방지', 'Fall Protection', N'坠落防护', 1, 2, GETDATE(), GETDATE()),
    (@ppeCatGroupId, 'BODY_PROTECTION', 'BODY_PROTECTION', N'신체 보호', 'Body Protection', N'身体防护', 1, 3, GETDATE(), GETDATE()),
    (@ppeCatGroupId, 'SAFETY_EQUIPMENT', 'SAFETY_EQUIPMENT', N'안전 장비', 'Safety Equipment', N'安全设备', 1, 4, GETDATE(), GETDATE()),
    (@ppeCatGroupId, 'OTHER', 'OTHER', N'기타', 'Other', N'其他', 1, 5, GETDATE(), GETDATE());
END;

-- ===== Code Group: INSPECT_CYCLE (점검 주기) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'INSPECT_CYCLE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('INSPECT_CYCLE', N'점검 주기', N'보호구·장비 점검 주기 코드', 1, 101, GETDATE(), GETDATE());
END;

DECLARE @inspectGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'INSPECT_CYCLE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @inspectGroupId AND code = '1M')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@inspectGroupId, 'NONE', 'NONE', N'해당 없음', 'N/A', N'不适用', 1, 0, GETDATE(), GETDATE()),
    (@inspectGroupId, '1M', '1M', N'1개월', '1 Month', N'1个月', 1, 1, GETDATE(), GETDATE()),
    (@inspectGroupId, '3M', '3M', N'3개월', '3 Months', N'3个月', 1, 2, GETDATE(), GETDATE()),
    (@inspectGroupId, '6M', '6M', N'6개월', '6 Months', N'6个月', 1, 3, GETDATE(), GETDATE()),
    (@inspectGroupId, '12M', '12M', N'12개월', '12 Months', N'12个月', 1, 4, GETDATE(), GETDATE());
END;

-- ===== PPE Equipment (보호구·장비 재고 관리) =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_ppe_equipment')
BEGIN
    CREATE TABLE tb_ppe_equipment (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        equipment_id    NVARCHAR(30) NOT NULL,         -- PPE-EQ-2026-001
        name            NVARCHAR(100) NOT NULL,        -- 항목명
        name_en         NVARCHAR(100),
        name_zh         NVARCHAR(100),
        category        NVARCHAR(50) NOT NULL,         -- 분류 (호흡보호구, 추락방지, 신체보호, 안전장비, 기타)
        category_en     NVARCHAR(50),
        category_zh     NVARCHAR(50),
        model           NVARCHAR(100),                 -- 모델/규격
        certification   NVARCHAR(100),                 -- KCs 인증번호
        stock_quantity  INT NOT NULL DEFAULT 0,        -- 현재 재고
        min_stock       INT NOT NULL DEFAULT 0,        -- 최소 재고 기준
        wear_rate       DECIMAL(5,2) DEFAULT 0,        -- 착용률 (%)
        expiry_date     DATE,                          -- 유효기간
        inspect_cycle   NVARCHAR(20),                  -- 점검 주기 (1M, 3M, 6M, 12M)
        last_inspect_date DATE,                        -- 마지막 점검일
        next_inspect_date DATE,                        -- 다음 점검일
        storage_location NVARCHAR(100),                -- 보관 위치
        department      NVARCHAR(50),                  -- 담당 부서
        status          NVARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- NORMAL, EXPIRY_SOON, EXPIRED, LOW_STOCK
        notes           NVARCHAR(500),
        deleted         BIT NOT NULL DEFAULT 0,
        created_at      DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at     DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== Dummy Data: 기존 데이터 삭제 후 코드값 기반으로 재삽입 =====
DELETE FROM tb_ppe_equipment;

INSERT INTO tb_ppe_equipment (equipment_id, name, name_en, name_zh, category, model, certification, stock_quantity, min_stock, wear_rate, expiry_date, inspect_cycle, last_inspect_date, next_inspect_date, storage_location, department, status, notes)
VALUES
('PPE-EQ-2026-001', N'방진 마스크 KF94',   'Dust Mask KF94',            N'防尘口罩 KF94',    'RESPIRATORY',      N'KF94 대형', 'KC-2024-R001', 48,  20, 96.0,  '2026-12-31', '3M',   '2026-03-01', '2026-06-01', N'안전 창고 A-1', N'전체',     'NORMAL',      NULL),
('PPE-EQ-2026-002', N'방독 마스크 (전면)',  'Gas Mask (Full)',            N'防毒面具(全面)',    'RESPIRATORY',      'GM-2000',    'KC-2023-R015', 3,   5,  88.0,  '2026-03-15', '1M',   '2026-02-15', '2026-03-15', N'안전 창고 A-2', N'설비팀',   'EXPIRED',     N'즉시 교체 필요'),
('PPE-EQ-2026-003', N'공기호흡기 (SCBA)',   'SCBA',                      N'空气呼吸器',       'RESPIRATORY',      'AP-50',      'KC-2024-R008', 6,   4,  100.0, '2027-06-30', '6M',   '2026-01-15', '2026-07-15', N'비상장비실',   N'전체',     'NORMAL',      NULL),
('PPE-EQ-2026-004', N'안전대 (전신식)',     'Full Body Harness',         N'安全带(全身式)',    'FALL_PROTECTION',  'SF-H1',      'KC-2024-F003', 22,  10, 91.0,  '2027-03-01', '6M',   '2026-01-01', '2026-07-01', N'안전 창고 B-1', N'생산 1팀', 'NORMAL',      NULL),
('PPE-EQ-2026-005', N'안전모 (ABS)',        'Safety Helmet (ABS)',       N'安全帽(ABS)',       'FALL_PROTECTION',  N'흰색/황색', 'KC-2024-F001', 35,  15, 98.0,  '2027-09-30', '12M',  '2025-10-01', '2026-10-01', N'안전 창고 B-2', N'전체',     'NORMAL',      NULL),
('PPE-EQ-2026-006', N'안전화 (경량)',       'Safety Shoes (Light)',      N'安全鞋(轻量)',      'BODY_PROTECTION',  '235~280mm',  NULL,           4,   20, 95.0,  NULL,         'NONE', NULL,         NULL,         N'안전 창고 C-1', N'전체',     'LOW_STOCK',   N'재고 부족 - 발주 필요'),
('PPE-EQ-2026-007', N'내화학성 장갑',       'Chemical Resistant Gloves', N'耐化学手套',       'BODY_PROTECTION',  'L/XL',       'KC-2024-B005', 30,  10, 89.0,  '2026-06-30', '3M',   '2026-03-01', '2026-06-01', N'안전 창고 C-2', N'품질팀',   'NORMAL',      NULL),
('PPE-EQ-2026-008', N'귀마개 (폼)',         'Ear Plugs (Foam)',          N'耳塞(泡沫)',       'BODY_PROTECTION',  'NRR33',      NULL,           120, 50, 82.0,  '2026-04-18', '1M',   '2026-03-18', '2026-04-18', N'안전 창고 C-3', N'생산 1팀', 'EXPIRY_SOON', N'교체 예정'),
('PPE-EQ-2026-009', N'가스감지기 (4종)',    '4-Gas Detector',            N'气体检测器(4种)',   'SAFETY_EQUIPMENT', 'GX-3R',      'KC-2024-E002', 8,   4,  100.0, '2026-10-01', '6M',   '2026-01-01', '2026-07-01', N'계측실',       N'설비팀',   'NORMAL',      NULL),
('PPE-EQ-2026-010', N'소화기 (ABC)',        'Fire Extinguisher (ABC)',   N'灭火器(ABC)',       'SAFETY_EQUIPMENT', '3.3kg',      'KC-2024-E010', 15,  10, 100.0, '2028-01-01', '12M',  '2025-07-01', '2026-07-01', N'각 층 비치',   N'전체',     'NORMAL',      NULL),
('PPE-EQ-2026-011', N'보호복 (화학용)',     'Chemical Suit (Type B)',    N'防护服(化学用)',    'BODY_PROTECTION',  'Type B',     'KC-2024-B012', 12,  5,  100.0, '2026-05-01', '3M',   '2026-02-01', '2026-05-01', N'안전 창고 C-4', N'생산 2팀', 'EXPIRY_SOON', N'유효기간 임박'),
('PPE-EQ-2026-012', N'구명줄 (15m)',        'Lifeline (15m)',            N'救生绳(15m)',       'FALL_PROTECTION',  'SL-15',      'KC-2024-F005', 10,  5,  100.0, '2027-12-31', '6M',   '2026-01-01', '2026-07-01', N'안전 창고 B-3', N'전체',     'NORMAL',      NULL);

-- ===== PPE Issuance History (보호구 지급·반납 이력) =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_ppe_history')
BEGIN
    CREATE TABLE tb_ppe_history (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        history_id      NVARCHAR(30) NOT NULL,
        action_type     NVARCHAR(20) NOT NULL,         -- ISSUE(지급), RETURN(반납), DISPOSE(폐기)
        item_name       NVARCHAR(100) NOT NULL,
        quantity         INT NOT NULL DEFAULT 1,
        recipient_name  NVARCHAR(50),
        recipient_dept  NVARCHAR(50),
        handler_name    NVARCHAR(50),
        action_date     DATETIME NOT NULL DEFAULT GETDATE(),
        notes           NVARCHAR(500),
        deleted         BIT NOT NULL DEFAULT 0,
        created_at      DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at     DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

DELETE FROM tb_ppe_history;

-- T_IDM_USER에서 실제 사용자 이름/부서를 가져와서 더미 데이터 생성
INSERT INTO tb_ppe_history (history_id, action_type, item_name, quantity, recipient_name, recipient_dept, handler_name, action_date, notes)
SELECT 'PPE-H-2026-001', 'ISSUE', N'안전화 (240mm)', 1,
       u.UserName, u.DeptCode,
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       '2026-03-31 09:12:00', N'신규 입사'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u
UNION ALL
SELECT 'PPE-H-2026-002', 'RETURN', N'방진 마스크 KF94', 5,
       u.UserName, u.DeptCode,
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       '2026-03-30 14:35:00', N'부서 이동'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u
UNION ALL
SELECT 'PPE-H-2026-003', 'ISSUE', N'안전모 (ABS, 흰색)', 3,
       u.UserName, u.DeptCode,
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       '2026-03-29 10:05:00', N'정기 교체'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u
UNION ALL
SELECT 'PPE-H-2026-004', 'DISPOSE', N'방독 마스크', 2,
       NULL, N'설비팀',
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       '2026-03-28 16:20:00', N'유효기간 초과'
UNION ALL
SELECT 'PPE-H-2026-005', 'ISSUE', N'내화학성 장갑', 10,
       u.UserName, u.DeptCode,
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       '2026-03-27 09:50:00', N'재고 수시 보충'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u
UNION ALL
SELECT 'PPE-H-2026-006', 'ISSUE', N'귀마개 (폼)', 20,
       u.UserName, u.DeptCode,
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       '2026-03-26 08:30:00', N'월간 지급'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u
UNION ALL
SELECT 'PPE-H-2026-007', 'RETURN', N'안전대 (전신식)', 2,
       u.UserName, u.DeptCode,
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       '2026-03-25 15:40:00', N'점검 후 반납'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u
UNION ALL
SELECT 'PPE-H-2026-008', 'ISSUE', N'보호복 (화학용)', 3,
       u.UserName, u.DeptCode,
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       '2026-03-24 10:15:00', N'특수 작업 투입'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u
UNION ALL
SELECT 'PPE-H-2026-009', 'DISPOSE', N'귀마개 (폼)', 50,
       NULL, N'생산 1팀',
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       '2026-03-23 11:00:00', N'만료 폐기'
UNION ALL
SELECT 'PPE-H-2026-010', 'ISSUE', N'가스감지기 (4종)', 1,
       u.UserName, u.DeptCode,
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       '2026-03-22 09:00:00', N'교정 후 재지급'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u;
