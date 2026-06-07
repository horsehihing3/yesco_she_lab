-- V204: 공정안전관리(PSM/PSW/MOC) — 핵심 테이블 생성
-- 1) tb_psm_data : 공정안전자료 6분류 통합 (category 컬럼으로 구분)
-- 2) tb_psm_moc  : 변경관리(MOC)
-- 3) tb_psm_hazop : HAZOP 워크시트 (form + item 통합)

----------------------------------------------------------------
-- 1) 공정안전자료 (Equipment / Chemical / Power / Vessel / Pipe / PSV)
----------------------------------------------------------------
IF OBJECT_ID('tb_psm_data', 'U') IS NULL
BEGIN
    CREATE TABLE tb_psm_data (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        category            NVARCHAR(20)  NOT NULL,    -- EQUIP/CHEM/POWER/VESSEL/PIPE/PSV
        code                NVARCHAR(50)  NOT NULL,    -- 설비번호/물질번호/태그
        name_ko             NVARCHAR(200) NOT NULL,    -- 설비명/물질명
        type_label          NVARCHAR(100) NULL,        -- 형식/유형
        location            NVARCHAR(200) NULL,        -- 기능위치/설치위치
        manufacturer        NVARCHAR(100) NULL,
        install_date        DATE          NULL,
        design_pressure     NVARCHAR(60)  NULL,
        design_temperature  NVARCHAR(60)  NULL,
        material            NVARCHAR(100) NULL,
        inspection_cycle    NVARCHAR(40)  NULL,        -- 6개월/1년 등
        last_inspection_date  DATE        NULL,
        next_inspection_date  DATE        NULL,
        status_code         NVARCHAR(20)  NULL,        -- NORMAL/PLAN/ABNORMAL/EXPIRED
        manager_name        NVARCHAR(50)  NULL,
        notes               NVARCHAR(1000) NULL,
        -- 분류별 부가 필드 (필요시 추가 컬럼 활용)
        extra_a             NVARCHAR(200) NULL,
        extra_b             NVARCHAR(200) NULL,
        extra_c             NVARCHAR(200) NULL,
        cas_number          NVARCHAR(40)  NULL,        -- 화학물질용
        ghs_class           NVARCHAR(40)  NULL,        -- 화학물질용
        regulated_qty_kg    DECIMAL(15,2) NULL,        -- 화학물질용 PSM 규정량
        holding_qty_kg      DECIMAL(15,2) NULL,        -- 화학물질용 보유량
        psm_target          BIT           NULL,        -- 화학물질용 PSM 대상 여부
        set_pressure        NVARCHAR(60)  NULL,        -- PSV 설정압력
        protected_equip     NVARCHAR(100) NULL,        -- PSV 보호설비
        -- 감사
        created_by_user_id  BIGINT        NULL,
        created_by_name     NVARCHAR(100) NULL,
        modified_by_user_id BIGINT        NULL,
        modified_by_name    NVARCHAR(100) NULL,
        deleted             BIT           NOT NULL DEFAULT 0,
        created_at          DATETIME      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME      NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_psm_data_category ON tb_psm_data(category, deleted);
    CREATE INDEX IX_psm_data_code ON tb_psm_data(code);
END
GO

----------------------------------------------------------------
-- 2) 변경관리 MOC
----------------------------------------------------------------
IF OBJECT_ID('tb_psm_moc', 'U') IS NULL
BEGIN
    CREATE TABLE tb_psm_moc (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        moc_no              NVARCHAR(40)  NOT NULL,     -- MOC-2026-041
        change_type         NVARCHAR(30)  NOT NULL,     -- PROCESS/EQUIP/MATERIAL/PROCEDURE
        title               NVARCHAR(300) NOT NULL,
        requester_name      NVARCHAR(50)  NULL,
        requester_dept      NVARCHAR(100) NULL,
        request_date        DATE          NULL,
        target_date         DATE          NULL,
        reason              NVARCHAR(2000) NULL,         -- 변경 사유
        scope               NVARCHAR(2000) NULL,         -- 변경 범위
        risk_method         NVARCHAR(40)  NULL,          -- HAZOP/WHATIF/CHECKLIST
        risk_result         NVARCHAR(40)  NULL,          -- APPROVED/CONDITIONAL/REJECTED
        risk_review_date    DATE          NULL,
        risk_opinion        NVARCHAR(2000) NULL,
        status              NVARCHAR(30)  NOT NULL DEFAULT 'DRAFT', -- DRAFT/REVIEWING/APPROVING/EDUCATING/EXECUTING/PSSR/DONE/REJECTED
        plan_approver_name  NVARCHAR(50)  NULL,
        plan_approved_at    DATETIME      NULL,
        completion_approver_name NVARCHAR(50) NULL,
        completion_approved_at   DATETIME NULL,
        reject_reason       NVARCHAR(500) NULL,
        created_by_user_id  BIGINT        NULL,
        created_by_name     NVARCHAR(100) NULL,
        modified_by_user_id BIGINT        NULL,
        modified_by_name    NVARCHAR(100) NULL,
        deleted             BIT           NOT NULL DEFAULT 0,
        created_at          DATETIME      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME      NOT NULL DEFAULT GETDATE()
    );
    CREATE UNIQUE INDEX UX_psm_moc_no ON tb_psm_moc(moc_no);
    CREATE INDEX IX_psm_moc_status ON tb_psm_moc(status, deleted);
END
GO

----------------------------------------------------------------
-- 3) HAZOP — form (헤더) + item (워크시트 행)
----------------------------------------------------------------
IF OBJECT_ID('tb_psm_hazop', 'U') IS NULL
BEGIN
    CREATE TABLE tb_psm_hazop (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        hazop_no            NVARCHAR(40)  NOT NULL,        -- HZ-2026-012
        node_name           NVARCHAR(200) NULL,            -- Node 3 — R-201 냉각라인
        pid_drawing_no      NVARCHAR(100) NULL,
        review_date         DATE          NULL,
        design_intent       NVARCHAR(500) NULL,
        team_leader         NVARCHAR(50)  NULL,
        secretary           NVARCHAR(50)  NULL,
        status              NVARCHAR(30)  NOT NULL DEFAULT 'IN_PROGRESS',  -- IN_PROGRESS/REVIEWING/COMPLETED
        created_by_user_id  BIGINT        NULL,
        created_by_name     NVARCHAR(100) NULL,
        modified_by_user_id BIGINT        NULL,
        modified_by_name    NVARCHAR(100) NULL,
        deleted             BIT           NOT NULL DEFAULT 0,
        created_at          DATETIME      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME      NOT NULL DEFAULT GETDATE()
    );
    CREATE UNIQUE INDEX UX_psm_hazop_no ON tb_psm_hazop(hazop_no);
END
GO

IF OBJECT_ID('tb_psm_hazop_item', 'U') IS NULL
BEGIN
    CREATE TABLE tb_psm_hazop_item (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        hazop_id            BIGINT        NOT NULL,
        item_no             INT           NOT NULL,        -- 워크시트 번호
        deviation           NVARCHAR(200) NULL,             -- 이탈
        guide_word          NVARCHAR(40)  NULL,             -- More/Less/No/Reverse/Other
        cause               NVARCHAR(500) NULL,
        consequence         NVARCHAR(500) NULL,
        likelihood          NVARCHAR(10)  NULL,             -- 낮음/중간/높음
        severity            NVARCHAR(10)  NULL,
        risk_grade          NVARCHAR(10)  NULL,             -- 저/중/고
        safeguard           NVARCHAR(500) NULL,
        owner               NVARCHAR(50)  NULL,
        sort_order          INT           NULL,
        created_at          DATETIME      NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_psm_hazop_item_hazop_id ON tb_psm_hazop_item(hazop_id);
END
GO

----------------------------------------------------------------
-- 더미 데이터
----------------------------------------------------------------
-- 공정안전자료 — 6분류
IF NOT EXISTS (SELECT 1 FROM tb_psm_data WHERE code = 'EQ-10045')
BEGIN
    INSERT INTO tb_psm_data (category, code, name_ko, type_label, location, manufacturer, install_date, design_pressure, design_temperature, material, inspection_cycle, last_inspection_date, next_inspection_date, status_code, manager_name)
    VALUES
        ('EQUIP', 'EQ-10045', 'R-201 반응기',     '교반형 반응기', 'U300-R201', '한화E&C',      '2018-03-15', '15 barg', '250°C', 'SUS316L', '6개월', '2026-04-10', '2026-10-10', 'NORMAL', '김철수'),
        ('EQUIP', 'EQ-10046', 'C-101 압축기',     '원심압축기',     'U300-C101', '두산중공업',  '2019-07-22', '15 barg', '150°C', 'SUS304',  '3개월', '2026-05-01', '2026-08-01', 'NORMAL', '이영희'),
        ('EQUIP', 'EQ-10047', 'T-401 저장탱크',   '고정지붕형',     'U400-T401', '삼성엔지니어링','2017-05-10','0.5 barg','50°C',  'SS400',   '1년',   '2025-06-25', '2026-06-25', 'PLAN',   '정수진'),
        ('EQUIP', 'EQ-10048', 'P-102A 펌프',      '원심펌프',       'U300-P102', 'KSB Korea',   '2020-01-15', '8 barg',  '80°C',  'SUS316L', '6개월', '2026-04-15', '2026-10-15', 'NORMAL', '최지원'),
        ('EQUIP', 'EQ-10049', 'HE-201 열교환기',  '쉘앤튜브',       'U300-HE201','하이엔텍',    '2018-11-08', '12 barg', '200°C', 'CS+SUS',  '1년',   '2025-04-15', '2026-04-15', 'ABNORMAL','김철수');

    INSERT INTO tb_psm_data (category, code, name_ko, type_label, cas_number, ghs_class, regulated_qty_kg, holding_qty_kg, psm_target, status_code, manager_name)
    VALUES
        ('CHEM', 'CH-001', '염화수소(HCl)',  '독성가스',     '7647-01-0', '1·2류', 500,    1240,  1, 'NORMAL', '박민준'),
        ('CHEM', 'CH-002', '암모니아(NH3)',  '독성/가연',    '7664-41-7', '1류',   500,    3800,  1, 'NORMAL', '박민준'),
        ('CHEM', 'CH-003', '톨루엔',          '인화성액체',   '108-88-3',  '2류',   5000,   8200,  1, 'NORMAL', '정수진'),
        ('CHEM', 'CH-004', '메탄올',          '인화성액체',   '67-56-1',   '2류',   5000,   4100,  1, 'NORMAL', '최지원'),
        ('CHEM', 'CH-005', '질소(N2)',        '불활성',       '7727-37-9', '5류',   NULL,   12000, 0, 'NORMAL', '이영희');

    INSERT INTO tb_psm_data (category, code, name_ko, type_label, extra_a, extra_b, extra_c, manufacturer, last_inspection_date, status_code, manager_name)
    VALUES
        ('POWER', 'PM-001', 'C-101 원심압축기',   '압축기',  '250 Nm3/h·15bar', '전동기',      '185 kW', '두산중공업',  '2026-03-15', 'NORMAL', '이영희'),
        ('POWER', 'PM-002', 'P-102A 원심펌프',    '펌프',    '120 m3/h·8bar',   '전동기',      '75 kW',  'KSB Korea',  '2026-02-20', 'NORMAL', '최지원'),
        ('POWER', 'PM-003', 'AGT-301 공기압축기', '압축기',  '500 Nm3/h·8bar',  '전동기',      '110 kW', '한국안전기술원','2025-11-10','PLAN', '김철수'),
        ('POWER', 'PM-004', 'FN-201 팬',          '팬',     '15,000 Nm3/h',     '전동기',      '22 kW',  '자체검사',    '2026-01-05', 'NORMAL', '박민준'),
        ('POWER', 'PM-005', 'KS-101 교반기',      '교반기', '250 rpm',          '전동기',      '30 kW',  '한국산업안전','2026-04-01', 'NORMAL', '정수진');

    INSERT INTO tb_psm_data (category, code, name_ko, type_label, design_pressure, design_temperature, material, status_code, manager_name)
    VALUES
        ('VESSEL', 'VE-001', 'R-201 반응기',     '교반형',     '15 barg', '250°C', 'SUS316L', 'NORMAL', '김철수'),
        ('VESSEL', 'VE-002', 'T-401 저장탱크',   '고정지붕형', '0.5 barg','50°C',  'SS400',   'PLAN',   '정수진'),
        ('VESSEL', 'VE-003', 'V-305 분리기',     '수직형',     '10 barg', '180°C', 'SUS304',  'NORMAL', '박민준'),
        ('VESSEL', 'VE-004', 'HE-201 열교환기',  '쉘앤튜브',   '12 barg', '200°C', 'CS+SUS',  'EXPIRED','김철수'),
        ('VESSEL', 'VE-005', 'D-101 드럼',       '수평형',     '8 barg',  '120°C', 'SUS316L', 'NORMAL', '최지원');

    INSERT INTO tb_psm_data (category, code, name_ko, type_label, design_pressure, material, extra_a, inspection_cycle, status_code, manager_name)
    VALUES
        ('PIPE', 'PI-001', '냉각수(CW)',  '배관', '8 barg',  'ASTM A106', '6"',  '2년',    'NORMAL', '최지원'),
        ('PIPE', 'PI-002', '스팀(STM)',    '배관', '15 barg', 'ASTM A335', '4"',  '1년',    'NORMAL', '이영희'),
        ('PIPE', 'PI-003', 'HCl 가스',     '배관', '6 barg',  'Hastelloy C','3"',  '6개월',  'PLAN',   '박민준'),
        ('PIPE', 'PI-004', '공정수(PW)',   '배관', '5 barg',  'SUS316L',    '2"',  '2년',    'NORMAL', '김철수'),
        ('PIPE', 'PI-005', '질소(N2)',     '배관', '10 barg', 'ASTM A106', '1.5"', '3년',    'NORMAL', '정수진');

    INSERT INTO tb_psm_data (category, code, name_ko, type_label, set_pressure, location, protected_equip, last_inspection_date, next_inspection_date, status_code, manager_name)
    VALUES
        ('PSV', 'PSV-101', 'PSV-101 안전밸브', '스프링식',  '12 barg', 'R-201 상부', '반응기',     '2025-12-01', '2026-12-01', 'NORMAL', '김철수'),
        ('PSV', 'PSV-201', 'PSV-201 안전밸브', '스프링식',  '9 barg',  'C-101 토출', '압축기',     '2026-01-15', '2027-01-15', 'NORMAL', '이영희'),
        ('PSV', 'RD-301',  'RD-301 파열판',    '파열판',    '11 barg', 'V-305 상부', '분리기',     '2025-09-20', '2026-03-20', 'EXPIRED','박민준'),
        ('PSV', 'PSV-401', 'PSV-401 안전밸브', '파일럿식',  '0.8 barg','T-401 상부', '저장탱크',   '2026-02-10', '2027-02-10', 'NORMAL', '정수진'),
        ('PSV', 'PSV-501', 'PSV-501 안전밸브', '스프링식',  '14 barg', 'HE-201 쉘', '열교환기',    '2025-11-05', '2026-06-22', 'PLAN',   '최지원');
END
GO

-- MOC 더미
IF NOT EXISTS (SELECT 1 FROM tb_psm_moc WHERE moc_no = 'MOC-2026-041')
BEGIN
    INSERT INTO tb_psm_moc (moc_no, change_type, title, requester_name, requester_dept, request_date, target_date, reason, scope, risk_method, risk_result, risk_review_date, risk_opinion, status, plan_approver_name)
    VALUES
        ('MOC-2026-041', 'PROCESS', 'R-201 냉각라인 설계압력 변경', '김철수', '공정팀', '2026-05-15', '2026-06-20',
         '생산량 증가에 따른 냉각수 유량 증가 필요. 기존 8 barg → 12 barg 변경 요청.',
         '배관 PI-001 (DN80), 플랜지 8개소, 가스켓 교체, P&ID 도면 갱신',
         'HAZOP', 'CONDITIONAL', '2026-05-20',
         '냉각라인 압력 상승에 따른 개스킷 재질 변경 필요. PSV-101 설정압력 재검토 권고.',
         'APPROVING', '이영희'),
        ('MOC-2026-038', 'EQUIP',   'C-101 압력설정 변경',          '이영희', '설비팀', '2026-04-22', '2026-05-30',
         '연료 효율 개선을 위한 압축기 토출압 13→15 barg 상향',
         'PSV-201 재설정, P&ID 갱신', 'WHATIF', 'APPROVED', '2026-04-30',
         '재료 적합성 확인됨, 변경 실행 가능', 'EXECUTING', '김철수'),
        ('MOC-2026-035', 'EQUIP',   'V-305 안전밸브 교체',          '박민준', '계측팀', '2026-03-10', '2026-05-15',
         '내부 부식 진행으로 신규 교체 필요', '안전밸브 1대 교체 + 인증서 발급',
         'CHECKLIST', 'APPROVED', '2026-03-20', 'PSSR 통과', 'PSSR', '정수진'),
        ('MOC-2026-029', 'EQUIP',   'P-102 임펠러 변경',            '최지원', '배관팀', '2026-02-15', '2026-04-10',
         '효율 개선용 임펠러 교체', '임펠러 1대 교체', 'WHATIF', 'APPROVED', '2026-02-25',
         '문제 없음', 'EXECUTING', '이영희'),
        ('MOC-2026-022', 'EQUIP',   'T-401 저장탱크 설치',          '정수진', 'EHS팀', '2026-01-05', '2026-06-30',
         '신규 톨루엔 저장 탱크 설치', '저장탱크 1기 신설 + 부속 배관', 'HAZOP', NULL, NULL,
         NULL, 'DRAFT', NULL);
END
GO

-- HAZOP 더미
IF NOT EXISTS (SELECT 1 FROM tb_psm_hazop WHERE hazop_no = 'HZ-2026-012')
BEGIN
    DECLARE @hid BIGINT;
    INSERT INTO tb_psm_hazop (hazop_no, node_name, pid_drawing_no, review_date, design_intent, team_leader, secretary, status)
    VALUES ('HZ-2026-012', 'Node 3 — R-201 냉각라인', 'PID-U300-003-R2', '2026-05-20',
            '냉각수로 반응기 온도 제어 (25~40도C)', '이영희', '박민준', 'IN_PROGRESS');
    SET @hid = SCOPE_IDENTITY();

    INSERT INTO tb_psm_hazop_item (hazop_id, item_no, deviation, guide_word, cause, consequence, likelihood, severity, risk_grade, safeguard, owner, sort_order)
    VALUES
        (@hid, 1, '고유량(More Flow)',  'More',    'FCV-101 고장 열림',         '반응기 과냉각, 생산 불량',    '낮음', '중간', '중', 'FI-101 경보, 수동 차단 SOP',         '김철수', 10),
        (@hid, 2, '저유량(Less Flow)',  'Less',    '배관 누출, FCV-101 닫힘',    '반응기 과열, 폭주 반응 위험', '중간', '높음', '고', 'TI-201 고온 인터록, PSV-101',        '김철수', 20),
        (@hid, 3, '역류(Reverse Flow)', 'Reverse', 'P-102 정지, 체크밸브 불량',  '냉각수 역류, 공정 오염',     '낮음', '낮음', '저', '체크밸브 NRV-101 정기 검사',         '이영희', 30),
        (@hid, 4, '무유량(No Flow)',    'No',      '배관 막힘, 펌프 고장',       '냉각 불가, 온도 급상승',     '낮음', '높음', '중', '저유량 경보, 비상 냉각 절차',        '박민준', 40);
END
GO
