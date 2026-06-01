-- V104: 팬오션 수급업체 평가표 (체크리스트 관리 > 팬오션 탭)
-- 21건 고정 평가 항목, 평가점수 입력 + 첨부파일 다건 (tb_file_metadata 재사용, entityType='PANOCEAN_EVAL_ITEM')

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_panocean_eval_item')
CREATE TABLE tb_panocean_eval_item (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    sort_order INT NOT NULL,
    category NVARCHAR(50) NOT NULL,
    eval_item NVARCHAR(100) NOT NULL,
    eval_content NVARCHAR(500) NOT NULL,
    max_score DECIMAL(5,1) NOT NULL,
    score DECIMAL(5,1) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);

-- 시드 데이터 (이미 있으면 건너뜀 — sort_order 기준)
IF NOT EXISTS (SELECT 1 FROM tb_panocean_eval_item)
BEGIN
    INSERT INTO tb_panocean_eval_item (sort_order, category, eval_item, eval_content, max_score) VALUES
    (1,  N'안전보건 관리체계', N'일반원칙',         N'안전보건방침 적정 여부', 5),
    (2,  N'안전보건 관리체계', N'계획수립',         N'산업재해예방 활동에 대한 수급인의 이행계획 적정 여부', 10),
    (3,  N'안전보건 관리체계', N'구조 및 책임',     N'이행계획 추진을 위한 구성원의 역할 분담', 5),
    (4,  N'실행수준',          N'위험성평가',       N'도급작업의 위험성평가 결과에 대한 이해수준 및 자체 유해·위험요인 평가수준', 5),
    (5,  N'실행수준',          N'안전점검',         N'안전점검 및 모니터링 (보호구 착용확인 포함)', 10),
    (6,  N'실행수준',          N'이행확인',         N'안전조치 이행여부 확인 (도급업체의 지도조언에 대한 이행 포함)', 10),
    (7,  N'실행수준',          N'교육 및 기록',     N'안전보건 교육 계획 및 기록관리', 5),
    (8,  N'실행수준',          N'안전작업 허가',    N'유해·위험작업에 대한 안전작업허가 이행수준', 5),
    (9,  N'운영관리',          N'신호 및 연락체계', N'도급/수급업체 간 신호/연락 체계', 5),
    (10, N'운영관리',          N'위험물질 및 설비', N'유해·위험 물질 및 취급 기계·기구 및 설비의 안전성 확인', 10),
    (11, N'운영관리',          N'비상대책',         N'비상시 대피 및 피해최소화대책 (고용부, 소방서, 병원 포함)', 10),
    (12, N'재해발생 수준',     N'산업재해 현황',    N'최근 3년간 산업재해 발생 현황', 15),
    (13, N'법령위반',          N'법령위반',         N'최근 3년간 법령 위반 현황', 5),
    (14, N'추가 가산점항목',   N'산업안전보건관리비',     N'산업안전 보건관리비 계정 적용 여부', 1),
    (15, N'추가 가산점항목',   N'안전보건관리규정',       N'안전보건관리 규정 보유/적용 여부', 1),
    (16, N'추가 가산점항목',   N'안전보건경영시스템',     N'ISO 45001 or KOSHA MS 등 인증 여부', 2),
    (17, N'추가 가산점항목',   N'위험성평가 인증',        N'위험성평가 우수사업자 인증 여부', 1),
    (18, N'추가 가산점항목',   N'항만운영협약',           N'해수부 항만운영협약 체결 대상자', 2),
    (19, N'추가 가산점항목',   N'재해경감우수기업',       N'재해경감우수기업 인증 여부', 1),
    (20, N'추가 가산점항목',   N'건강증진 우수사업장',    N'근로자 건강증진활동 우수 사업장 인증 여부', 1),
    (21, N'추가 가산점항목',   N'외부기관 포상',          N'안전보건 관련 정부협회 포상', 1);
END
