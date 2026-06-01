-- ============================================================
-- V26: EHS Plan / KPI Indicator / Goal Management
-- ============================================================

-- Table 1: tb_ehs_annual_plan (연간 계획)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_ehs_annual_plan' AND xtype='U')
BEGIN
CREATE TABLE tb_ehs_annual_plan (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_year INT NOT NULL,
    category NVARCHAR(50),
    plan_name NVARCHAR(500) NOT NULL,
    description NVARCHAR(MAX),
    department NVARCHAR(100),
    manager_name NVARCHAR(100),
    start_date DATE,
    end_date DATE,
    progress_rate INT DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'PLANNED',
    priority NVARCHAR(20),
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- Table 2: tb_ehs_kpi_indicator (KPI)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_ehs_kpi_indicator' AND xtype='U')
BEGIN
CREATE TABLE tb_ehs_kpi_indicator (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    kpi_year INT NOT NULL,
    category NVARCHAR(50),
    kpi_name NVARCHAR(500) NOT NULL,
    unit NVARCHAR(50),
    target_value NVARCHAR(100),
    actual_value NVARCHAR(100),
    achievement_rate INT DEFAULT 0,
    achievement_status NVARCHAR(20),
    trend NVARCHAR(20),
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- Table 3: tb_ehs_goal (목표 관리)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_ehs_goal' AND xtype='U')
BEGIN
CREATE TABLE tb_ehs_goal (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    goal_year INT NOT NULL,
    goal_name NVARCHAR(500) NOT NULL,
    goal_icon NVARCHAR(20),
    target_value NVARCHAR(100),
    current_value NVARCHAR(100),
    achievement_rate INT DEFAULT 0,
    description NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'IN_PROGRESS',
    sort_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- ============================================================
-- Code Groups (V10 패턴 준수: group_id 참조 방식)
-- ============================================================

-- PLAN_CATEGORY
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'PLAN_CATEGORY')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('PLAN_CATEGORY', N'계획 분류', N'EHS 계획 분류 코드', 1, 2100, GETDATE(), GETDATE());
END;

DECLARE @planCategoryGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'PLAN_CATEGORY');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @planCategoryGroupId AND code = 'SAFETY')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@planCategoryGroupId, 'SAFETY',      'SAFETY',      N'안전',     'Safety',      N'安全', 1, 1, GETDATE(), GETDATE()),
    (@planCategoryGroupId, 'ENVIRONMENT', 'ENVIRONMENT', N'환경',     'Environment', N'环境', 1, 2, GETDATE(), GETDATE()),
    (@planCategoryGroupId, 'HEALTH',      'HEALTH',      N'보건',     'Health',      N'健康', 1, 3, GETDATE(), GETDATE()),
    (@planCategoryGroupId, 'COMPLIANCE',  'COMPLIANCE',  N'법규준수', 'Compliance',  N'合规', 1, 4, GETDATE(), GETDATE()),
    (@planCategoryGroupId, 'TRAINING',    'TRAINING',    N'교육',     'Training',    N'培训', 1, 5, GETDATE(), GETDATE());
END;

-- PLAN_STATUS
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'PLAN_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('PLAN_STATUS', N'계획 상태', N'EHS 계획 상태 코드', 1, 2101, GETDATE(), GETDATE());
END;

DECLARE @planStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'PLAN_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @planStatusGroupId AND code = 'PLANNED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@planStatusGroupId, 'PLANNED',     'PLANNED',     N'계획',   'Planned',     N'已计划', 1, 1, GETDATE(), GETDATE()),
    (@planStatusGroupId, 'IN_PROGRESS', 'IN_PROGRESS', N'진행중', 'In Progress', N'进行中', 1, 2, GETDATE(), GETDATE()),
    (@planStatusGroupId, 'COMPLETED',   'COMPLETED',   N'완료',   'Completed',   N'已完成', 1, 3, GETDATE(), GETDATE()),
    (@planStatusGroupId, 'DELAYED',     'DELAYED',     N'지연',   'Delayed',     N'延迟',   1, 4, GETDATE(), GETDATE()),
    (@planStatusGroupId, 'CANCELLED',   'CANCELLED',   N'취소',   'Cancelled',   N'已取消', 1, 5, GETDATE(), GETDATE());
END;

-- KPI_ACHIEVEMENT_STATUS
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'KPI_ACHIEVEMENT_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('KPI_ACHIEVEMENT_STATUS', N'KPI 달성상태', N'KPI 달성상태 코드', 1, 2102, GETDATE(), GETDATE());
END;

DECLARE @kpiStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'KPI_ACHIEVEMENT_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @kpiStatusGroupId AND code = 'ACHIEVED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@kpiStatusGroupId, 'ACHIEVED',     'ACHIEVED',     N'달성',   'Achieved',     N'已达成', 1, 1, GETDATE(), GETDATE()),
    (@kpiStatusGroupId, 'IN_PROGRESS',  'IN_PROGRESS',  N'진행중', 'In Progress',  N'进行中', 1, 2, GETDATE(), GETDATE()),
    (@kpiStatusGroupId, 'REVIEW',       'REVIEW',       N'검토',   'Review',       N'审核',   1, 3, GETDATE(), GETDATE()),
    (@kpiStatusGroupId, 'NOT_ACHIEVED', 'NOT_ACHIEVED', N'미달',   'Not Achieved', N'未达成', 1, 4, GETDATE(), GETDATE());
END;

-- ============================================================
-- Dummy Data: Plans (10 records)
-- ============================================================

INSERT INTO tb_ehs_annual_plan (plan_year, category, plan_name, description, department, manager_name, start_date, end_date, progress_rate, status, priority, remarks)
VALUES
(2026, 'SAFETY', N'연간 EHS 계획 수립', N'2025년 연간 EHS 종합계획 수립 및 배포', N'EHS팀', N'김안전', '2025-01-02', '2025-01-31', 100, 'COMPLETED', 'HIGH', N'전사 배포 완료'),
(2026, 'TRAINING', N'전직원 EHS 교육', N'전 직원 대상 EHS 기본 교육 실시', N'EHS팀', N'이교육', '2025-02-01', '2025-03-31', 100, 'COMPLETED', 'HIGH', N'온라인/오프라인 병행'),
(2026, 'SAFETY', N'1분기 위험성평가', N'1분기 정기 위험성평가 실시', N'안전관리팀', N'박평가', '2025-01-15', '2025-03-31', 100, 'COMPLETED', 'HIGH', N'전 공정 완료'),
(2026, 'SAFETY', N'상반기 EHS 감사', N'상반기 내부 EHS 감사 실시', N'EHS팀', N'최감사', '2025-04-01', '2025-06-30', 70, 'IN_PROGRESS', 'HIGH', N'3개 사업장 중 2개 완료'),
(2026, 'HEALTH', N'작업환경측정 상반기', N'상반기 작업환경측정 실시', N'보건관리팀', N'정보건', '2025-03-01', '2025-04-30', 100, 'COMPLETED', 'MEDIUM', N'측정결과 양호'),
(2026, 'ENVIRONMENT', N'온실가스 감축 활동', N'온실가스 배출량 5% 감축 목표 달성 활동', N'환경관리팀', N'한환경', '2025-01-01', '2025-12-31', 55, 'IN_PROGRESS', 'HIGH', N'현재 3.2% 감축 달성'),
(2026, 'ENVIRONMENT', N'화학물질 MSDS 갱신', N'전체 화학물질 MSDS 최신본 갱신', N'환경관리팀', N'오화학', '2025-02-01', '2025-04-30', 100, 'COMPLETED', 'MEDIUM', N'총 156건 갱신 완료'),
(2026, 'SAFETY', N'비상대응 훈련', N'분기별 비상대응 훈련 실시', N'안전관리팀', N'김안전', '2025-01-01', '2025-12-31', 40, 'IN_PROGRESS', 'MEDIUM', N'2회차 완료, 3회차 예정'),
(2026, 'COMPLIANCE', N'법규 변경사항 반영', N'EHS 관련 법규 변경사항 파악 및 반영', N'법규팀', N'이법규', '2025-01-01', '2025-12-31', 30, 'DELAYED', 'HIGH', N'법규 개정 지연으로 일정 변경'),
(2026, 'HEALTH', N'하반기 특수건강검진', N'하반기 특수건강검진 대상자 검진 실시', N'보건관리팀', N'정보건', '2025-07-01', '2025-09-30', 0, 'PLANNED', 'MEDIUM', N'대상자 선정 완료');

-- ============================================================
-- Dummy Data: KPI Indicators (10 records)
-- ============================================================

INSERT INTO tb_ehs_kpi_indicator (kpi_year, category, kpi_name, unit, target_value, actual_value, achievement_rate, achievement_status, trend, remarks)
VALUES
(2026, 'SAFETY', N'산업재해율', N'%', N'0.5 이하', N'0.31', 100, 'ACHIEVED', 'IMPROVING', N'전년 대비 개선'),
(2026, 'SAFETY', N'아차사고 보고건수', N'건', N'50건 이상', N'68', 100, 'ACHIEVED', 'IMPROVING', N'보고 문화 정착'),
(2026, 'SAFETY', N'중대재해 발생건수', N'건', N'0', N'0', 100, 'ACHIEVED', 'MAINTAINING', N'무재해 유지'),
(2026, 'ENVIRONMENT', N'온실가스 배출량', N'%', N'-5%', N'-3.2%', 64, 'IN_PROGRESS', 'IMPROVING', N'감축 활동 진행중'),
(2026, 'ENVIRONMENT', N'폐기물 발생량', N'톤/월', N'120 이하', N'108', 100, 'ACHIEVED', 'IMPROVING', N'목표 대비 양호'),
(2026, 'ENVIRONMENT', N'법규 위반건수', N'건', N'0', N'1', 20, 'NOT_ACHIEVED', 'DECLINING', N'배출허용기준 1회 초과'),
(2026, 'HEALTH', N'특수건강검진 수검률', N'%', N'100%', N'100%', 100, 'ACHIEVED', 'MAINTAINING', N'전원 수검 완료'),
(2026, 'HEALTH', N'직무스트레스 고위험군 비율', N'%', N'10% 이하', N'8.4%', 100, 'ACHIEVED', 'IMPROVING', N'상담 프로그램 운영'),
(2026, 'COMPLIANCE', N'EHS 교육 이수율', N'%', N'100%', N'100%', 100, 'ACHIEVED', 'MAINTAINING', N'법정교육 전원 이수'),
(2026, 'COMPLIANCE', N'감사 시정조치 완료율', N'%', N'95% 이상', N'97%', 100, 'ACHIEVED', 'IMPROVING', N'시정조치 적극 이행');

-- ============================================================
-- Dummy Data: Goals (6 records)
-- ============================================================

INSERT INTO tb_ehs_goal (goal_year, goal_name, goal_icon, target_value, current_value, achievement_rate, description, status, sort_order)
VALUES
(2026, N'무재해 목표', N'🛡️', N'365일', N'183일', 50, N'연간 무재해 달성 목표', 'IN_PROGRESS', 1),
(2026, N'온실가스 감축', N'🌱', N'-5%', N'-3.2%', 64, N'전년 대비 온실가스 배출량 5% 감축', 'IN_PROGRESS', 2),
(2026, N'교육 이수율', N'📚', N'100%', N'100%', 100, N'전 직원 EHS 교육 이수', 'ACHIEVED', 3),
(2026, N'법규 위반 Zero', N'⚖️', N'0건', N'1건', 20, N'EHS 관련 법규 위반 제로 달성', 'NOT_ACHIEVED', 4),
(2026, N'건강검진 수검률', N'🏥', N'100%', N'100%', 100, N'특수건강검진 대상자 전원 수검', 'ACHIEVED', 5),
(2026, N'아차사고 보고', N'📋', N'600건/년', N'408건', 68, N'아차사고 자율보고 활성화', 'IN_PROGRESS', 6);
