-- ============================================================
-- V210: 사업장(WorkplaceSite) 테이블 신규 생성
-- 도면관리 트리의 루트 노드로 사용. 건물 넘버링(B30-NNNN) 자동 생성
-- ============================================================

IF OBJECT_ID('tb_workplace_site', 'U') IS NOT NULL DROP TABLE tb_workplace_site;

CREATE TABLE tb_workplace_site (
    id                       BIGINT          IDENTITY(1,1) PRIMARY KEY,
    building_number          NVARCHAR(20)    NOT NULL UNIQUE,        -- B30-0001
    site_name                NVARCHAR(200)   NOT NULL,               -- 사업장명
    site_code                NVARCHAR(50)    NULL,                   -- 사업장코드
    site_type                NVARCHAR(50)    NULL,                   -- 사업장유형
    industry                 NVARCHAR(100)   NULL,                   -- 업종
    address                  NVARCHAR(500)   NULL,                   -- 주소
    business_reg_no          NVARCHAR(50)    NULL,                   -- 사업자등록번호
    she_manager              NVARCHAR(100)   NULL,                   -- SHE담당자
    established_date         DATE            NULL,                   -- 설립일
    representative_contact   NVARCHAR(50)    NULL,                   -- 대표연락처
    risk_grade               NVARCHAR(10)    NULL,                   -- 위험등급 (A/B/C/D)
    operation_status         NVARCHAR(20)    NOT NULL CONSTRAINT DF_workplace_site_op_status DEFAULT 'ACTIVE', -- ACTIVE/SUSPENDED/CLOSED
    notes                    NVARCHAR(MAX)   NULL,                   -- 비고
    active                   BIT             NOT NULL CONSTRAINT DF_workplace_site_active DEFAULT 1,
    created_at               DATETIME        NOT NULL CONSTRAINT DF_workplace_site_created DEFAULT GETDATE(),
    modified_at              DATETIME        NOT NULL CONSTRAINT DF_workplace_site_modified DEFAULT GETDATE()
);

CREATE INDEX IX_workplace_site_building_number ON tb_workplace_site(building_number);

-- ── 더미 데이터 ───────────────────────────────────────────────
INSERT INTO tb_workplace_site (building_number, site_name, site_code, site_type, industry, address, business_reg_no, she_manager, established_date, representative_contact, risk_grade, operation_status, notes)
VALUES
('B30-0001', '본사', 'HQ-SEOUL',   '제조',  '도시가스',     '서울특별시 강남구 테헤란로 152',   '123-45-67890', '김안전', '1995-01-15', '02-1234-5678',  'B', 'ACTIVE', '본사 사옥'),
('B30-0002', '울산공장', 'PLANT-USAN', '제조',  '도시가스 생산', '울산광역시 남구 산업로 100',       '234-56-78901', '이환경', '2002-03-20', '052-1234-5678', 'A', 'ACTIVE', '주력 생산 공장'),
('B30-0003', '대전영업소', 'BR-DJ',    '영업',  '도시가스 판매', '대전광역시 유성구 대학로 99',     '345-67-89012', '박보건', '2010-09-01', '042-1234-5678', 'C', 'ACTIVE', '중부권 영업'),
('B30-0004', '인천물류센터', 'LG-IC',  '물류',  '가스 운송',     '인천광역시 서구 가좌동 200',       '456-78-90123', '최건설', '2015-06-12', '032-1234-5678', 'B', 'ACTIVE', NULL);

-- ── tb_floor_drawing 에 site_id FK 컬럼 추가 (NULL 허용 - 기존 데이터 호환) ──
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = 'site_id' AND Object_ID = Object_ID('tb_floor_drawing'))
BEGIN
    ALTER TABLE tb_floor_drawing ADD site_id BIGINT NULL;
END
GO
