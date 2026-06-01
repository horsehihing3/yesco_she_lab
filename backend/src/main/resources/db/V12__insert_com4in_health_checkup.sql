-- ===================================================================
-- V12: com4in 계정 건강검진 더미 데이터
-- ===================================================================

-- com4in 유저의 실제 email/username 을 찾아서 검진 데이터 삽입
-- employee_email, employee_id 둘 다 username 값으로 세팅

DECLARE @com4inEmail NVARCHAR(100) = (SELECT TOP 1 email FROM tb_user WHERE username = 'com4in');
DECLARE @com4inName NVARCHAR(50) = (SELECT TOP 1 name FROM tb_user WHERE username = 'com4in');
DECLARE @com4inDept NVARCHAR(100) = (SELECT TOP 1 department FROM tb_user WHERE username = 'com4in');

-- 이메일이 NULL이면 username 자체를 사용
IF @com4inEmail IS NULL SET @com4inEmail = 'com4in';
IF @com4inName IS NULL SET @com4inName = 'com4in';
IF @com4inDept IS NULL SET @com4inDept = 'EHS팀';

-- 기존 com4in 데이터 정리 (중복 방지)
DELETE FROM tb_health_checkup_detail WHERE checkup_id IN ('HC-2026-010','HC-2026-011','HC-2025-004');
DELETE FROM tb_health_checkup WHERE checkup_id IN ('HC-2026-010','HC-2026-011','HC-2025-004');

-- 검진 마스터 데이터
INSERT INTO tb_health_checkup (checkup_id, employee_id, employee_name, employee_dept, employee_email, checkup_year, checkup_type, is_target, checkup_status, checkup_date, hospital, overall_result, next_checkup_date, author_name, author_email, deleted) VALUES
('HC-2026-010', 'com4in', @com4inName, @com4inDept, @com4inEmail, 2026, N'일반', 1, 'COMPLETED', '2026-01-20', N'삼성서울병원', 'A', '2027-01-20', @com4inName, @com4inEmail, 0),
('HC-2026-011', 'com4in', @com4inName, @com4inDept, @com4inEmail, 2026, N'특수', 1, 'COMPLETED', '2026-03-25', N'서울아산병원', 'B', '2026-09-25', @com4inName, @com4inEmail, 0),
('HC-2025-004', 'com4in', @com4inName, @com4inDept, @com4inEmail, 2025, N'일반', 1, 'COMPLETED', '2025-02-10', N'삼성서울병원', 'A', '2026-02-10', @com4inName, @com4inEmail, 0);

-- 검진 상세 결과
INSERT INTO tb_health_checkup_detail (checkup_id, body_part, category, result_value, reference_range, result_status, notes) VALUES
('HC-2026-010', 'chest',   N'흉부 X-ray',   N'정상',      N'정상', 'normal', NULL),
('HC-2026-010', 'heart',   N'심전도',       N'정상',      N'정상', 'normal', NULL),
('HC-2026-010', 'eye',     N'시력검사',     N'1.2/1.0',   N'0.7이상', 'normal', NULL),
('HC-2026-010', 'ear',     N'청력검사',     N'정상',      N'정상', 'normal', NULL),
('HC-2026-010', 'liver',   N'간기능 (GOT)', N'25',        N'0~40', 'normal', NULL),
('HC-2026-010', 'liver',   N'간기능 (GPT)', N'20',        N'0~35', 'normal', NULL),
('HC-2026-010', 'abdomen', N'복부 초음파',  N'정상',      N'정상', 'normal', NULL),
('HC-2026-011', 'lung',    N'폐기능검사',   N'FVC 88%',   N'80%이상', 'normal', NULL),
('HC-2026-011', 'ear',     N'순음청력검사', N'좌18dB/우22dB', N'25dB이하', 'normal', NULL),
('HC-2026-011', 'chest',   N'흉부 X-ray',   N'정상',      N'정상', 'normal', NULL),
('HC-2026-011', 'liver',   N'간기능 (GOT)', N'38',        N'0~40', 'caution', N'상한선 근접'),
('HC-2026-011', 'liver',   N'간기능 (GPT)', N'42',        N'0~35', 'abnormal', N'기준치 초과 - 재검 권고'),
('HC-2025-004', 'chest',   N'흉부 X-ray',   N'정상',      N'정상', 'normal', NULL),
('HC-2025-004', 'heart',   N'심전도',       N'정상',      N'정상', 'normal', NULL),
('HC-2025-004', 'eye',     N'시력검사',     N'1.2/1.0',   N'0.7이상', 'normal', NULL),
('HC-2025-004', 'liver',   N'간기능 (GOT)', N'22',        N'0~40', 'normal', NULL),
('HC-2025-004', 'liver',   N'간기능 (GPT)', N'18',        N'0~35', 'normal', NULL);
