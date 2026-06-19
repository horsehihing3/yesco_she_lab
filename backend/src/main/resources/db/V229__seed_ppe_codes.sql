-- ════════════════════════════════════════════════════════════════════
-- V229 — 보호구·장비(PPE) 신규 9개 코드 그룹 시드
-- ════════════════════════════════════════════════════════════════════
-- 9개 그룹: PPE_CATEGORY/PPE_LOCATION/PPE_ISSUE_REASON/PPE_ISSUE_STATUS/
--           PPE_INSPECTION_TYPE/PPE_INSPECTION_RESULT/PPE_WEAR_STATUS/
--           PPE_PERFORMANCE_RESULT/PPE_INOUT_TYPE
-- 멱등: 그룹 UPSERT + detail DELETE 후 재시드.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. PPE_CATEGORY ─────────────────────────────────────────────
DECLARE @groupId BIGINT;
IF NOT EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'PPE_CATEGORY')
    INSERT INTO tb_code_group (group_code, group_name, is_active, sort_order, created_at, modified_at)
    VALUES ('PPE_CATEGORY', N'보호구 카테고리', 1, 1, SYSDATETIME(), SYSDATETIME());

SELECT @groupId = id FROM tb_code_group WHERE group_code = 'PPE_CATEGORY';
DELETE FROM tb_code_detail WHERE group_id = @groupId;
INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
(@groupId, 'HEAD',        'HEAD',        N'두부보호(안전모)',      N'Head Protection',       N'头部防护(安全帽)',     1, 1, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'EYE',         'EYE',         N'눈/안면 보호(보안경)',  N'Eye/Face Protection',   N'眼/面部防护(护目镜)',   1, 2, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'RESPIRATORY', 'RESPIRATORY', N'호흡기 보호(마스크)',   N'Respiratory Protection',N'呼吸防护(口罩)',       1, 3, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'HEARING',     'HEARING',     N'청력 보호(귀마개)',     N'Hearing Protection',    N'听力防护(耳塞)',       1, 4, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'HAND',        'HAND',        N'손 보호(안전장갑)',     N'Hand Protection',       N'手部防护(安全手套)',   1, 5, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'FOOT',        'FOOT',        N'발 보호(안전화)',       N'Foot Protection',       N'脚部防护(安全鞋)',     1, 6, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'FALL',        'FALL',        N'추락 보호(안전대)',     N'Fall Protection',       N'坠落防护(安全带)',     1, 7, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'BODY',        'BODY',        N'전신 보호(방호복)',     N'Body Protection',       N'全身防护(防护服)',     1, 8, SYSDATETIME(), SYSDATETIME());
GO

-- ── 2. PPE_LOCATION ─────────────────────────────────────────────
DECLARE @groupId BIGINT;
IF NOT EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'PPE_LOCATION')
    INSERT INTO tb_code_group (group_code, group_name, is_active, sort_order, created_at, modified_at)
    VALUES ('PPE_LOCATION', N'보호구 보관 창고', 1, 1, SYSDATETIME(), SYSDATETIME());

SELECT @groupId = id FROM tb_code_group WHERE group_code = 'PPE_LOCATION';
DELETE FROM tb_code_detail WHERE group_id = @groupId;
INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
(@groupId, 'CENTRAL', 'CENTRAL', N'중앙창고',     N'Central Warehouse',      N'中央仓库',     1, 1, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'SAFETY',  'SAFETY',  N'안전용품창고', N'Safety Goods Warehouse', N'安全用品仓库', 1, 2, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'FIELD_A', 'FIELD_A', N'현장창고A',    N'Field Warehouse A',      N'现场仓库A',    1, 3, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'FIELD_B', 'FIELD_B', N'현장창고B',    N'Field Warehouse B',      N'现场仓库B',    1, 4, SYSDATETIME(), SYSDATETIME());
GO

-- ── 3. PPE_ISSUE_REASON ─────────────────────────────────────────
DECLARE @groupId BIGINT;
IF NOT EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'PPE_ISSUE_REASON')
    INSERT INTO tb_code_group (group_code, group_name, is_active, sort_order, created_at, modified_at)
    VALUES ('PPE_ISSUE_REASON', N'보호구 지급 사유', 1, 1, SYSDATETIME(), SYSDATETIME());

SELECT @groupId = id FROM tb_code_group WHERE group_code = 'PPE_ISSUE_REASON';
DELETE FROM tb_code_detail WHERE group_id = @groupId;
INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
(@groupId, 'NEW',          'NEW',          N'신규지급',   N'New Issue',      N'新发放',  1, 1, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'CYCLE',        'CYCLE',        N'정기교체',   N'Cycle Replace',  N'定期更换',1, 2, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'DAMAGE',       'DAMAGE',       N'파손교체',   N'Damage Replace', N'损坏更换',1, 3, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'LOSS_REISSUE', 'LOSS_REISSUE', N'분실재지급', N'Loss Reissue',   N'丢失补发',1, 4, SYSDATETIME(), SYSDATETIME());
GO

-- ── 4. PPE_ISSUE_STATUS ─────────────────────────────────────────
DECLARE @groupId BIGINT;
IF NOT EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'PPE_ISSUE_STATUS')
    INSERT INTO tb_code_group (group_code, group_name, is_active, sort_order, created_at, modified_at)
    VALUES ('PPE_ISSUE_STATUS', N'보호구 지급 상태', 1, 1, SYSDATETIME(), SYSDATETIME());

SELECT @groupId = id FROM tb_code_group WHERE group_code = 'PPE_ISSUE_STATUS';
DELETE FROM tb_code_detail WHERE group_id = @groupId;
INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
(@groupId, 'ISSUED',   'ISSUED',   N'지급완료', N'Issued',          N'已发放',  1, 1, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'RETURNED', 'RETURNED', N'반납완료', N'Returned',        N'已归还',  1, 2, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'REPLACE',  'REPLACE',  N'교체요청', N'Replace Request', N'更换申请',1, 3, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'LOSS',     'LOSS',     N'분실신고', N'Loss Reported',   N'丢失报告',1, 4, SYSDATETIME(), SYSDATETIME());
GO

-- ── 5. PPE_INSPECTION_TYPE ──────────────────────────────────────
DECLARE @groupId BIGINT;
IF NOT EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'PPE_INSPECTION_TYPE')
    INSERT INTO tb_code_group (group_code, group_name, is_active, sort_order, created_at, modified_at)
    VALUES ('PPE_INSPECTION_TYPE', N'보호구 점검 유형', 1, 1, SYSDATETIME(), SYSDATETIME());

SELECT @groupId = id FROM tb_code_group WHERE group_code = 'PPE_INSPECTION_TYPE';
DELETE FROM tb_code_detail WHERE group_id = @groupId;
INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
(@groupId, 'REGULAR', 'REGULAR', N'정기검사', N'Regular Inspection', N'定期检查',1, 1, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'SELF',    'SELF',    N'자체점검', N'Self Inspection',    N'自查',    1, 2, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'PRE',     'PRE',     N'사전점검', N'Pre Inspection',     N'预先检查',1, 3, SYSDATETIME(), SYSDATETIME());
GO

-- ── 6. PPE_INSPECTION_RESULT ────────────────────────────────────
DECLARE @groupId BIGINT;
IF NOT EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'PPE_INSPECTION_RESULT')
    INSERT INTO tb_code_group (group_code, group_name, is_active, sort_order, created_at, modified_at)
    VALUES ('PPE_INSPECTION_RESULT', N'보호구 점검 결과', 1, 1, SYSDATETIME(), SYSDATETIME());

SELECT @groupId = id FROM tb_code_group WHERE group_code = 'PPE_INSPECTION_RESULT';
DELETE FROM tb_code_detail WHERE group_id = @groupId;
INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
(@groupId, 'PASS',        'PASS',        N'합격',       N'Pass',            N'合格',      1, 1, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'CONDITIONAL', 'CONDITIONAL', N'조건부합격', N'Conditional Pass',N'有条件合格',1, 2, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'FAIL',        'FAIL',        N'불합격',     N'Fail',            N'不合格',    1, 3, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'DISPOSE',     'DISPOSE',     N'폐기',       N'Dispose',         N'废弃',      1, 4, SYSDATETIME(), SYSDATETIME());
GO

-- ── 7. PPE_WEAR_STATUS ──────────────────────────────────────────
DECLARE @groupId BIGINT;
IF NOT EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'PPE_WEAR_STATUS')
    INSERT INTO tb_code_group (group_code, group_name, is_active, sort_order, created_at, modified_at)
    VALUES ('PPE_WEAR_STATUS', N'보호구 착용 상태', 1, 1, SYSDATETIME(), SYSDATETIME());

SELECT @groupId = id FROM tb_code_group WHERE group_code = 'PPE_WEAR_STATUS';
DELETE FROM tb_code_detail WHERE group_id = @groupId;
INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
(@groupId, 'OK',        'OK',        N'착용확인',   N'Worn',            N'确认佩戴', 1, 1, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'VIOLATION', 'VIOLATION', N'미착용',     N'Not Worn',        N'未佩戴',   1, 2, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'IMPROPER',  'IMPROPER',  N'부적정착용', N'Improperly Worn', N'佩戴不当', 1, 3, SYSDATETIME(), SYSDATETIME());
GO

-- ── 8. PPE_PERFORMANCE_RESULT ───────────────────────────────────
DECLARE @groupId BIGINT;
IF NOT EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'PPE_PERFORMANCE_RESULT')
    INSERT INTO tb_code_group (group_code, group_name, is_active, sort_order, created_at, modified_at)
    VALUES ('PPE_PERFORMANCE_RESULT', N'보호구 성능 평가 결과', 1, 1, SYSDATETIME(), SYSDATETIME());

SELECT @groupId = id FROM tb_code_group WHERE group_code = 'PPE_PERFORMANCE_RESULT';
DELETE FROM tb_code_detail WHERE group_id = @groupId;
INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
(@groupId, 'MEET',    'MEET',    N'기준충족', N'Meets Standard',   N'达标',   1, 1, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'BELOW',   'BELOW',   N'성능미달', N'Below Standard',   N'不达标', 1, 2, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'PENDING', 'PENDING', N'평가중',   N'Under Evaluation', N'评估中', 1, 3, SYSDATETIME(), SYSDATETIME());
GO

-- ── 9. PPE_INOUT_TYPE ───────────────────────────────────────────
DECLARE @groupId BIGINT;
IF NOT EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'PPE_INOUT_TYPE')
    INSERT INTO tb_code_group (group_code, group_name, is_active, sort_order, created_at, modified_at)
    VALUES ('PPE_INOUT_TYPE', N'보호구 입출고 유형', 1, 1, SYSDATETIME(), SYSDATETIME());

SELECT @groupId = id FROM tb_code_group WHERE group_code = 'PPE_INOUT_TYPE';
DELETE FROM tb_code_detail WHERE group_id = @groupId;
INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
(@groupId, 'IN',  'IN',  N'입고', N'In',  N'入库', 1, 1, SYSDATETIME(), SYSDATETIME()),
(@groupId, 'OUT', 'OUT', N'출고', N'Out', N'出库', 1, 2, SYSDATETIME(), SYSDATETIME());
GO
