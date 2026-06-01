-- ===== Code Group: PPE_REQUEST_STATUS (보호구 신청 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'PPE_REQUEST_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('PPE_REQUEST_STATUS', N'보호구 신청 상태', N'보호구 지급 신청 상태 코드', 1, 110, GETDATE(), GETDATE());
END;

DECLARE @ppeReqStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'PPE_REQUEST_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @ppeReqStatusId AND code = 'REQUESTED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@ppeReqStatusId, 'REQUESTED',  'REQUESTED',  N'신청',     'Requested',  N'已申请', 1, 1, GETDATE(), GETDATE()),
    (@ppeReqStatusId, 'APPROVED',   'APPROVED',   N'승인',     'Approved',   N'已批准', 1, 2, GETDATE(), GETDATE()),
    (@ppeReqStatusId, 'ISSUED',     'ISSUED',     N'지급완료', 'Issued',     N'已发放', 1, 3, GETDATE(), GETDATE()),
    (@ppeReqStatusId, 'REJECTED',   'REJECTED',   N'반려',     'Rejected',   N'已驳回', 1, 4, GETDATE(), GETDATE()),
    (@ppeReqStatusId, 'CANCELLED',  'CANCELLED',  N'취소',     'Cancelled',  N'已取消', 1, 5, GETDATE(), GETDATE());
END;

-- ===== Table: tb_ppe_request =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_ppe_request')
BEGIN
    CREATE TABLE tb_ppe_request (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        request_id          NVARCHAR(30) NOT NULL,
        status              NVARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
        equipment_id        BIGINT,
        item_name           NVARCHAR(100) NOT NULL,
        item_category       NVARCHAR(50),
        item_model          NVARCHAR(100),
        quantity            INT NOT NULL DEFAULT 1,
        reason              NVARCHAR(500),
        requester_name      NVARCHAR(50),
        requester_dept      NVARCHAR(100),
        requester_id        NVARCHAR(50),
        request_date        DATETIME NOT NULL DEFAULT GETDATE(),
        approver_name       NVARCHAR(50),
        approver_dept       NVARCHAR(100),
        approver_id         NVARCHAR(50),
        approved_at         DATETIME,
        issued_at           DATETIME,
        rejection_reason    NVARCHAR(500),
        notes               NVARCHAR(500),
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== Dummy Data =====
DELETE FROM tb_ppe_request;

INSERT INTO tb_ppe_request (request_id, status, item_name, item_category, item_model, quantity, reason, requester_name, requester_dept, requester_id, request_date, approver_name, approver_dept, approved_at, issued_at, notes)
SELECT 'PPE-REQ-2026-001', 'ISSUED',
       N'방진 마스크 KF94', 'RESPIRATORY', N'KF94 대형', 10,
       N'현장 작업 투입 인원 증가로 추가 지급 필요',
       u1.UserName, u1.DeptCode, u1.UID, '2026-03-25 09:00:00',
       u2.UserName, u2.DeptCode, '2026-03-25 10:30:00', '2026-03-25 14:00:00', N'긴급 요청 - 당일 지급 완료'
FROM (SELECT TOP 1 UserName, DeptCode, UID FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' AND UID IS NOT NULL ORDER BY NEWID()) u1,
     (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u2;

INSERT INTO tb_ppe_request (request_id, status, item_name, item_category, item_model, quantity, reason, requester_name, requester_dept, requester_id, request_date, approver_name, approver_dept, approved_at, notes)
SELECT 'PPE-REQ-2026-002', 'APPROVED',
       N'안전화 (경량)', 'BODY_PROTECTION', '260mm', 2,
       N'신규 입사자 안전화 지급 요청',
       u1.UserName, u1.DeptCode, u1.UID, '2026-03-28 11:00:00',
       u2.UserName, u2.DeptCode, '2026-03-28 15:00:00', N'창고 재고 확인 후 지급 예정'
FROM (SELECT TOP 1 UserName, DeptCode, UID FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' AND UID IS NOT NULL ORDER BY NEWID()) u1,
     (SELECT TOP 1 UserName, DeptCode FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' ORDER BY NEWID()) u2;

INSERT INTO tb_ppe_request (request_id, status, item_name, item_category, item_model, quantity, reason, requester_name, requester_dept, requester_id, request_date, notes)
SELECT 'PPE-REQ-2026-003', 'REQUESTED',
       N'내화학성 장갑', 'BODY_PROTECTION', 'L', 5,
       N'화학물질 취급 작업 예정으로 장갑 추가 필요',
       u1.UserName, u1.DeptCode, u1.UID, '2026-03-31 08:30:00', NULL
FROM (SELECT TOP 1 UserName, DeptCode, UID FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' AND UID IS NOT NULL ORDER BY NEWID()) u1;

INSERT INTO tb_ppe_request (request_id, status, item_name, item_category, item_model, quantity, reason, requester_name, requester_dept, requester_id, request_date, notes)
SELECT 'PPE-REQ-2026-004', 'REQUESTED',
       N'안전대 (전신식)', 'FALL_PROTECTION', 'SF-H1', 3,
       N'고소작업 예정 - 안전대 점검 후 교체 필요',
       u1.UserName, u1.DeptCode, u1.UID, '2026-04-01 09:15:00', N'기존 안전대 유효기간 만료'
FROM (SELECT TOP 1 UserName, DeptCode, UID FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' AND UID IS NOT NULL ORDER BY NEWID()) u1;

INSERT INTO tb_ppe_request (request_id, status, item_name, item_category, item_model, quantity, reason, requester_name, requester_dept, requester_id, request_date, rejection_reason, notes)
SELECT 'PPE-REQ-2026-005', 'REJECTED',
       N'공기호흡기 (SCBA)', 'RESPIRATORY', 'AP-50', 1,
       N'비상 대비용 추가 배치 요청',
       u1.UserName, u1.DeptCode, u1.UID, '2026-03-20 14:00:00',
       N'현재 재고 충분. 다음 분기 예산 편성 시 재검토', N'반려 후 재신청 예정'
FROM (SELECT TOP 1 UserName, DeptCode, UID FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' AND UID IS NOT NULL ORDER BY NEWID()) u1;

INSERT INTO tb_ppe_request (request_id, status, item_name, item_category, item_model, quantity, reason, requester_name, requester_dept, requester_id, request_date, notes)
SELECT 'PPE-REQ-2026-006', 'REQUESTED',
       N'귀마개 (폼)', 'BODY_PROTECTION', 'NRR33', 50,
       N'월간 정기 지급 - 생산라인 전체',
       u1.UserName, u1.DeptCode, u1.UID, '2026-04-01 08:00:00', N'매월 초 정기 신청'
FROM (SELECT TOP 1 UserName, DeptCode, UID FROM T_IDM_USER WHERE UserStatus='10' AND ObjectCategory=N'인사임직원' AND UID IS NOT NULL ORDER BY NEWID()) u1;
