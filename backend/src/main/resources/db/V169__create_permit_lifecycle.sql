-- ============================================================
-- V169: 인허가 라이프사이클 관리 (7-Stage Permit Lifecycle)
-- 1)식별·등록 2)대장 3)갱신 4)변경관리(MOC) 5)자체점검 6)보고·신고 7)증빙·기록
-- ============================================================

-- ===== Table 1: tb_permit_identification (식별·등록) =====
IF OBJECT_ID('tb_permit_identification', 'U') IS NULL
BEGIN
    CREATE TABLE tb_permit_identification (
        id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
        equipment_name          NVARCHAR(300)  NOT NULL,
        equipment_type          NVARCHAR(300),
        location                NVARCHAR(300),
        install_date            DATE,
        applicable_categories   NVARCHAR(500),
        applicable_permits      NVARCHAR(1000),
        status                  NVARCHAR(30)   NOT NULL DEFAULT N'검토중',
        assessor                NVARCHAR(200),
        assessment_date         DATE,
        linked_permits          NVARCHAR(1000),
        notes                   NVARCHAR(MAX),
        deleted                 BIT            NOT NULL DEFAULT 0,
        created_at              DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at             DATETIME2      NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ===== Table 2: tb_permit_registry (대장) =====
IF OBJECT_ID('tb_permit_registry', 'U') IS NULL
BEGIN
    CREATE TABLE tb_permit_registry (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        category        NVARCHAR(30)   NOT NULL,
        permit_type     NVARCHAR(200),
        name            NVARCHAR(500)  NOT NULL,
        law             NVARCHAR(300),
        agency          NVARCHAR(300),
        permit_number   NVARCHAR(200),
        issued_date     DATE,
        expiry_date     DATE,
        cycle           NVARCHAR(100),
        facility        NVARCHAR(500),
        location        NVARCHAR(300),
        manager         NVARCHAR(200),
        notes           NVARCHAR(MAX),
        deleted         BIT            NOT NULL DEFAULT 0,
        created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at     DATETIME2      NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX ix_preg_expiry ON tb_permit_registry(expiry_date);
END;
GO

-- ===== Table 3: tb_permit_renewal (갱신) =====
IF OBJECT_ID('tb_permit_renewal', 'U') IS NULL
BEGIN
    CREATE TABLE tb_permit_renewal (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        permit_name     NVARCHAR(500)  NOT NULL,
        category        NVARCHAR(30),
        stage           NVARCHAR(30)   NOT NULL DEFAULT N'검토',
        current_expiry  DATE,
        target_date     DATE,
        start_date      DATE,
        assignee        NVARCHAR(200),
        next_action     NVARCHAR(500),
        due_date        DATE,
        notes           NVARCHAR(MAX),
        deleted         BIT            NOT NULL DEFAULT 0,
        created_at      DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at     DATETIME2      NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ===== Table 4: tb_permit_change (변경관리 MOC) =====
IF OBJECT_ID('tb_permit_change', 'U') IS NULL
BEGIN
    CREATE TABLE tb_permit_change (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        change_type         NVARCHAR(50)   NOT NULL,
        title               NVARCHAR(500)  NOT NULL,
        description         NVARCHAR(MAX),
        request_date        DATE,
        planned_date        DATE,
        initiator           NVARCHAR(200),
        approver            NVARCHAR(200),
        impact_assessment   NVARCHAR(50),
        status              NVARCHAR(50)   NOT NULL DEFAULT N'검토중',
        affected_permits    NVARCHAR(1000),
        notes               NVARCHAR(MAX),
        deleted             BIT            NOT NULL DEFAULT 0,
        created_at          DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME2      NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ===== Table 5: tb_permit_inspection (자체점검) =====
IF OBJECT_ID('tb_permit_inspection', 'U') IS NULL
BEGIN
    CREATE TABLE tb_permit_inspection (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        inspection_name     NVARCHAR(500)  NOT NULL,
        inspection_type     NVARCHAR(50),
        frequency           NVARCHAR(20)   NOT NULL,
        target_facility     NVARCHAR(500),
        legal_basis         NVARCHAR(500),
        last_date           DATE,
        next_date           DATE           NOT NULL,
        assignee            NVARCHAR(200),
        last_result         NVARCHAR(50),
        notes               NVARCHAR(MAX),
        deleted             BIT            NOT NULL DEFAULT 0,
        created_at          DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME2      NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX ix_pins_next ON tb_permit_inspection(next_date);
END;
GO

-- ===== Table 6: tb_permit_reporting (보고·신고) =====
IF OBJECT_ID('tb_permit_reporting', 'U') IS NULL
BEGIN
    CREATE TABLE tb_permit_reporting (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        report_name         NVARCHAR(500)  NOT NULL,
        report_type         NVARCHAR(50),
        regulatory_body     NVARCHAR(300),
        legal_basis         NVARCHAR(300),
        frequency           NVARCHAR(20),
        last_submission     DATE,
        next_deadline       DATE,
        assignee            NVARCHAR(200),
        status              NVARCHAR(30)   NOT NULL DEFAULT N'준비중',
        notes               NVARCHAR(MAX),
        deleted             BIT            NOT NULL DEFAULT 0,
        created_at          DATETIME2      NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME2      NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX ix_prep_deadline ON tb_permit_reporting(next_deadline);
END;
GO

-- ===== Table 7: tb_permit_document (증빙·기록) =====
IF OBJECT_ID('tb_permit_document', 'U') IS NULL
BEGIN
    CREATE TABLE tb_permit_document (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        doc_name            NVARCHAR(500)  NOT NULL,
        doc_type            NVARCHAR(50)   NOT NULL,
        category            NVARCHAR(30),
        related_permit      NVARCHAR(200),
        issue_date          DATE           NOT NULL,
        retention_years     INT            NOT NULL DEFAULT 5,
        file_location       NVARCHAR(500),
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

-- (1) Identification
IF NOT EXISTS (SELECT 1 FROM tb_permit_identification)
BEGIN
    INSERT INTO tb_permit_identification (equipment_name, equipment_type, location, install_date, applicable_categories, applicable_permits, status, assessor, assessment_date, linked_permits, notes) VALUES
    (N'도장부스 #1',              N'대기오염물질 발생시설',   N'1공장 B동 2층', '2022-08-15', N'환경,화학',          N'대기배출시설,유해화학물질영업',                 N'식별완료', N'환경팀 박과장',  '2022-09-01', N'대기배출시설 설치허가(2024-대기-00123)',          N'VOC 발생시설로 활성탄 흡착시설 부속.'),
    (N'폐수처리장 (집수조~방류조)', N'폐수배출시설',           N'2공장 외부',     '2020-05-10', N'환경',                N'폐수배출시설',                                  N'식별완료', N'환경팀 박과장',  '2020-06-15', N'폐수배출시설 설치신고(2023-폐수-00078)',           N'5종 사업장. 자가측정 월 1회.'),
    (N'보일러 #1 (10ton/h)',      N'압력용기 / 대기배출시설', N'유틸리티동',     '2019-03-20', N'환경,안전,소방',      N'대기배출시설,안전검사,위험물제조소',            N'식별완료', N'시설팀 한과장',  '2019-04-01', N'안전검사(2024-B-0012), 위험물 옥내저장소 허가',    N'경유 5,000L × 5기 옥내저장소 연계.'),
    (N'제품 야적장 A·B',          N'비산먼지 발생시설',       N'제3공장 외곽',   '2023-04-15', N'환경',                N'비산먼지',                                     N'식별완료', N'환경팀 박과장',  '2024-05-08', N'비산먼지 발생사업 신고(2024-비산-0045)',          N'살수시설 1일 2회. 풍속 8m/s 이상 시 방진막.'),
    (N'톨루엔 저장탱크 2t',       N'유해화학물질 저장시설',   N'화학물질 보관소', '2023-02-10', N'화학,소방,안전',     N'유해화학물질영업,위험물제조소,PSM',             N'식별완료', N'안전관리팀 정차장','2023-03-01', N'유독물질 사용업 허가(CCMS-2023-S-0145)',          N'취급시설 정기검사 연 1회.'),
    (N'공조기·송풍기 (옥상)',     N'소음·진동 배출시설',     N'본관 옥상',      '2018-09-05', N'환경',                N'소음진동시설',                                  N'식별완료', N'환경팀 박과장',  '2023-11-15', N'소음·진동 배출시설 신고(2023-소음-0067)',         N'야간 22시~06시 가동 제한.'),
    (N'신규 압축기 (2026.04 도입)', N'공기압축설비',           N'3공장 신축동',   '2026-04-20', N'안전',                N'안전검사',                                     N'검토중',  N'시설팀 한과장',  '2026-05-01', N'-',                                              N'안전검사 대상 여부 검토 중. 압력 7bar 이상이면 대상.'),
    (N'IPA 세척조 (신규 검토)',   N'유기용제 사용시설',       N'1공장 검토 중',  '2026-06-01', N'보건,화학,환경',     N'대기배출시설,작업환경측정,유해화학물질영업',    N'검토중',  N'안전보건팀 김주임','2026-05-15', N'-',                                              N'연간 사용량 검토 후 인허가 대상 판정.'),
    (N'제5공장 신축동 (계획)',    N'건축물',                 N'신축 부지',       '2026-12-31', N'건축,환경,안전,소방', N'건축물사용승인,대기배출시설,소방시설,전기안전관리자', N'미식별', N'-',           NULL,         N'-',                                              N'신축 계획 단계. 인허가 종합 검토 필요.');
END;
GO

-- (2) Registry
IF NOT EXISTS (SELECT 1 FROM tb_permit_registry)
BEGIN
    INSERT INTO tb_permit_registry (category, permit_type, name, law, agency, permit_number, issued_date, expiry_date, cycle, facility, location, manager, notes) VALUES
    (N'환경', N'대기배출시설 설치허가',  N'1공장 도장공정 대기배출시설', N'대기환경보전법 제23조',  N'○○시청 환경정책과', N'2024-대기-00123', '2024-03-15', '2029-03-14', N'5년',  N'도장부스 #1~3',                  N'1공장 B동 2층', N'환경팀 박과장',   N'활성탄 흡착시설 6개월 교체.'),
    (N'환경', N'폐수배출시설 설치신고',  N'폐수처리시설 (5종)',         N'물환경보전법 제33조',   N'○○시청',           N'2023-폐수-00078', '2023-08-20', NULL,         N'없음', N'폐수처리장',                      N'2공장 외부',     N'환경팀 박과장',   N'방류수 월 1회 측정.'),
    (N'환경', N'비산먼지 발생사업 신고', N'제품 야적장 비산먼지 신고',   N'대기환경보전법 제43조', N'○○구청',           N'2024-비산-0045',  '2024-05-10', NULL,         N'없음', N'야적장 A, B',                     N'제3공장',        N'환경팀 박과장',   N''),
    (N'환경', N'온실가스 배출권',        N'온실가스 배출권 할당대상',     N'배출권거래법 제8조',    N'환경부',             N'GHG-2024-K0789',  '2024-01-01', '2026-06-30', N'1년',  N'전사',                            N'본사',           N'환경팀 최팀장',   N'연 1회 명세서 제출.'),
    (N'안전', N'유해위험방지계획서',    N'도장설비 유해위험방지계획서',  N'산안법 제42조',         N'안전보건공단',       N'2024-유해-00345', '2024-02-10', '2026-08-09', N'6개월확인', N'도장공정',                 N'1공장 B동',      N'안전관리팀 정차장', N'6개월마다 공단 확인.'),
    (N'안전', N'공정안전보고서 (PSM)',  N'화학공정 PSM 보고서',         N'산안법 제44조',         N'안전보건공단',       N'PSM-2022-0034',   '2022-06-15', '2026-06-14', N'4년',  N'반응기 R-101',                   N'화학공장 A동',   N'안전관리팀 정차장', N'P등급 유지.'),
    (N'안전', N'안전검사 (보일러)',     N'보일러 안전검사',             N'산안법 제93조',         N'안전보건공단',       N'안검-2024-B-0012','2024-04-20', '2026-04-19', N'2년',  N'보일러 #1',                       N'유틸리티동',     N'시설팀 한과장',   N''),
    (N'안전', N'안전검사 (크레인)',     N'천장크레인 안전검사',         N'산안법 제93조',         N'안전보건공단',       N'안검-2024-C-0089','2024-07-08', '2026-07-07', N'2년',  N'천장크레인 #2',                  N'2공장',          N'시설팀 한과장',   N''),
    (N'보건', N'작업환경측정 결과보고', N'상반기 작업환경측정',         N'산안법 제125조',        N'지방고용노동청',     N'2024-측정-상반기','2024-04-15', '2026-10-14', N'6개월', N'38개 단위작업장소',             N'전사',           N'안전보건팀 김주임',N'소음 1개소 초과·개선완료.'),
    (N'보건', N'특수건강진단 (소음)',   N'소음 노출자 특수건강진단',     N'산안법 제130조',        N'특건기관',           N'2024-특건-소음',  '2024-05-20', '2026-05-19', N'1년',  N'85dB 작업자 47명',              N'2·3공장',        N'안전보건팀 김주임',N'C1 3명 사후관리.'),
    (N'소방', N'소방안전관리자 선임',   N'소방안전관리자 선임 신고',     N'화재예방법 제24조',     N'○○소방서',         N'소안관-2023-0567','2023-04-12', NULL,         N'수시', N'특정소방대상물',                N'본관 외 4개동',  N'시설팀 한과장',   N'1급 자격. 연 8h 보수교육.'),
    (N'소방', N'위험물 옥내저장소 허가', N'경유 옥내저장소 (지정수량 50배)', N'위험물안전관리법 제6조', N'○○소방서',      N'위제-2021-0078',  '2021-12-20', NULL,         N'정기점검', N'경유 5,000L × 5기',         N'유틸리티동',     N'시설팀 한과장',   N'정기점검 연 1회.'),
    (N'화학', N'유해화학물질 영업허가', N'유독물질 사용업 허가',          N'화관법 제28조',         N'화학물질안전원',     N'CCMS-2023-S-0145','2023-03-08', '2028-03-07', N'5년',  N'톨루엔 2t, MEK 1t',             N'화학물질 보관소', N'안전관리팀 정차장',N'정기검사 연 1회.'),
    (N'건축', N'건축물 사용승인',       N'제3공장 사용승인',             N'건축법 제22조',         N'○○시청',           N'사용-2023-1234',  '2023-06-30', NULL,         N'정기점검', N'제3공장 3,200㎡',           N'제3공장',        N'시설팀 한과장',   N'정기점검 3년.'),
    (N'건축', N'전기안전관리자 선임',   N'전기안전관리자 선임 신고',     N'전기안전관리법 제22조',  N'전기안전공사',       N'전안-2023-K-0345','2023-09-01', NULL,         N'수시', N'수전설비 2,500kVA × 2',        N'전기실',         N'시설팀 한과장',   N'월 1회 정기점검.');
END;
GO

-- (3) Renewal
IF NOT EXISTS (SELECT 1 FROM tb_permit_renewal)
BEGIN
    INSERT INTO tb_permit_renewal (permit_name, category, stage, current_expiry, target_date, start_date, assignee, next_action, due_date, notes) VALUES
    (N'공정안전보고서 (PSM) 갱신',     N'안전', N'심사중',    '2026-06-14', '2026-06-01', '2025-09-01', N'안전관리팀 정차장', N'안전보건공단 보완자료 제출',          '2026-06-05', N'12개 요소 자료 보강 중. 4년 주기.'),
    (N'보일러 안전검사 갱신',          N'안전', N'신청완료',  '2026-04-19', '2026-04-15', '2026-03-10', N'시설팀 한과장',     N'검사관 현장방문 일정 협의',           '2026-04-10', N'안전밸브 작동 사전점검 완료.'),
    (N'천장크레인 안전검사 갱신',      N'안전', N'서류준비',  '2026-07-07', '2026-06-30', '2026-05-01', N'시설팀 한과장',     N'와이어로프 점검·신청서 작성',         '2026-05-30', N''),
    (N'온실가스 명세서 갱신',          N'환경', N'서류준비',  '2026-06-30', '2026-06-15', '2026-02-01', N'환경팀 최팀장',     N'연간 배출량 검증보고서 제출',         '2026-06-10', N'제3자 검증기관 확정.'),
    (N'유해위험방지계획서 6개월 확인', N'안전', N'검토',     '2026-08-09', '2026-08-01', '2026-05-15', N'안전관리팀 정차장', N'공단 확인 요청서 작성',                '2026-07-20', N'4번째 확인.'),
    (N'특수건강진단 (소음) 갱신',      N'보건', N'완료',     '2026-05-19', '2026-05-15', '2026-04-01', N'안전보건팀 김주임', N'완료',                                 '2026-05-10', N'47명 진단 완료. C1 3명 사후관리.');
END;
GO

-- (4) Change (MOC)
IF NOT EXISTS (SELECT 1 FROM tb_permit_change)
BEGIN
    INSERT INTO tb_permit_change (change_type, title, description, request_date, planned_date, initiator, approver, impact_assessment, status, affected_permits, notes) VALUES
    (N'설비증설', N'도장공정 라인 증설 (#4)',    N'도장부스 #4 신설로 연간 도장량 30% 증가',           '2026-03-15', '2026-09-01', N'생산기술팀 김부장', N'안전관리팀 정차장', N'영향있음', N'허가신청',     N'대기배출시설 변경허가, 유해위험방지계획서',  N'대기배출량 30% 증가. 변경허가 신청.'),
    (N'물질변경', N'톨루엔 → MEK 변경 검토',     N'세척 용제를 톨루엔(특별관리물질)에서 MEK로 전환',   '2026-04-10', '2026-07-01', N'생산기술팀 김부장', N'안전관리팀 정차장', N'영향있음', N'안전영향평가', N'유해화학물질 영업허가, 작업환경측정',         N'MSDS·노출평가 검토 중.'),
    (N'인원변경', N'안전관리자 교체',             N'안전관리자 정차장 → 신차장으로 교체',               '2026-05-01', '2026-06-01', N'인사팀',           N'경영지원실',         N'영향없음', N'이행완료',     N'안전관리자 선임 (산안법 제17조)',           N'14일 내 신고 완료.'),
    (N'공정변경', N'폐수처리 용량 증설',           N'폐수처리시설 일 50톤 → 80톤 증설',                  '2026-02-20', '2026-08-15', N'시설팀 한과장',    N'환경팀 박과장',      N'영향있음', N'승인',         N'폐수배출시설 변경신고',                       N'○○시청 변경신고 수리.'),
    (N'위치변경', N'톨루엔 보관소 위치 변경',     N'화학물질 보관소를 본관 후문 → 신축 보관동으로 이전', '2026-05-10', '2026-10-01', N'안전관리팀',       N'-',                  N'검토중',   N'검토중',       N'유해화학물질 영업허가 변경, 위험물 옥내저장소', N'취급시설 정기검사 재실시 필요.');
END;
GO

-- (5) Inspection
IF NOT EXISTS (SELECT 1 FROM tb_permit_inspection)
BEGIN
    INSERT INTO tb_permit_inspection (inspection_name, inspection_type, frequency, target_facility, legal_basis, last_date, next_date, assignee, last_result, notes) VALUES
    (N'소방시설 작동기능점검',        N'법정', N'반기', N'본관·1~5공장 전체',     N'소방시설법 제22조',          '2026-04-20', '2026-10-20', N'시설팀 한과장',       N'적합',     N'소화기 23개 충전 교체.'),
    (N'소방시설 종합정밀점검',        N'법정', N'연',   N'특정소방대상물',         N'소방시설법 제22조',          '2025-11-15', '2026-11-15', N'소방안전관리자',      N'적합',     N'외부 점검업체 위탁.'),
    (N'위험물 옥내저장소 정기점검',   N'법정', N'연',   N'경유 옥내저장소',         N'위험물안전관리법 제18조',    '2025-12-10', '2026-12-10', N'위험물안전관리자',    N'적합',     N''),
    (N'국소배기장치 자체검사',        N'법정', N'연',   N'도장부스·세척조 LEV',     N'산안기준규칙 제600조',      '2025-11-25', '2026-11-25', N'환경팀 박과장',       N'적합',     N'제어풍속 기준 충족.'),
    (N'전기설비 정기점검',            N'법정', N'월',   N'수전설비·배전반·분전반', N'전기안전관리법 제22조',     '2026-04-30', '2026-05-31', N'전기안전관리자',      N'적합',     N'월간 점검일지 작성.'),
    (N'크레인 일일 점검',             N'법정', N'일',   N'천장크레인 #1, #2',      N'산안기준규칙 제35조',        '2026-05-17', '2026-05-18', N'관리감독자',          N'적합',     N'와이어로프·훅·브레이크.'),
    (N'압력용기 자체점검',            N'법정', N'월',   N'보일러 #1',              N'산안기준규칙 제261조',      '2026-04-25', '2026-05-25', N'시설팀 한과장',       N'적합',     N'안전밸브·압력계.'),
    (N'안전보건위원회',               N'법정', N'분기', N'본사',                   N'산안법 제24조',              '2026-03-25', '2026-06-25', N'안전보건팀',          N'적합',     N'노사 동수 9:9.'),
    (N'도급·수급 합동점검',           N'법정', N'분기', N'도급사업장 전체',         N'산안법 제64조',              '2026-04-10', '2026-07-10', N'안전관리팀 정차장',   N'시정필요', N'협력사 2개소 보호구 미착용 발견·시정 완료.'),
    (N'폐수처리시설 자가측정',        N'법정', N'월',   N'방류조',                  N'물환경보전법 제46조',       '2026-04-28', '2026-05-28', N'환경팀 박과장',       N'적합',     N'BOD·COD·SS·pH 측정.'),
    (N'유해화학물질 취급시설 점검',  N'법정', N'주',   N'톨루엔·MEK 저장탱크',     N'화관법 제26조',              '2026-05-13', '2026-05-20', N'안전관리팀 정차장',   N'적합',     N'누액·체결상태·표지 확인.'),
    (N'위험성평가 정기 실시',         N'법정', N'연',   N'전 작업장',               N'산안법 제36조',              '2025-10-15', '2026-10-15', N'안전관리팀 정차장',   N'적합',     N'37개 단위작업 평가 완료.');
END;
GO

-- (6) Reporting
IF NOT EXISTS (SELECT 1 FROM tb_permit_reporting)
BEGIN
    INSERT INTO tb_permit_reporting (report_name, report_type, regulatory_body, legal_basis, frequency, last_submission, next_deadline, assignee, status, notes) VALUES
    (N'작업환경측정 결과보고 (상반기)',     N'결과보고',  N'지방고용노동청',  N'산안법 제125조',          N'반기', '2026-04-15', '2026-10-15', N'안전보건팀 김주임',     N'제출완료', N'소음 1개소 노출기준 초과·개선완료.'),
    (N'산업재해조사표',                     N'재해보고',  N'지방고용노동청',  N'산안법 제57조',           N'수시', '2025-11-20', NULL,         N'안전관리팀 정차장',     N'제출완료', N'3일 이상 휴업재해 발생 시 1개월 내 제출.'),
    (N'화학물질 배출이동량 (PRTR) 보고',    N'연간보고',  N'화학물질안전원',   N'화관법 제11조',           N'연',   '2026-04-25', '2027-04-30', N'환경팀 박과장',         N'제출완료', N'17종 대상 물질. 산정자료 5년 보존.'),
    (N'온실가스 배출량 명세서',             N'연간보고',  N'환경부',           N'배출권거래법 제24조',     N'연',   '2026-03-31', '2027-03-31', N'환경팀 최팀장',         N'제출완료', N'제3자 검증보고서 첨부.'),
    (N'폐수 자가측정 결과보고',             N'월간보고',  N'○○시청',          N'물환경보전법 제46조',     N'월',   '2026-04-30', '2026-05-31', N'환경팀 박과장',         N'준비중',   N'BOD·COD·SS·pH·T-N·T-P.'),
    (N'대기 자가측정 결과보고',             N'분기보고',  N'○○시청',          N'대기환경보전법 제39조',   N'분기', '2026-03-31', '2026-06-30', N'환경팀 박과장',         N'준비중',   N'도장공정 VOC·먼지.'),
    (N'폐기물 처리실적 보고',               N'연간보고',  N'○○시청',          N'폐기물관리법 제17조',     N'연',   '2026-02-15', '2027-02-28', N'환경팀 박과장',         N'제출완료', N'올바로시스템 인계서 기반.'),
    (N'안전보건교육 실시 보고',             N'연간보고',  N'지방고용노동청',  N'산안법 제29조',           N'연',   NULL,         '2026-06-15', N'안전보건팀 김주임',     N'임박',     N'상반기 교육 결과 정리 필요.'),
    (N'위험물 정기점검 결과보고',           N'연간보고',  N'○○소방서',        N'위험물안전관리법 제18조', N'연',   NULL,         '2026-12-20', N'위험물안전관리자',      N'준비중',   N'');
END;
GO

-- (7) Document
IF NOT EXISTS (SELECT 1 FROM tb_permit_document)
BEGIN
    INSERT INTO tb_permit_document (doc_name, doc_type, category, related_permit, issue_date, retention_years, file_location, notes) VALUES
    (N'대기배출시설 설치허가증',                  N'허가증',     N'환경', N'2024-대기-00123',  '2024-03-15', 999, N'/문서함/환경/대기/2024-대기-00123.pdf',   N'폐지 시까지 영구 보존.'),
    (N'폐수배출시설 설치신고증',                  N'신고증',     N'환경', N'2023-폐수-00078',  '2023-08-20', 999, N'/문서함/환경/수질/2023-폐수-00078.pdf',   N''),
    (N'보일러 안전검사 합격증명서',                N'검사결과서', N'안전', N'안검-2024-B-0012', '2024-04-20', 5,   N'/문서함/안전/검사/2024-B-0012.pdf',       N''),
    (N'작업환경측정 결과보고서 (상반기)',          N'측정결과서', N'보건', N'2024-측정-상반기', '2024-04-15', 5,   N'/문서함/보건/측정/2024-상반기.pdf',       N'특별관리물질 노출자 측정결과는 30년.'),
    (N'톨루엔 취급일지 (특별관리물질)',            N'취급일지',   N'화학', N'CCMS-2023-S-0145', '2024-01-01', 30,  N'/문서함/화학/취급일지/톨루엔-2024.xlsx',   N'특별관리물질 30년 보존.'),
    (N'특수건강진단 결과표',                       N'검사결과서', N'보건', N'2024-특건-소음',   '2024-05-20', 30,  N'/문서함/보건/특건/2024-소음.pdf',         N'특별관리물질 노출자 30년.'),
    (N'PSM 보고서 (전체)',                         N'보고서',     N'안전', N'PSM-2022-0034',    '2022-06-15', 5,   N'/문서함/안전/PSM/2022-0034.zip',         N'갱신 시 갱신본 작성.'),
    (N'유해화학물질 영업허가증',                  N'허가증',     N'화학', N'CCMS-2023-S-0145', '2023-03-08', 999, N'/문서함/화학/허가증/CCMS-2023-S-0145.pdf', N''),
    (N'안전보건교육 일지 (2023)',                  N'교육일지',   N'보건', N'-',                 '2023-12-31', 3,   N'/문서함/교육/2023-교육일지.xlsx',         N''),
    (N'위험성평가 결과서 (2023)',                  N'보고서',     N'안전', N'-',                 '2023-10-15', 3,   N'/문서함/안전/위험성평가/2023.pdf',        N'내년 폐기 검토.'),
    (N'석면조사 결과보고서',                       N'보고서',     N'보건', N'-',                 '2020-05-10', 30,  N'/문서함/보건/석면/2020-조사.pdf',         N'석면관리 30년 보존.'),
    (N'비산먼지 발생사업 신고증',                  N'신고증',     N'환경', N'2024-비산-0045',   '2024-05-10', 999, N'/문서함/환경/비산먼지/2024-0045.pdf',     N'');
END;
GO
