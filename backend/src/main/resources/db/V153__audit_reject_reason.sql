-- V153: 감사 실시 완료 결재 반려 사유(reject_reason) 컬럼 추가 + 더미 백필.

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_audit', 'U') IS NULL
    RETURN;
GO

IF COL_LENGTH('tb_audit', 'reject_reason') IS NULL
    ALTER TABLE tb_audit ADD reject_reason NVARCHAR(MAX) NULL;
GO

-- IN_PROGRESS 로 되돌려진 항목 중 사유가 비어 있으면 안내 사유 백필 (없으면 영향 없음)
UPDATE tb_audit
   SET reject_reason = N'점검 항목 보완 필요로 반려합니다. 미흡 항목 수정 후 재상신해주세요.',
       modified_at = GETDATE()
 WHERE status = 'IN_PROGRESS' AND deleted = 0
   AND completion_approved_at IS NULL
   AND (reject_reason IS NULL OR reject_reason = N'')
   AND id IN (SELECT TOP 1 id FROM tb_audit WHERE deleted = 0 ORDER BY id);
GO
