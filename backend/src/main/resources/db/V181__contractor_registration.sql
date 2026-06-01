-- V181: 협력 업체 등록 — 신규 등록 모듈
--   기존 협력업체관리 메뉴 하위에 5단계 위저드(기본정보/안전보건/담당자/계약·서류/확인) 폼으로
--   협력 업체 등록정보를 받는 마스터 테이블 신설.
--   첨부 서류는 기존 tb_file(entity_type='contractor_registration') 으로 연결.

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_contractor_registration', 'U') IS NULL
BEGIN
    CREATE TABLE tb_contractor_registration (
        id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
        reg_no                  NVARCHAR(40)   NOT NULL,    -- EHS-2026-1234

        -- Step1 사업자 기본
        biz_num                 NVARCHAR(20)   NOT NULL,    -- 사업자등록번호 (000-00-00000)
        corp_num                NVARCHAR(20)   NULL,        -- 법인등록번호
        company_name            NVARCHAR(200)  NOT NULL,
        ceo_name                NVARCHAR(100)  NOT NULL,
        biz_type                NVARCHAR(50)   NULL,        -- 건설업/제조업/...
        biz_category            NVARCHAR(100)  NULL,        -- 업태

        zip_code                NVARCHAR(10)   NULL,
        addr1                   NVARCHAR(255)  NULL,
        addr2                   NVARCHAR(255)  NULL,

        tel                     NVARCHAR(30)   NULL,
        fax                     NVARCHAR(30)   NULL,
        email                   NVARCHAR(150)  NULL,
        homepage                NVARCHAR(255)  NULL,
        emp_size                NVARCHAR(30)   NULL,        -- 5인 미만 / 5~49인 / 50~299인 / 300인 이상

        -- Step2 안전보건
        osh_apply               NVARCHAR(20)   NULL,        -- 해당/비해당
        safety_mgr_status       NVARCHAR(20)   NULL,        -- 선임/미선임/위탁
        health_mgr_status       NVARCHAR(20)   NULL,        -- 선임/미선임/위탁
        acc_rate                DECIMAL(5,2)   NULL,        -- 전년도 산업재해율 %
        certifications          NVARCHAR(255)  NULL,        -- 콤마분리: ISO45001,KOSHA-MS,...
        risk_eval               NVARCHAR(20)   NULL,        -- 실시/미실시
        risk_eval_date          DATE           NULL,
        hazard_factors          NVARCHAR(500)  NULL,        -- 콤마분리: 화학물질,고소작업,...
        safety_rating           SMALLINT       NULL,        -- 0~5 (안전관리 수준)
        env_rating              SMALLINT       NULL,        -- 0~5 (환경관리 수준)
        reg_status              NVARCHAR(20)   NOT NULL CONSTRAINT DF_contractor_registration_status DEFAULT 'REVIEW',  -- APPROVED/REVIEW/HOLD

        -- Step3 담당자 (협력업체 안전담당자)
        safety_mgr_name         NVARCHAR(100)  NULL,
        safety_mgr_position     NVARCHAR(100)  NULL,
        safety_mgr_dept         NVARCHAR(100)  NULL,
        safety_mgr_tel          NVARCHAR(30)   NULL,
        safety_mgr_office_tel   NVARCHAR(30)   NULL,
        safety_mgr_email        NVARCHAR(150)  NULL,
        -- 보건담당자
        health_mgr_name         NVARCHAR(100)  NULL,
        health_mgr_position     NVARCHAR(100)  NULL,
        health_mgr_cert         NVARCHAR(200)  NULL,
        health_mgr_tel          NVARCHAR(30)   NULL,
        health_mgr_email        NVARCHAR(150)  NULL,
        -- 당사 내부 담당자
        internal_dept           NVARCHAR(100)  NULL,
        internal_name           NVARCHAR(100)  NULL,
        internal_tel            NVARCHAR(30)   NULL,
        memo                    NVARCHAR(MAX)  NULL,

        -- Step4 계약
        contract_start          DATE           NULL,
        contract_end            DATE           NULL,
        contract_type           NVARCHAR(30)   NULL,        -- 도급/용역/구매/파견/기타
        contract_amount         DECIMAL(15,2)  NULL,
        work_zone               NVARCHAR(200)  NULL,

        deleted                 BIT            NOT NULL CONSTRAINT DF_contractor_registration_deleted DEFAULT 0,
        created_at              DATETIME2      NOT NULL CONSTRAINT DF_contractor_registration_created DEFAULT GETDATE(),
        modified_at             DATETIME2      NOT NULL CONSTRAINT DF_contractor_registration_modified DEFAULT GETDATE(),
        modified_by             NVARCHAR(100)  NULL,
        CONSTRAINT UQ_contractor_registration_reg_no UNIQUE (reg_no)
    );

    CREATE INDEX IX_contractor_registration_company_name ON tb_contractor_registration(company_name);
    CREATE INDEX IX_contractor_registration_biz_num ON tb_contractor_registration(biz_num);
    CREATE INDEX IX_contractor_registration_reg_status ON tb_contractor_registration(reg_status);
END;
GO

-- ─────────────────────────────────────────────
-- 더미 데이터 6건
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM tb_contractor_registration)
BEGIN
    INSERT INTO tb_contractor_registration (
        reg_no, biz_num, corp_num, company_name, ceo_name, biz_type, biz_category,
        zip_code, addr1, addr2, tel, fax, email, homepage, emp_size,
        osh_apply, safety_mgr_status, health_mgr_status, acc_rate, certifications,
        risk_eval, risk_eval_date, hazard_factors, safety_rating, env_rating, reg_status,
        safety_mgr_name, safety_mgr_position, safety_mgr_dept, safety_mgr_tel, safety_mgr_office_tel, safety_mgr_email,
        health_mgr_name, health_mgr_position, health_mgr_cert, health_mgr_tel, health_mgr_email,
        internal_dept, internal_name, internal_tel, memo,
        contract_start, contract_end, contract_type, contract_amount, work_zone,
        modified_by, created_at, modified_at
    ) VALUES
    ('EHS-2026-1001', '123-45-67890', '110111-1234567', N'㈜우림안전기술', N'홍기범', N'건설업', N'도급',
     '07338', N'서울특별시 영등포구 여의도동 12-34', N'우림빌딩 5층', '02-555-1234', '02-555-1235', 'info@woorim-safety.co.kr', 'https://www.woorim-safety.co.kr', N'50~299인',
     N'해당', N'선임', N'위탁', 0.42, N'ISO45001,KOSHA-MS,ISO14001',
     N'실시', '2026-02-15', N'고소작업,중량물 취급,전기', 5, 4, 'APPROVED',
     N'박정훈', N'안전관리자', N'안전팀', '010-2233-4455', '02-555-1240', 'jh.park@woorim-safety.co.kr',
     N'김보영', N'보건관리자', N'간호사', '010-3344-5566', 'by.kim@woorim-safety.co.kr',
     N'안전보건팀', N'이담당', '010-1111-2222', N'주요 시공사 협력, 최근 3년 무재해.',
     '2026-01-01', '2026-12-31', N'도급', 850000000, N'제1공장 전기설비',
     'admin', '2026-04-10 09:00:00', '2026-04-10 09:00:00'),

    ('EHS-2026-1002', '234-56-78901', '110111-2345678', N'㈜그린화학솔루션', N'서민호', N'화학·환경', N'용역',
     '14118', N'경기도 안양시 동안구 시민대로 230', N'그린타워 8층', '031-444-2233', '031-444-2234', 'office@greenchem.kr', 'https://greenchem.kr', N'5~49인',
     N'해당', N'위탁', N'미선임', 1.18, N'ISO14001',
     N'실시', '2026-01-20', N'화학물질,폭발·화재,분진', 3, 4, 'REVIEW',
     N'임승현', N'안전과장', N'EHS팀', '010-7788-9911', '031-444-2240', 'sh.lim@greenchem.kr',
     N'-', N'-', N'-', '-', '-',
     N'환경팀', N'박환경', '010-3333-4444', N'유해화학물질 운반·관리. 매월 정기점검 필요.',
     '2026-03-01', '2027-02-28', N'용역', 220000000, N'폐수처리장',
     'admin', '2026-04-15 11:30:00', '2026-04-15 11:30:00'),

    ('EHS-2026-1003', '345-67-89012', '110111-3456789', N'한빛전기공사㈜', N'정재현', N'전기·통신', N'도급',
     '21999', N'인천광역시 남동구 논현동 480-12', N'-', '032-777-8899', '032-777-8800', 'mail@hanbit-elec.co.kr', '', N'5인 미만',
     N'해당', N'미선임', N'미선임', 2.34, N'',
     N'미실시', NULL, N'전기,고소작업', 2, 2, 'HOLD',
     N'-', N'-', N'-', '-', '-', '-',
     N'-', N'-', N'-', '-', '-',
     N'구매팀', N'최구매', '010-9988-7766', N'위험성평가 미실시 — 등록 보류. 보완 요청 발송함.',
     NULL, NULL, N'기타', NULL, N'-',
     'admin', '2026-04-18 14:20:00', '2026-04-18 14:20:00'),

    ('EHS-2026-1004', '456-78-90123', '110111-4567890', N'동방물류㈜', N'장보영', N'운반·물류', N'용역',
     '46241', N'부산광역시 강서구 녹산산단 261로 30', N'4동', '051-222-3344', '051-222-3345', 'admin@dongbang.kr', 'https://dongbang.kr', N'50~299인',
     N'해당', N'선임', N'선임', 0.65, N'ISO45001,ISO9001',
     N'실시', '2026-02-28', N'중량물 취급,소음·진동', 4, 3, 'APPROVED',
     N'노유안', N'안전팀장', N'안전보건팀', '010-5566-7788', '051-222-3350', 'ya.noh@dongbang.kr',
     N'서원빈', N'보건관리자', N'산업위생관리사', '010-6677-8899', 'wb.seo@dongbang.kr',
     N'생산팀', N'정생산', '010-2222-3333', N'사내 운송 협력. 차량 정기점검 보고서 매월 제출.',
     '2026-02-01', '2027-01-31', N'용역', 540000000, N'전 공장 운송',
     'admin', '2026-04-20 16:10:00', '2026-04-20 16:10:00'),

    ('EHS-2026-1005', '567-89-01234', '110111-5678901', N'정밀기계공업㈜', N'이산', N'기계·설비', N'도급',
     '13486', N'경기도 성남시 분당구 판교로 256', N'B동 3층', '031-888-9988', '031-888-9989', 'sales@jungmilki.co.kr', 'https://jungmilki.co.kr', N'300인 이상',
     N'해당', N'선임', N'선임', 0.28, N'ISO45001,KOSHA-MS,ISO14001,ISO9001',
     N'실시', '2026-03-10', N'기계,중량물 취급,소음·진동', 5, 5, 'APPROVED',
     N'백도연', N'안전이사', N'EHS본부', '010-1010-2020', '031-888-9990', 'dy.baek@jungmilki.co.kr',
     N'염서진', N'보건관리자', N'간호사,산업위생관리사', '010-2020-3030', 'sj.yeom@jungmilki.co.kr',
     N'생산팀', N'한생산', '010-7777-8888', N'장기 거래처. 안전관리 우수업체.',
     '2025-12-01', '2027-11-30', N'도급', 2300000000, N'제2공장 설비공사',
     'admin', '2026-04-25 10:00:00', '2026-04-25 10:00:00'),

    ('EHS-2026-1006', '678-90-12345', NULL, N'클린워시', N'심단비', N'청소·위생', N'용역',
     '07736', N'서울특별시 강서구 마곡중앙로 80', N'-', '02-333-4455', NULL, 'cs@cleanwash.kr', '', N'5인 미만',
     N'비해당', N'미선임', N'미선임', 0.00, N'',
     N'실시', '2026-04-01', N'분진', 3, 2, 'REVIEW',
     N'심단비', N'대표', N'-', '010-4444-5555', '-', 'cs@cleanwash.kr',
     N'-', N'-', N'-', '-', '-',
     N'안전보건팀', N'이담당', '010-1111-2222', N'사옥 청소용역, 소규모 신규 협력업체.',
     '2026-05-01', '2026-10-31', N'용역', 36000000, N'본관 사옥',
     'admin', '2026-04-28 09:30:00', '2026-04-28 09:30:00');
END;
GO
