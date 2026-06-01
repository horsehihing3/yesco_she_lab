-- V144: 체크리스트 템플릿 더미데이터의 created_at 을 다양한 일자로 분산.
--   원래는 모두 마이그레이션이 돌았던 같은 시각이라 목록에서 작성일이 동일해 보이는 문제 해결.
--   카테고리별 + id 순으로 최근 12개월 안에 분산되도록 백필한다 (id*7일씩 과거로 빼기).

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_checklist_template', 'U') IS NULL
    RETURN;
GO

-- 분산 백필: 가장 최근 = 오늘, 그 이전 항목들은 id*7일 만큼 과거로 (카테고리 별로 group)
;WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY ISNULL(category_type, N'') ORDER BY id DESC) AS rn
      FROM tb_checklist_template
)
UPDATE t
   SET created_at  = DATEADD(DAY, -((r.rn - 1) * 7) - (ABS(CHECKSUM(NEWID())) % 5), GETDATE()),
       modified_at = DATEADD(DAY, -((r.rn - 1) * 7) - (ABS(CHECKSUM(NEWID())) % 5), GETDATE())
  FROM tb_checklist_template t
  JOIN ranked r ON r.id = t.id
 WHERE t.created_at IS NULL
    OR CAST(t.created_at AS DATE) >= DATEADD(DAY, -1, CAST(GETDATE() AS DATE));
GO

-- tb_eval_sheet_meta 도 동일 처리 (한 행 짜리지만 NULL/오늘이면 한 달 전으로 백필)
IF OBJECT_ID('tb_eval_sheet_meta', 'U') IS NOT NULL
BEGIN
    UPDATE tb_eval_sheet_meta
       SET created_at  = COALESCE(created_at,  DATEADD(DAY, -30, GETDATE())),
           modified_at = COALESCE(modified_at, DATEADD(DAY, -30, GETDATE()))
     WHERE created_at IS NULL
        OR CAST(created_at AS DATE) >= DATEADD(DAY, -1, CAST(GETDATE() AS DATE));
END
GO
