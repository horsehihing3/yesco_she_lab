package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.LegalComplianceFindingMapper;
import com.smartehs.mapper.LegalComplianceLogMapper;
import com.smartehs.model.LegalComplianceFinding;
import com.smartehs.model.LegalComplianceLog;
import com.smartehs.model.LegalComplianceLogItem;
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
public class LegalComplianceFindingService {

    private final LegalComplianceFindingMapper findingMapper;
    private final LegalComplianceLogMapper logMapper;

    @Transactional(readOnly = true)
    public Page<LegalComplianceFinding> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<LegalComplianceFinding> content = findingMapper.findByDeletedFalse(offset, limit);
        int total = findingMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public LegalComplianceFinding findById(Long id) {
        LegalComplianceFinding f = findingMapper.findById(id);
        if (f == null) throw new ResourceNotFoundException("LegalComplianceFinding", "id", id);
        return f;
    }

    @Transactional(readOnly = true)
    public Page<LegalComplianceFinding> findByAuditId(Long auditId, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<LegalComplianceFinding> content = findingMapper.findByAuditId(auditId, offset, limit);
        int total = findingMapper.countByAuditId(auditId);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<LegalComplianceFinding> findBySeverity(String severity, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<LegalComplianceFinding> content = findingMapper.findBySeverity(severity, offset, limit);
        int total = findingMapper.countBySeverity(severity);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public LegalComplianceFinding create(LegalComplianceFinding f) {
        String newId = generateFindingId();
        f.setFindingId(newId);
        if (f.getStatus() == null) f.setStatus("PENDING");
        f.setDeleted(false);
        findingMapper.insert(f);
        return findById(f.getId());
    }

    @Transactional
    public LegalComplianceFinding update(Long id, LegalComplianceFinding f) {
        LegalComplianceFinding existing = findingMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalComplianceFinding", "id", id);
        f.setId(id);
        findingMapper.update(f);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        LegalComplianceFinding existing = findingMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalComplianceFinding", "id", id);
        findingMapper.softDelete(id);
    }

    private String generateFindingId() {
        String prefix = "LC-FD-" + LocalDate.now().getYear() + "-";
        int count = findingMapper.countByFindingIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }

    /** 실시의 최신 CHECKLIST_SAVE 로그의 FAIL 항목을 finding 으로 동기화 (중복 description 스킵). */
    @Transactional
    public int syncFromChecklist(Long auditId) {
        List<LegalComplianceLog> logs = logMapper.findByAuditId(auditId);
        LegalComplianceLog latest = logs.stream()
                .filter(l -> "CHECKLIST_SAVE".equals(l.getAction()))
                .max(Comparator.comparing(LegalComplianceLog::getCreatedAt))
                .orElse(null);
        if (latest == null) return 0;

        List<LegalComplianceLogItem> items = logMapper.findItemsByLogId(latest.getId());
        List<LegalComplianceLogItem> failItems = items.stream()
                .filter(i -> "FAIL".equals(i.getCheckResult()))
                .toList();
        if (failItems.isEmpty()) return 0;

        List<LegalComplianceFinding> existing = findingMapper.findByAuditId(auditId, 0, 1000);
        Set<String> existingDescriptions = new HashSet<>();
        for (LegalComplianceFinding f : existing) {
            if (f.getDescription() != null) existingDescriptions.add(f.getDescription().trim());
        }

        int created = 0;
        for (LegalComplianceLogItem item : failItems) {
            String desc = buildFindingDescription(item);
            if (existingDescriptions.contains(desc.trim())) continue;
            LegalComplianceFinding f = LegalComplianceFinding.builder()
                    .auditId(auditId).severity("MINOR")
                    .description(desc).legalRef(item.getLegalBasis())
                    .status("PENDING").deleted(false).build();
            create(f);
            created++;
        }
        return created;
    }

    private String buildFindingDescription(LegalComplianceLogItem item) {
        StringBuilder sb = new StringBuilder();
        if (item.getCategoryName() != null) sb.append("[").append(item.getCategoryName()).append("] ");
        if (item.getCheckItem() != null) sb.append(item.getCheckItem());
        if (item.getFinding() != null && !item.getFinding().isBlank()) sb.append(" - ").append(item.getFinding());
        return sb.toString().trim();
    }
}
