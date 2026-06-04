-- V191: EHS 메시지 + Q&A 댓글 (대댓글 지원) — tb_ehs_alert_comment 와 동일 구조

SET NOCOUNT ON;
GO

-- ===== tb_ehs_message_comment =====
IF OBJECT_ID('tb_ehs_message_comment', 'U') IS NULL
BEGIN
    CREATE TABLE tb_ehs_message_comment (
        id            BIGINT IDENTITY(1,1) PRIMARY KEY,
        message_id    BIGINT       NOT NULL,
        parent_id     BIGINT       NULL,
        content       NVARCHAR(2000) NOT NULL,
        author_name   NVARCHAR(50) NOT NULL,
        author_dept   NVARCHAR(100) NULL,
        author_email  NVARCHAR(150) NULL,
        deleted       BIT NOT NULL DEFAULT 0,
        created_at    DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at   DATETIME NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_ehs_message_comment_msg    ON tb_ehs_message_comment (message_id, deleted, parent_id, id);
    CREATE INDEX IX_ehs_message_comment_parent ON tb_ehs_message_comment (parent_id);
END;
GO

-- ===== tb_qna_comment =====
IF OBJECT_ID('tb_qna_comment', 'U') IS NULL
BEGIN
    CREATE TABLE tb_qna_comment (
        id            BIGINT IDENTITY(1,1) PRIMARY KEY,
        qna_id        BIGINT       NOT NULL,
        parent_id     BIGINT       NULL,
        content       NVARCHAR(2000) NOT NULL,
        author_name   NVARCHAR(50) NOT NULL,
        author_dept   NVARCHAR(100) NULL,
        author_email  NVARCHAR(150) NULL,
        deleted       BIT NOT NULL DEFAULT 0,
        created_at    DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at   DATETIME NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_qna_comment_qna    ON tb_qna_comment (qna_id, deleted, parent_id, id);
    CREATE INDEX IX_qna_comment_parent ON tb_qna_comment (parent_id);
END;
GO

-- ===== 더미 데이터 =====
IF OBJECT_ID('tb_ehs_message', 'U') IS NOT NULL
BEGIN
    DECLARE @mid1 BIGINT = (SELECT TOP 1 id FROM tb_ehs_message ORDER BY id ASC);
    IF @mid1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tb_ehs_message_comment WHERE message_id = @mid1)
    BEGIN
        INSERT INTO tb_ehs_message_comment (message_id, parent_id, content, author_name, author_dept, author_email)
        VALUES (@mid1, NULL, N'메시지 전사 공유 완료했습니다.', N'이안전', N'안전관리팀', 'safety@com4in.com');
        DECLARE @mcid1 BIGINT = SCOPE_IDENTITY();
        INSERT INTO tb_ehs_message_comment (message_id, parent_id, content, author_name, author_dept, author_email) VALUES
            (@mid1, @mcid1, N'팀 회의에서도 전달했습니다.', N'박환경', N'환경팀',     'env@com4in.com'),
            (@mid1, NULL,   N'추가 자료 첨부 부탁드립니다.', N'정총무', N'총무팀',     'admin@com4in.com');
    END
END
GO

IF OBJECT_ID('tb_qna_post', 'U') IS NOT NULL
BEGIN
    DECLARE @qid1 BIGINT = (SELECT TOP 1 id FROM tb_qna_post ORDER BY id ASC);
    IF @qid1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tb_qna_comment WHERE qna_id = @qid1)
    BEGIN
        INSERT INTO tb_qna_comment (qna_id, parent_id, content, author_name, author_dept, author_email)
        VALUES (@qid1, NULL, N'관련 부서에서 검토 중입니다.', N'이안전', N'안전관리팀', 'safety@com4in.com');
        DECLARE @qcid1 BIGINT = SCOPE_IDENTITY();
        INSERT INTO tb_qna_comment (qna_id, parent_id, content, author_name, author_dept, author_email) VALUES
            (@qid1, @qcid1, N'답변 확정되면 회신드리겠습니다.', N'박환경', N'환경팀',     'env@com4in.com'),
            (@qid1, NULL,   N'동일한 사안 별도 케이스 있습니다.', N'최보건', N'보건관리팀', 'health@com4in.com');
    END
END
GO
