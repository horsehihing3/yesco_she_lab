-- 법규 대응: 개정 모니터링 필터링용 법령 텍스트 (개행 구분)
IF OBJECT_ID('tb_legal_filter','U') IS NULL
BEGIN
CREATE TABLE tb_legal_filter (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    allowed_laws NVARCHAR(MAX) NULL,   -- 매칭 키워드(개행 구분). law_name 이 키워드를 포함하면 매칭
    updated_at DATETIME NOT NULL DEFAULT GETDATE()
);

INSERT INTO tb_legal_filter (allowed_laws, updated_at)
VALUES (N'산업안전보건법
중대재해처벌법
근로기준법
소방기본법
시설물관리법
산업재해보상보험법
도시가스사업법
고압가스 안전관리법
액화석유가스의 안전관리 및 사업법
지하안전관리에 관한 특별법', GETDATE());
END
GO
