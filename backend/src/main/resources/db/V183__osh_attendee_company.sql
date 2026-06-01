-- ============================================================
-- V183: tb_osh_committee_attendee — 외부 참석자 소속업체 컬럼 추가 + 더미 데이터
-- EHS 협의체에 외부 직원(이름·소속업체·전화번호) 등록 지원
-- ============================================================

IF COL_LENGTH('tb_osh_committee_attendee', 'attendee_company') IS NULL
BEGIN
    ALTER TABLE tb_osh_committee_attendee ADD attendee_company NVARCHAR(255) NULL;
END;
GO

-- 최근 협의체 3건에 외부 참석자 더미 추가 (중복 방지)
DECLARE @oshId NVARCHAR(50);
DECLARE cur CURSOR FOR
    SELECT TOP 3 osh_id FROM tb_osh_committee_list ORDER BY osh_date DESC;
OPEN cur;
FETCH NEXT FROM cur INTO @oshId;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tb_osh_committee_attendee
        WHERE osh_id = @oshId AND attendee_mail LIKE 'ext-seed-%'
    )
    BEGIN
        INSERT INTO tb_osh_committee_attendee
            (osh_id, attendee_name, attendee_mail, attendee_company, attendee_phone, is_external, is_signed, created_at)
        VALUES
            (@oshId, N'박외부', 'ext-seed-park-' + @oshId + '@external', N'한국전기설비', '010-2222-3333', 1, 0, GETDATE()),
            (@oshId, N'김협력', 'ext-seed-kim-'  + @oshId + '@external', N'대성건설',     '010-4444-5555', 1, 0, GETDATE());

        -- attendee_count 동기화
        UPDATE tb_osh_committee_list
        SET attendee_count = (SELECT COUNT(*) FROM tb_osh_committee_attendee WHERE osh_id = @oshId)
        WHERE osh_id = @oshId;
    END;
    FETCH NEXT FROM cur INTO @oshId;
END;
CLOSE cur;
DEALLOCATE cur;
GO
