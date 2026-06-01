-- ===== Code Group: COMPLIANCE_CATEGORY =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'COMPLIANCE_CATEGORY')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('COMPLIANCE_CATEGORY', N'법규 분류', N'법규 준수 관리 분류 코드', 1, 200, GETDATE(), GETDATE());
END;

DECLARE @compCatGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_CATEGORY');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @compCatGroupId AND code = 'INDUSTRIAL_SAFETY')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@compCatGroupId, 'INDUSTRIAL_SAFETY', 'INDUSTRIAL_SAFETY', N'산업안전보건법', 'Occupational Safety and Health Act', N'产业安全卫生法', 1, 1, GETDATE(), GETDATE()),
    (@compCatGroupId, 'CHEMICAL_MGMT', 'CHEMICAL_MGMT', N'화학물질관리법', 'Chemical Substances Control Act', N'化学物质管理法', 1, 2, GETDATE(), GETDATE()),
    (@compCatGroupId, 'AIR_QUALITY', 'AIR_QUALITY', N'대기환경보전법', 'Clean Air Conservation Act', N'大气环境保全法', 1, 3, GETDATE(), GETDATE()),
    (@compCatGroupId, 'WATER_QUALITY', 'WATER_QUALITY', N'수질환경보전법', 'Water Environment Conservation Act', N'水质环境保全法', 1, 4, GETDATE(), GETDATE()),
    (@compCatGroupId, 'WASTE_MGMT', 'WASTE_MGMT', N'폐기물관리법', 'Waste Management Act', N'废弃物管理法', 1, 5, GETDATE(), GETDATE()),
    (@compCatGroupId, 'FIRE_SAFETY', 'FIRE_SAFETY', N'소방법', 'Fire Services Act', N'消防法', 1, 6, GETDATE(), GETDATE()),
    (@compCatGroupId, 'ELECTRICAL_SAFETY', 'ELECTRICAL_SAFETY', N'전기안전관리법', 'Electrical Safety Management Act', N'电气安全管理法', 1, 7, GETDATE(), GETDATE()),
    (@compCatGroupId, 'OTHER', 'OTHER', N'기타', 'Other', N'其他', 1, 8, GETDATE(), GETDATE());
END;

-- ===== Code Group: COMPLIANCE_STATUS =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'COMPLIANCE_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('COMPLIANCE_STATUS', N'준수 상태', N'법규 준수 상태 코드', 1, 201, GETDATE(), GETDATE());
END;

DECLARE @compStatGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'COMPLIANCE_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @compStatGroupId AND code = 'COMPLIANT')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@compStatGroupId, 'COMPLIANT', 'COMPLIANT', N'준수', 'Compliant', N'合规', 1, 1, GETDATE(), GETDATE()),
    (@compStatGroupId, 'NON_COMPLIANT', 'NON_COMPLIANT', N'미준수', 'Non-Compliant', N'不合规', 1, 2, GETDATE(), GETDATE()),
    (@compStatGroupId, 'UNDER_REVIEW', 'UNDER_REVIEW', N'검토중', 'Under Review', N'审查中', 1, 3, GETDATE(), GETDATE()),
    (@compStatGroupId, 'NEEDS_IMPROVEMENT', 'NEEDS_IMPROVEMENT', N'개선필요', 'Needs Improvement', N'需要改善', 1, 4, GETDATE(), GETDATE()),
    (@compStatGroupId, 'NOT_APPLICABLE', 'NOT_APPLICABLE', N'해당없음', 'Not Applicable', N'不适用', 1, 5, GETDATE(), GETDATE());
END;

-- ===== Compliance Table =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_compliance')
BEGIN
    CREATE TABLE tb_compliance (
        id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
        compliance_id           NVARCHAR(30) NOT NULL,
        category                NVARCHAR(50) NOT NULL,
        status                  NVARCHAR(50) NOT NULL DEFAULT 'UNDER_REVIEW',
        law_name                NVARCHAR(200) NOT NULL,
        article_number          NVARCHAR(100),
        requirement_description NVARCHAR(2000),
        compliance_detail       NVARCHAR(2000),
        responsible_dept        NVARCHAR(100),
        responsible_name        NVARCHAR(50),
        due_date                DATE,
        last_review_date        DATE,
        next_review_date        DATE,
        evidence_description    NVARCHAR(1000),
        penalty_risk            NVARCHAR(500),
        improvement_action      NVARCHAR(2000),
        notes                   NVARCHAR(500),
        deleted                 BIT NOT NULL DEFAULT 0,
        created_at              DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at             DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== Dummy Data =====
DELETE FROM tb_compliance;

INSERT INTO tb_compliance (compliance_id, category, status, law_name, article_number, requirement_description, compliance_detail, responsible_dept, responsible_name, due_date, last_review_date, next_review_date, evidence_description, penalty_risk, improvement_action, notes)
VALUES
('COMP-2026-001', 'INDUSTRIAL_SAFETY', 'COMPLIANT', N'산업안전보건법', N'제29조 (근로자에 대한 안전보건교육)',
 N'사업주는 근로자에 대하여 정기적으로 안전보건교육을 실시하여야 한다. 신규 채용 시 및 작업내용 변경 시 특별안전보건교육을 실시하여야 한다.',
 N'분기별 정기 안전보건교육 실시 완료. 신규 입사자 교육 100% 이수.',
 N'안전환경팀', N'김안전', '2026-06-30', '2026-03-15', '2026-06-15',
 N'교육 참석부 및 이수증 보관',
 N'5백만원 이하의 과태료 (미실시 시)',
 NULL, N'2026년 1분기 교육 완료'),

('COMP-2026-002', 'CHEMICAL_MGMT', 'NEEDS_IMPROVEMENT', N'화학물질관리법', N'제11조 (화학물질 확인)',
 N'화학물질을 수입하려는 자는 해당 화학물질이 기존화학물질에 해당하는지 여부를 확인하여야 한다. MSDS를 비치하고 근로자에게 교육하여야 한다.',
 N'MSDS 비치율 85%. 일부 부서 미비치 확인.',
 N'환경안전팀', N'이화학', '2026-04-30', '2026-03-01', '2026-04-30',
 N'MSDS 비치 현황표, 교육 기록',
 N'3천만원 이하의 벌금 또는 3년 이하의 징역',
 N'미비치 부서 MSDS 즉시 보완 및 교육 재실시', N'생산2팀, 품질팀 미비치'),

('COMP-2026-003', 'AIR_QUALITY', 'COMPLIANT', N'대기환경보전법', N'제16조 (배출시설의 설치허가 및 신고)',
 N'대기오염물질배출시설을 설치하려는 자는 환경부장관의 허가를 받거나 신고하여야 한다. 배출허용기준을 준수하여야 한다.',
 N'배출시설 허가 완료. 자가측정 결과 기준치 이내.',
 N'환경관리팀', N'박대기', '2026-12-31', '2026-02-20', '2026-08-20',
 N'배출시설 설치허가서, 자가측정 결과보고서',
 N'7년 이하의 징역 또는 2억원 이하의 벌금 (무허가 시)',
 NULL, NULL),

('COMP-2026-004', 'WATER_QUALITY', 'UNDER_REVIEW', N'수질환경보전법', N'제33조 (배출시설의 설치허가 및 신고)',
 N'수질오염물질을 배출하는 배출시설을 설치하려는 자는 허가를 받아야 한다. 방류수 수질기준을 준수하여야 한다.',
 N'수질 측정 결과 검토 중. 일부 항목 경계치 접근.',
 N'환경관리팀', N'최수질', '2026-05-31', '2026-03-10', '2026-05-10',
 N'수질오염물질 측정 결과, 방류수 수질검사 성적서',
 N'5년 이하의 징역 또는 5천만원 이하의 벌금',
 N'방류수 처리 효율 개선 검토', N'BOD 항목 기준치 근접'),

('COMP-2026-005', 'WASTE_MGMT', 'COMPLIANT', N'폐기물관리법', N'제18조 (사업장폐기물의 처리)',
 N'사업장폐기물배출자는 그의 사업장에서 발생하는 폐기물을 스스로 처리하거나 위탁하여 처리하여야 한다.',
 N'지정폐기물 위탁업체 계약 완료. 처리 이력 관리 중.',
 N'환경관리팀', N'정폐기', '2026-12-31', '2026-03-05', '2026-09-05',
 N'폐기물 위탁처리 계약서, 폐기물 인수인계서',
 N'3년 이하의 징역 또는 3천만원 이하의 벌금',
 NULL, NULL),

('COMP-2026-006', 'FIRE_SAFETY', 'NON_COMPLIANT', N'화재예방, 소방시설 설치유지 및 안전관리에 관한 법률', N'제25조 (소방안전관리자)',
 N'특정소방대상물의 관계인은 소방안전관리자를 선임하여야 한다. 소방훈련 및 교육을 연 2회 이상 실시하여야 한다.',
 N'소방안전관리자 선임 완료. 상반기 소방훈련 미실시.',
 N'총무팀', N'한소방', '2026-04-15', '2026-02-28', '2026-04-15',
 N'소방안전관리자 선임 신고서, 소방훈련 실시 결과보고서',
 N'3백만원 이하의 과태료 (훈련 미실시 시)',
 N'2026년 4월 내 소방훈련 실시 예정', N'긴급 - 상반기 훈련 미실시'),

('COMP-2026-007', 'ELECTRICAL_SAFETY', 'COMPLIANT', N'전기안전관리법', N'제22조 (정기검사)',
 N'자가용전기설비의 소유자 또는 점유자는 정기검사를 받아야 한다. 전기안전관리자를 선임하여야 한다.',
 N'전기안전관리자 선임 완료. 정기검사 합격.',
 N'설비팀', N'오전기', '2026-10-31', '2026-01-15', '2026-07-15',
 N'전기안전관리자 선임서, 정기검사 합격증',
 N'1천만원 이하의 과태료',
 NULL, NULL),

('COMP-2026-008', 'INDUSTRIAL_SAFETY', 'NEEDS_IMPROVEMENT', N'산업안전보건법', N'제36조 (위험성평가)',
 N'사업주는 건설물, 기계기구, 설비, 원재료, 가스, 증기, 분진 등에 의한 위험성평가를 실시하여야 한다.',
 N'위험성평가 실시율 70%. 일부 공정 미실시.',
 N'안전환경팀', N'김안전', '2026-05-31', '2026-03-20', '2026-05-20',
 N'위험성평가 보고서, 개선 조치 계획서',
 N'5백만원 이하의 과태료 (미실시 시)',
 N'미실시 공정 위험성평가 즉시 실시 및 개선조치 이행', N'도장공정, 용접공정 미실시');
