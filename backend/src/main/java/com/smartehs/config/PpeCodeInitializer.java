package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 보호구·장비(PPE) 코드 시스템 초기화기.
 * - 옛 PPE 코드 그룹(PPE_CATEGORY, PPE_TYPE, PPE_REQUEST_STATUS) 삭제 후
 *   신규 8개 도메인에 맞는 9개 코드 그룹 재등록.
 * - 멱등: 그룹·코드 모두 삭제→재시드.
 * - 프론트는 useCodeMap('PPE_*') 으로 조회. 코드 키(영어) → 표시명(ko/en/zh).
 */
@Slf4j
@Order(45)
@Component
@RequiredArgsConstructor
public class PpeCodeInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        cleanupLegacy();

        seedGroup("PPE_CATEGORY", "보호구 카테고리", List.of(
            row("HEAD",        "두부보호(안전모)",     "Head Protection",          "头部防护(安全帽)"),
            row("EYE",         "눈/안면 보호(보안경)", "Eye/Face Protection",      "眼/面部防护(护目镜)"),
            row("RESPIRATORY", "호흡기 보호(마스크)",  "Respiratory Protection",   "呼吸防护(口罩)"),
            row("HEARING",     "청력 보호(귀마개)",    "Hearing Protection",       "听力防护(耳塞)"),
            row("HAND",        "손 보호(안전장갑)",    "Hand Protection",          "手部防护(安全手套)"),
            row("FOOT",        "발 보호(안전화)",      "Foot Protection",          "脚部防护(安全鞋)"),
            row("FALL",        "추락 보호(안전대)",    "Fall Protection",          "坠落防护(安全带)"),
            row("BODY",        "전신 보호(방호복)",    "Body Protection",          "全身防护(防护服)")
        ));

        seedGroup("PPE_LOCATION", "보호구 보관 창고", List.of(
            row("CENTRAL", "중앙창고",     "Central Warehouse",      "中央仓库"),
            row("SAFETY",  "안전용품창고", "Safety Goods Warehouse", "安全用品仓库"),
            row("FIELD_A", "현장창고A",    "Field Warehouse A",      "现场仓库A"),
            row("FIELD_B", "현장창고B",    "Field Warehouse B",      "现场仓库B")
        ));

        seedGroup("PPE_ISSUE_REASON", "보호구 지급 사유", List.of(
            row("NEW",          "신규지급",     "New Issue",      "新发放"),
            row("CYCLE",        "정기교체",     "Cycle Replace",  "定期更换"),
            row("DAMAGE",       "파손교체",     "Damage Replace", "损坏更换"),
            row("LOSS_REISSUE", "분실재지급",   "Loss Reissue",   "丢失补发")
        ));

        seedGroup("PPE_ISSUE_STATUS", "보호구 지급 상태", List.of(
            row("ISSUED",   "지급완료", "Issued",         "已发放"),
            row("RETURNED", "반납완료", "Returned",       "已归还"),
            row("REPLACE",  "교체요청", "Replace Request","更换申请"),
            row("LOSS",     "분실신고", "Loss Reported",  "丢失报告")
        ));

        seedGroup("PPE_INSPECTION_TYPE", "보호구 점검 유형", List.of(
            row("REGULAR", "정기검사", "Regular Inspection", "定期检查"),
            row("SELF",    "자체점검", "Self Inspection",    "自查"),
            row("PRE",     "사전점검", "Pre Inspection",     "预先检查")
        ));

        seedGroup("PPE_INSPECTION_RESULT", "보호구 점검 결과", List.of(
            row("PASS",         "합격",       "Pass",             "合格"),
            row("CONDITIONAL",  "조건부합격", "Conditional Pass", "有条件合格"),
            row("FAIL",         "불합격",     "Fail",             "不合格"),
            row("DISPOSE",      "폐기",       "Dispose",          "废弃")
        ));

        seedGroup("PPE_WEAR_STATUS", "보호구 착용 상태", List.of(
            row("OK",        "착용확인",   "Worn",            "确认佩戴"),
            row("VIOLATION", "미착용",     "Not Worn",        "未佩戴"),
            row("IMPROPER",  "부적정착용", "Improperly Worn", "佩戴不当")
        ));

        seedGroup("PPE_PERFORMANCE_RESULT", "보호구 성능 평가 결과", List.of(
            row("MEET",    "기준충족", "Meets Standard",  "达标"),
            row("BELOW",   "성능미달", "Below Standard",  "不达标"),
            row("PENDING", "평가중",   "Under Evaluation","评估中")
        ));

        seedGroup("PPE_INOUT_TYPE", "보호구 입출고 유형", List.of(
            row("IN",  "입고", "In",  "入库"),
            row("OUT", "출고", "Out", "出库")
        ));

        log.info("PpeCodeInitializer: 보호구·장비 코드 9개 그룹 재시드 완료");
    }

    private void cleanupLegacy() {
        for (String code : List.of("PPE_CATEGORY", "PPE_TYPE", "PPE_REQUEST_STATUS")) {
            Long groupId = findGroupId(code);
            if (groupId != null) {
                int n = jdbcTemplate.update("DELETE FROM tb_code_detail WHERE group_id = ?", groupId);
                jdbcTemplate.update("DELETE FROM tb_code_group WHERE id = ?", groupId);
                log.info("PpeCodeInitializer: 옛 코드 그룹 '{}' 삭제 (detail {}개)", code, n);
            }
        }
    }

    private Long findGroupId(String code) {
        try {
            return jdbcTemplate.queryForObject(
                "SELECT id FROM tb_code_group WHERE group_code = ?", Long.class, code);
        } catch (Exception e) {
            return null;
        }
    }

    private void seedGroup(String groupCode, String groupName, List<Object[]> codes) {
        Long groupId = findGroupId(groupCode);
        if (groupId == null) {
            jdbcTemplate.update(
                "INSERT INTO tb_code_group (group_code, group_name, is_active, sort_order, created_at, modified_at) " +
                "VALUES (?, ?, 1, 1, SYSDATETIME(), SYSDATETIME())",
                groupCode, groupName);
            groupId = jdbcTemplate.queryForObject(
                "SELECT id FROM tb_code_group WHERE group_code = ?", Long.class, groupCode);
        } else {
            jdbcTemplate.update(
                "UPDATE tb_code_group SET group_name = ?, modified_at = SYSDATETIME() WHERE id = ?",
                groupName, groupId);
        }
        jdbcTemplate.update("DELETE FROM tb_code_detail WHERE group_id = ?", groupId);
        int order = 1;
        for (Object[] c : codes) {
            jdbcTemplate.update(
                "INSERT INTO tb_code_detail " +
                "(group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, 1, ?, SYSDATETIME(), SYSDATETIME())",
                groupId, c[0], c[0], c[1], c[2], c[3], order++);
        }
    }

    private Object[] row(String code, String ko, String en, String zh) {
        return new Object[]{code, ko, en, zh};
    }
}
