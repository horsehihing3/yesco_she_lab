-- ════════════════════════════════════════════════════════════════════
-- V230 — 보호구·장비(PPE) 8개 도메인 더미데이터 시드 (43건)
-- ════════════════════════════════════════════════════════════════════
-- T_IDM_USER + T_IDM_group 에서 실시간 SELECT 로 실제 사용자/부서 정보 매핑.
--   작성/수정 PersonRef: EHS Part 첫 활성 사용자
--   지급받는 근로자 5명: Operation팀 활성 사용자 5명
--   점검자·평가자·확인자·담당자: EHS Part 활성 사용자 3명
--   예산 부서: 실제 그룹 5개 (GroupName 조회)
-- 멱등: 각 테이블에 활성 데이터가 있으면 시드 스킵.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. 품목 마스터 (8건) ────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM tb_ppe_item WHERE is_deleted = 0)
BEGIN
    DECLARE @author NVARCHAR(MAX);
    SELECT TOP 1 @author =
        '{"userId":' + CAST(u.UIDNumber AS NVARCHAR(20)) +
        ',"name":"' + u.UserName +
        '","team":"' + g.GroupName +
        '","position":"사원"}'
    FROM T_IDM_USER u
    LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
    WHERE g.GroupName LIKE N'%EHS%' AND u.UIDNumber IS NOT NULL AND u.UserName IS NOT NULL
    ORDER BY u.UIDNumber;

    INSERT INTO tb_ppe_item (item_code, name, category, model_no, kc_cert_no, grade, supplier, unit_price, replace_cycle, cert_expiry, min_stock, note, created_by, modified_by, created_at, modified_at, is_deleted) VALUES
    ('PPE-001', N'산업용 안전모 ABS형',    'HEAD',        'SH-100A',  'KCS-2024-0123', N'1등급', N'대한안전(주)',     18000,  24, '2025-12-31', 50,  N'',                       @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('PPE-002', N'방진 마스크 1급',        'RESPIRATORY', 'DS-M1000', 'KCS-2023-0456', N'1급',   N'안전산업(주)',     3500,   3,  '2025-03-31', 200, N'필터 월 1회 교체',       @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('PPE-003', N'안전화 중편 S1P',        'FOOT',        'SF-700S',  'KCS-2024-0789', N'S1P',   N'대한안전(주)',     85000,  12, '2026-06-30', 30,  N'',                       @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('PPE-004', N'차광 보안경 2호',        'EYE',         'EG-2000',  'KCS-2023-0321', N'2호',   N'세이프티코리아',   12000,  6,  '2025-08-31', 40,  N'용접 작업용',            @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('PPE-005', N'안전 장갑 가죽제',       'HAND',        'GL-L100',  '',              N'일반',  N'안전산업(주)',     4500,   3,  NULL,         100, N'',                       @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('PPE-006', N'추락 방지 안전대 Y형',   'FALL',        'HL-Y200',  'KCS-2024-0555', N'특급',  N'한국안전(주)',     145000, 24, '2026-03-31', 20,  N'6개월 정기검사 필수',    @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('PPE-007', N'귀마개 EP-3',            'HEARING',     'EP-3000',  'KCS-2023-0999', N'일반',  N'세이프티코리아',   500,    1,  '2025-09-30', 300, N'',                       @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('PPE-008', N'방화 방호복 상하',       'BODY',        'FR-200',   'KCS-2024-0777', N'특급',  N'한국안전(주)',     280000, 36, '2026-12-31', 10,  N'',                       @author, @author, SYSDATETIME(), SYSDATETIME(), 0);
END
GO

-- ── 2. 재고 (8건) ───────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM tb_ppe_stock WHERE is_deleted = 0)
BEGIN
    DECLARE @author NVARCHAR(MAX);
    SELECT TOP 1 @author =
        '{"userId":' + CAST(u.UIDNumber AS NVARCHAR(20)) + ',"name":"' + u.UserName +
        '","team":"' + g.GroupName + '","position":"사원"}'
    FROM T_IDM_USER u LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
    WHERE g.GroupName LIKE N'%EHS%' AND u.UIDNumber IS NOT NULL AND u.UserName IS NOT NULL
    ORDER BY u.UIDNumber;

    INSERT INTO tb_ppe_stock (item_id, item_name, location, quantity, min_qty, opt_qty, expiry_date, created_by, modified_by, created_at, modified_at, is_deleted) VALUES
    (1, N'산업용 안전모 ABS형',   'CENTRAL', 120, 50,  100, '2026-12-31', @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    (2, N'방진 마스크 1급',       'SAFETY',  85,  200, 300, '2025-08-31', @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    (3, N'안전화 중편 S1P',       'CENTRAL', 45,  30,  60,  '2027-06-30', @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    (4, N'차광 보안경 2호',       'FIELD_A', 18,  40,  60,  '2026-08-31', @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    (5, N'안전 장갑 가죽제',      'FIELD_B', 320, 100, 200, '2025-07-31', @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    (6, N'추락 방지 안전대 Y형',  'CENTRAL', 28,  20,  40,  '2028-03-31', @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    (7, N'귀마개 EP-3',           'SAFETY',  580, 300, 500, '2025-09-30', @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    (8, N'방화 방호복 상하',      'CENTRAL', 12,  10,  20,  '2028-12-31', @author, @author, SYSDATETIME(), SYSDATETIME(), 0);
END
GO

-- ── 3. 입출고 (5건) — 담당자: EHS Part 3명 ─────────────────────
IF NOT EXISTS (SELECT 1 FROM tb_ppe_inout WHERE is_deleted = 0)
BEGIN
    DECLARE @author NVARCHAR(MAX);
    DECLARE @m1 NVARCHAR(100), @m2 NVARCHAR(100), @m3 NVARCHAR(100);

    SELECT TOP 1 @author =
        '{"userId":' + CAST(u.UIDNumber AS NVARCHAR(20)) + ',"name":"' + u.UserName +
        '","team":"' + g.GroupName + '","position":"사원"}'
    FROM T_IDM_USER u LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
    WHERE g.GroupName LIKE N'%EHS%' AND u.UIDNumber IS NOT NULL AND u.UserName IS NOT NULL
    ORDER BY u.UIDNumber;

    ;WITH ehs AS (
        SELECT TOP 3 ROW_NUMBER() OVER (ORDER BY u.UIDNumber) AS rn, u.UserName
        FROM T_IDM_USER u LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
        WHERE g.GroupName LIKE N'%EHS%' AND u.UIDNumber IS NOT NULL AND u.UserName IS NOT NULL
        ORDER BY u.UIDNumber
    )
    SELECT @m1 = MAX(CASE WHEN rn=1 THEN UserName END),
           @m2 = MAX(CASE WHEN rn=2 THEN UserName END),
           @m3 = MAX(CASE WHEN rn=3 THEN UserName END)
    FROM ehs;

    INSERT INTO tb_ppe_inout (inout_date, item_id, item_name, inout_type, quantity, location, manager, created_by, modified_by, created_at, modified_at, is_deleted) VALUES
    ('2026-06-01', 1, N'산업용 안전모 ABS형', 'IN',  50,  'CENTRAL', @m1, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-05', 2, N'방진 마스크 1급',     'OUT', 30,  'SAFETY',  @m2, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-10', 3, N'안전화 중편 S1P',     'IN',  20,  'CENTRAL', @m1, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-12', 5, N'안전 장갑 가죽제',    'OUT', 50,  'FIELD_B', @m3, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-15', 7, N'귀마개 EP-3',         'IN',  200, 'SAFETY',  @m1, @author, @author, SYSDATETIME(), SYSDATETIME(), 0);
END
GO

-- ── 4. 지급·반납 (5건) — 근로자: Operation팀 5명 ───────────────
IF NOT EXISTS (SELECT 1 FROM tb_ppe_issue WHERE is_deleted = 0)
BEGIN
    DECLARE @author NVARCHAR(MAX);
    DECLARE @w1n NVARCHAR(100), @w1e NVARCHAR(50), @w1d NVARCHAR(100);
    DECLARE @w2n NVARCHAR(100), @w2e NVARCHAR(50), @w2d NVARCHAR(100);
    DECLARE @w3n NVARCHAR(100), @w3e NVARCHAR(50), @w3d NVARCHAR(100);
    DECLARE @w4n NVARCHAR(100), @w4e NVARCHAR(50), @w4d NVARCHAR(100);
    DECLARE @w5n NVARCHAR(100), @w5e NVARCHAR(50), @w5d NVARCHAR(100);

    SELECT TOP 1 @author =
        '{"userId":' + CAST(u.UIDNumber AS NVARCHAR(20)) + ',"name":"' + u.UserName +
        '","team":"' + g.GroupName + '","position":"사원"}'
    FROM T_IDM_USER u LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
    WHERE g.GroupName LIKE N'%EHS%' AND u.UIDNumber IS NOT NULL AND u.UserName IS NOT NULL
    ORDER BY u.UIDNumber;

    ;WITH ops AS (
        SELECT TOP 5 ROW_NUMBER() OVER (ORDER BY u.UIDNumber) AS rn,
            u.UserName, u.EmpNo, g.GroupName
        FROM T_IDM_USER u LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
        WHERE g.GroupName LIKE N'%Operation%' AND u.UIDNumber IS NOT NULL
              AND u.UserName IS NOT NULL AND u.EmpNo IS NOT NULL
        ORDER BY u.UIDNumber
    )
    SELECT @w1n = MAX(CASE WHEN rn=1 THEN UserName END), @w1e = MAX(CASE WHEN rn=1 THEN EmpNo END), @w1d = MAX(CASE WHEN rn=1 THEN GroupName END),
           @w2n = MAX(CASE WHEN rn=2 THEN UserName END), @w2e = MAX(CASE WHEN rn=2 THEN EmpNo END), @w2d = MAX(CASE WHEN rn=2 THEN GroupName END),
           @w3n = MAX(CASE WHEN rn=3 THEN UserName END), @w3e = MAX(CASE WHEN rn=3 THEN EmpNo END), @w3d = MAX(CASE WHEN rn=3 THEN GroupName END),
           @w4n = MAX(CASE WHEN rn=4 THEN UserName END), @w4e = MAX(CASE WHEN rn=4 THEN EmpNo END), @w4d = MAX(CASE WHEN rn=4 THEN GroupName END),
           @w5n = MAX(CASE WHEN rn=5 THEN UserName END), @w5e = MAX(CASE WHEN rn=5 THEN EmpNo END), @w5d = MAX(CASE WHEN rn=5 THEN GroupName END)
    FROM ops;

    INSERT INTO tb_ppe_issue (issue_date, worker_name, emp_id, department, item_id, item_name, quantity, issue_reason, return_date, status, signed, created_by, modified_by, created_at, modified_at, is_deleted) VALUES
    ('2026-06-01', @w1n, @w1e, @w1d, 1, N'산업용 안전모 ABS형',   1, 'NEW',    '2028-06-01', 'ISSUED',  1, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-02', @w2n, @w2e, @w2d, 2, N'방진 마스크 1급',       2, 'CYCLE',  '2026-09-02', 'ISSUED',  1, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-03', @w3n, @w3e, @w3d, 6, N'추락 방지 안전대 Y형',  1, 'NEW',    '2028-06-03', 'ISSUED',  1, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-05', @w4n, @w4e, @w4d, 4, N'차광 보안경 2호',       1, 'DAMAGE', '2026-12-05', 'REPLACE', 0, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-07', @w5n, @w5e, @w5d, 3, N'안전화 중편 S1P',       1, 'NEW',    '2027-06-07', 'LOSS',    1, @author, @author, SYSDATETIME(), SYSDATETIME(), 0);
END
GO

-- ── 5. 검사·점검 (5건) — 점검자: EHS Part 3명 ───────────────────
IF NOT EXISTS (SELECT 1 FROM tb_ppe_inspection WHERE is_deleted = 0)
BEGIN
    DECLARE @author NVARCHAR(MAX);
    DECLARE @i1 NVARCHAR(100), @i2 NVARCHAR(100), @i3 NVARCHAR(100);

    SELECT TOP 1 @author =
        '{"userId":' + CAST(u.UIDNumber AS NVARCHAR(20)) + ',"name":"' + u.UserName +
        '","team":"' + g.GroupName + '","position":"사원"}'
    FROM T_IDM_USER u LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
    WHERE g.GroupName LIKE N'%EHS%' AND u.UIDNumber IS NOT NULL AND u.UserName IS NOT NULL
    ORDER BY u.UIDNumber;

    ;WITH ehs AS (
        SELECT TOP 3 ROW_NUMBER() OVER (ORDER BY u.UIDNumber) AS rn, u.UserName
        FROM T_IDM_USER u LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
        WHERE g.GroupName LIKE N'%EHS%' AND u.UIDNumber IS NOT NULL AND u.UserName IS NOT NULL
        ORDER BY u.UIDNumber
    )
    SELECT @i1 = MAX(CASE WHEN rn=1 THEN UserName END),
           @i2 = MAX(CASE WHEN rn=2 THEN UserName END),
           @i3 = MAX(CASE WHEN rn=3 THEN UserName END)
    FROM ehs;

    INSERT INTO tb_ppe_inspection (inspection_date, item_id, item_name, item_code, inspection_type, inspector, result, next_date, note, created_by, modified_by, created_at, modified_at, is_deleted) VALUES
    ('2026-06-01', 6, N'추락 방지 안전대 Y형', 'PPE-006', 'REGULAR', @i1, 'PASS',        '2026-12-01', N'이상 없음',                @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-05', 2, N'방진 마스크 1급',      'PPE-002', 'SELF',    @i2, 'CONDITIONAL', '2026-07-05', N'필터 교체 필요',           @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-08', 4, N'차광 보안경 2호',      'PPE-004', 'PRE',     @i3, 'FAIL',        '2026-06-15', N'렌즈 파손, 사용 중지',     @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-05-20', 1, N'산업용 안전모 ABS형',  'PPE-001', 'SELF',    @i1, 'PASS',        '2026-11-20', N'정상',                     @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-04-10', 3, N'안전화 중편 S1P',      'PPE-003', 'REGULAR', @i2, 'DISPOSE',     NULL,         N'밑창 분리, 즉시 폐기 처리',@author, @author, SYSDATETIME(), SYSDATETIME(), 0);
END
GO

-- ── 6. 착용 이행 (5건) — 근로자: Operation팀 5명, 확인자: EHS Part 3명 ──
IF NOT EXISTS (SELECT 1 FROM tb_ppe_wear WHERE is_deleted = 0)
BEGIN
    DECLARE @author NVARCHAR(MAX);
    DECLARE @w1n NVARCHAR(100), @w1d NVARCHAR(100);
    DECLARE @w2n NVARCHAR(100), @w2d NVARCHAR(100);
    DECLARE @w3n NVARCHAR(100), @w3d NVARCHAR(100);
    DECLARE @w4n NVARCHAR(100), @w4d NVARCHAR(100);
    DECLARE @w5n NVARCHAR(100), @w5d NVARCHAR(100);
    DECLARE @c1 NVARCHAR(100), @c2 NVARCHAR(100), @c3 NVARCHAR(100);

    SELECT TOP 1 @author =
        '{"userId":' + CAST(u.UIDNumber AS NVARCHAR(20)) + ',"name":"' + u.UserName +
        '","team":"' + g.GroupName + '","position":"사원"}'
    FROM T_IDM_USER u LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
    WHERE g.GroupName LIKE N'%EHS%' AND u.UIDNumber IS NOT NULL AND u.UserName IS NOT NULL
    ORDER BY u.UIDNumber;

    ;WITH ops AS (
        SELECT TOP 5 ROW_NUMBER() OVER (ORDER BY u.UIDNumber) AS rn, u.UserName, g.GroupName
        FROM T_IDM_USER u LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
        WHERE g.GroupName LIKE N'%Operation%' AND u.UIDNumber IS NOT NULL AND u.UserName IS NOT NULL
        ORDER BY u.UIDNumber
    )
    SELECT @w1n = MAX(CASE WHEN rn=1 THEN UserName END), @w1d = MAX(CASE WHEN rn=1 THEN GroupName END),
           @w2n = MAX(CASE WHEN rn=2 THEN UserName END), @w2d = MAX(CASE WHEN rn=2 THEN GroupName END),
           @w3n = MAX(CASE WHEN rn=3 THEN UserName END), @w3d = MAX(CASE WHEN rn=3 THEN GroupName END),
           @w4n = MAX(CASE WHEN rn=4 THEN UserName END), @w4d = MAX(CASE WHEN rn=4 THEN GroupName END),
           @w5n = MAX(CASE WHEN rn=5 THEN UserName END), @w5d = MAX(CASE WHEN rn=5 THEN GroupName END)
    FROM ops;

    ;WITH ehs AS (
        SELECT TOP 3 ROW_NUMBER() OVER (ORDER BY u.UIDNumber) AS rn, u.UserName
        FROM T_IDM_USER u LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
        WHERE g.GroupName LIKE N'%EHS%' AND u.UIDNumber IS NOT NULL AND u.UserName IS NOT NULL
        ORDER BY u.UIDNumber
    )
    SELECT @c1 = MAX(CASE WHEN rn=1 THEN UserName END),
           @c2 = MAX(CASE WHEN rn=2 THEN UserName END),
           @c3 = MAX(CASE WHEN rn=3 THEN UserName END)
    FROM ehs;

    INSERT INTO tb_ppe_wear (check_datetime, worker_name, department, work_zone, required_ppe, wear_status, checker, action_taken, created_by, modified_by, created_at, modified_at, is_deleted) VALUES
    ('2026-06-10 09:00:00', @w1n, @w1d, N'A동 프레스실',  N'안전모, 안전화, 장갑',        'OK',        @c1, N'',                                            @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-10 10:30:00', @w2n, @w2d, N'B동 용접실',    N'안전모, 보안경, 방진마스크',  'IMPROPER',  @c2, N'마스크 미착용 → 즉시 착용 지도',              @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-11 08:45:00', @w3n, @w3d, N'옥상 설비구역', N'안전모, 안전대, 안전화',      'OK',        @c3, N'',                                            @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-11 14:00:00', @w4n, @w4d, N'A동 프레스실',  N'안전모, 안전화, 귀마개',      'VIOLATION', @c1, N'귀마개 미착용 → 교육 실시, 보호구 지급',      @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-12 09:15:00', @w5n, @w5d, N'C동 검사실',    N'안전화, 보안경',              'OK',        @c2, N'',                                            @author, @author, SYSDATETIME(), SYSDATETIME(), 0);
END
GO

-- ── 7. 성능 평가 (5건) — 평가자: EHS Part 3명 ──────────────────
IF NOT EXISTS (SELECT 1 FROM tb_ppe_performance WHERE is_deleted = 0)
BEGIN
    DECLARE @author NVARCHAR(MAX);
    DECLARE @e1 NVARCHAR(100), @e2 NVARCHAR(100), @e3 NVARCHAR(100);

    SELECT TOP 1 @author =
        '{"userId":' + CAST(u.UIDNumber AS NVARCHAR(20)) + ',"name":"' + u.UserName +
        '","team":"' + g.GroupName + '","position":"사원"}'
    FROM T_IDM_USER u LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
    WHERE g.GroupName LIKE N'%EHS%' AND u.UIDNumber IS NOT NULL AND u.UserName IS NOT NULL
    ORDER BY u.UIDNumber;

    ;WITH ehs AS (
        SELECT TOP 3 ROW_NUMBER() OVER (ORDER BY u.UIDNumber) AS rn, u.UserName
        FROM T_IDM_USER u LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
        WHERE g.GroupName LIKE N'%EHS%' AND u.UIDNumber IS NOT NULL AND u.UserName IS NOT NULL
        ORDER BY u.UIDNumber
    )
    SELECT @e1 = MAX(CASE WHEN rn=1 THEN UserName END),
           @e2 = MAX(CASE WHEN rn=2 THEN UserName END),
           @e3 = MAX(CASE WHEN rn=3 THEN UserName END)
    FROM ehs;

    INSERT INTO tb_ppe_performance (evaluation_date, item_id, item_name, performance_standard, standard_value, measured_value, result, evaluator, created_by, modified_by, created_at, modified_at, is_deleted) VALUES
    ('2026-06-01', 2, N'방진 마스크 1급',      N'분진포집효율',       N'80% 이상',  N'87.3%',     'MEET',  @e2, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-03', 1, N'산업용 안전모 ABS형',  N'내관통성(추 낙하)',  N'관통 없음', N'관통 없음', 'MEET',  @e1, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-05', 4, N'차광 보안경 2호',      N'광투과율',           N'3~8%',      N'12.4%',     'BELOW', @e3, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-08', 6, N'추락 방지 안전대 Y형', N'최대하중',           N'15kN 이상', N'18.2kN',    'MEET',  @e1, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    ('2026-06-10', 7, N'귀마개 EP-3',          N'차음값(SNR)',        N'25dB 이상', N'22dB',      'BELOW', @e2, @author, @author, SYSDATETIME(), SYSDATETIME(), 0);
END
GO

-- ── 8. 비용·예산 (5건, 현재 연도) — 부서: T_IDM_group 상위 5개 ──
IF NOT EXISTS (SELECT 1 FROM tb_ppe_budget WHERE is_deleted = 0)
BEGIN
    DECLARE @author NVARCHAR(MAX);
    DECLARE @d1 NVARCHAR(100), @d2 NVARCHAR(100), @d3 NVARCHAR(100), @d4 NVARCHAR(100), @d5 NVARCHAR(100);
    DECLARE @yr INT = YEAR(GETDATE());

    SELECT TOP 1 @author =
        '{"userId":' + CAST(u.UIDNumber AS NVARCHAR(20)) + ',"name":"' + u.UserName +
        '","team":"' + g.GroupName + '","position":"사원"}'
    FROM T_IDM_USER u LEFT JOIN T_IDM_group g ON u.DeptCode = g.GroupCode
    WHERE g.GroupName LIKE N'%EHS%' AND u.UIDNumber IS NOT NULL AND u.UserName IS NOT NULL
    ORDER BY u.UIDNumber;

    -- 활성 사용자가 있는 생산/운영혁신 부서 5개
    ;WITH deptList AS (
        SELECT TOP 5 ROW_NUMBER() OVER (ORDER BY g.GroupName) AS rn, g.GroupName
        FROM T_IDM_group g
        WHERE g.GroupName LIKE N'%생산%' OR g.GroupName LIKE N'%운영%'
              OR g.GroupName LIKE N'%EHS%' OR g.GroupName LIKE N'%Operation%'
        GROUP BY g.GroupName
    )
    SELECT @d1 = MAX(CASE WHEN rn=1 THEN GroupName END),
           @d2 = MAX(CASE WHEN rn=2 THEN GroupName END),
           @d3 = MAX(CASE WHEN rn=3 THEN GroupName END),
           @d4 = MAX(CASE WHEN rn=4 THEN GroupName END),
           @d5 = MAX(CASE WHEN rn=5 THEN GroupName END)
    FROM deptList;

    INSERT INTO tb_ppe_budget (budget_year, department, budget_amount, spent_amount, created_by, modified_by, created_at, modified_at, is_deleted) VALUES
    (@yr, @d1, 35000000, 24800000, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    (@yr, @d2, 20000000, 14200000, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    (@yr, @d3, 15000000,  9200000, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    (@yr, @d4, 12000000,  8400000, @author, @author, SYSDATETIME(), SYSDATETIME(), 0),
    (@yr, @d5,  8000000,  4200000, @author, @author, SYSDATETIME(), SYSDATETIME(), 0);
END
GO
