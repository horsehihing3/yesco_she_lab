-- ===== Occupational Disease Management (직업병 관리) =====

-- Table 1: tb_odm_suspect (직업병 의심자)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_odm_suspect' AND xtype='U')
BEGIN
CREATE TABLE tb_odm_suspect (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    employee_name NVARCHAR(100) NOT NULL,
    employee_no NVARCHAR(20),
    department NVARCHAR(100),
    symptoms NVARCHAR(500),
    hazard_factor NVARCHAR(200),
    report_date DATE,
    status NVARCHAR(20) DEFAULT 'RECEIVED',
    doctor NVARCHAR(100),
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- Table 2: tb_odm_exposure (유해인자 노출)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_odm_exposure' AND xtype='U')
BEGIN
CREATE TABLE tb_odm_exposure (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    employee_name NVARCHAR(100) NOT NULL,
    employee_no NVARCHAR(20),
    department NVARCHAR(100),
    hazard_factor NVARCHAR(200),
    exposure_level NVARCHAR(50),
    exposure_standard NVARCHAR(50),
    exposure_period NVARCHAR(100),
    risk_level NVARCHAR(20),
    exceed_count INT DEFAULT 0,
    exposed_workers INT DEFAULT 0,
    measurement_date DATE,
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- Table 3: tb_odm_confirmed (직업병 확정/산재)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_odm_confirmed' AND xtype='U')
BEGIN
CREATE TABLE tb_odm_confirmed (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    employee_name NVARCHAR(100) NOT NULL,
    disease_name NVARCHAR(200),
    hazard_factor NVARCHAR(200),
    diagnosis_agency NVARCHAR(200),
    confirmed_date DATE,
    claim_status NVARCHAR(20),
    approval_status NVARCHAR(20),
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- Table 4: tb_odm_followup (사후관리)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_odm_followup' AND xtype='U')
BEGIN
CREATE TABLE tb_odm_followup (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    employee_name NVARCHAR(100) NOT NULL,
    judgment NVARCHAR(20),
    action_type NVARCHAR(100),
    action_start_date DATE,
    followup_exam_date DATE,
    status NVARCHAR(20) DEFAULT 'INCOMPLETE',
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- ===== Code Groups =====

-- ODM_SUSPECT_STATUS
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'ODM_SUSPECT_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('ODM_SUSPECT_STATUS', N'직업병 의심자 상태', N'직업병 의심자 관리 상태 코드', 1, 2400, GETDATE(), GETDATE());
END;

DECLARE @odmSuspectStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'ODM_SUSPECT_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @odmSuspectStatusId AND code = 'RECEIVED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@odmSuspectStatusId, 'RECEIVED',      'RECEIVED',      N'접수',     'Received',      N'已接收', 1, 1, GETDATE(), GETDATE()),
    (@odmSuspectStatusId, 'INVESTIGATING', 'INVESTIGATING', N'조사중',   'Investigating', N'调查中', 1, 2, GETDATE(), GETDATE()),
    (@odmSuspectStatusId, 'EXAMINATION',   'EXAMINATION',   N'정밀검사', 'Examination',   N'精密检查', 1, 3, GETDATE(), GETDATE()),
    (@odmSuspectStatusId, 'FOLLOWUP',      'FOLLOWUP',      N'사후관리', 'Follow-up',     N'后续管理', 1, 4, GETDATE(), GETDATE()),
    (@odmSuspectStatusId, 'CLOSED',        'CLOSED',        N'종결',     'Closed',        N'已结案', 1, 5, GETDATE(), GETDATE());
END;

-- ODM_RISK_LEVEL
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'ODM_RISK_LEVEL')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('ODM_RISK_LEVEL', N'위험 수준', N'유해인자 노출 위험 수준 코드', 1, 2410, GETDATE(), GETDATE());
END;

DECLARE @odmRiskLevelId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'ODM_RISK_LEVEL');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @odmRiskLevelId AND code = 'HIGH')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@odmRiskLevelId, 'HIGH',   'HIGH',   N'고위험', 'High',   N'高风险', 1, 1, GETDATE(), GETDATE()),
    (@odmRiskLevelId, 'MEDIUM', 'MEDIUM', N'중위험', 'Medium', N'中风险', 1, 2, GETDATE(), GETDATE()),
    (@odmRiskLevelId, 'LOW',    'LOW',    N'저위험', 'Low',    N'低风险', 1, 3, GETDATE(), GETDATE());
END;

-- ODM_CLAIM_STATUS
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'ODM_CLAIM_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('ODM_CLAIM_STATUS', N'산재 신청 상태', N'직업병 산재 신청 상태 코드', 1, 2420, GETDATE(), GETDATE());
END;

DECLARE @odmClaimStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'ODM_CLAIM_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @odmClaimStatusId AND code = 'COMPLETED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@odmClaimStatusId, 'COMPLETED',   'COMPLETED',   N'완료',   'Completed',   N'已完成', 1, 1, GETDATE(), GETDATE()),
    (@odmClaimStatusId, 'IN_PROGRESS', 'IN_PROGRESS', N'진행중', 'In Progress', N'进行中', 1, 2, GETDATE(), GETDATE()),
    (@odmClaimStatusId, 'NOT_APPLIED', 'NOT_APPLIED', N'미신청', 'Not Applied', N'未申请', 1, 3, GETDATE(), GETDATE());
END;

-- ODM_APPROVAL_STATUS
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'ODM_APPROVAL_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('ODM_APPROVAL_STATUS', N'산재 승인 상태', N'직업병 산재 승인 상태 코드', 1, 2430, GETDATE(), GETDATE());
END;

DECLARE @odmApprovalStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'ODM_APPROVAL_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @odmApprovalStatusId AND code = 'APPROVED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@odmApprovalStatusId, 'APPROVED',  'APPROVED',  N'인정',   'Approved',  N'已批准', 1, 1, GETDATE(), GETDATE()),
    (@odmApprovalStatusId, 'REJECTED',  'REJECTED',  N'불인정', 'Rejected',  N'已拒绝', 1, 2, GETDATE(), GETDATE()),
    (@odmApprovalStatusId, 'REVIEWING', 'REVIEWING', N'심사중', 'Reviewing', N'审查中', 1, 3, GETDATE(), GETDATE()),
    (@odmApprovalStatusId, 'PENDING',   'PENDING',   N'대기',   'Pending',   N'待处理', 1, 4, GETDATE(), GETDATE());
END;

-- ODM_FOLLOWUP_STATUS
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'ODM_FOLLOWUP_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('ODM_FOLLOWUP_STATUS', N'사후관리 상태', N'직업병 사후관리 상태 코드', 1, 2440, GETDATE(), GETDATE());
END;

DECLARE @odmFollowupStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'ODM_FOLLOWUP_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @odmFollowupStatusId AND code = 'INCOMPLETE')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@odmFollowupStatusId, 'INCOMPLETE',  'INCOMPLETE',  N'미완료',   'Incomplete',  N'未完成',   1, 1, GETDATE(), GETDATE()),
    (@odmFollowupStatusId, 'IN_PROGRESS', 'IN_PROGRESS', N'이행중',   'In Progress', N'执行中',   1, 2, GETDATE(), GETDATE()),
    (@odmFollowupStatusId, 'REVIEW',      'REVIEW',      N'복직검토', 'Review',      N'复职审查', 1, 3, GETDATE(), GETDATE()),
    (@odmFollowupStatusId, 'COMPLETED',   'COMPLETED',   N'완료',     'Completed',   N'已完成',   1, 4, GETDATE(), GETDATE());
END;

-- ODM_JUDGMENT
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'ODM_JUDGMENT')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('ODM_JUDGMENT', N'건강진단 판정', N'직업병 건강진단 판정 코드', 1, 2450, GETDATE(), GETDATE());
END;

DECLARE @odmJudgmentId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'ODM_JUDGMENT');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @odmJudgmentId AND code = 'D1')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@odmJudgmentId, 'D1', 'D1', N'직업병의심',     'Suspected Occupational Disease',  N'疑似职业病',   1, 1, GETDATE(), GETDATE()),
    (@odmJudgmentId, 'D2', 'D2', N'일반질환의심',   'Suspected General Disease',       N'疑似一般疾病', 1, 2, GETDATE(), GETDATE()),
    (@odmJudgmentId, 'C1', 'C1', N'직업성유소견',   'Occupational Findings',           N'职业性异常',   1, 3, GETDATE(), GETDATE()),
    (@odmJudgmentId, 'C2', 'C2', N'일반질환유소견', 'General Disease Findings',        N'一般疾病异常', 1, 4, GETDATE(), GETDATE()),
    (@odmJudgmentId, 'R',  'R',  N'사후관리대상',   'Follow-up Management Required',   N'后续管理对象', 1, 5, GETDATE(), GETDATE());
END;

-- ===== Dummy Data =====

-- Suspects
IF NOT EXISTS (SELECT * FROM tb_odm_suspect WHERE employee_no = 'E0234')
BEGIN
    INSERT INTO tb_odm_suspect (employee_name, employee_no, department, symptoms, hazard_factor, report_date, status, doctor, remarks)
    VALUES
    (N'김철수', 'E0234', N'도장공정', N'청력저하', N'소음', '2026-01-15', 'INVESTIGATING', N'박의사', N'소음 노출 3년 이상'),
    (N'이영희', 'E0411', N'화학실험실', N'접촉성피부염', N'화학물질', '2026-02-20', 'RECEIVED', NULL, N'피부과 진료 예정'),
    (N'박민준', 'E0189', N'용접공정', N'호흡곤란', N'금속흄', '2026-01-28', 'EXAMINATION', N'김의사', N'폐기능검사 예정'),
    (N'최수진', 'E0523', N'VDT작업', N'어깨목통증', N'근골격계', '2026-03-05', 'FOLLOWUP', N'이의사', N'물리치료 진행중'),
    (N'정현우', 'E0312', N'도장공정', N'두통어지럼', N'유기용제', '2026-02-10', 'INVESTIGATING', NULL, N'작업환경 측정 필요');
END;

-- Exposures
IF NOT EXISTS (SELECT * FROM tb_odm_exposure WHERE hazard_factor = N'소음' AND department = N'제조공정')
BEGIN
    INSERT INTO tb_odm_exposure (employee_name, employee_no, department, hazard_factor, exposure_level, exposure_standard, exposure_period, risk_level, exceed_count, exposed_workers, measurement_date, remarks)
    VALUES
    (N'소음 노출군', NULL, N'제조공정', N'소음', '92dB', '90dB', N'8시간/일', 'HIGH', 23, 187, '2026-01-10', N'도장/용접 공정 집중'),
    (N'분진 노출군', NULL, N'가공공정', N'분진', '8.5mg/m3', '10mg/m3', N'8시간/일', 'MEDIUM', 8, 134, '2026-01-10', N'환기시설 개선 필요'),
    (N'유기용제 노출군', NULL, N'도장공정', N'유기용제', '45ppm', '50ppm', N'6시간/일', 'MEDIUM', 5, 96, '2026-02-15', N'보호구 착용 강화'),
    (N'금속흄 노출군', NULL, N'용접공정', N'금속흄', '3.2mg/m3', '5mg/m3', N'8시간/일', 'LOW', 0, 72, '2026-02-15', N'국소배기장치 정상'),
    (N'방사선 노출군', NULL, N'품질검사', N'방사선', '12mSv', '20mSv', N'4시간/일', 'LOW', 0, 18, '2026-03-01', N'차폐시설 양호');
END;

-- Confirmed
IF NOT EXISTS (SELECT * FROM tb_odm_confirmed WHERE employee_name = N'김선호')
BEGIN
    INSERT INTO tb_odm_confirmed (employee_name, disease_name, hazard_factor, diagnosis_agency, confirmed_date, claim_status, approval_status, remarks)
    VALUES
    (N'김선호', N'소음성난청', N'소음 88dB', N'산업안전보건공단', '2026-01-20', 'COMPLETED', 'APPROVED', N'양측 감각신경성 난청'),
    (N'이화진', N'진폐증', N'분진', N'근로복지공단', '2026-02-15', 'COMPLETED', 'REJECTED', N'직업 관련성 불인정'),
    (N'강태호', N'직업성천식', N'이소시아네이트', N'직업환경의학과', '2026-03-10', 'IN_PROGRESS', 'REVIEWING', N'역학조사 진행중');
END;

-- Followups
IF NOT EXISTS (SELECT * FROM tb_odm_followup WHERE employee_name = N'홍길동')
BEGIN
    INSERT INTO tb_odm_followup (employee_name, judgment, action_type, action_start_date, followup_exam_date, status, remarks)
    VALUES
    (N'홍길동', 'D1', N'업무전환', '2026-02-01', '2026-05-01', 'INCOMPLETE', N'전환 부서 미정'),
    (N'강미영', 'C1', N'근로시간단축', '2026-01-15', '2026-04-15', 'IN_PROGRESS', N'주 30시간 근무'),
    (N'최수진', 'C2', N'추적관찰', '2026-03-01', '2026-06-01', 'IN_PROGRESS', N'3개월 후 재검'),
    (N'김선호', 'D1', N'업무전환·재활', '2026-01-25', '2026-04-25', 'REVIEW', N'청력재활 프로그램 이수');
END;
