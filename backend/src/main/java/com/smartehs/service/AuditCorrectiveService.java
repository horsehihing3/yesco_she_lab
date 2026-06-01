package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.AuditCorrectiveMapper;
import com.smartehs.mapper.AuditFindingMapper;
import com.smartehs.model.AuditCorrective;
import com.smartehs.model.AuditFinding;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditCorrectiveService {

    private final AuditCorrectiveMapper correctiveMapper;
    private final AuditFindingMapper findingMapper;

    @Transactional(readOnly = true)
    public Page<AuditCorrective> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AuditCorrective> content = correctiveMapper.findByDeletedFalse(offset, limit);
        int total = correctiveMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public AuditCorrective findById(Long id) {
        AuditCorrective corrective = correctiveMapper.findById(id);
        if (corrective == null) {
            throw new ResourceNotFoundException("AuditCorrective", "id", id);
        }
        return corrective;
    }

    @Transactional(readOnly = true)
    public Page<AuditCorrective> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AuditCorrective> content = correctiveMapper.findByStatus(status, offset, limit);
        int total = correctiveMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<AuditCorrective> findByAuditId(Long auditId, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AuditCorrective> content = correctiveMapper.findByAuditId(auditId, offset, limit);
        int total = correctiveMapper.countByAuditId(auditId);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public AuditCorrective create(AuditCorrective corrective) {
        // finding_id 로 부적합 사항을 조회해 audit_id / severity / finding_description 자동 채움
        denormalizeFromFinding(corrective);

        String newId = generateCorrectiveId();
        corrective.setCorrectiveId(newId);
        if (corrective.getStatus() == null) {
            corrective.setStatus("IN_PROGRESS");
        }
        corrective.setDeleted(false);
        correctiveMapper.insert(corrective);
        log.info("Created audit corrective: {}", newId);
        return findById(corrective.getId());
    }

    @Transactional
    public AuditCorrective update(Long id, AuditCorrective corrective) {
        AuditCorrective existing = correctiveMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AuditCorrective", "id", id);
        }
        // 수정에서도 finding 변경 시 denormalize 반영
        denormalizeFromFinding(corrective);
        corrective.setId(id);
        correctiveMapper.update(corrective);
        log.info("Updated audit corrective: {}", existing.getCorrectiveId());
        return findById(id);
    }

    private void denormalizeFromFinding(AuditCorrective corrective) {
        if (corrective.getFindingId() == null) {
            throw new IllegalArgumentException("findingId is required");
        }
        AuditFinding finding = findingMapper.findById(corrective.getFindingId());
        if (finding == null) {
            throw new ResourceNotFoundException("AuditFinding", "id", corrective.getFindingId());
        }
        // finding 이 바뀌면 audit_id / severity / finding_description 도 그에 맞춰 항상 갱신
        corrective.setAuditId(finding.getAuditId());
        corrective.setSeverity(finding.getSeverity());
        corrective.setFindingDescription(finding.getDescription());
    }

    @Transactional
    public void delete(Long id) {
        AuditCorrective existing = correctiveMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AuditCorrective", "id", id);
        }
        correctiveMapper.softDelete(id);
        log.info("Soft deleted audit corrective with id: {}", id);
    }

    private String generateCorrectiveId() {
        String prefix = "AUD-CA-" + LocalDate.now().getYear() + "-";
        int count = correctiveMapper.countByCorrectiveIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
