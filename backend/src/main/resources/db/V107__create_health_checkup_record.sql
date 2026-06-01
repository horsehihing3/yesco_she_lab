-- V107: 임직원 건강검진 사후관리 (보건 데이터베이스)
-- PDF 결과지 업로드 후 자동 파싱된 검진 수치 저장

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_health_checkup_record')
CREATE TABLE tb_health_checkup_record (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    -- 기본 정보
    exam_date NVARCHAR(20) NULL,            -- 검진일 (예: 2024-11-09)
    exam_period NVARCHAR(20) NULL,          -- 검진시기 (예: 10-12)
    hospital_name NVARCHAR(200) NULL,       -- 병원명
    department NVARCHAR(200) NULL,          -- 부서명
    name NVARCHAR(50) NULL,                 -- 성명
    age INT NULL,                           -- 연령
    -- 고혈압
    bp_systolic INT NULL,                   -- 수축기
    bp_diastolic INT NULL,                  -- 이완기
    bp_med NVARCHAR(10) NULL,               -- 약복용 (유/무)
    bp_grade NVARCHAR(30) NULL,             -- 건강구분 (정상/전단계/의심/유질환자)
    -- 당뇨병
    bst INT NULL,                           -- 공복혈당
    dm_med NVARCHAR(10) NULL,
    dm_grade NVARCHAR(30) NULL,
    -- 이상지질혈증
    tc INT NULL,                            -- 총콜레스테롤
    tg INT NULL,                            -- 중성지방
    ldl INT NULL,                           -- 저밀도
    hdl INT NULL,                           -- 고밀도
    lipid_med NVARCHAR(10) NULL,
    lipid_grade NVARCHAR(30) NULL,
    -- 기타
    follow_up NVARCHAR(MAX) NULL,           -- 사후관리소견
    work_fitness NVARCHAR(10) NULL,         -- 업무적합 (가/조건부/불가)
    remark NVARCHAR(MAX) NULL,              -- 비고
    -- 원본 PDF 참조
    pdf_file_id BIGINT NULL,                -- tb_file_metadata FK (옵션)
    -- 메타
    created_by NVARCHAR(100) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_health_checkup_record_name_date')
CREATE INDEX IX_health_checkup_record_name_date ON tb_health_checkup_record(name, exam_date DESC);

-- 상담 이력
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_health_consultation')
CREATE TABLE tb_health_consultation (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    record_id BIGINT NOT NULL,
    consultation_date NVARCHAR(20) NULL,
    content NVARCHAR(MAX) NULL,
    email_sent BIT DEFAULT 0,
    email_sent_at DATETIME2 NULL,
    created_by NVARCHAR(100) NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_health_consultation_record')
CREATE INDEX IX_health_consultation_record ON tb_health_consultation(record_id, created_at DESC);
