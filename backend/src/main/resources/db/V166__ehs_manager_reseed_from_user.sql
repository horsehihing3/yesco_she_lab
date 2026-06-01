-- V166: EHS 직책자 명단 더미데이터 T_IDM_USER 기반 재시드
--   EHS 담당자 / 근로자 위원 / Compliance Advisor 3 카테고리 모두 채움.
--   T_IDM_USER 활성 인사임직원과 T_IDM_COMPANY / T_IDM_GROUP 을 JOIN 하여
--   user_name·user_mail·user_dept·user_company 컬럼을 실제 직원 정보로 동기화.

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_ehs_manager', 'U') IS NULL OR OBJECT_ID('T_IDM_USER', 'U') IS NULL
BEGIN
    PRINT 'tb_ehs_manager or T_IDM_USER not found, skipping V166 reseed';
    RETURN;
END
GO

-- 기존 더미 전체 삭제
DELETE FROM tb_ehs_manager;
GO

-- T_IDM_USER 활성 직원 중 13명을 가져와 카테고리별로 분배
;WITH ranked AS (
    SELECT
        u.UserName       AS name,
        ISNULL(u.Email, u.UID) AS email,
        ISNULL(g.GroupName, u.DeptCode) AS dept_name,
        ISNULL(c.Name, u.CompanyCode)    AS company_name,
        ROW_NUMBER() OVER (ORDER BY u.UIDNumber ASC) AS rn
    FROM T_IDM_USER u
    LEFT JOIN T_IDM_COMPANY c ON c.CompanyCode = u.CompanyCode
    LEFT JOIN T_IDM_GROUP   g ON g.CompanyCode = u.CompanyCode AND g.GroupCode = u.DeptCode
    WHERE u.UserStatus    = '10'
      AND u.ObjectCategory = N'인사임직원'
      AND u.UIDNumber IS NOT NULL
)
INSERT INTO tb_ehs_manager (
    role_category, role_detail, role_place, role_idx,
    user_name, user_mail, user_dept, user_company,
    role_ca_hd, role_ca_field, role_ca_team,
    is_admin, active, created_at
)
SELECT
    CASE
        WHEN rn <=  5 THEN N'EHS'
        WHEN rn <=  9 THEN N'근로자위원'
        ELSE              N'CA'
    END AS role_category,
    CASE rn
        WHEN  1 THEN N'EHS 팀장'
        WHEN  2 THEN N'안전 관리자'
        WHEN  3 THEN N'보건 관리자'
        WHEN  4 THEN N'환경 관리자'
        WHEN  5 THEN N'EHS 팀원'
        WHEN  6 THEN N'생산팀 대표'
        WHEN  7 THEN N'정비팀 대표'
        WHEN  8 THEN N'품질팀 대표'
        WHEN  9 THEN N'물류팀 대표'
        WHEN 10 THEN N'Field Compliance Officer'
        WHEN 11 THEN N'HQ Compliance Officer'
        WHEN 12 THEN N'Team Compliance Officer'
        ELSE         N'Senior Compliance Counsel'
    END AS role_detail,
    CASE
        WHEN rn <= 5 THEN N'본사'
        WHEN rn <= 9 THEN N'생산동 A'
        ELSE              N'본사'
    END AS role_place,
    RIGHT('0' + CAST(rn AS NVARCHAR(2)), 2) AS role_idx,
    name, email, dept_name, company_name,
    CASE WHEN rn >= 10 THEN N'경영본부'   ELSE NULL END AS role_ca_hd,
    CASE WHEN rn >= 10 THEN N'EHS 부문'    ELSE NULL END AS role_ca_field,
    CASE WHEN rn >= 10 THEN N'Compliance 팀' ELSE NULL END AS role_ca_team,
    0, 1, GETDATE()
FROM ranked
WHERE rn <= 13;
GO
