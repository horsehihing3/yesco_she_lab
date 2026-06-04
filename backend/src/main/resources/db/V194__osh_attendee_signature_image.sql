-- OSH 위원회 참석자: 서명 여부(boolean) 제거 대신 실제 서명 이미지(base64 dataURL) 저장.
-- is_signed 컬럼은 하위 호환을 위해 남겨두되, 신규 입력은 signature_image 가 비어있지 않으면 1 로 자동 세팅.

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.tb_osh_committee_attendee')
      AND name = 'signature_image'
)
BEGIN
    ALTER TABLE dbo.tb_osh_committee_attendee
        ADD signature_image NVARCHAR(MAX) NULL;
END;
