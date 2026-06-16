-- 법규 대응: 개정 모니터링 필터 — 사용자 지정 법령 목록으로 업데이트
-- 법제처 API 가 반환하는 정식 명칭과 매칭되도록 일부 보정:
--   '중대재해처벌법'   → '중대재해 처벌'     (정식: 중대재해 처벌 등에 관한 법률)
--   '시설물관리법'     → '시설물의 안전'     (정식: 시설물의 안전 및 유지관리에 관한 특별법)
--   '액화석유가스관리법' → '액화석유가스'   (정식: 액화석유가스의 안전관리 및 사업법)
--   '지하안전관리특별법' → '지하안전관리'   (정식: 지하안전관리에 관한 특별법)
-- 그 외는 정식 명칭과 동일하므로 그대로 사용.

IF EXISTS (SELECT 1 FROM tb_legal_filter)
BEGIN
    UPDATE tb_legal_filter
    SET allowed_laws = N'산업안전보건법
중대재해 처벌
근로기준법
소방기본법
시설물의 안전
산업재해보상보험법
도시가스사업법
고압가스 안전관리법
액화석유가스
지하안전관리',
        updated_at = GETDATE()
    WHERE id = (SELECT MIN(id) FROM tb_legal_filter);
END
ELSE
BEGIN
    INSERT INTO tb_legal_filter (allowed_laws, updated_at)
    VALUES (N'산업안전보건법
중대재해 처벌
근로기준법
소방기본법
시설물의 안전
산업재해보상보험법
도시가스사업법
고압가스 안전관리법
액화석유가스
지하안전관리', GETDATE());
END
GO
