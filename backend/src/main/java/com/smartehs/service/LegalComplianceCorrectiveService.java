package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.LegalComplianceCorrectiveMapper;
import com.smartehs.mapper.LegalComplianceFindingMapper;
import com.smartehs.model.LegalComplianceCorrective;
import com.smartehs.model.LegalComplianceFinding;
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
public class LegalComplianceCorrectiveService {

    private final LegalComplianceCorrectiveMapper correctiveMapper;
    private final LegalComplianceFindingMapper findingMapper;

    @Transactional(readOnly = true)
    public Page<LegalComplianceCorrective> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<LegalComplianceCorrective> content = correctiveMapper.findByDeletedFalse(offset, limit);
        int total = correctiveMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public LegalComplianceCorrective findById(Long id) {
        LegalComplianceCorrective c = correctiveMapper.findById(id);
        if (c == null) throw new ResourceNotFoundException("LegalComplianceCorrective", "id", id);
        return c;
    }

    @Transactional(readOnly = true)
    public Page<LegalComplianceCorrective> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<LegalComplianceCorrective> content = correctiveMapper.findByStatus(status, offset, limit);
        int total = correctiveMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<LegalComplianceCorrective> findByAuditId(Long auditId, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<LegalComplianceCorrective> content = correctiveMapper.findByAuditId(auditId, offset, limit);
        int total = correctiveMapper.countByAuditId(auditId);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public LegalComplianceCorrective create(LegalComplianceCorrective c) {
        denormalizeFromFinding(c);
        String newId = generateCorrectiveId();
        c.setCorrectiveId(newId);
        if (c.getStatus() == null) c.setStatus("IN_PROGRESS");
        c.setDeleted(false);
        correctiveMapper.insert(c);
        return findById(c.getId());
    }

    @Transactional
    public LegalComplianceCorrective update(Long id, LegalComplianceCorrective c) {
        LegalComplianceCorrective existing = correctiveMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalComplianceCorrective", "id", id);
        denormalizeFromFinding(c);
        c.setId(id);
        correctiveMapper.update(c);
        return findById(id);
    }

    private void denormalizeFromFinding(LegalComplianceCorrective c) {
        if (c.getFindingId() == null) throw new IllegalArgumentException("findingId is required");
        LegalComplianceFinding finding = findingMapper.findById(c.getFindingId());
        if (finding == null) throw new ResourceNotFoundException("LegalComplianceFinding", "id", c.getFindingId());
        c.setAuditId(finding.getAuditId());
        c.setSeverity(finding.getSeverity());
        c.setFindingDescription(finding.getDescription());
    }

    @Transactional
    public void delete(Long id) {
        LegalComplianceCorrective existing = correctiveMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("LegalComplianceCorrective", "id", id);
        correctiveMapper.softDelete(id);
    }

    private String generateCorrectiveId() {
        String prefix = "LC-CA-" + LocalDate.now().getYear() + "-";
        int count = correctiveMapper.countByCorrectiveIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
