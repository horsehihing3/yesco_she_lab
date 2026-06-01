package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.AuditFindingMapper;
import com.smartehs.mapper.AuditLogMapper;
import com.smartehs.model.AuditFinding;
import com.smartehs.model.AuditLog;
import com.smartehs.model.AuditLogItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditFindingService {

    private final AuditFindingMapper findingMapper;
    private final AuditLogMapper auditLogMapper;

    @Transactional(readOnly = true)
    public Page<AuditFinding> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AuditFinding> content = findingMapper.findByDeletedFalse(offset, limit);
        int total = findingMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public AuditFinding findById(Long id) {
        AuditFinding finding = findingMapper.findById(id);
        if (finding == null) {
            throw new ResourceNotFoundException("AuditFinding", "id", id);
        }
        return finding;
    }

    @Transactional(readOnly = true)
    public Page<AuditFinding> findByAuditId(Long auditId, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AuditFinding> content = findingMapper.findByAuditId(auditId, offset, limit);
        int total = findingMapper.countByAuditId(auditId);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<AuditFinding> findBySeverity(String severity, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AuditFinding> content = findingMapper.findBySeverity(severity, offset, limit);
        int total = findingMapper.countBySeverity(severity);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public AuditFinding create(AuditFinding finding) {
        String newId = generateFindingId();
        finding.setFindingId(newId);
        if (finding.getStatus() == null) {
            finding.setStatus("PENDING");
        }
        finding.setDeleted(false);
        findingMapper.insert(finding);
        log.info("Created audit finding: {}", newId);
        return findById(finding.getId());
    }

    @Transactional
    public AuditFinding update(Long id, AuditFinding finding) {
        AuditFinding existing = findingMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AuditFinding", "id", id);
        }
        finding.setId(id);
        findingMapper.update(finding);
        log.info("Updated audit finding: {}", existing.getFindingId());
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        AuditFinding existing = findingMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AuditFinding", "id", id);
        }
        findingMapper.softDelete(id);
        log.info("Soft deleted audit finding with id: {}", id);
    }

    private String generateFindingId() {
        String prefix = "AUD-FD-" + LocalDate.now().getYear() + "-";
        int count = findingMapper.countByFindingIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }

    /**
     * 감사의 최신 체크리스트 저장 로그에 있는 FAIL 항목들을 tb_audit_finding 으로 동기화.
     * 이미 동일한 description 으로 등록된 finding 이 있으면 건너뛴다 (중복 방지).
     */
    @Transactional
    public int syncFromChecklist(Long auditId) {
        // 1) 최신 CHECKLIST_SAVE 로그 찾기
        List<AuditLog> logs = auditLogMapper.findByAuditId(auditId);
        AuditLog latest = logs.stream()
                .filter(l -> "CHECKLIST_SAVE".equals(l.getAction()))
                .max(Comparator.comparing(AuditLog::getCreatedAt))
                .orElse(null);
        if (latest == null) {
            log.info("syncFromChecklist: no CHECKLIST_SAVE log for auditId={}", auditId);
            return 0;
        }

        // 2) 해당 로그의 FAIL 항목들 조회
        List<AuditLogItem> items = auditLogMapper.findItemsByLogId(latest.getId());
        List<AuditLogItem> failItems = items.stream()
                .filter(i -> "FAIL".equals(i.getCheckResult()))
                .toList();
        if (failItems.isEmpty()) {
            log.info("syncFromChecklist: no FAIL items in log {}", latest.getId());
            return 0;
        }

        // 3) 이미 등록된 finding description 모음 (중복 방지)
        List<AuditFinding> existing = findingMapper.findByAuditId(auditId, 0, 1000);
        Set<String> existingDescriptions = new HashSet<>();
        for (AuditFinding f : existing) {
            if (f.getDescription() != null) existingDescriptions.add(f.getDescription().trim());
        }

        // 4) 새 finding 생성
        int created = 0;
        for (AuditLogItem item : failItems) {
            String desc = buildFindingDescription(item);
            if (existingDescriptions.contains(desc.trim())) continue;
            AuditFinding f = AuditFinding.builder()
                    .auditId(auditId)
                    .severity("MINOR")
                    .description(desc)
                    .legalRef(item.getLegalBasis())
                    .status("PENDING")
                    .deleted(false)
                    .build();
            create(f);
            created++;
        }
        log.info("syncFromChecklist: auditId={} created {} new findings", auditId, created);
        return created;
    }

    private String buildFindingDescription(AuditLogItem item) {
        StringBuilder sb = new StringBuilder();
        if (item.getCategoryName() != null) sb.append("[").append(item.getCategoryName()).append("] ");
        if (item.getCheckItem() != null) sb.append(item.getCheckItem());
        if (item.getFinding() != null && !item.getFinding().isBlank()) {
            sb.append(" - ").append(item.getFinding());
        }
        return sb.toString().trim();
    }
}
