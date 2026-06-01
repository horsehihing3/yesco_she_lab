-- ============================================================
-- V171: tb_osh_committee_attendee — 외부 참석자 지원
-- 협력업체 EHS 협의체에 외부 직원(이름·전화번호)을 등록할 수 있도록 컬럼 추가
-- ============================================================

IF COL_LENGTH('tb_osh_committee_attendee', 'attendee_phone') IS NULL
BEGIN
    ALTER TABLE tb_osh_committee_attendee ADD attendee_phone NVARCHAR(50) NULL;
END;
GO

IF COL_LENGTH('tb_osh_committee_attendee', 'is_external') IS NULL
BEGIN
    ALTER TABLE tb_osh_committee_attendee ADD is_external BIT NOT NULL DEFAULT 0;
END;
GO
