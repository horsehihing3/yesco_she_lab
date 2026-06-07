-- V205: PSM Work Order + Incident 테이블
----------------------------------------------------------------
-- Work Order (SAP PM 단순화 버전)
----------------------------------------------------------------
IF OBJECT_ID('tb_psm_wo', 'U') IS NULL
BEGIN
    CREATE TABLE tb_psm_wo (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        wo_no               NVARCHAR(40)  NOT NULL,        -- WO-2026-001
        wo_type             NVARCHAR(20)  NULL,            -- PM01/PM02/PM03 (예방/수리/검사)
        priority            NVARCHAR(10)  NULL,            -- 1/2/3
        functional_location NVARCHAR(100) NULL,            -- KR-PLANT01-U300-R201
        equipment_no        NVARCHAR(50)  NULL,            -- 10045231
        equipment_name      NVARCHAR(200) NULL,            -- R-201 반응기
        plant_code          NVARCHAR(20)  NULL,            -- KR01
        work_center         NVARCHAR(40)  NULL,            -- MECH-WC01
        plan_start_date     DATE          NULL,
        plan_end_date       DATE          NULL,
        actual_start_date   DATE          NULL,
        actual_end_date     DATE          NULL,
        manager_name        NVARCHAR(50)  NULL,
        description         NVARCHAR(2000) NULL,
        status              NVARCHAR(30)  NOT NULL DEFAULT 'CREATED', -- CREATED/PLANNED/APPROVED/IN_PROGRESS/COMPLETED
        labor_cost          DECIMAL(15,0) NULL,
        material_cost       DECIMAL(15,0) NULL,
        outsourcing_cost    DECIMAL(15,0) NULL,
        other_cost          DECIMAL(15,0) NULL,
        operations_json     NVARCHAR(MAX) NULL,            -- Operations 배열 (간결화)
        materials_json      NVARCHAR(MAX) NULL,            -- Components 배열
        created_by_user_id  BIGINT        NULL,
        created_by_name     NVARCHAR(100) NULL,
        modified_by_user_id BIGINT        NULL,
        modified_by_name    NVARCHAR(100) NULL,
        deleted             BIT           NOT NULL DEFAULT 0,
        created_at          DATETIME      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME      NOT NULL DEFAULT GETDATE()
    );
    CREATE UNIQUE INDEX UX_psm_wo_no ON tb_psm_wo(wo_no);
    CREATE INDEX IX_psm_wo_status ON tb_psm_wo(status, deleted);
END
GO

----------------------------------------------------------------
-- Incident 사고보고 (4단계 통합 1 row)
----------------------------------------------------------------
IF OBJECT_ID('tb_psm_incident', 'U') IS NULL
BEGIN
    CREATE TABLE tb_psm_incident (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        incident_no         NVARCHAR(40)  NOT NULL,
        -- Step 1: 기본 정보
        incident_type       NVARCHAR(30)  NULL,            -- LEAK/FIRE/EXPLOSION/NEAR_MISS/INJURY
        occur_at            DATETIME      NULL,
        location            NVARCHAR(200) NULL,
        related_equipment   NVARCHAR(100) NULL,
        related_material    NVARCHAR(100) NULL,
        first_finder        NVARCHAR(50)  NULL,
        reporter            NVARCHAR(50)  NULL,
        investigator        NVARCHAR(50)  NULL,
        reported_at         DATETIME      NULL,
        narrative           NVARCHAR(MAX) NULL,            -- 5W1H
        severity            NVARCHAR(10)  NULL,            -- CRITICAL/MAJOR/MINOR/NEAR
        -- Step 2: 원인 분석
        human_factors_json  NVARCHAR(MAX) NULL,            -- 체크박스 [string]
        technical_factors_json NVARCHAR(MAX) NULL,
        why1                NVARCHAR(500) NULL,
        why2                NVARCHAR(500) NULL,
        why3                NVARCHAR(500) NULL,
        why4                NVARCHAR(500) NULL,
        why5                NVARCHAR(500) NULL,
        management_cause    NVARCHAR(500) NULL,
        -- Step 3: 피해 현황
        deaths              INT           NULL,
        serious_injuries    INT           NULL,
        minor_injuries      INT           NULL,
        injury_type         NVARCHAR(50)  NULL,
        damaged_equipment   NVARCHAR(200) NULL,
        property_loss       DECIMAL(15,0) NULL,            -- 단위: 천원
        production_loss     DECIMAL(15,0) NULL,
        downtime_hours      DECIMAL(8,2)  NULL,
        env_impact          NVARCHAR(40)  NULL,
        recovery_date       DATE          NULL,
        -- Step 4: 재발방지
        actions_json        NVARCHAR(MAX) NULL,             -- 즉시 조치 배열
        technical_action    NVARCHAR(MAX) NULL,
        managerial_action   NVARCHAR(MAX) NULL,
        similar_check_plan  NVARCHAR(MAX) NULL,
        psm_improvement     NVARCHAR(MAX) NULL,
        status              NVARCHAR(20)  NOT NULL DEFAULT 'DRAFT',  -- DRAFT/SUBMITTED/CLOSED
        created_by_user_id  BIGINT        NULL,
        created_by_name     NVARCHAR(100) NULL,
        modified_by_user_id BIGINT        NULL,
        modified_by_name    NVARCHAR(100) NULL,
        deleted             BIT           NOT NULL DEFAULT 0,
        created_at          DATETIME      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME      NOT NULL DEFAULT GETDATE()
    );
    CREATE UNIQUE INDEX UX_psm_incident_no ON tb_psm_incident(incident_no);
END
GO

----------------------------------------------------------------
-- 더미데이터
----------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM tb_psm_wo WHERE wo_no = 'WO-2026-001')
BEGIN
    INSERT INTO tb_psm_wo (wo_no, wo_type, priority, functional_location, equipment_no, equipment_name, plant_code, work_center, plan_start_date, plan_end_date, manager_name, description, status, labor_cost, material_cost, outsourcing_cost, other_cost, operations_json, materials_json)
    VALUES
        ('WO-2026-001', 'PM02', '2', 'KR-PLANT01-U300-R201', '10045231', 'R-201 반응기', 'KR01', 'MECH-WC01',
         '2026-06-05', '2026-06-06', '김철수',
         'R-201 반응기 냉각수 라인 누출. 플랜지 가스켓 교체. MOC-2026-041 연계.',
         'APPROVED', 405000, 120000, 0, 15000,
         N'[{"no":"0010","desc":"작업 준비 및 PTW","wc":"MECH-WC01","hours":1.0,"crew":2,"status":"DONE"},{"no":"0020","desc":"냉각수 라인 격리","wc":"MECH-WC01","hours":2.0,"crew":2,"status":"IN_PROGRESS"},{"no":"0030","desc":"플랜지 가스켓 교체","wc":"MECH-WC01","hours":3.0,"crew":3,"status":"PENDING"},{"no":"0040","desc":"수압 시험","wc":"INSP-WC01","hours":2.0,"crew":2,"status":"PENDING"},{"no":"0050","desc":"완료 보고","wc":"MECH-WC01","hours":1.0,"crew":1,"status":"PENDING"}]',
         N'[{"code":"10045A","name":"가스켓 DN80","qty":4,"unit":"EA","status":"STOCK"},{"code":"M20-SET","name":"볼트/너트 세트 M20","qty":16,"unit":"SET","status":"STOCK"},{"code":"30021C","name":"실란트 테이프","qty":2,"unit":"롤","status":"PURCHASING"}]'),
        ('WO-2026-002', 'PM01', '3', 'KR-PLANT01-U300-C101', '10046001', 'C-101 압축기', 'KR01', 'MECH-WC01',
         '2026-06-15', '2026-06-15', '이영희',
         '월간 정기 예방정비',
         'PLANNED', NULL, NULL, NULL, NULL,
         N'[{"no":"0010","desc":"외관 점검","wc":"MECH-WC01","hours":0.5,"crew":1,"status":"PENDING"},{"no":"0020","desc":"오일 교환","wc":"MECH-WC01","hours":1.5,"crew":2,"status":"PENDING"}]',
         N'[{"code":"OIL-2T","name":"압축기 오일","qty":40,"unit":"L","status":"STOCK"}]'),
        ('WO-2026-003', 'PM03', '1', 'KR-PLANT01-U300-HE201', '10049001', 'HE-201 열교환기', 'KR01', 'INSP-WC01',
         '2026-06-10', '2026-06-12', '박민준',
         '법정검사 만료 — 두께측정 및 비파괴검사',
         'IN_PROGRESS', 800000, 200000, 1500000, 0,
         N'[{"no":"0010","desc":"검사 준비","wc":"INSP-WC01","hours":2.0,"crew":1,"status":"DONE"},{"no":"0020","desc":"두께 측정 UT","wc":"INSP-WC01","hours":6.0,"crew":2,"status":"IN_PROGRESS"}]',
         N'[]');
END
GO

IF NOT EXISTS (SELECT 1 FROM tb_psm_incident WHERE incident_no = 'INC-2026-001')
BEGIN
    INSERT INTO tb_psm_incident (incident_no, incident_type, occur_at, location, related_equipment, related_material, first_finder, reporter, investigator, reported_at, narrative, severity,
        human_factors_json, technical_factors_json, why1, why2, why3, why4, why5, management_cause,
        deaths, serious_injuries, minor_injuries, injury_type, damaged_equipment, property_loss, production_loss, downtime_hours, env_impact, recovery_date,
        actions_json, technical_action, managerial_action, similar_check_plan, psm_improvement, status)
    VALUES
        ('INC-2026-001', 'LEAK', CAST('2026-06-03 09:30:00' AS DATETIME), 'U300 R-201 반응기 주변', 'EQ-10045 R-201 반응기', 'CH-001 염화수소',
         '김철수', '이영희', '박민준', CAST('2026-06-03 10:00:00' AS DATETIME),
         '2026-06-03 09:30경 R-201 반응기 하부 플랜지에서 염화수소 가스 누출이 발견되어 즉시 비상정지 후 가스 흡수탑으로 격리. 작업자 1명 경미한 호흡기 자극 호소.',
         'MINOR',
         N'["안전수칙 미준수"]', N'["설비 결함/노후화"]',
         '플랜지 가스켓 누출', '가스켓 노후로 인한 밀폐 불량', '교체 주기 초과 (24개월)',
         '예방정비 일정 누락', '정비 일정 추적 시스템 미비',
         'MOC 적용 누락, 자동 알람 시스템 부재',
         0, 0, 1, '화상', 'R-201 하부 플랜지 + 가스켓', 2500, 8000, 6.5, '대기 오염', '2026-06-04',
         N'[{"no":1,"desc":"즉시 격리 및 가스 흡수탑 가동","owner":"김철수","due":"2026-06-03"},{"no":2,"desc":"가스켓 교체 (PI-003 신규)","owner":"이영희","due":"2026-06-04"},{"no":3,"desc":"전사 가스켓 일제 점검","owner":"박민준","due":"2026-06-15"}]',
         '플랜지 가스켓 PTFE → Hastelloy 재질 변경, 자동 압력 모니터링 추가',
         '예방정비 주기 자동 알람 시스템 구축, MOC 의무 적용 범위 확대',
         '동일 유형 플랜지 24개소 일제 두께측정 및 가스켓 교체 (2026-06-15까지)',
         '공정안전자료 갱신, 가스켓 교체 이력 데이터베이스 추가',
         'CLOSED'),
        ('INC-2026-002', 'NEAR_MISS', CAST('2026-05-22 14:15:00' AS DATETIME), 'U400 T-401 저장탱크 상부', 'EQ-10047 T-401 저장탱크', 'CH-003 톨루엔',
         '최지원', '최지원', NULL, CAST('2026-05-22 15:00:00' AS DATETIME),
         '톨루엔 저장탱크 상부 PSV-401 작동음 발생 — 설정압 도달 직전 운전실에서 즉시 압력 강하 조치. 실제 분출 없었음.',
         'NEAR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
         0, 0, 0, NULL, NULL, 0, 0, 0.5, '없음', NULL,
         N'[{"no":1,"desc":"PSV-401 설정압 재확인","owner":"박민준","due":"2026-05-25"}]',
         NULL, NULL, NULL, NULL, 'SUBMITTED');
END
GO
