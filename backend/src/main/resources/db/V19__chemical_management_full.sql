-- =====================================================
-- V19: 화학물질 관리 시스템 전체 확장
-- 마스터/규제, MSDS, Life-Cycle, 승인연동
-- =====================================================

-- ===== 1. tb_chemical 컬럼 추가 =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_chemical' AND COLUMN_NAME='molecular_formula')
BEGIN
    ALTER TABLE tb_chemical ADD molecular_formula NVARCHAR(100) NULL;
    ALTER TABLE tb_chemical ADD applicable_regulation NVARCHAR(200) NULL;
    ALTER TABLE tb_chemical ADD ghs_classification NVARCHAR(500) NULL;
    ALTER TABLE tb_chemical ADD exposure_limit NVARCHAR(100) NULL;
END;

-- ===== 2. Code Groups =====
-- CHEMICAL_VENDOR_GRADE
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CHEM_VENDOR_GRADE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CHEM_VENDOR_GRADE', N'협력사 평가등급', N'화학물질 협력사 평가등급', 1, 710, GETDATE(), GETDATE());
END;
DECLARE @vendorGradeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHEM_VENDOR_GRADE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @vendorGradeId AND code = 'A')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@vendorGradeId, 'A', 'A', N'A등급', 'Grade A', N'A级', 1, 1, GETDATE(), GETDATE()),
    (@vendorGradeId, 'B', 'B', N'B등급', 'Grade B', N'B级', 1, 2, GETDATE(), GETDATE()),
    (@vendorGradeId, 'C', 'C', N'C등급', 'Grade C', N'C级', 1, 3, GETDATE(), GETDATE());
END;

-- CHEM_REG_TYPE
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CHEM_REG_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CHEM_REG_TYPE', N'규제 구분', N'화학물질 규제 유형', 1, 711, GETDATE(), GETDATE());
END;
DECLARE @regTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHEM_REG_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @regTypeId AND code = 'DOMESTIC')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@regTypeId, 'DOMESTIC', 'DOMESTIC', N'국내', 'Domestic', N'国内', 1, 1, GETDATE(), GETDATE()),
    (@regTypeId, 'OVERSEAS', 'OVERSEAS', N'해외', 'Overseas', N'海外', 1, 2, GETDATE(), GETDATE());
END;

-- CHEM_ERP_STATUS
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CHEM_ERP_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CHEM_ERP_STATUS', N'ERP 자재 상태', N'ERP 자재 재고 상태', 1, 712, GETDATE(), GETDATE());
END;
DECLARE @erpStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHEM_ERP_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @erpStatusId AND code = 'NORMAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@erpStatusId, 'NORMAL',    'NORMAL',    N'정상',     'Normal',     N'正常',     1, 1, GETDATE(), GETDATE()),
    (@erpStatusId, 'LOW_STOCK', 'LOW_STOCK', N'재고부족', 'Low Stock',  N'库存不足', 1, 2, GETDATE(), GETDATE()),
    (@erpStatusId, 'EXPIRING',  'EXPIRING',  N'만료임박', 'Expiring',   N'即将到期', 1, 3, GETDATE(), GETDATE()),
    (@erpStatusId, 'RESTRICTED','RESTRICTED',N'사용제한', 'Restricted', N'使用受限', 1, 4, GETDATE(), GETDATE());
END;

-- CHEM_WH_TYPE
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CHEM_WH_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CHEM_WH_TYPE', N'창고 보관 유형', N'화학물질 창고 보관 유형', 1, 713, GETDATE(), GETDATE());
END;
DECLARE @whTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CHEM_WH_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @whTypeId AND code = 'GENERAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@whTypeId, 'GENERAL',    'GENERAL',    N'일반',   'General',    N'一般',   1, 1, GETDATE(), GETDATE()),
    (@whTypeId, 'HAZARDOUS',  'HAZARDOUS',  N'위험물', 'Hazardous',  N'危险品', 1, 2, GETDATE(), GETDATE()),
    (@whTypeId, 'CORROSIVE',  'CORROSIVE',  N'부식성', 'Corrosive',  N'腐蚀性', 1, 3, GETDATE(), GETDATE()),
    (@whTypeId, 'TOXIC',      'TOXIC',      N'유독물', 'Toxic',      N'有毒物', 1, 4, GETDATE(), GETDATE());
END;

-- ===== 3. tb_erp_material =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_erp_material')
BEGIN
    CREATE TABLE tb_erp_material (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        material_code       NVARCHAR(30) NOT NULL,
        material_name       NVARCHAR(200) NOT NULL,
        chemical_name       NVARCHAR(200),
        cas_number          NVARCHAR(30),
        supplier            NVARCHAR(100),
        stock_quantity      DECIMAL(12,2),
        unit                NVARCHAR(20),
        unit_price          DECIMAL(12,2),
        last_incoming_date  DATE,
        status              NVARCHAR(30) DEFAULT 'NORMAL',
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 4. tb_chemical_vendor =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_chemical_vendor')
BEGIN
    CREATE TABLE tb_chemical_vendor (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        vendor_code         NVARCHAR(30) NOT NULL,
        vendor_name         NVARCHAR(200) NOT NULL,
        representative      NVARCHAR(50),
        contact_person      NVARCHAR(50),
        phone               NVARCHAR(50),
        supply_items_count  INT DEFAULT 0,
        msds_status         NVARCHAR(30) DEFAULT 'COMPLETE',
        last_transaction_date DATE,
        grade               NVARCHAR(10) DEFAULT 'A',
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 5. tb_chemical_regulation =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_chemical_regulation')
BEGIN
    CREATE TABLE tb_chemical_regulation (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        reg_code            NVARCHAR(30) NOT NULL,
        reg_name            NVARCHAR(200) NOT NULL,
        reg_type            NVARCHAR(30) DEFAULT 'DOMESTIC',
        authority           NVARCHAR(100),
        applicable_count    INT DEFAULT 0,
        last_revision_date  DATE,
        next_review_date    DATE,
        status              NVARCHAR(30) DEFAULT 'ACTIVE',
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 6. tb_regulation_check =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_regulation_check')
BEGIN
    CREATE TABLE tb_regulation_check (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        check_id            NVARCHAR(30) NOT NULL,
        check_name          NVARCHAR(200) NOT NULL,
        related_regulation  NVARCHAR(200),
        check_type          NVARCHAR(30) DEFAULT 'REGULAR',
        assignee            NVARCHAR(50),
        due_date            DATE,
        progress            INT DEFAULT 0,
        status              NVARCHAR(30) DEFAULT 'PENDING',
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 7. tb_msds =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_msds')
BEGIN
    CREATE TABLE tb_msds (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        msds_type           NVARCHAR(20) NOT NULL,       -- RAW / PRODUCT
        item_name           NVARCHAR(200) NOT NULL,
        item_code           NVARCHAR(50),
        cas_number          NVARCHAR(30),
        supplier            NVARCHAR(100),
        version             NVARCHAR(20),
        issue_date          DATE,
        retire_date         DATE,
        retire_reason       NVARCHAR(500),
        language            NVARCHAR(50),
        file_size           NVARCHAR(20),
        file_id             BIGINT,
        export_countries    NVARCHAR(200),
        is_latest           BIT DEFAULT 1,
        change_type         NVARCHAR(30),
        change_summary      NVARCHAR(500),
        registered_by       NVARCHAR(50),
        status              NVARCHAR(30) DEFAULT 'VALID',
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 8. tb_chemical_ghs =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_chemical_ghs')
BEGIN
    CREATE TABLE tb_chemical_ghs (
        id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
        chemical_name           NVARCHAR(200) NOT NULL,
        cas_number              NVARCHAR(30),
        physical_hazard         NVARCHAR(300),
        health_hazard           NVARCHAR(300),
        environmental_hazard    NVARCHAR(300),
        signal_word             NVARCHAR(30),
        ghs_version             NVARCHAR(20),
        status                  NVARCHAR(30) DEFAULT 'LATEST',
        deleted                 BIT NOT NULL DEFAULT 0,
        created_at              DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at             DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 9. tb_chemical_reach =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_chemical_reach')
BEGIN
    CREATE TABLE tb_chemical_reach (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        chemical_name       NVARCHAR(200) NOT NULL,
        cas_number          NVARCHAR(30),
        registration_no     NVARCHAR(50),
        svhc                NVARCHAR(30) DEFAULT 'N',
        authorization_required NVARCHAR(30) DEFAULT 'N',
        restriction_note    NVARCHAR(500),
        registration_date   DATE,
        status              NVARCHAR(30) DEFAULT 'REGISTERED',
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 10. tb_chemical_clp =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_chemical_clp')
BEGIN
    CREATE TABLE tb_chemical_clp (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        chemical_name       NVARCHAR(200) NOT NULL,
        cas_number          NVARCHAR(30),
        clp_classification  NVARCHAR(300),
        signal_word         NVARCHAR(30),
        h_codes             NVARCHAR(300),
        p_codes             NVARCHAR(300),
        last_updated        DATE,
        status              NVARCHAR(30) DEFAULT 'LATEST',
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 11. tb_chemical_tsca =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_chemical_tsca')
BEGIN
    CREATE TABLE tb_chemical_tsca (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        chemical_name       NVARCHAR(200) NOT NULL,
        cas_number          NVARCHAR(30),
        inventory_status    NVARCHAR(30) DEFAULT 'LISTED',
        regulation_section  NVARCHAR(30),
        reporting_duty      NVARCHAR(100),
        export_to_us        NVARCHAR(30),
        pmn_required        NVARCHAR(30) DEFAULT 'N',
        status              NVARCHAR(30) DEFAULT 'COMPLIANT',
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 12. tb_chemical_warehouse =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_chemical_warehouse')
BEGIN
    CREATE TABLE tb_chemical_warehouse (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        warehouse_code      NVARCHAR(30) NOT NULL,
        warehouse_name      NVARCHAR(200) NOT NULL,
        storage_type        NVARCHAR(30) DEFAULT 'GENERAL',
        location            NVARCHAR(200),
        stored_items_count  INT DEFAULT 0,
        total_stock         NVARCHAR(50),
        temperature         NVARCHAR(20),
        humidity            NVARCHAR(20),
        status              NVARCHAR(30) DEFAULT 'NORMAL',
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 13. tb_chemical_incoming =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_chemical_incoming')
BEGIN
    CREATE TABLE tb_chemical_incoming (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        incoming_date       DATE NOT NULL,
        incoming_no         NVARCHAR(30) NOT NULL,
        chemical_name       NVARCHAR(200) NOT NULL,
        supplier            NVARCHAR(100),
        quantity            DECIMAL(12,2),
        unit                NVARCHAR(20),
        warehouse_code      NVARCHAR(30),
        handler             NVARCHAR(50),
        msds_confirmed      BIT DEFAULT 0,
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 14. tb_chemical_usage =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_chemical_usage')
BEGIN
    CREATE TABLE tb_chemical_usage (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        usage_date          DATE NOT NULL,
        chemical_name       NVARCHAR(200) NOT NULL,
        department          NVARCHAR(100),
        purpose             NVARCHAR(200),
        usage_quantity      DECIMAL(12,2),
        unit                NVARCHAR(20),
        handler             NVARCHAR(50),
        remaining_stock     NVARCHAR(50),
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 15. tb_chemical_lot_tracking =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_chemical_lot_tracking')
BEGIN
    CREATE TABLE tb_chemical_lot_tracking (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        lot_number          NVARCHAR(30) NOT NULL,
        chemical_name       NVARCHAR(200) NOT NULL,
        incoming_date       DATE,
        incoming_quantity   NVARCHAR(50),
        current_location    NVARCHAR(200),
        used_quantity       NVARCHAR(50),
        remaining_quantity  NVARCHAR(50),
        elapsed_days        INT DEFAULT 0,
        status              NVARCHAR(30) DEFAULT 'STORED',
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 16. tb_chemical_usage_report =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_chemical_usage_report')
BEGIN
    CREATE TABLE tb_chemical_usage_report (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        report_year         INT NOT NULL,
        chemical_name       NVARCHAR(200) NOT NULL,
        cas_number          NVARCHAR(30),
        annual_usage        DECIMAL(12,2),
        unit                NVARCHAR(20),
        usage_purpose       NVARCHAR(200),
        report_deadline     DATE,
        submit_date         DATE,
        status              NVARCHAR(30) DEFAULT 'COLLECTING',
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 17. tb_chemical_hazard_report =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_chemical_hazard_report')
BEGIN
    CREATE TABLE tb_chemical_hazard_report (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        report_year         INT NOT NULL,
        chemical_name       NVARCHAR(200) NOT NULL,
        cas_number          NVARCHAR(30),
        hazard_class        NVARCHAR(100),
        annual_handling     NVARCHAR(50),
        handling_facility   NVARCHAR(200),
        report_deadline     DATE,
        submit_date         DATE,
        status              NVARCHAR(30) DEFAULT 'COLLECTING',
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== Update existing tb_chemical dummy data with new columns =====
-- NOTE: EXEC is required because ALTER TABLE + column references in same batch is not allowed in SQL Server
EXEC('UPDATE tb_chemical SET molecular_formula = N''(CH3)2CO'',  applicable_regulation = N''GHS'',           ghs_classification = N''Flam. Liq. 2'',       exposure_limit = N''500 ppm'' WHERE cas_number = ''67-64-1''');
EXEC('UPDATE tb_chemical SET molecular_formula = N''H2SO4'',     applicable_regulation = N''EU CLP, GHS'',   ghs_classification = N''Skin Corr. 1A'',      exposure_limit = N''1 mg/m3'' WHERE cas_number = ''7664-93-9''');
EXEC('UPDATE tb_chemical SET molecular_formula = N''C7H8'',      applicable_regulation = N''GHS, TSCA'',     ghs_classification = N''Flam. Liq. 2'',       exposure_limit = N''50 ppm'' WHERE cas_number = ''108-88-3''');
EXEC('UPDATE tb_chemical SET molecular_formula = N''NaOH'',      applicable_regulation = N''GHS'',           ghs_classification = N''Skin Corr. 1A'',      exposure_limit = N''2 mg/m3'' WHERE cas_number = ''1310-73-2''');
EXEC('UPDATE tb_chemical SET molecular_formula = N''HCl'',       applicable_regulation = N''EU CLP, GHS'',   ghs_classification = N''Skin Corr. 1B'',      exposure_limit = N''5 ppm'' WHERE cas_number = ''7647-01-0''');
EXEC('UPDATE tb_chemical SET molecular_formula = N''CH3OH'',     applicable_regulation = N''GHS'',           ghs_classification = N''Flam. Liq. 2, Acute Tox. 3'', exposure_limit = N''200 ppm'' WHERE cas_number = ''67-56-1''');
EXEC('UPDATE tb_chemical SET molecular_formula = N''C3H8O'',     applicable_regulation = N''GHS'',           ghs_classification = N''Flam. Liq. 2'',       exposure_limit = N''400 ppm'' WHERE cas_number = ''67-63-0''');
EXEC('UPDATE tb_chemical SET molecular_formula = N''H2O2'',      applicable_regulation = N''GHS'',           ghs_classification = N''Ox. Liq. 1'',         exposure_limit = N''1 ppm'' WHERE cas_number = ''7722-84-1''');

-- Add more chemicals from HTML mockup
EXEC('INSERT INTO tb_chemical (chemical_id, chemical_name_ko, chemical_name_en, cas_number, molecular_formula, hazard_class, applicable_regulation, ghs_classification, exposure_limit, status, storage_location, storage_quantity, unit, max_storage_limit, supplier, department, handler_name, signal_word, hazard_statements, precautionary_statements) VALUES
(''CHEM-2026-009'', N''벤젠'',             ''Benzene'',              ''71-43-2'',   N''C6H6'',    ''CARCINOGENIC'',  N''EU REACH, GHS'',  N''Carc. 1A, Muta. 1B'', N''0.5 ppm'',  ''IN_USE'',      N''A동 화학물질 보관실 1'', 80.00,  ''L'',  150.00,  N''삼성화학'',       N''생산부'',     N''이규정'', N''위험'', N''발암성 물질. 유전적 결함을 일으킬 수 있음.'', N''적절한 개인 보호구를 착용하시오.''),
(''CHEM-2026-010'', N''에탄올'',           ''Ethanol'',              ''64-17-5'',   N''C2H5OH'',  ''FLAMMABLE'',     N''GHS'',            N''Flam. Liq. 2'',       N''1000 ppm'', ''IN_USE'',      N''A동 화학물질 보관실 2'', 800.00, ''L'',  1000.00, N''LG화학'',         N''품질관리부'', N''최희합'', N''위험'', N''고인화성 액체 및 증기.'',                      N''열, 스파크, 화염으로부터 멀리하시오.''),
(''CHEM-2026-011'', N''트리클로로에틸렌'', ''Trichloroethylene'',    ''79-01-6'',   N''C2HCl3'',  ''CARCINOGENIC'',  N''EU REACH'',       N''Carc. 1A'',           N''10 ppm'',   ''PENDING_DISPOSAL'', N''C동 위험물 보관소'', 200.00, ''L'', 300.00, N''에베이코리아'', N''생산부'', N''이규정'', N''위험'', N''발암성 물질. 생식독성 의심.'', N''적절한 개인 보호구를 착용하시오.''),
(''CHEM-2026-012'', N''디클로로메탄'',     ''Dichloromethane'',      ''75-09-2'',   N''CH2Cl2'',  ''CARCINOGENIC'',  N''EU REACH'',       N''Carc. 2'',            N''50 ppm'',   ''PENDING_DISPOSAL'', N''C동 위험물 보관소'', 150.00, ''L'', 250.00, N''에베이코리아'', N''연구개발부'', N''박연구'', N''위험'', N''발암 의심 물질.'',             N''증기를 흡입하지 마시오.'')');

-- ===== ERP Material Dummy Data =====
INSERT INTO tb_erp_material (material_code, material_name, chemical_name, cas_number, supplier, stock_quantity, unit, unit_price, last_incoming_date, status) VALUES
('M-001234', N'아세톤 (1급)',                N'아세톤',             '67-64-1',   N'삼성화학',         1250.00, 'kg', 2800.00, '2026-04-01', 'NORMAL'),
('M-001235', N'에탄올 95%',                  N'에탄올',             '64-17-5',   N'LG화학',           800.00,  'L',  1500.00, '2026-03-28', 'NORMAL'),
('M-001299', N'황산 98%',                    N'황산',               '7664-93-9', N'코스롱인더스트리', 500.00,  'kg', 1200.00, '2026-03-20', 'LOW_STOCK'),
('M-001302', N'톨루엔 (공업용)',             N'톨루엔',             '108-88-3',  N'한화케미칼',       320.00,  'L',  3100.00, '2026-03-15', 'NORMAL'),
('M-001350', N'염산 35%',                    N'염산',               '7647-01-0', N'OCI',              150.00,  'kg', 980.00,  '2026-02-10', 'EXPIRING'),
('M-001388', N'트리클로로에틸렌',            N'트리클로로에틸렌',   '79-01-6',   N'에베이코리아',     200.00,  'L',  8500.00, '2026-01-20', 'RESTRICTED');

-- ===== Vendor Dummy Data =====
INSERT INTO tb_chemical_vendor (vendor_code, vendor_name, representative, contact_person, phone, supply_items_count, msds_status, last_transaction_date, grade) VALUES
('V-0021', N'삼성화학',         N'김철수', N'박민서', '02-1234-5678',  12, 'COMPLETE',   '2026-04-01', 'A'),
('V-0022', N'LG화학',           N'이상호', N'최지성', '02-2345-6789',  8,  'COMPLETE',   '2026-03-28', 'A'),
('V-0035', N'코스롱인더스트리', N'전도현', N'한길동', '031-345-7890',  5,  'PARTIAL',    '2026-03-20', 'B'),
('V-0041', N'한화케미칼',       N'강민준', N'오서빈', '02-4567-8901',  9,  'COMPLETE',   '2026-03-15', 'A'),
('V-0058', N'OCI',              N'윤성호', N'전지훈', '02-5678-9012',  3,  'MISSING',    '2026-02-10', 'C'),
('V-0063', N'에베이코리아',     N'박동희', N'김시한', '031-789-0123',  4,  'COMPLETE',   '2026-01-20', 'B');

-- ===== Regulation Dummy Data =====
INSERT INTO tb_chemical_regulation (reg_code, reg_name, reg_type, authority, applicable_count, last_revision_date, next_review_date, status) VALUES
('REG-001', N'화학물질관리법',                              'DOMESTIC', N'환경부',     312, '2025-01-01', '2026-12-31', 'ACTIVE'),
('REG-002', N'산업안전보건법',                              'DOMESTIC', N'고용노동부', 188, '2024-07-01', '2026-06-30', 'ACTIVE'),
('REG-003', N'EU REACH',                                    'OVERSEAS', N'ECHA',       54,  '2023-09-01', '2025-09-01', 'REVIEW_NEEDED'),
('REG-004', N'EU CLP',                                      'OVERSEAS', N'ECHA',       42,  '2024-03-01', '2026-03-01', 'REVIEW_NEEDED'),
('REG-005', N'TSCA (미국)',                                  'OVERSEAS', N'US EPA',     31,  '2023-06-01', '2025-06-01', 'EXPIRED'),
('REG-006', N'화학물질의 등록 및 평가에 관한 법률',         'DOMESTIC', N'환경부',     95,  '2024-01-01', '2027-01-01', 'ACTIVE');

-- ===== Regulation Check Dummy Data =====
INSERT INTO tb_regulation_check (check_id, check_name, related_regulation, check_type, assignee, due_date, progress, status) VALUES
('CHK-2026-001', N'유해화학물질 취급시설 점검',      N'화학물질관리법',   'REGULAR',  N'김환경', '2026-04-30', 75,  'IN_PROGRESS'),
('CHK-2026-002', N'REACH SVHC 적합성 검토',          N'EU REACH',         'SPECIAL',  N'이규정', '2026-05-15', 30,  'IN_PROGRESS'),
('CHK-2026-003', N'물질안전보건자료 최신화',          N'산업안전보건법',   'REGULAR',  N'박영수', '2026-04-15', 100, 'COMPLETED'),
('CHK-2026-004', N'TSCA 규제 물질 사전검토',          N'TSCA',             'SPECIAL',  N'최희합', '2026-06-01', 0,   'PENDING'),
('CHK-2026-005', N'취급시설 안전진단',                N'화학물질관리법',   'REGULAR',  N'강부식', '2026-03-31', 100, 'COMPLETED');

-- ===== MSDS Dummy Data (Raw - Latest) =====
INSERT INTO tb_msds (msds_type, item_name, cas_number, supplier, version, issue_date, language, file_size, is_latest, change_type, change_summary, registered_by, status) VALUES
('RAW', N'아세톤',     '67-64-1',   N'삼성화학',         'v4.2', '2025-11-01', 'KOR / ENG', '1.2 MB', 1, 'LATEST', N'GHS 7차 개정 반영, 노출기준 업데이트', N'김관리', 'VALID'),
('RAW', N'에탄올 95%', '64-17-5',   N'LG화학',           'v3.1', '2025-09-15', 'KOR / ENG', '980 KB', 1, 'LATEST', N'정기 갱신, ENG 번역 추가',             N'김관리', 'VALID'),
('RAW', N'황산 98%',   '7664-93-9', N'코스롱인더스트리', 'v2.0', '2024-12-01', 'KOR',       '750 KB', 1, 'LATEST', N'공급사 변경',                          N'이성수', 'NEED_UPDATE'),
('RAW', N'톨루엔',     '108-88-3',  N'한화케미칼',       'v5.0', '2026-01-10', 'KOR / ENG', '1.5 MB', 1, 'LATEST', N'REACH 규제 정보 추가',                 N'이규정', 'VALID'),
('RAW', N'염산 35%',   '7647-01-0', N'OCI',              'v1.8', '2025-06-01', 'KOR',       '640 KB', 1, 'LATEST', NULL,                                    N'박관리', 'VALID');

-- MSDS Raw - Old versions
INSERT INTO tb_msds (msds_type, item_name, cas_number, supplier, version, issue_date, retire_date, retire_reason, language, file_size, is_latest, change_type, registered_by, status) VALUES
('RAW', N'아세톤',     '67-64-1',   N'삼성화학',     'v4.1', '2024-03-01', '2025-11-01', N'GHS 7차 개정 반영',  'KOR / ENG', '1.1 MB', 0, 'OLD', N'이성수', 'RETIRED'),
('RAW', N'아세톤',     '67-64-1',   N'삼성화학',     'v4.0', '2023-01-01', '2024-03-01', N'노출기준 변경',      'KOR',       '950 KB', 0, 'OLD', N'이성수', 'RETIRED'),
('RAW', N'에탄올 95%', '64-17-5',   N'LG화학',       'v3.0', '2023-05-01', '2025-09-15', N'정기 갱신',          'KOR',       '920 KB', 0, 'OLD', N'김관리', 'RETIRED'),
('RAW', N'톨루엔',     '108-88-3',  N'한화케미칼',   'v4.1', '2024-06-01', '2026-01-10', N'정기 갱신',          'KOR / ENG', '1.3 MB', 0, 'OLD', N'이규정', 'RETIRED'),
('RAW', N'황산 98%',   '7664-93-9', N'코스롱인더스트리', 'v1.9', '2022-08-01', '2024-12-01', N'공급사 변경', 'KOR', '680 KB', 0, 'OLD', N'박관리', 'RETIRED');

-- MSDS Product
INSERT INTO tb_msds (msds_type, item_name, item_code, version, issue_date, language, export_countries, file_size, is_latest, change_type, change_summary, registered_by, status) VALUES
('PRODUCT', N'세정제 A형',    'PRD-0001', 'v2.1', '2026-01-15', 'KOR / ENG / CHN', N'한국, 중국',   '1.8 MB', 1, 'LATEST', N'수출국 CHN 추가, 중문 번역',       N'이수출', 'VALID'),
('PRODUCT', N'코팅제 B-500',  'PRD-0012', 'v3.0', '2025-10-01', 'KOR / ENG',       N'한국, EU',     '1.4 MB', 1, 'LATEST', N'EU REACH SVHC 규제 정보 반영',    N'김규정', 'VALID'),
('PRODUCT', N'접착제 C형',    'PRD-0025', 'v1.5', '2024-08-01', 'KOR',             N'한국',         '900 KB', 1, 'LATEST', NULL,                               N'박성분', 'NEED_UPDATE'),
('PRODUCT', N'희석제 D-200',  'PRD-0031', 'v2.0', '2025-04-01', 'KOR / ENG',       N'한국, 미국',   '1.1 MB', 1, 'LATEST', NULL,                               N'이수출', 'VALID');

-- MSDS Product - Old
INSERT INTO tb_msds (msds_type, item_name, item_code, version, issue_date, retire_date, retire_reason, language, file_size, is_latest, change_type, registered_by, status) VALUES
('PRODUCT', N'세정제 A형',   'PRD-0001', 'v2.0', '2024-06-01', '2026-01-15', N'성분 비율 변경', 'KOR / ENG', '1.6 MB', 0, 'OLD', N'박성분', 'RETIRED'),
('PRODUCT', N'세정제 A형',   'PRD-0001', 'v1.5', '2023-01-01', '2024-06-01', N'GHS 개정',       'KOR',       '1.2 MB', 0, 'OLD', N'박성분', 'RETIRED'),
('PRODUCT', N'코팅제 B-500', 'PRD-0012', 'v2.9', '2024-02-01', '2025-10-01', N'정기 갱신',      'KOR / ENG', '1.3 MB', 0, 'OLD', N'김규정', 'RETIRED');

-- ===== GHS Dummy Data =====
INSERT INTO tb_chemical_ghs (chemical_name, cas_number, physical_hazard, health_hazard, environmental_hazard, signal_word, ghs_version, status) VALUES
(N'아세톤',             '67-64-1',   N'Flam. Liq. 2',       N'Eye Irrit. 2',                    NULL,               N'위험', 'Rev.9', 'LATEST'),
(N'벤젠',               '71-43-2',   N'Flam. Liq. 2',       N'Carc. 1A, Muta. 1B',              N'Aquatic Chr. 3',  N'위험', 'Rev.9', 'LATEST'),
(N'황산',               '7664-93-9', NULL,                   N'Skin Corr. 1A',                   NULL,               N'위험', 'Rev.8', 'NEED_UPDATE'),
(N'트리클로로에틸렌',   '79-01-6',   N'Flam. Liq. 3',       N'Carc. 1A, Repr. 2',               N'Aquatic Chr. 3',  N'위험', 'Rev.9', 'LATEST'),
(N'에탄올',             '64-17-5',   N'Flam. Liq. 2',       NULL,                                NULL,               N'위험', 'Rev.9', 'LATEST');

-- ===== REACH Dummy Data =====
INSERT INTO tb_chemical_reach (chemical_name, cas_number, registration_no, svhc, authorization_required, restriction_note, registration_date, status) VALUES
(N'벤젠',               '71-43-2', '01-2119447013-50', 'Y', 'Y', N'농도 0.1% 초과 금지',         '2009-12-01', 'REGISTERED'),
(N'트리클로로에틸렌',   '79-01-6', '01-2119471843-32', 'Y', 'Y', N'사용 제한 (허가 필요)',        '2010-06-01', 'NEED_UPDATE'),
(N'톨루엔',             '108-88-3','01-2119471310-51', 'N', 'N', NULL,                            '2010-11-01', 'REGISTERED'),
(N'황산',               '7664-93-9','01-2119458838-20','N', 'N', NULL,                            '2010-12-01', 'REGISTERED'),
(N'디클로로메탄',       '75-09-2', '01-2119480404-36', 'Y', 'Y', N'산업용 사용 제한',             '2011-03-01', 'UNDER_REVIEW');

-- ===== CLP Dummy Data =====
INSERT INTO tb_chemical_clp (chemical_name, cas_number, clp_classification, signal_word, h_codes, p_codes, last_updated, status) VALUES
(N'황산',     '7664-93-9', N'Skin Corr. 1A',                  N'Danger', 'H290, H314',                 'P234, P260, P301', '2025-03-01', 'LATEST'),
(N'염산',     '7647-01-0', N'Skin Corr. 1B',                  N'Danger', 'H335, H290, H314',           'P234, P260',       '2024-11-01', 'LATEST'),
(N'벤젠',     '71-43-2',   N'Carc. 1A',                       N'Danger', 'H225, H304, H340, H350',     'P201, P210',       '2025-01-01', 'LATEST'),
(N'아세톤',   '67-64-1',   N'Flam. Liq. 2, Eye Irrit. 2',    N'Danger', 'H225, H319, H336',           'P210, P261',       '2025-06-01', 'LATEST');

-- ===== TSCA Dummy Data =====
INSERT INTO tb_chemical_tsca (chemical_name, cas_number, inventory_status, regulation_section, reporting_duty, export_to_us, pmn_required, status) VALUES
(N'벤젠',               '71-43-2',  'LISTED',   'Section 6',  N'연간 보고',     N'미국 수출', 'N', 'COMPLIANT'),
(N'트리클로로에틸렌',   '79-01-6',  'LISTED',   'Section 6',  N'연간 보고',     N'미국 수출', 'N', 'UNDER_REVIEW'),
(N'톨루엔',             '108-88-3', 'LISTED',   NULL,          N'불필요',        N'미수출',    'N', 'COMPLIANT'),
(N'신규물질 A',         NULL,       'UNLISTED', 'Section 5',  N'PMN 제출 필요', N'미국 수출 예정', 'Y', 'ACTION_NEEDED');

-- ===== Warehouse Dummy Data =====
INSERT INTO tb_chemical_warehouse (warehouse_code, warehouse_name, storage_type, location, stored_items_count, total_stock, temperature, humidity, status) VALUES
('WH-01', N'일반화학품 창고 A', 'GENERAL',   N'공장동 1층',   24, N'3,200 kg', N'20C', '45%', 'NORMAL'),
('WH-02', N'인화성액체 보관실', 'HAZARDOUS', N'옥외 격리동',  8,  N'1,500 L',  N'18C', '40%', 'NORMAL'),
('WH-03', N'산/알칼리 보관실',  'CORROSIVE', N'공장동 지하',   5,  N'800 kg',   N'22C', '50%', 'INSPECTION_NEEDED'),
('WH-04', N'특수화학물질 보관실','TOXIC',     N'격리동 B',     12, N'450 kg',   N'15C', '35%', 'NORMAL'),
('WH-05', N'일반화학품 창고 B', 'GENERAL',   N'공장동 2층',   18, N'2,100 kg', N'21C', '48%', 'NORMAL');

-- ===== Incoming Dummy Data =====
INSERT INTO tb_chemical_incoming (incoming_date, incoming_no, chemical_name, supplier, quantity, unit, warehouse_code, handler, msds_confirmed) VALUES
('2026-04-05', 'IN-2026-0042', N'에탄올 95%', N'LG화학',           200.00, 'L',  'WH-01', N'이수령', 1),
('2026-04-04', 'IN-2026-0041', N'아세톤',     N'삼성화학',         500.00, 'kg', 'WH-02', N'김입고', 1),
('2026-04-02', 'IN-2026-0039', N'황산 98%',   N'코스롱인더스트리', 100.00, 'kg', 'WH-03', N'박확인', 0),
('2026-04-01', 'IN-2026-0038', N'톨루엔',     N'한화케미칼',       150.00, 'L',  'WH-02', N'강동장', 1);

-- ===== Usage Dummy Data =====
INSERT INTO tb_chemical_usage (usage_date, chemical_name, department, purpose, usage_quantity, unit, handler, remaining_stock) VALUES
('2026-04-05', N'아세톤',     N'생산1팀',     N'세정',   50.00,  'kg', N'오현장', N'1,200 kg'),
('2026-04-05', N'에탄올 95%', N'품질관리팀',  N'분석',   10.00,  'L',  N'한부석', N'790 L'),
('2026-04-04', N'톨루엔',     N'생산2팀',     N'도장',   30.00,  'L',  N'강동장', N'290 L'),
('2026-04-03', N'황산 98%',   N'코팅처리실',  N'실험',   20.00,  'kg', N'박확인', N'480 kg');

-- ===== Lot Tracking Dummy Data =====
INSERT INTO tb_chemical_lot_tracking (lot_number, chemical_name, incoming_date, incoming_quantity, current_location, used_quantity, remaining_quantity, elapsed_days, status) VALUES
('LOT-2026-0041', N'아세톤',     '2026-04-04', N'500 kg', 'WH-02',              N'50 kg',  N'450 kg', 2,   'STORED'),
('LOT-2026-0039', N'황산 98%',   '2026-04-02', N'100 kg', 'WH-03',              N'0 kg',   N'100 kg', 4,   'INSPECTION_PENDING'),
('LOT-2026-0031', N'톨루엔',     '2026-03-15', N'350 L',  N'WH-02, 생산2팀',    N'60 L',   N'290 L',  22,  'IN_USE'),
('LOT-2026-0012', N'에탄올 95%', '2026-01-10', N'400 L',  N'품질관리팀',         N'380 L',  N'20 L',   86,  'EXPIRING_SOON'),
('LOT-2025-0912', N'에탄올 95%', '2025-10-01', N'500 L',  NULL,                  N'500 L',  N'0 L',    187, 'CONSUMED');

-- ===== Usage Report Dummy Data =====
INSERT INTO tb_chemical_usage_report (report_year, chemical_name, cas_number, annual_usage, unit, usage_purpose, report_deadline, submit_date, status) VALUES
(2025, N'아세톤',     '67-64-1',   15200.00, 'kg', N'세정',       '2026-03-31', '2026-03-15', 'SUBMITTED'),
(2025, N'에탄올 95%', '64-17-5',   8500.00,  'L',  N'분석/세정',  '2026-03-31', '2026-03-15', 'SUBMITTED'),
(2025, N'톨루엔',     '108-88-3',  6300.00,  'L',  N'도장',       '2026-03-31', '2026-03-15', 'SUBMITTED'),
(2026, N'아세톤',     '67-64-1',   3800.00,  'kg', N'세정',       '2027-03-31', NULL,         'COLLECTING'),
(2026, N'에탄올 95%', '64-17-5',   1200.00,  'L',  N'분석',       '2027-03-31', NULL,         'COLLECTING');

-- ===== Hazard Report Dummy Data =====
INSERT INTO tb_chemical_hazard_report (report_year, chemical_name, cas_number, hazard_class, annual_handling, handling_facility, report_deadline, submit_date, status) VALUES
(2025, N'벤젠',               '71-43-2', N'발암성 1A', N'1,200 kg', N'생산동 A', '2026-03-31', '2026-03-15', 'SUBMITTED'),
(2025, N'트리클로로에틸렌',   '79-01-6', N'발암성 1A', N'850 L',    N'세정동',   '2026-03-31', '2026-03-15', 'SUBMITTED'),
(2025, N'황산',               '7664-93-9',N'부식성',   N'2,400 kg', N'코팅처리실','2026-03-31', '2026-03-15', 'SUBMITTED'),
(2025, N'염산',               '7647-01-0',N'부식성',   N'1,800 kg', N'코팅처리실','2026-03-31', '2026-03-15', 'SUBMITTED'),
(2026, N'벤젠',               '71-43-2', N'발암성 1A', N'280 kg',   N'생산동 A', '2027-03-31', NULL,         'COLLECTING'),
(2026, N'트리클로로에틸렌',   '79-01-6', N'발암성 1A', N'120 L',    N'세정동',   '2027-03-31', NULL,         'COLLECTING');

-- ===== Add CHEMICAL approval type code =====
DECLARE @approvalTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'APPROVAL_TYPE');
IF @approvalTypeId IS NOT NULL AND NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @approvalTypeId AND code = 'CHEMICAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES (@approvalTypeId, 'CHEMICAL', 'CHEMICAL', N'화학물질', 'Chemical', N'化学品', 1, 10, GETDATE(), GETDATE());
END;

-- ===== Chemical Approval Dummy Data =====
INSERT INTO tb_approval (approval_id, type, title, content, applicant_name, applicant_dept, applicant_email, request_date, status, approver_name, approval_date, created_at, modified_at) VALUES
('APR-2026-050', 'CHEMICAL', N'신규 화학물질 등록 요청 - 벤젠', N'CAS 71-43-2 벤젠 신규 등록 요청입니다. MSDS 첨부.', N'이규정', N'생산부', 'lee@com4in.com', '2026-04-01', 'APPROVED', N'김부장', '2026-04-03', GETDATE(), GETDATE()),
('APR-2026-051', 'CHEMICAL', N'유해화학물질 사용제한 해제 요청', N'트리클로로에틸렌 사용제한 해제를 요청합니다.', N'박연구', N'연구개발부', 'park@com4in.com', '2026-04-02', 'PENDING', NULL, NULL, GETDATE(), GETDATE()),
('APR-2026-052', 'CHEMICAL', N'MSDS 갱신 승인 요청 - 황산', N'황산 98% MSDS v2.1 갱신 승인 요청입니다.', N'김관리', N'품질관리부', 'kim@com4in.com', '2026-04-04', 'PENDING', NULL, NULL, GETDATE(), GETDATE()),
('APR-2026-053', 'CHEMICAL', N'화학물질 폐기 승인 요청', N'과산화수소 유효기한 초과 폐기 승인 요청입니다.', N'정관리', N'시설관리부', 'jung@com4in.com', '2026-04-05', 'REJECTED', N'김부장', '2026-04-05', GETDATE(), GETDATE());
