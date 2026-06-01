-- ============================================================
-- V184: EHS 협의체 참석자 더미 — 실 부서 트리(T_IDM_USER) 기반 재시드
--   - V183 에서 추가한 외부 참석자(ext-seed-%) 제거
--   - 최근 협의체 3건에 활성 임직원 6명씩 INTERNAL 참석자로 시드 (부서·연락처 포함)
--   - 추가로 1명만 EXTERNAL 참석자(협력업체) 유지하여 양쪽 케이스 시연
-- ============================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_osh_committee_attendee', 'U') IS NULL
   OR OBJECT_ID('tb_osh_committee_list', 'U') IS NULL
   OR OBJECT_ID('T_IDM_USER', 'U') IS NULL
BEGIN
    PRINT 'osh tables or T_IDM_USER not found, skipping V184';
    RETURN;
END
GO

-- V183 외부 더미 제거
DELETE FROM tb_osh_committee_attendee WHERE attendee_mail LIKE 'ext-seed-%';
GO

-- ============================================================
-- 최근 협의체 3건에 실 임직원 6명 시드
-- ============================================================
DECLARE @oshId NVARCHAR(50);
DECLARE cur CURSOR FOR
    SELECT TOP 3 osh_id FROM tb_osh_committee_list ORDER BY osh_date DESC;
OPEN cur;
FETCH NEXT FROM cur INTO @oshId;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tb_osh_committee_attendee
        WHERE osh_id = @oshId AND attendee_mail LIKE 'osh-int-%@hankook.com'
    )
    BEGIN
        ;WITH ranked AS (
            SELECT TOP 6
                u.UserName AS user_name,
                ISNULL(u.Email, u.UID + '@hankook.com') AS user_email,
                ISNULL(g.GroupName, u.DeptCode) AS dept_name,
                ROW_NUMBER() OVER (ORDER BY u.UIDNumber ASC) AS rn
            FROM T_IDM_USER u
            LEFT JOIN T_IDM_GROUP g ON g.CompanyCode = u.CompanyCode AND g.GroupCode = u.DeptCode
            WHERE u.UserStatus    = '10'
              AND u.ObjectCategory = N'인사임직원'
              AND u.UIDNumber IS NOT NULL
        )
        INSERT INTO tb_osh_committee_attendee
            (osh_id, attendee_name, attendee_mail, attendee_dept, attendee_company,
             attendee_phone, is_external, is_signed, signature_date, created_at)
        SELECT
            @oshId,
            user_name,
            'osh-int-' + CAST(rn AS NVARCHAR(2)) + '-' + @oshId + '@hankook.com',
            dept_name,
            NULL,
            -- 더미 휴대전화: 010-9xxx-xxxx (충돌 방지)
            '010-9' + RIGHT('000' + CAST(rn AS NVARCHAR(3)), 3) + '-' + RIGHT('0000' + CAST(ABS(CHECKSUM(NEWID())) % 10000 AS NVARCHAR(4)), 4),
            0,
            CASE WHEN rn <= 3 THEN 1 ELSE 0 END,  -- 앞 3명만 서명완료로 시연
            CASE WHEN rn <= 3 THEN GETDATE() ELSE NULL END,
            GETDATE()
        FROM ranked;

        -- 외부 참석자 1명만 시연용 추가
        INSERT INTO tb_osh_committee_attendee
            (osh_id, attendee_name, attendee_mail, attendee_dept, attendee_company,
             attendee_phone, is_external, is_signed, created_at)
        VALUES
            (@oshId, N'박외부',
             'osh-ext-park-' + @oshId + '@external',
             NULL, N'한국전기설비',
             '010-2222-3333', 1, 0, GETDATE());
    END;

    -- attendee_count 동기화
    UPDATE tb_osh_committee_list
    SET attendee_count = (SELECT COUNT(*) FROM tb_osh_committee_attendee WHERE osh_id = @oshId)
    WHERE osh_id = @oshId;

    FETCH NEXT FROM cur INTO @oshId;
END;
CLOSE cur;
DEALLOCATE cur;
GO
