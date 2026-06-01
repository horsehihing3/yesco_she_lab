package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 이전 빌드에서 잘못 자동 시드된 사무업무용 체크리스트 템플릿 3건을 정리.
 * (사용자가 체크리스트 관리에서 직접 만들어야 하므로 자동 시드는 제거됨)
 * 항목이 추가되어 있다면 사용자가 작업한 것이므로 삭제하지 않음.
 */
@Slf4j
@Order(45)
@Component
@RequiredArgsConstructor
public class OfficeWorkAutoSeededTemplateCleanup implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    private static final List<String> NAMES = List.of(
        "사무업무", "산업안전보건법 예방 사무업무", "중대재해처벌법 예방 사무업무"
    );

    @Override
    public void run(String... args) {
        try {
            Integer tplTable = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_checklist_template'", Integer.class);
            if (tplTable == null || tplTable == 0) return;

            for (String name : NAMES) {
                List<Long> ids = jdbcTemplate.queryForList(
                    "SELECT id FROM tb_checklist_template WHERE template_name = ? AND category_type = 'OFFICE_WORK'",
                    Long.class, name);
                for (Long id : ids) {
                    Integer hasCategories = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM tb_checklist_category WHERE template_id = ?",
                        Integer.class, id);
                    if (hasCategories != null && hasCategories > 0) continue; // 사용자 작업 보존
                    // 위험성 평가에서 참조 끊기
                    try {
                        jdbcTemplate.update(
                            "UPDATE tb_risk_assessment SET office_checklist_id = NULL WHERE office_checklist_id = ?", id);
                        jdbcTemplate.update(
                            "UPDATE tb_risk_assessment SET sanup_checklist_id = NULL WHERE sanup_checklist_id = ?", id);
                        jdbcTemplate.update(
                            "UPDATE tb_risk_assessment SET jungdae_checklist_id = NULL WHERE jungdae_checklist_id = ?", id);
                    } catch (Exception ignored) { /* 컬럼 없을 수 있음 */ }
                    jdbcTemplate.update("DELETE FROM tb_checklist_template WHERE id = ?", id);
                    log.info("자동 시드된 사무업무 템플릿 삭제: id={} name={}", id, name);
                }
            }
        } catch (Exception e) {
            log.warn("자동 시드된 사무업무 템플릿 정리 실패", e);
        }
    }
}
