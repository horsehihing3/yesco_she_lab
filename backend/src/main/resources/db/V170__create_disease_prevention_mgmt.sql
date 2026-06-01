-- ============================================================
-- V170: 질병예방 관리 (Disease Prevention Management)
-- 7개 프로그램: 근골격계(MSD) / 뇌심혈관(CVD) / 직무스트레스(KOSS-26) /
--               호흡기·피부 / 청력보존 / 온열·한랭 / 감염병
-- ============================================================

-- ===== Table 1: tb_dp_msd (근골격계 평가) =====
IF OBJECT_ID('tb_dp_msd', 'U') IS NULL
BEGIN
    CREATE TABLE tb_dp_msd (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        worker_name         NVARCHAR(200)  NOT NULL,
        department          NVARCHAR(200),
        job_title           NVARCHAR(200),
        task_name           NVARCHAR(300),
        task_category       NVARCHAR(100),
        reba_score          INT,
        owas_score          INT,
        risk_level          NVARCHAR(20),
        affected_body_parts NVARCHAR(300),
        symptoms            NVARCHAR(300),
        assessment_date     DATE,
        assessor            NVARCHAR(200),
        status              NVARCHAR(30),
        action_taken        NVARCHAR(MAX),
        notes               NVARCHAR(MAX),
        deleted             BIT            NOT NULL DEFAULT 0,
        created_at          DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME2      NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ===== Table 2: tb_dp_cvd (뇌심혈관 위험도) =====
IF OBJECT_ID('tb_dp_cvd', 'U') IS NULL
BEGIN
    CREATE TABLE tb_dp_cvd (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        worker_name         NVARCHAR(200)  NOT NULL,
        department          NVARCHAR(200),
        age                 INT,
        gender              NVARCHAR(10),
        bmi                 DECIMAL(5,2),
        bp_sys              INT,
        bp_dia              INT,
        fasting_glucose     INT,
        ldl                 INT,
        hdl                 INT,
        smoking             NVARCHAR(50),
        drinking            NVARCHAR(50),
        exercise            NVARCHAR(50),
        night_shift         NVARCHAR(50),
        overtime            NVARCHAR(100),
        risk_level          NVARCHAR(20)   NOT NULL,
        assessment_date     DATE           NOT NULL,
        assessor            NVARCHAR(200),
        management_plan     NVARCHAR(MAX),
        next_checkup        DATE,
        notes               NVARCHAR(MAX),
        deleted             BIT            NOT NULL DEFAULT 0,
        created_at          DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME2      NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ===== Table 3: tb_dp_stress (KOSS-26 직무스트레스) =====
IF OBJECT_ID('tb_dp_stress', 'U') IS NULL
BEGIN
    CREATE TABLE tb_dp_stress (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        worker_name         NVARCHAR(200)  NOT NULL,
        department          NVARCHAR(200),
        physical_env        INT,
        job_demand          INT,
        autonomy            INT,
        relationship        INT,
        job_insecurity      INT,
        system_fairness     INT,
        reward              INT,
        work_culture        INT,
        total_score         INT,
        risk_level          NVARCHAR(20),
        assessment_date     DATE,
        has_counseling      BIT            NOT NULL DEFAULT 0,
        counseling_notes    NVARCHAR(MAX),
        notes               NVARCHAR(MAX),
        deleted             BIT            NOT NULL DEFAULT 0,
        created_at          DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME2      NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ===== Table 4: tb_dp_respi (호흡기·피부 노출자) =====
IF OBJECT_ID('tb_dp_respi', 'U') IS NULL
BEGIN
    CREATE TABLE tb_dp_respi (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        worker_name         NVARCHAR(200)  NOT NULL,
        department          NVARCHAR(200),
        exposure_type       NVARCHAR(50)   NOT NULL,
        exposure_substance  NVARCHAR(500),
        exposure_level      NVARCHAR(200),
        ppe_type            NVARCHAR(300),
        fit_test_date       DATE,
        fit_test_result     NVARCHAR(20),
        pft_fvc             DECIMAL(5,2),
        pft_fev1            DECIMAL(5,2),
        skin_condition      NVARCHAR(200),
        patch_test_result   NVARCHAR(200),
        status              NVARCHAR(30),
        exam_date           DATE,
        examiner            NVARCHAR(200),
        notes               NVARCHAR(MAX),
        deleted             BIT            NOT NULL DEFAULT 0,
        created_at          DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME2      NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ===== Table 5: tb_dp_hearing (청력보존) =====
IF OBJECT_ID('tb_dp_hearing', 'U') IS NULL
BEGIN
    CREATE TABLE tb_dp_hearing (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        worker_name         NVARCHAR(200)  NOT NULL,
        department          NVARCHAR(200),
        noise_level         INT,
        exposure_hours      INT,
        right_4k            INT,
        right_6k            INT,
        left_4k             INT,
        left_6k             INT,
        sts_result          NVARCHAR(200),
        ppe_type            NVARCHAR(200),
        ppe_nrr             INT,
        exam_date           DATE,
        exam_type           NVARCHAR(30),
        status              NVARCHAR(30),
        notes               NVARCHAR(MAX),
        deleted             BIT            NOT NULL DEFAULT 0,
        created_at          DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME2      NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ===== Table 6: tb_dp_thermal (온열·한랭) =====
IF OBJECT_ID('tb_dp_thermal', 'U') IS NULL
BEGIN
    CREATE TABLE tb_dp_thermal (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        thermal_type        NVARCHAR(20)   NOT NULL,
        occur_date          DATE           NOT NULL,
        location            NVARCHAR(300),
        worker_name         NVARCHAR(200),
        department          NVARCHAR(200),
        weather_condition   NVARCHAR(200),
        perceived_temp      DECIMAL(5,2),
        symptoms            NVARCHAR(500),
        severity            NVARCHAR(20),
        treatment           NVARCHAR(500),
        outcome             NVARCHAR(500),
        prevention_action   NVARCHAR(MAX),
        notes               NVARCHAR(MAX),
        deleted             BIT            NOT NULL DEFAULT 0,
        created_at          DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME2      NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ===== Table 7: tb_dp_infect (감염병) =====
IF OBJECT_ID('tb_dp_infect', 'U') IS NULL
BEGIN
    CREATE TABLE tb_dp_infect (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        worker_name         NVARCHAR(200)  NOT NULL,
        department          NVARCHAR(200),
        program_type        NVARCHAR(50)   NOT NULL,
        disease_type        NVARCHAR(200),
        impl_date           DATE,
        result              NVARCHAR(200),
        status              NVARCHAR(30),
        next_due_date       DATE,
        notes               NVARCHAR(MAX),
        deleted             BIT            NOT NULL DEFAULT 0,
        created_at          DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME2      NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ===================================================================
-- ===== Dummy Data ==================================================
-- ===================================================================

-- MSD
IF NOT EXISTS (SELECT 1 FROM tb_dp_msd)
BEGIN
    INSERT INTO tb_dp_msd (worker_name, department, job_title, task_name, task_category, reba_score, owas_score, risk_level, affected_body_parts, symptoms, assessment_date, assessor, status, action_taken, notes) VALUES
    (N'김생산', N'생산1팀', N'조립작업자',   N'소형부품 조립',  N'반복 손목 작업', 9,  3, N'높음', N'손목,어깨',  N'통증,저림',  '2026-05-10', N'안전보건팀 김주임', N'요개선', N'작업대 높이 조정·툴 교체·시간당 5분 휴식 도입', N'2년차 작업자. VAS 6점.'),
    (N'이조립', N'생산2팀', N'조립작업자',   N'대형 패널 운반', N'중량물 들기',    11, 4, N'높음', N'허리,목',    N'통증',       '2026-04-20', N'안전보건팀 김주임', N'요개선', N'리프트보조기구 도입 · 2인1조 작업', N'25kg 이상 운반 빈도 높음.'),
    (N'박포장', N'물류팀',  N'포장작업자',   N'박스 포장·적재', N'반복 어깨 작업', 6,  2, N'중간', N'어깨',       N'뻐근함',     '2026-05-15', N'안전보건팀 김주임', N'요관찰', N'스트레칭 프로그램 안내', N''),
    (N'최사무', N'관리팀',  N'사무직',       N'컴퓨터 문서작업', N'반복 컴퓨터 작업', 4, 1, N'중간', N'목,손목',    N'뻐근함',     '2026-05-12', N'안전보건팀 김주임', N'요관찰', N'의자·모니터 위치 조정 안내', N'하루 7시간 PC 사용.'),
    (N'정용접', N'용접팀',  N'용접작업자',   N'쪼그린 자세 용접', N'지속적 쪼그려앉기', 8, 4, N'높음', N'무릎,허리', N'통증',       '2026-04-28', N'안전보건팀 김주임', N'요개선', N'용접대 도입·작업자세 교육', N''),
    (N'강검사', N'품질팀',  N'검사원',       N'제품 외관검사',   N'자세 정적유지',    5, 2, N'중간', N'목,어깨',   N'피로',       '2026-05-08', N'안전보건팀 김주임', N'요관찰', N'검사대 높이 조정·휴식주기 조정', N''),
    (N'윤도장', N'도장팀',  N'도장작업자',   N'스프레이 도장',   N'부적절한 자세',    7, 3, N'중간', N'어깨,손목', N'저림',       '2026-05-03', N'안전보건팀 김주임', N'요관찰', N'스프레이건 경량화 검토', N''),
    (N'조운반', N'물류팀',  N'지게차 운전자', N'진동공구 작업',  N'반복 진동공구',    6, 2, N'중간', N'손목,팔',   N'저림',       '2026-04-22', N'안전보건팀 김주임', N'요관찰', N'방진장갑 지급', N'');
END;
GO

-- CVD
IF NOT EXISTS (SELECT 1 FROM tb_dp_cvd)
BEGIN
    INSERT INTO tb_dp_cvd (worker_name, department, age, gender, bmi, bp_sys, bp_dia, fasting_glucose, ldl, hdl, smoking, drinking, exercise, night_shift, overtime, risk_level, assessment_date, assessor, management_plan, next_checkup, notes) VALUES
    (N'김중년', N'생산1팀',   52, N'남', 28.5, 145, 92, 130, 165, 38, N'현재흡연', N'주 3회 이상', N'주 1회 미만', N'주 2~3회', N'월 50시간 이상', N'고위험', '2026-04-15', N'보건관리자 이주임', N'금연·체중감량·전문의 진료 의뢰',          '2026-07-15', N'고혈압 약물 복용 중. 야간작업 제한 검토.'),
    (N'이건강', N'관리팀',    38, N'남', 24.1, 122, 78,  95, 120, 52, N'비흡연',   N'주 1회',     N'주 3회 이상', N'없음',     N'월 20시간',      N'저위험', '2026-04-15', N'보건관리자 이주임', N'연 1회 정기평가',                          '2027-04-15', N''),
    (N'박야간', N'생산2팀',   45, N'남', 26.8, 138, 88, 115, 145, 42, N'현재흡연', N'주 2회',     N'주 1~2회',   N'주 3회 이상', N'월 60시간',   N'중위험', '2026-04-20', N'보건관리자 이주임', N'금연 클리닉 연계·생활습관 교육',         '2026-10-20', N'야간작업 누적 5년.'),
    (N'최임원', N'경영지원',  58, N'여', 23.5, 148, 95, 125, 155, 48, N'비흡연',   N'주 1회 미만', N'주 2회',     N'없음',     N'월 40시간',      N'고위험', '2026-04-18', N'보건관리자 이주임', N'심혈관 전문의 진료 · 약물치료',          '2026-07-18', N'폐경 후 위험도 상승.'),
    (N'정젊은', N'품질팀',    32, N'남', 22.5, 118, 76,  88, 110, 55, N'비흡연',   N'주 2회',     N'주 4회 이상', N'없음',     N'월 15시간',      N'저위험', '2026-04-22', N'보건관리자 이주임', N'연 1회 평가',                              '2027-04-22', N''),
    (N'강장년', N'생산1팀',   48, N'남', 27.2, 132, 84, 108, 138, 44, N'금연 1년', N'주 2회',     N'주 2회',     N'주 2회',   N'월 35시간',      N'중위험', '2026-04-25', N'보건관리자 이주임', N'체중 5% 감량 목표 · 운동 처방',          '2026-10-25', N'');
END;
GO

-- Stress (KOSS-26)
IF NOT EXISTS (SELECT 1 FROM tb_dp_stress)
BEGIN
    INSERT INTO tb_dp_stress (worker_name, department, physical_env, job_demand, autonomy, relationship, job_insecurity, system_fairness, reward, work_culture, total_score, risk_level, assessment_date, has_counseling, counseling_notes, notes) VALUES
    (N'김스트레스', N'고객지원팀', 6, 15, 11, 8, 7, 14, 12, 9, 82, N'고위험', '2026-04-10', 1, N'감정노동 부담 호소. 외부 EAP 상담 2회차. 부서 이동 검토.', N'고객 응대 6년차.'),
    (N'이업무',     N'영업팀',     4, 13,  8, 6, 5,  9, 10, 7, 62, N'잠재',   '2026-04-10', 0, N'',                                                                N'성과 압박.'),
    (N'박관리',     N'관리팀',     3,  9,  6, 5, 4,  7,  8, 5, 47, N'잠재',   '2026-04-10', 0, N'',                                                                N''),
    (N'최생산',     N'생산1팀',    8, 11, 13, 4, 6,  8,  9, 6, 65, N'고위험', '2026-04-10', 1, N'물리환경·자율성 영역 고득점. 작업환경 개선 협의.',          N'소음·고온 환경.'),
    (N'정안정',     N'연구소',     2,  7,  4, 3, 3,  5,  6, 4, 34, N'정상',   '2026-04-10', 0, N'',                                                                N''),
    (N'강야간',     N'생산2팀',    7, 10,  9, 5, 4,  8,  9, 6, 58, N'잠재',   '2026-04-10', 0, N'',                                                                N'야간근무 영향.');
END;
GO

-- Respi
IF NOT EXISTS (SELECT 1 FROM tb_dp_respi)
BEGIN
    INSERT INTO tb_dp_respi (worker_name, department, exposure_type, exposure_substance, exposure_level, ppe_type, fit_test_date, fit_test_result, pft_fvc, pft_fev1, skin_condition, patch_test_result, status, exam_date, examiner, notes) VALUES
    (N'김도장', N'도장팀',   N'유기용제',  N'톨루엔·MEK·자일렌',   N'15ppm (TWA)',     N'송기마스크 / 반면형 방진방독', '2026-03-15', N'적합', 4.2, 3.5, N'정상',       N'음성',              N'정상',     '2026-04-20', N'○○특건기관', N'국소배기장치 가동률 양호.'),
    (N'이용접', N'용접팀',   N'금속분진',  N'망간·크롬·니켈 흄',   N'TLV 이하',         N'용접용 송기마스크',           '2026-03-20', N'적합', 3.8, 3.0, N'정상',       N'음성',              N'요관찰',   '2026-04-25', N'○○특건기관', N'FEV1/FVC 비율 약간 저하. 6개월 추적.'),
    (N'박세척', N'세척팀',   N'산알칼리',  N'황산·수산화나트륨',   N'간헐적 노출',      N'내산 보호장갑·앞치마·고글',   '2026-02-10', N'적합', 4.0, 3.3, N'경미 자극',  N'음성',              N'요관찰',   '2026-04-12', N'○○특건기관', N'손등 경미 발적. 보호장갑 교체 주기 단축.'),
    (N'최분진', N'연마팀',   N'분진',      N'결정형 실리카',       N'0.045 mg/m³',     N'특급 방진마스크 (P3)',         '2026-03-25', N'적합', 3.5, 2.7, N'정상',       N'음성',              N'이상소견', '2026-04-30', N'○○특건기관', N'진폐 의심 소견. 정밀검진 의뢰.'),
    (N'정세제', N'청소팀',   N'감작성물질', N'이소시아네이트·계면활성제', N'저농도 지속노출', N'내화학 장갑·앞치마',     NULL,         N'',     3.9, 3.2, N'경미 발진',  N'양성 (계면활성제)', N'요관찰',   '2026-04-18', N'○○특건기관', N'알레르기성 접촉피부염. 물질 교체 검토.'),
    (N'강도장', N'도장팀',   N'유기용제',  N'톨루엔',              N'8ppm',             N'반면형 방독마스크',           '2026-03-18', N'적합', 4.5, 3.7, N'정상',       N'음성',              N'정상',     '2026-04-22', N'○○특건기관', N'');
END;
GO

-- Hearing
IF NOT EXISTS (SELECT 1 FROM tb_dp_hearing)
BEGIN
    INSERT INTO tb_dp_hearing (worker_name, department, noise_level, exposure_hours, right_4k, right_6k, left_4k, left_6k, sts_result, ppe_type, ppe_nrr, exam_date, exam_type, status, notes) VALUES
    (N'김소음',   N'프레스팀', 92, 8, 25, 30, 28, 32, N'없음',                N'귀마개 (NRR 29)',   29, '2026-04-10', N'정기', N'정상',   N'기준선 대비 변화 없음.'),
    (N'이프레스', N'프레스팀', 95, 8, 35, 40, 38, 45, N'발생 (우측 4k +12dB)', N'귀덮개 (NRR 27)',   27, '2026-04-12', N'정기', N'STS발생', N'재검사 + 청력보호구 적합성 재평가.'),
    (N'박분쇄',   N'분쇄팀',   98, 6, 50, 55, 48, 52, N'발생',                N'귀마개+귀덮개 이중', 35, '2026-04-15', N'정기', N'D1',      N'소음성난청 요관찰자. 작업환경 개선 필요.'),
    (N'최기계',   N'가공팀',   88, 7, 20, 22, 22, 25, N'없음',                N'귀마개 (NRR 32)',   32, '2026-04-08', N'정기', N'정상',   N''),
    (N'정굴착',   N'시설팀',  102, 4, 65, 70, 62, 68, N'발생',                N'귀마개+귀덮개',     35, '2026-04-18', N'정기', N'D2',      N'소음성난청 유소견자. 작업전환 검토.'),
    (N'강조립',   N'조립팀',   85, 8, 18, 20, 20, 22, N'없음',                N'귀마개 (NRR 25)',   25, '2026-04-05', N'기준선', N'정상', N'신규 입사자 기준선 검사.');
END;
GO

-- Thermal
IF NOT EXISTS (SELECT 1 FROM tb_dp_thermal)
BEGIN
    INSERT INTO tb_dp_thermal (thermal_type, occur_date, location, worker_name, department, weather_condition, perceived_temp, symptoms, severity, treatment, outcome, prevention_action, notes) VALUES
    (N'온열',     '2025-08-12', N'제3공장 외곽 야적장', N'김야외',   N'물류팀',     N'폭염주의보',         35.2, N'두통·어지러움·발한', N'경증',   N'그늘 휴식·수분보충·이온음료', N'30분 후 회복',     N'오후 2~4시 옥외작업 중단·휴게실 가동',                      N'폭염 매시간 15분 휴식 적용.'),
    (N'온열',     '2025-08-05', N'용접장 (옥내)',       N'이용접',   N'용접팀',     N'폭염경보',           38.5, N'심한 두통·구토',    N'중등도', N'응급실 이송·수액 처치',     N'당일 귀가·3일 휴식', N'용접장 환기설비 점검·작업시간 단축',                          N'체감 38℃ 이상으로 작업중지 권고.'),
    (N'예방조치', '2025-08-10', N'전사',               N'-',        N'안전보건팀', N'폭염경보 (체감 35℃)', 35.0, N'-',                 N'경증',   N'-',                          N'예방 완료',         N'옥외작업 14~17시 중단·아이스조끼 지급·물 500ml/h 지급',     N'체감온도 35℃ 이상 시 자동 발령.'),
    (N'한랭',     '2026-01-15', N'냉동창고',            N'박냉동',   N'물류팀',    N'실내 -18℃',          -22.0, N'손가락 동상 1도',   N'경증',   N'체온 회복실 이동·미온수 처치', N'당일 회복',        N'방한장갑 교체·작업시간 30분 단축·교대주기 단축',           N'냉동창고 작업자 한랭 매뉴얼 적용.'),
    (N'한랭',     '2026-01-08', N'옥외 보수작업',       N'정시설',   N'시설팀',    N'한파주의보 (-12℃)',  -18.0, N'근육통·떨림',       N'경증',   N'실내 휴식·따뜻한 음료',     N'회복',              N'방한복 6종 세트 지급·휴게시간 확대',                          N''),
    (N'예방조치', '2026-01-12', N'전사 옥외작업장',     N'-',        N'안전보건팀', N'한파경보',          -15.0, N'-',                 N'경증',   N'-',                          N'예방 완료',         N'체감 -15℃ 이하 옥외작업 중단·일산화탄소 측정기 비치',     N'갈탄·전기난로 사용 금지 안내.');
END;
GO

-- Infect
IF NOT EXISTS (SELECT 1 FROM tb_dp_infect)
BEGIN
    INSERT INTO tb_dp_infect (worker_name, department, program_type, disease_type, impl_date, result, status, next_due_date, notes) VALUES
    (N'김건강',   N'식당팀',    N'예방접종',   N'A형간염',           '2026-03-10', N'접종완료 (2차)',     N'완료',     NULL,         N'식품취급자 의무 접종.'),
    (N'이근로',   N'식당팀',    N'검진',       N'결핵검진',         '2026-04-15', N'음성',               N'완료',     '2027-04-15', N'식품취급자 연 1회 결핵검진.'),
    (N'응웬 반', N'생산2팀',   N'검진',       N'결핵검진 (외국인)', '2026-02-20', N'음성',               N'완료',     '2027-02-20', N'베트남 국적. 외국인 근로자 연 1회.'),
    (N'박독감',   N'관리팀',    N'예방접종',   N'인플루엔자',       '2025-10-20', N'접종완료',           N'완료',     '2026-10-20', N'연 1회 자율 접종.'),
    (N'최간염',   N'청소팀',    N'예방접종',   N'B형간염',          '2025-12-15', N'접종완료 (3차)',     N'완료',     NULL,         N'혈액매개 노출 위험군.'),
    (N'정노출',   N'생산1팀',   N'노출사고',   N'체액 노출',        '2026-04-08', N'추적검사 진행 중',   N'추적관리', '2026-07-08', N'근무 중 체액 노출. 3개월·6개월 추적.'),
    (N'강전염',   N'영업팀',    N'감염병발생', N'코로나19',         '2026-03-25', N'확진·격리',          N'회복',     NULL,         N'5일 격리 후 복귀.'),
    (N'윤검진',   N'연구소',    N'예방접종',   N'파상풍',           '2024-05-12', N'접종완료',           N'완료',     '2034-05-12', N'10년 주기 추가접종.'),
    (N'응웬 티', N'생산2팀',   N'검진',       N'결핵검진 (외국인)', NULL,        N'예정',               N'예정',     '2026-06-15', N'베트남 신규 입사자. 채용 시 검진 예정.');
END;
GO
