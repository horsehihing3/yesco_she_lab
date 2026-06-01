-- V152: 위험성 평가 — 반려(rejected) 상태인데 reject_reason 이 비어 있는 항목에 더미 사유 채우기.
--   상신자가 반려 시 사유를 확인할 수 있도록 안내 메시지 형태로 백필.

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_risk_assessment', 'U') IS NULL
    RETURN;
GO

UPDATE tb_risk_assessment
   SET reject_reason = N'유해위험요인 누락 / 감소대책 구체성 부족으로 반려합니다. 보완 후 재상신해주세요.',
       modified_at = GETDATE()
 WHERE status = 'rejected'
   AND (reject_reason IS NULL OR reject_reason = N'');
GO
