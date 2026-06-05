package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * V191: tb_ehs_message_comment + tb_qna_comment 테이블 생성
 */
@Slf4j
@Order(99)
@Component
@RequiredArgsConstructor
public class EhsMessageQnaCommentInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            createEhsMessageCommentTable();
            createQnaCommentTable();
            log.info("EhsMessageQnaCommentInitializer 완료");
        } catch (Exception e) {
            log.warn("EhsMessageQnaCommentInitializer 실패", e);
        }
    }

    private void createEhsMessageCommentTable() {
        Integer exists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_ehs_message_comment'", Integer.class);
        if (exists != null && exists > 0) return;

        jdbcTemplate.execute(
            "CREATE TABLE tb_ehs_message_comment (" +
            "  id          BIGINT IDENTITY(1,1) PRIMARY KEY," +
            "  message_id  BIGINT NOT NULL," +
            "  parent_id   BIGINT NULL," +
            "  content     NVARCHAR(2000) NOT NULL," +
            "  author_name NVARCHAR(50) NOT NULL," +
            "  author_dept NVARCHAR(100) NULL," +
            "  author_email NVARCHAR(150) NULL," +
            "  deleted     BIT NOT NULL DEFAULT 0," +
            "  created_at  DATETIME NOT NULL DEFAULT GETDATE()," +
            "  modified_at DATETIME NOT NULL DEFAULT GETDATE()" +
            ")");
        jdbcTemplate.execute(
            "CREATE INDEX IX_ehs_message_comment_msg ON tb_ehs_message_comment (message_id, deleted, parent_id, id)");
        jdbcTemplate.execute(
            "CREATE INDEX IX_ehs_message_comment_parent ON tb_ehs_message_comment (parent_id)");
        log.info("tb_ehs_message_comment 생성 완료");
    }

    private void createQnaCommentTable() {
        Integer exists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_qna_comment'", Integer.class);
        if (exists != null && exists > 0) return;

        jdbcTemplate.execute(
            "CREATE TABLE tb_qna_comment (" +
            "  id          BIGINT IDENTITY(1,1) PRIMARY KEY," +
            "  qna_id      BIGINT NOT NULL," +
            "  parent_id   BIGINT NULL," +
            "  content     NVARCHAR(2000) NOT NULL," +
            "  author_name NVARCHAR(50) NOT NULL," +
            "  author_dept NVARCHAR(100) NULL," +
            "  author_email NVARCHAR(150) NULL," +
            "  deleted     BIT NOT NULL DEFAULT 0," +
            "  created_at  DATETIME NOT NULL DEFAULT GETDATE()," +
            "  modified_at DATETIME NOT NULL DEFAULT GETDATE()" +
            ")");
        jdbcTemplate.execute(
            "CREATE INDEX IX_qna_comment_qna ON tb_qna_comment (qna_id, deleted, parent_id, id)");
        jdbcTemplate.execute(
            "CREATE INDEX IX_qna_comment_parent ON tb_qna_comment (parent_id)");
        log.info("tb_qna_comment 생성 완료");
    }
}
