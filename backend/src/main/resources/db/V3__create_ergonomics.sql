-- ===== Code Group: ERGO_ASSESS_TYPE (근골격계 평가 유형) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'ERGO_ASSESS_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('ERGO_ASSESS_TYPE', N'근골격계 평가 유형', N'근골격계 부담작업 평가 도구 코드', 1, 300, GETDATE(), GETDATE());
END;

DECLARE @ergoTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'ERGO_ASSESS_TYPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @ergoTypeId AND code = 'REBA')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@ergoTypeId, 'REBA',  'REBA',  N'REBA (신속전신평가)',   'REBA',  N'REBA快速全身评估', 1, 1, GETDATE(), GETDATE()),
    (@ergoTypeId, 'OWAS',  'OWAS',  N'OWAS (작업자세분석)',   'OWAS',  N'OWAS作业姿势分析', 1, 2, GETDATE(), GETDATE()),
    (@ergoTypeId, 'NIOSH', 'NIOSH', N'NIOSH (들기작업)',      'NIOSH Lifting', N'NIOSH提举分析', 1, 3, GETDATE(), GETDATE()),
    (@ergoTypeId, 'STRAIN_INDEX', 'STRAIN_INDEX', N'SI (상지반복작업)', 'Strain Index', N'劳损指数', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: ERGO_RISK_LEVEL (근골격계 위험 수준) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'ERGO_RISK_LEVEL')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('ERGO_RISK_LEVEL', N'근골격계 위험 수준', N'평가 결과 위험 수준 코드', 1, 301, GETDATE(), GETDATE());
END;

DECLARE @ergoRiskId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'ERGO_RISK_LEVEL');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @ergoRiskId AND code = 'NEGLIGIBLE')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@ergoRiskId, 'NEGLIGIBLE', 'NEGLIGIBLE', N'무시 가능',    'Negligible',    N'可忽略', 1, 1, GETDATE(), GETDATE()),
    (@ergoRiskId, 'LOW',        'LOW',        N'낮음',        'Low',           N'低',     1, 2, GETDATE(), GETDATE()),
    (@ergoRiskId, 'MEDIUM',     'MEDIUM',     N'보통',        'Medium',        N'中',     1, 3, GETDATE(), GETDATE()),
    (@ergoRiskId, 'HIGH',       'HIGH',       N'높음',        'High',          N'高',     1, 4, GETDATE(), GETDATE()),
    (@ergoRiskId, 'VERY_HIGH',  'VERY_HIGH',  N'매우 높음',   'Very High',     N'极高',   1, 5, GETDATE(), GETDATE());
END;

-- ===== Code Group: BODY_PART (신체 부위) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'BODY_PART')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('BODY_PART', N'신체 부위', N'근골격계 증상 호소 신체 부위 코드', 1, 302, GETDATE(), GETDATE());
END;

DECLARE @bodyPartId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'BODY_PART');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @bodyPartId AND code = 'NECK')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@bodyPartId, 'NECK',         'NECK',         N'목',            'Neck',           N'颈部',   1, 1, GETDATE(), GETDATE()),
    (@bodyPartId, 'SHOULDER',     'SHOULDER',     N'어깨',          'Shoulder',       N'肩部',   1, 2, GETDATE(), GETDATE()),
    (@bodyPartId, 'UPPER_ARM',    'UPPER_ARM',    N'상완(위팔)',     'Upper Arm',      N'上臂',   1, 3, GETDATE(), GETDATE()),
    (@bodyPartId, 'ELBOW',        'ELBOW',        N'팔꿈치',        'Elbow',          N'肘部',   1, 4, GETDATE(), GETDATE()),
    (@bodyPartId, 'WRIST_HAND',   'WRIST_HAND',   N'손목/손',       'Wrist/Hand',     N'腕/手',  1, 5, GETDATE(), GETDATE()),
    (@bodyPartId, 'UPPER_BACK',   'UPPER_BACK',   N'상부 등',       'Upper Back',     N'上背',   1, 6, GETDATE(), GETDATE()),
    (@bodyPartId, 'LOWER_BACK',   'LOWER_BACK',   N'허리',          'Lower Back',     N'腰部',   1, 7, GETDATE(), GETDATE()),
    (@bodyPartId, 'HIP',          'HIP',          N'엉덩이/골반',   'Hip/Pelvis',     N'臀/骨盆', 1, 8, GETDATE(), GETDATE()),
    (@bodyPartId, 'KNEE',         'KNEE',         N'무릎',          'Knee',           N'膝部',   1, 9, GETDATE(), GETDATE()),
    (@bodyPartId, 'ANKLE_FOOT',   'ANKLE_FOOT',   N'발목/발',       'Ankle/Foot',     N'踝/足',  1, 10, GETDATE(), GETDATE());
END;

-- ===== Table: tb_ergonomics_assessment =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_ergonomics_assessment')
BEGIN
    CREATE TABLE tb_ergonomics_assessment (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        assessment_id       NVARCHAR(30) NOT NULL,
        assess_type         NVARCHAR(30) NOT NULL,          -- ERGO_ASSESS_TYPE code
        department          NVARCHAR(100),
        work_process        NVARCHAR(200) NOT NULL,         -- 작업 공정명
        work_description    NVARCHAR(2000),                 -- 작업 내용 상세
        worker_name         NVARCHAR(50),
        worker_id           NVARCHAR(50),
        assess_date         DATE NOT NULL,
        assessor_name       NVARCHAR(50),
        score               DECIMAL(5,1),                   -- 평가 점수
        risk_level          NVARCHAR(20),                   -- ERGO_RISK_LEVEL code
        affected_body_parts NVARCHAR(500),                  -- 영향 받는 신체 부위 (BODY_PART codes, comma separated)
        symptoms            NVARCHAR(1000),                 -- 증상 설명
        improvement_action  NVARCHAR(2000),                 -- 개선 조치 내용
        improvement_deadline DATE,                           -- 개선 기한
        improvement_status  NVARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED
        photo_file_id       BIGINT,
        notes               NVARCHAR(500),
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== Dummy Data =====
DELETE FROM tb_ergonomics_assessment;

INSERT INTO tb_ergonomics_assessment (assessment_id, assess_type, department, work_process, work_description, worker_name, assess_date, assessor_name, score, risk_level, affected_body_parts, symptoms, improvement_action, improvement_deadline, improvement_status, notes)
SELECT 'ERGO-2026-001', 'REBA', u1.DeptCode,
       N'프레스 부품 투입 작업', N'프레스 기계에 금속 부품을 수동 투입하는 반복 작업. 1회 중량 약 8kg, 시간당 약 120회 반복',
       u1.UserName, '2026-03-15',
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       9.0, 'HIGH', 'SHOULDER,LOWER_BACK,WRIST_HAND',
       N'어깨 통증, 허리 뻐근함 호소. 작업 3시간 이후 증상 심화',
       N'자동 투입장치 도입 검토, 작업 로테이션(2시간 간격), 스트레칭 프로그램 실시',
       '2026-06-30', 'IN_PROGRESS', N'설비 도입 견적 진행중'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1;

INSERT INTO tb_ergonomics_assessment (assessment_id, assess_type, department, work_process, work_description, worker_name, assess_date, assessor_name, score, risk_level, affected_body_parts, symptoms, improvement_action, improvement_deadline, improvement_status, notes)
SELECT 'ERGO-2026-002', 'OWAS', u1.DeptCode,
       N'배관 용접 자세 작업', N'좁은 공간에서 웅크린 자세로 배관 용접 작업 수행. 1회 작업 약 30분 지속',
       u1.UserName, '2026-03-20',
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       3.0, 'VERY_HIGH', 'LOWER_BACK,KNEE,NECK',
       N'무릎 통증, 허리 디스크 의심 증상. 장시간 웅크린 자세로 인한 근골격계 부담',
       N'작업대 높이 조절, 무릎 보호대 지급, 작업 시간 제한(연속 20분 이내), 대체 자세 교육',
       '2026-05-15', 'PENDING', N'산업의학과 진료 의뢰 예정'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1;

INSERT INTO tb_ergonomics_assessment (assessment_id, assess_type, department, work_process, work_description, worker_name, assess_date, assessor_name, score, risk_level, affected_body_parts, symptoms, improvement_action, improvement_deadline, improvement_status, notes)
SELECT 'ERGO-2026-003', 'NIOSH', u1.DeptCode,
       N'원자재 포대 적재', N'25kg 원자재 포대를 바닥에서 팔레트(높이 1.2m)로 적재. 시간당 약 30회',
       u1.UserName, '2026-02-28',
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       2.8, 'HIGH', 'LOWER_BACK,SHOULDER',
       N'만성 요통 호소. NIOSH 권장 무게 초과(RWL 9.5kg, LI 2.63)',
       N'진공 리프터 도입, 적재 높이 조정, 2인 1조 작업으로 변경',
       '2026-04-30', 'COMPLETED', N'진공 리프터 설치 완료(2026-04-01)'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1;

INSERT INTO tb_ergonomics_assessment (assessment_id, assess_type, department, work_process, work_description, worker_name, assess_date, assessor_name, score, risk_level, affected_body_parts, symptoms, improvement_action, improvement_deadline, improvement_status, notes)
SELECT 'ERGO-2026-004', 'STRAIN_INDEX', u1.DeptCode,
       N'제품 검사 라인 포장', N'완제품 외관 검사 후 포장 작업. 양손 반복 작업, 시간당 약 300회',
       u1.UserName, '2026-03-25',
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       13.5, 'MEDIUM', 'WRIST_HAND,ELBOW',
       N'손목 저림 증상. 수근관 증후군 초기 의심',
       N'작업 높이 조절, 손목 보호대 지급, 자동 포장기 부분 도입, 작업 로테이션',
       '2026-07-31', 'IN_PROGRESS', NULL
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1;

INSERT INTO tb_ergonomics_assessment (assessment_id, assess_type, department, work_process, work_description, worker_name, assess_date, assessor_name, score, risk_level, affected_body_parts, symptoms, improvement_action, improvement_deadline, improvement_status, notes)
SELECT 'ERGO-2026-005', 'REBA', u1.DeptCode,
       N'VDT 작업 (사무직)', N'하루 8시간 이상 모니터 작업. 고정 자세 장시간 유지',
       u1.UserName, '2026-03-10',
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       4.0, 'MEDIUM', 'NECK,UPPER_BACK,WRIST_HAND',
       N'목 뻣뻣함, 어깨 결림. 오후 시간대 증상 심화',
       N'모니터 높이 조절 받침대 지급, 인체공학 의자 교체, 1시간 간격 스트레칭 권고',
       '2026-04-15', 'COMPLETED', N'의자 교체 및 받침대 지급 완료'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1;

INSERT INTO tb_ergonomics_assessment (assessment_id, assess_type, department, work_process, work_description, worker_name, assess_date, assessor_name, score, risk_level, affected_body_parts, symptoms, improvement_action, improvement_deadline, improvement_status, notes)
SELECT 'ERGO-2026-006', 'REBA', u1.DeptCode,
       N'천장 배선 작업', N'사다리 위에서 팔을 머리 위로 올린 자세로 전선 배선 작업. 1회 작업 약 15분',
       u1.UserName, '2026-03-28',
       (SELECT TOP 1 UserName FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()),
       10.0, 'VERY_HIGH', 'SHOULDER,NECK,UPPER_ARM',
       N'어깨 극심한 통증, 팔 저림. 회전근개 손상 의심',
       N'이동식 작업대(높이 조절) 도입, 전동 케이블 풀러 사용, 작업 시간 제한(연속 10분)',
       '2026-05-31', 'PENDING', N'산재 신청 검토 중'
FROM (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u1;
