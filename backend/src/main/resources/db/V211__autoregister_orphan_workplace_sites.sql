-- ============================================================
-- V211: 도면관리 "사업장 미지정" 정리
--   - tb_floor_drawing 의 site / name 컬럼 값 중 tb_workplace_site 에 매칭되는
--     site_name 이 없는 항목들을 자동으로 사업장 등록
--   - 도면관리 트리에서 더 이상 "(사업장 미지정)" 그룹이 생기지 않도록 함
--   - building_number 는 기존 최대값 다음 번호부터 'B30-NNNN' 형식으로 자동 부여
-- ============================================================

SET NOCOUNT ON;
GO

-- 1) 다음 사용 가능한 building_number 일련번호 계산
DECLARE @nextSeq INT = ISNULL(
    (SELECT MAX(CAST(SUBSTRING(building_number, 5, 10) AS INT))
     FROM tb_workplace_site
     WHERE building_number LIKE 'B30-[0-9][0-9][0-9][0-9]'),
    0
) + 1;

-- 2) 도면 테이블에 등장하지만 사업장으로 등록되지 않은 이름들 수집
--    (site 컬럼 + name 컬럼 둘 다 검사 — 매칭 로직이 OR 이므로)
;WITH OrphanNames AS (
    SELECT DISTINCT LTRIM(RTRIM(s)) AS site_name
    FROM (
        SELECT site AS s FROM tb_floor_drawing
        WHERE active = 1 AND site IS NOT NULL AND LTRIM(RTRIM(site)) <> ''
        UNION
        SELECT name AS s FROM tb_floor_drawing
        WHERE active = 1 AND name IS NOT NULL AND LTRIM(RTRIM(name)) <> ''
    ) src
    WHERE NOT EXISTS (
        SELECT 1 FROM tb_workplace_site ws
        WHERE ws.site_name = LTRIM(RTRIM(src.s))
    )
),
Numbered AS (
    SELECT site_name,
           ROW_NUMBER() OVER (ORDER BY site_name) AS rn
    FROM OrphanNames
)
INSERT INTO tb_workplace_site (
    building_number, site_name, operation_status, active, created_at, modified_at
)
SELECT
    'B30-' + RIGHT('0000' + CAST(@nextSeq + rn - 1 AS NVARCHAR(10)), 4),
    site_name,
    'ACTIVE',
    1,
    GETDATE(),
    GETDATE()
FROM Numbered;
GO
