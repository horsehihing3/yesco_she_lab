-- Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_qna_post' AND xtype='U')
CREATE TABLE tb_qna_post (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(500) NOT NULL,
    content NVARCHAR(MAX),
    category NVARCHAR(50),
    author_name NVARCHAR(100),
    author_dept NVARCHAR(100),
    author_email NVARCHAR(200),
    views INT DEFAULT 0,
    is_answered BIT DEFAULT 0,
    answer NVARCHAR(MAX),
    answer_author_name NVARCHAR(100),
    answer_author_dept NVARCHAR(100),
    answer_date DATETIME2,
    is_public BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);

-- ===== Code Group: QNA_CATEGORY (Q&A 분류) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'QNA_CATEGORY')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('QNA_CATEGORY', N'Q&A 분류', N'Q&A 게시판 분류 코드', 1, 1200, GETDATE(), GETDATE());
END;

DECLARE @qnaCategoryGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'QNA_CATEGORY');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @qnaCategoryGroupId AND code = 'GENERAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@qnaCategoryGroupId, 'GENERAL',     'GENERAL',     N'일반',   'General',     N'一般', 1, 1, GETDATE(), GETDATE()),
    (@qnaCategoryGroupId, 'SAFETY',      'SAFETY',      N'안전',   'Safety',      N'安全', 1, 2, GETDATE(), GETDATE()),
    (@qnaCategoryGroupId, 'ENVIRONMENT', 'ENVIRONMENT', N'환경',   'Environment', N'环境', 1, 3, GETDATE(), GETDATE()),
    (@qnaCategoryGroupId, 'HEALTH',      'HEALTH',      N'보건',   'Health',      N'保健', 1, 4, GETDATE(), GETDATE());
END;

-- Dummy data (mix of answered and unanswered)
INSERT INTO tb_qna_post (title, content, category, author_name, author_dept, author_email, views, is_answered, answer, answer_author_name, answer_author_dept, answer_date, is_public)
VALUES
(N'안전화 지급 기준이 어떻게 되나요?', N'신규 입사자 안전화 지급 기준과 교체 주기가 궁금합니다.', 'SAFETY', N'박진호', N'설비팀', 'park@company.com', 23, 1, N'안전화는 입사 시 1족 지급되며, 교체 주기는 6개월입니다. 마모가 심한 경우 조기 교체 신청이 가능합니다.', N'김민수', N'안전팀', '2026-03-20', 1),
(N'화학물질 취급 시 필수 보호구는?', N'도장 공정에서 사용하는 유기용제 취급 시 착용해야 하는 보호구 목록을 알려주세요.', 'SAFETY', N'이상호', N'생산팀', 'lee@company.com', 45, 1, N'유기용제 취급 시 방독마스크(유기가스용), 내화학장갑, 보안경, 보호복 착용이 필수입니다. 상세 기준은 MSDS를 참고해주세요.', N'김민수', N'안전팀', '2026-03-25', 1),
(N'탄소배출량 보고 주기는 어떻게 되나요?', N'환경부 탄소배출량 보고서 제출 주기와 양식이 궁금합니다.', 'ENVIRONMENT', N'전도현', N'생산팀', 'jeon@company.com', 12, 0, NULL, NULL, NULL, NULL, 1),
(N'건강검진 결과 열람은 어디서 하나요?', N'정기 건강검진 결과를 시스템에서 확인할 수 있는 방법을 알려주세요.', 'HEALTH', N'최영미', N'인사팀', 'choi@company.com', 31, 1, N'보건관리 > 건강검진 관리 메뉴에서 본인 검진 결과를 확인할 수 있습니다. 개인정보 보호를 위해 본인 기록만 열람 가능합니다.', N'김민수', N'안전팀', '2026-04-02', 1),
(N'아차사고 보고 절차가 어떻게 되나요?', N'아차사고(Near Miss) 발생 시 보고 절차와 양식이 궁금합니다.', 'GENERAL', N'박진호', N'설비팀', 'park@company.com', 8, 0, NULL, NULL, NULL, NULL, 1);
