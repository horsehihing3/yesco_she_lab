-- V159: 산재신청 테이블 복구
--        이전 V157(어제 버전)이 DROP TABLE tb_accident_claim* 을 포함하여 적용되면서
--        V64 에서 생성한 산재신청 테이블이 소실됨. 본 마이그레이션으로 동일 스키마/더미를 재생성.

SET NOCOUNT ON;
GO

-- ===== 산업재해 신청서 테이블 =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_accident_claim')
BEGIN
    CREATE TABLE tb_accident_claim (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        claim_id NVARCHAR(30) NOT NULL,
        status NVARCHAR(20) DEFAULT 'DRAFT',

        -- 1. 재해근로자 인적사항
        worker_name NVARCHAR(50) NULL,
        worker_ssn NVARCHAR(20) NULL,
        worker_phone NVARCHAR(20) NULL,
        worker_address NVARCHAR(300) NULL,
        worker_job_type NVARCHAR(100) NULL,
        worker_join_date DATE NULL,
        worker_dept NVARCHAR(100) NULL,

        -- 2. 사업장 사항
        company_name NVARCHAR(200) NULL,
        company_rep_name NVARCHAR(50) NULL,
        company_biz_no NVARCHAR(20) NULL,
        company_address NVARCHAR(300) NULL,
        company_phone NVARCHAR(20) NULL,
        company_industry NVARCHAR(100) NULL,
        company_workers_count INT NULL,

        -- 3. 직업병 관련
        disease_name NVARCHAR(200) NULL,
        disease_code NVARCHAR(30) NULL,
        onset_date DATE NULL,
        diagnosis_date DATE NULL,
        exposure_period NVARCHAR(100) NULL,
        exposure_factor NVARCHAR(500) NULL,
        work_history NVARCHAR(2000) NULL,

        -- 4. 요양급여 신청
        hospital_name NVARCHAR(200) NULL,
        hospital_dept NVARCHAR(100) NULL,
        treatment_start_date DATE NULL,
        treatment_end_date DATE NULL,
        treatment_type NVARCHAR(100) NULL,

        -- 5. 기타
        applicant_name NVARCHAR(50) NULL,
        applicant_relation NVARCHAR(50) NULL,
        apply_date DATE NULL,
        notes NVARCHAR(2000) NULL,

        deleted BIT DEFAULT 0,
        created_by NVARCHAR(50) NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        modified_at DATETIME2 DEFAULT GETDATE()
    );
END;
GO

-- ===== 첨부서류 체크 테이블 =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_accident_claim_doc')
BEGIN
    CREATE TABLE tb_accident_claim_doc (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        claim_id BIGINT NOT NULL,
        doc_type NVARCHAR(50) NOT NULL,
        doc_name NVARCHAR(200) NOT NULL,
        is_required BIT DEFAULT 1,
        is_submitted BIT DEFAULT 0,
        file_id BIGINT NULL,
        notes NVARCHAR(200) NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_claim_doc_claim FOREIGN KEY (claim_id) REFERENCES tb_accident_claim(id)
    );
END;
GO

-- ===== 더미 데이터 (V65 동일) — 비어 있을 때만 적재 =====
IF NOT EXISTS (SELECT 1 FROM tb_accident_claim)
BEGIN
    INSERT INTO tb_accident_claim (claim_id, status, worker_name, worker_ssn, worker_phone, worker_address, worker_job_type, worker_join_date, worker_dept, company_name, company_rep_name, company_biz_no, company_address, company_phone, company_industry, company_workers_count, disease_name, disease_code, onset_date, diagnosis_date, exposure_period, exposure_factor, work_history, hospital_name, hospital_dept, treatment_start_date, treatment_type, applicant_name, applicant_relation, apply_date, created_by) VALUES
    (N'AC-2026-001', 'SUBMITTED', N'김근로', N'850101-1******', '010-1234-5678', N'서울시 강남구 테헤란로 123', N'도장공', '2015-03-01', N'생산 2팀', N'(주)스마트이에이치에스', N'홍대표', '123-45-67890', N'서울시 강남구 역삼동 456', '02-1234-5678', N'제조업', 250, N'유기용제 중독(톨루엔)', 'T52.2', '2026-02-15', '2026-03-01', N'11년 (2015~2026)', N'톨루엔, 자일렌, 메틸에틸케톤', N'2015년부터 도장 작업 종사. 밀폐 공간에서 유기용제 사용 도장 작업 수행. 환기시설 미비 기간 있음.', N'서울대학교병원', N'직업환경의학과', '2026-03-05', N'입원', N'김근로', N'본인', '2026-03-10', 'admin'),
    (N'AC-2026-002', 'DRAFT',     N'이용접', N'900315-1******', '010-2345-6789', N'경기도 수원시 팔달구 인계동 789', N'용접공', '2018-06-15', N'설비팀', N'(주)스마트이에이치에스', N'홍대표', '123-45-67890', N'서울시 강남구 역삼동 456', '02-1234-5678', N'제조업', 250, N'진폐증(용접흄)',  'J68.0', '2026-01-20', '2026-02-10', N'8년 (2018~2026)',  N'용접흄, 망간, 철분진',          N'2018년부터 아크 용접 작업 종사. 일일 평균 6시간 이상 용접 작업 수행.',                          N'분당서울대병원',     N'호흡기내과',         '2026-02-15', N'통원', N'이용접', N'본인', NULL,        'admin'),
    (N'AC-2026-003', 'APPROVED',  N'박소음', N'780520-2******', '010-3456-7890', N'인천시 남동구 논현동 321',     N'프레스공', '2010-01-10', N'생산 1팀', N'(주)스마트이에이치에스', N'홍대표', '123-45-67890', N'서울시 강남구 역삼동 456', '02-1234-5678', N'제조업', 250, N'소음성 난청',     'H83.3', '2025-11-01', '2025-12-15', N'16년 (2010~2026)', N'소음 (85dB 이상 지속 노출)',     N'2010년부터 프레스 작업장 근무. 작업환경측정 결과 90dB 이상 측정.',                              N'서울아산병원',       N'이비인후과',         '2025-12-20', N'통원', N'박소음', N'본인', '2026-01-05', 'admin');
END;
GO

IF NOT EXISTS (SELECT 1 FROM tb_accident_claim_doc)
BEGIN
    DECLARE @c1 BIGINT = (SELECT id FROM tb_accident_claim WHERE claim_id = 'AC-2026-001');
    DECLARE @c2 BIGINT = (SELECT id FROM tb_accident_claim WHERE claim_id = 'AC-2026-002');
    DECLARE @c3 BIGINT = (SELECT id FROM tb_accident_claim WHERE claim_id = 'AC-2026-003');

    INSERT INTO tb_accident_claim_doc (claim_id, doc_type, doc_name, is_required, is_submitted) VALUES
    (@c1, 'DIAGNOSIS',     N'진단서 (원본)',           1, 1),
    (@c1, 'OPINION',       N'소견서 (업무관련성)',     1, 1),
    (@c1, 'HEALTH_EXAM',   N'특수건강검진 결과표',     1, 0),
    (@c1, 'ENV_MEASURE',   N'작업환경측정결과서',      1, 1),
    (@c1, 'MSDS',          N'MSDS (취급물질목록)',     1, 1),
    (@c1, 'WORK_CONFIRM',  N'업무내용 확인서',         1, 0),
    (@c1, 'CAREER_CERT',   N'경력증명서 (전 직장)',    0, 0),
    (@c1, 'EMPLOY_CERT',   N'재직증명서',              1, 1),
    (@c1, 'ID_COPY',       N'주민등록증 사본',         1, 1),
    (@c1, 'BANK_COPY',     N'통장 사본',               1, 1),
    (@c1, 'RADIATION',     N'방사선 피폭선량 기록',    0, 0),
    (@c1, 'OTHER_MEDICAL', N'기타 관련 의료기록',      0, 0),

    (@c2, 'DIAGNOSIS',     N'진단서 (원본)',           1, 0),
    (@c2, 'OPINION',       N'소견서 (업무관련성)',     1, 0),
    (@c2, 'HEALTH_EXAM',   N'특수건강검진 결과표',     1, 0),
    (@c2, 'ENV_MEASURE',   N'작업환경측정결과서',      1, 0),
    (@c2, 'MSDS',          N'MSDS (취급물질목록)',     1, 0),
    (@c2, 'WORK_CONFIRM',  N'업무내용 확인서',         1, 0),
    (@c2, 'CAREER_CERT',   N'경력증명서 (전 직장)',    0, 0),
    (@c2, 'EMPLOY_CERT',   N'재직증명서',              1, 0),
    (@c2, 'ID_COPY',       N'주민등록증 사본',         1, 0),
    (@c2, 'BANK_COPY',     N'통장 사본',               1, 0),
    (@c2, 'RADIATION',     N'방사선 피폭선량 기록',    0, 0),
    (@c2, 'OTHER_MEDICAL', N'기타 관련 의료기록',      0, 0),

    (@c3, 'DIAGNOSIS',     N'진단서 (원본)',           1, 1),
    (@c3, 'OPINION',       N'소견서 (업무관련성)',     1, 1),
    (@c3, 'HEALTH_EXAM',   N'특수건강검진 결과표',     1, 1),
    (@c3, 'ENV_MEASURE',   N'작업환경측정결과서',      1, 1),
    (@c3, 'MSDS',          N'MSDS (취급물질목록)',     1, 1),
    (@c3, 'WORK_CONFIRM',  N'업무내용 확인서',         1, 1),
    (@c3, 'CAREER_CERT',   N'경력증명서 (전 직장)',    0, 1),
    (@c3, 'EMPLOY_CERT',   N'재직증명서',              1, 1),
    (@c3, 'ID_COPY',       N'주민등록증 사본',         1, 1),
    (@c3, 'BANK_COPY',     N'통장 사본',               1, 1),
    (@c3, 'RADIATION',     N'방사선 피폭선량 기록',    0, 0),
    (@c3, 'OTHER_MEDICAL', N'기타 관련 의료기록',      0, 1);
END;
GO
