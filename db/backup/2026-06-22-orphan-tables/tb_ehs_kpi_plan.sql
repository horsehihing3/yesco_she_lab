-- Backup of [tb_ehs_kpi_plan] from yescoSHE_lab2  (2026-06-22, orphan table backup before DROP)
-- Restore: run schema then data. For checklist, run 01_master before 02_item (FK).
SET NOCOUNT ON;
GO
IF OBJECT_ID('tb_ehs_kpi_plan','U') IS NOT NULL
    PRINT 'WARNING: tb_ehs_kpi_plan already exists - review before running';
GO
CREATE TABLE [tb_ehs_kpi_plan] (
    [id] bigint IDENTITY(1,1) NOT NULL,
    [plan_year] int NOT NULL,
    [indicator_type] nvarchar(30) NOT NULL,
    [indicator_name] nvarchar(200) NOT NULL,
    [description] nvarchar(500) NULL,
    [department] nvarchar(100) NULL,
    [responsible_person] nvarchar(50) NULL,
    [measurement_period] nvarchar(30) NULL DEFAULT ('MONTHLY'),
    [unit] nvarchar(30) NULL,
    [target_value] decimal(12,2) NULL,
    [current_value] decimal(12,2) NULL,
    [achievement_rate] decimal(5,2) NULL,
    [status] nvarchar(30) NULL DEFAULT ('ON_TRACK'),
    [start_date] date NULL,
    [end_date] date NULL,
    [notes] nvarchar(1000) NULL,
    [deleted] bit NOT NULL DEFAULT ((0)),
    [created_at] datetime NOT NULL DEFAULT (getdate()),
    [modified_at] datetime NOT NULL DEFAULT (getdate()),
    CONSTRAINT [PK_tb_ehs_kpi_plan] PRIMARY KEY ([id])
);
GO
INSERT INTO [tb_ehs_kpi_plan] ([id], [plan_year], [indicator_type], [indicator_name], [description], [department], [responsible_person], [measurement_period], [unit], [target_value], [current_value], [achievement_rate], [status], [start_date], [end_date], [notes], [deleted], [created_at], [modified_at]) VALUES (21, 2026, N'LEADING', N'안전교육 이수율', N'전 직원 안전교육 이수 비율', N'안전환경팀', N'김안전', N'MONTHLY', N'%', 95.00, 88.50, 93.16, N'ON_TRACK', '2026-01-01 00:00:00.000', '2026-12-31 00:00:00.000', NULL, 0, '2026-04-09 14:12:06.190', '2026-04-09 14:12:06.190');
INSERT INTO [tb_ehs_kpi_plan] ([id], [plan_year], [indicator_type], [indicator_name], [description], [department], [responsible_person], [measurement_period], [unit], [target_value], [current_value], [achievement_rate], [status], [start_date], [end_date], [notes], [deleted], [created_at], [modified_at]) VALUES (22, 2026, N'LEADING', N'위험성평가 완료율', N'연간 위험성평가 계획 대비 완료율', N'안전환경팀', N'이평가', N'QUARTERLY', N'%', 100.00, 75.00, 75.00, N'AT_RISK', '2026-01-01 00:00:00.000', '2026-12-31 00:00:00.000', NULL, 0, '2026-04-09 14:12:06.190', '2026-04-09 14:12:06.190');
INSERT INTO [tb_ehs_kpi_plan] ([id], [plan_year], [indicator_type], [indicator_name], [description], [department], [responsible_person], [measurement_period], [unit], [target_value], [current_value], [achievement_rate], [status], [start_date], [end_date], [notes], [deleted], [created_at], [modified_at]) VALUES (23, 2026, N'LEADING', N'안전점검 실시율', N'월간 안전점검 계획 대비 실시율', N'안전환경팀', N'박점검', N'MONTHLY', N'%', 100.00, 92.00, 92.00, N'ON_TRACK', '2026-01-01 00:00:00.000', '2026-12-31 00:00:00.000', NULL, 0, '2026-04-09 14:12:06.190', '2026-04-09 14:12:06.190');
INSERT INTO [tb_ehs_kpi_plan] ([id], [plan_year], [indicator_type], [indicator_name], [description], [department], [responsible_person], [measurement_period], [unit], [target_value], [current_value], [achievement_rate], [status], [start_date], [end_date], [notes], [deleted], [created_at], [modified_at]) VALUES (24, 2026, N'LEADING', N'아차사고 보고 건수', N'아차사고 자율 보고 활성화 목표', N'전사', N'김안전', N'MONTHLY', N'건', 50.00, 38.00, 76.00, N'AT_RISK', '2026-01-01 00:00:00.000', '2026-12-31 00:00:00.000', NULL, 0, '2026-04-09 14:12:06.190', '2026-04-09 14:12:06.190');
INSERT INTO [tb_ehs_kpi_plan] ([id], [plan_year], [indicator_type], [indicator_name], [description], [department], [responsible_person], [measurement_period], [unit], [target_value], [current_value], [achievement_rate], [status], [start_date], [end_date], [notes], [deleted], [created_at], [modified_at]) VALUES (25, 2026, N'LEADING', N'비상훈련 실시 횟수', N'연간 비상대응 훈련 실시 목표', N'안전환경팀', N'최훈련', N'QUARTERLY', N'회', 12.00, 8.00, 66.67, N'OFF_TRACK', '2026-01-01 00:00:00.000', '2026-12-31 00:00:00.000', NULL, 0, '2026-04-09 14:12:06.190', '2026-04-09 14:12:06.190');
INSERT INTO [tb_ehs_kpi_plan] ([id], [plan_year], [indicator_type], [indicator_name], [description], [department], [responsible_person], [measurement_period], [unit], [target_value], [current_value], [achievement_rate], [status], [start_date], [end_date], [notes], [deleted], [created_at], [modified_at]) VALUES (26, 2026, N'LAGGING', N'재해율', N'연간 산업재해 발생률', N'안전환경팀', N'김안전', N'YEARLY', N'%', 0.50, 0.30, 100.00, N'ACHIEVED', '2026-01-01 00:00:00.000', '2026-12-31 00:00:00.000', NULL, 0, '2026-04-09 14:12:06.190', '2026-04-09 14:12:06.190');
INSERT INTO [tb_ehs_kpi_plan] ([id], [plan_year], [indicator_type], [indicator_name], [description], [department], [responsible_person], [measurement_period], [unit], [target_value], [current_value], [achievement_rate], [status], [start_date], [end_date], [notes], [deleted], [created_at], [modified_at]) VALUES (27, 2026, N'LAGGING', N'도수율(FR)', N'백만 근로시간당 재해 건수', N'안전환경팀', N'김안전', N'YEARLY', N'건', 2.00, 1.20, 100.00, N'ACHIEVED', '2026-01-01 00:00:00.000', '2026-12-31 00:00:00.000', NULL, 0, '2026-04-09 14:12:06.190', '2026-04-09 14:12:06.190');
INSERT INTO [tb_ehs_kpi_plan] ([id], [plan_year], [indicator_type], [indicator_name], [description], [department], [responsible_person], [measurement_period], [unit], [target_value], [current_value], [achievement_rate], [status], [start_date], [end_date], [notes], [deleted], [created_at], [modified_at]) VALUES (28, 2026, N'LAGGING', N'강도율(SR)', N'천 근로시간당 근로 손실일수', N'안전환경팀', N'김안전', N'YEARLY', N'일', 0.50, 0.25, 100.00, N'ACHIEVED', '2026-01-01 00:00:00.000', '2026-12-31 00:00:00.000', NULL, 0, '2026-04-09 14:12:06.190', '2026-04-09 14:12:06.190');
INSERT INTO [tb_ehs_kpi_plan] ([id], [plan_year], [indicator_type], [indicator_name], [description], [department], [responsible_person], [measurement_period], [unit], [target_value], [current_value], [achievement_rate], [status], [start_date], [end_date], [notes], [deleted], [created_at], [modified_at]) VALUES (29, 2026, N'LAGGING', N'환경법규 위반 건수', N'연간 환경법규 위반 Zero 목표', N'환경팀', N'박환경', N'YEARLY', N'건', 0.00, 0.00, 100.00, N'ACHIEVED', '2026-01-01 00:00:00.000', '2026-12-31 00:00:00.000', NULL, 0, '2026-04-09 14:12:06.190', '2026-04-09 14:12:06.190');
INSERT INTO [tb_ehs_kpi_plan] ([id], [plan_year], [indicator_type], [indicator_name], [description], [department], [responsible_person], [measurement_period], [unit], [target_value], [current_value], [achievement_rate], [status], [start_date], [end_date], [notes], [deleted], [created_at], [modified_at]) VALUES (30, 2026, N'LAGGING', N'직업병 발생 건수', N'연간 직업병 발생 건수 목표', N'보건팀', N'이보건', N'YEARLY', N'건', 0.00, 1.00, 0.00, N'OFF_TRACK', '2026-01-01 00:00:00.000', '2026-12-31 00:00:00.000', NULL, 0, '2026-04-09 14:12:06.190', '2026-04-09 14:12:06.190');
GO
-- rows: 10
