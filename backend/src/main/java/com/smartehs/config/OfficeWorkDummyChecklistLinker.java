package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 위험성 평가 - 사무업무 더미 6건의 office/sanup/jungdae_checklist_id 를
 * V137/OfficeWorkSampleTemplateSeeder 가 만든 샘플 템플릿으로 자동 연결.
 * 이미 연결되어 있으면 그대로 둠 (사용자 수정 보존).
 */
@Slf4j
@Order(60)
@Component
@RequiredArgsConstructor
public class OfficeWorkDummyChecklistLinker implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer aTable = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_risk_assessment'", Integer.class);
            Integer tplTable = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_checklist_template'", Integer.class);
            if (aTable == null || aTable == 0 || tplTable == null || tplTable == 0) return;

            // 컬럼 존재 확인
            Integer hasCol = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment') AND name = 'office_checklist_id'",
                Integer.class);
            if (hasCol == null || hasCol == 0) return;

            Long officeId  = findTemplateId("사무실 일반 안전 점검표");
            Long sanupId   = findTemplateId("산업안전보건법 사무직 예방 점검표");
            Long jungdaeId = findTemplateId("중대재해처벌법 사무직 예방 점검표");
            if (officeId == null && sanupId == null && jungdaeId == null) return;

            int updated = jdbcTemplate.update(
                "UPDATE tb_risk_assessment " +
                "   SET office_checklist_id  = COALESCE(office_checklist_id, ?), " +
                "       sanup_checklist_id   = COALESCE(sanup_checklist_id, ?), " +
                "       jungdae_checklist_id = COALESCE(jungdae_checklist_id, ?), " +
                "       modified_at = GETDATE() " +
                " WHERE title LIKE N'%(사무업무)'",
                officeId, sanupId, jungdaeId);
            if (updated > 0) log.info("사무업무 더미 체크리스트 연결 백필: {}건 (office={}, sanup={}, jungdae={})",
                updated, officeId, sanupId, jungdaeId);
        } catch (Exception e) {
            log.warn("사무업무 더미 체크리스트 연결 실패", e);
        }
    }

    private Long findTemplateId(String name) {
        try {
            return jdbcTemplate.queryForObject(
                "SELECT TOP 1 id FROM tb_checklist_template WHERE template_name = ? ORDER BY id",
                Long.class, name);
        } catch (Exception e) {
            return null;
        }
    }
}
