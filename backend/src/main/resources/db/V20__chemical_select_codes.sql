-- =====================================================
-- V20: 화학물질 관리 셀렉트박스 코드 그룹 추가
-- MSDS, GHS, REACH, CLP, TSCA 관련
-- =====================================================

-- ===== MSDS_STATUS =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'MSDS_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('MSDS_STATUS', N'MSDS 상태', N'MSDS 유효 상태', 1, 720, GETDATE(), GETDATE());
END;
DECLARE @msdsStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'MSDS_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @msdsStatusId AND code = 'VALID')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@msdsStatusId, 'VALID',       'VALID',       N'유효',     'Valid',       N'有效',     1, 1, GETDATE(), GETDATE()),
    (@msdsStatusId, 'NEED_UPDATE', 'NEED_UPDATE', N'갱신필요', 'Need Update', N'需更新',   1, 2, GETDATE(), GETDATE()),
    (@msdsStatusId, 'RETIRED',     'RETIRED',     N'폐기',     'Retired',     N'已废弃',   1, 3, GETDATE(), GETDATE());
END;

-- ===== MSDS_CHANGE_TYPE =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'MSDS_CHANGE_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('MSDS_CHANGE_TYPE', N'MSDS 변경 유형', N'MSDS 이력 변경 유형', 1, 721, GETDATE(), GETDATE());
END;
DECLARE @msdsChangeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'MSDS_CHANGE_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @msdsChangeId AND code = 'LATEST')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@msdsChangeId, 'LATEST', 'LATEST', N'최신',   'Latest',  N'最新', 1, 1, GETDATE(), GETDATE()),
    (@msdsChangeId, 'OLD',    'OLD',    N'구버전', 'Old',     N'旧版', 1, 2, GETDATE(), GETDATE());
END;

-- ===== GHS_STATUS =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'GHS_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('GHS_STATUS', N'GHS 분류 상태', N'GHS 분류 상태 코드', 1, 722, GETDATE(), GETDATE());
END;
DECLARE @ghsStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'GHS_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @ghsStatusId AND code = 'LATEST')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@ghsStatusId, 'LATEST',      'LATEST',      N'최신',     'Latest',      N'最新',   1, 1, GETDATE(), GETDATE()),
    (@ghsStatusId, 'NEED_UPDATE', 'NEED_UPDATE', N'갱신필요', 'Need Update', N'需更新', 1, 2, GETDATE(), GETDATE());
END;

-- ===== CLP_SIGNAL_WORD =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CLP_SIGNAL_WORD')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CLP_SIGNAL_WORD', N'CLP 신호어', N'EU CLP 신호어 코드', 1, 723, GETDATE(), GETDATE());
END;
DECLARE @clpSignalId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CLP_SIGNAL_WORD');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @clpSignalId AND code = 'DANGER')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@clpSignalId, 'DANGER',  'Danger',  N'위험', 'Danger',  N'危险', 1, 1, GETDATE(), GETDATE()),
    (@clpSignalId, 'WARNING', 'Warning', N'경고', 'Warning', N'警告', 1, 2, GETDATE(), GETDATE());
END;

-- ===== CLP_STATUS =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'CLP_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('CLP_STATUS', N'CLP 상태', N'EU CLP 분류 상태', 1, 724, GETDATE(), GETDATE());
END;
DECLARE @clpStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'CLP_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @clpStatusId AND code = 'LATEST')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@clpStatusId, 'LATEST',      'LATEST',      N'최신',     'Latest',      N'最新',   1, 1, GETDATE(), GETDATE()),
    (@clpStatusId, 'NEED_UPDATE', 'NEED_UPDATE', N'갱신필요', 'Need Update', N'需更新', 1, 2, GETDATE(), GETDATE());
END;

-- ===== REACH_YN (SVHC, 허가대상 공용) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'REACH_YN')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('REACH_YN', N'REACH 해당여부', N'REACH SVHC/허가 해당 여부', 1, 725, GETDATE(), GETDATE());
END;
DECLARE @reachYnId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'REACH_YN');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @reachYnId AND code = 'Y')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@reachYnId, 'Y', 'Y', N'해당',   'Yes', N'是', 1, 1, GETDATE(), GETDATE()),
    (@reachYnId, 'N', 'N', N'비해당', 'No',  N'否', 1, 2, GETDATE(), GETDATE());
END;

-- ===== REACH_STATUS =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'REACH_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('REACH_STATUS', N'REACH 상태', N'EU REACH 등록 상태', 1, 726, GETDATE(), GETDATE());
END;
DECLARE @reachStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'REACH_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @reachStatusId AND code = 'REGISTERED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@reachStatusId, 'REGISTERED',   'REGISTERED',   N'등록완료', 'Registered',   N'已注册',   1, 1, GETDATE(), GETDATE()),
    (@reachStatusId, 'NEED_UPDATE',  'NEED_UPDATE',  N'갱신필요', 'Need Update',  N'需更新',   1, 2, GETDATE(), GETDATE()),
    (@reachStatusId, 'UNDER_REVIEW', 'UNDER_REVIEW', N'검토중',   'Under Review', N'审查中',   1, 3, GETDATE(), GETDATE());
END;

-- ===== TSCA_INVENTORY =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'TSCA_INVENTORY')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('TSCA_INVENTORY', N'TSCA Inventory 상태', N'TSCA 등재 상태', 1, 727, GETDATE(), GETDATE());
END;
DECLARE @tscaInvId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'TSCA_INVENTORY');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @tscaInvId AND code = 'LISTED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@tscaInvId, 'LISTED',   'LISTED',   N'등재',   'Listed',   N'已登记', 1, 1, GETDATE(), GETDATE()),
    (@tscaInvId, 'UNLISTED', 'UNLISTED', N'미등재', 'Unlisted', N'未登记', 1, 2, GETDATE(), GETDATE());
END;

-- ===== TSCA_PMN (PMN 여부, Y/N 공용) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'TSCA_PMN')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('TSCA_PMN', N'TSCA PMN 여부', N'TSCA PMN 제출 필요 여부', 1, 728, GETDATE(), GETDATE());
END;
DECLARE @tscaPmnId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'TSCA_PMN');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @tscaPmnId AND code = 'Y')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@tscaPmnId, 'Y', 'Y', N'필요',   'Required',     N'需要', 1, 1, GETDATE(), GETDATE()),
    (@tscaPmnId, 'N', 'N', N'불필요', 'Not Required', N'不需要', 1, 2, GETDATE(), GETDATE());
END;

-- ===== TSCA_STATUS =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'TSCA_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('TSCA_STATUS', N'TSCA 상태', N'TSCA 적합 상태', 1, 729, GETDATE(), GETDATE());
END;
DECLARE @tscaStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'TSCA_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @tscaStatusId AND code = 'COMPLIANT')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@tscaStatusId, 'COMPLIANT',    'COMPLIANT',    N'적합',     'Compliant',    N'合规',     1, 1, GETDATE(), GETDATE()),
    (@tscaStatusId, 'UNDER_REVIEW', 'UNDER_REVIEW', N'검토중',   'Under Review', N'审查中',   1, 2, GETDATE(), GETDATE()),
    (@tscaStatusId, 'ACTION_NEEDED','ACTION_NEEDED',N'조치필요', 'Action Needed',N'需处理',   1, 3, GETDATE(), GETDATE());
END;

-- ===== MSDS_LANGUAGE =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'MSDS_LANGUAGE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('MSDS_LANGUAGE', N'MSDS 언어', N'MSDS 문서 언어', 1, 730, GETDATE(), GETDATE());
END;
DECLARE @msdsLangId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'MSDS_LANGUAGE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @msdsLangId AND code = 'KOR')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@msdsLangId, 'KOR', 'KOR', N'한국어 (KOR)',   'Korean (KOR)',   N'韩语 (KOR)',   1, 1, GETDATE(), GETDATE()),
    (@msdsLangId, 'ENG', 'ENG', N'English (ENG)',   'English (ENG)',  N'英语 (ENG)',   1, 2, GETDATE(), GETDATE()),
    (@msdsLangId, 'CHN', 'CHN', N'中文 (CHN)',      'Chinese (CHN)',  N'中文 (CHN)',   1, 3, GETDATE(), GETDATE()),
    (@msdsLangId, 'JPN', 'JPN', N'日本語 (JPN)',    'Japanese (JPN)', N'日语 (JPN)',   1, 4, GETDATE(), GETDATE()),
    (@msdsLangId, 'DEU', 'DEU', N'Deutsch (DEU)',   'German (DEU)',   N'德语 (DEU)',   1, 5, GETDATE(), GETDATE()),
    (@msdsLangId, 'FRA', 'FRA', N'Français (FRA)',  'French (FRA)',   N'法语 (FRA)',   1, 6, GETDATE(), GETDATE()),
    (@msdsLangId, 'ESP', 'ESP', N'Español (ESP)',   'Spanish (ESP)',  N'西班牙语 (ESP)', 1, 7, GETDATE(), GETDATE());
END;
