package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.AccidentClaimDocMapper;
import com.smartehs.mapper.AccidentClaimMapper;
import com.smartehs.model.AccidentClaim;
import com.smartehs.model.AccidentClaimDoc;
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
public class AccidentClaimService {

    private final AccidentClaimMapper accidentClaimMapper;
    private final AccidentClaimDocMapper accidentClaimDocMapper;

    private static final Object[][] DEFAULT_DOCS = {
            {"DIAGNOSIS", "진단서 원본", true},
            {"OPINION", "소견서 업무관련성", true},
            {"HEALTH_EXAM", "특수건강검진 결과표", true},
            {"ENV_MEASURE", "작업환경측정결과서", true},
            {"MSDS", "MSDS 취급물질목록", true},
            {"WORK_CONFIRM", "업무내용 확인서", true},
            {"CAREER_CERT", "경력증명서 전 직장", false},
            {"EMPLOY_CERT", "재직증명서", true},
            {"ID_COPY", "주민등록증 사본", true},
            {"BANK_COPY", "통장 사본", true},
            {"RADIATION", "방사선 피폭선량 기록", false},
            {"OTHER_MEDICAL", "기타 관련 의료기록", false},
    };

    @Transactional(readOnly = true)
    public Page<AccidentClaim> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AccidentClaim> content = accidentClaimMapper.findByDeletedFalse(offset, limit);
        int total = accidentClaimMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public AccidentClaim findById(Long id) {
        AccidentClaim claim = accidentClaimMapper.findById(id);
        if (claim == null) {
            throw new ResourceNotFoundException("AccidentClaim", "id", id);
        }
        return claim;
    }

    @Transactional(readOnly = true)
    public Page<AccidentClaim> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AccidentClaim> content = accidentClaimMapper.findByStatus(status, offset, limit);
        int total = accidentClaimMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<AccidentClaim> findByCreatedBy(String createdBy, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AccidentClaim> content = accidentClaimMapper.findByCreatedBy(createdBy, offset, limit);
        int total = accidentClaimMapper.countByCreatedBy(createdBy);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public AccidentClaim create(AccidentClaim claim, String createdBy) {
        String newId = generateClaimId();
        claim.setClaimId(newId);
        claim.setCreatedBy(createdBy);
        if (claim.getStatus() == null) {
            claim.setStatus("DRAFT");
        }
        claim.setDeleted(false);
        accidentClaimMapper.insert(claim);
        log.info("Created accident claim: {}", newId);

        // Auto-create 12 document records
        for (Object[] doc : DEFAULT_DOCS) {
            AccidentClaimDoc claimDoc = AccidentClaimDoc.builder()
                    .claimId(claim.getId())
                    .docType((String) doc[0])
                    .docName((String) doc[1])
                    .isRequired((Boolean) doc[2])
                    .isSubmitted(false)
                    .build();
            accidentClaimDocMapper.insert(claimDoc);
        }
        log.info("Created {} document records for claim: {}", DEFAULT_DOCS.length, newId);

        return findById(claim.getId());
    }

    @Transactional
    public AccidentClaim update(Long id, AccidentClaim claim) {
        AccidentClaim existing = accidentClaimMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AccidentClaim", "id", id);
        }
        claim.setId(id);
        accidentClaimMapper.update(claim);
        log.info("Updated accident claim: {}", existing.getClaimId());
        return findById(id);
    }

    @Transactional
    public AccidentClaim updateStatus(Long id, String status) {
        AccidentClaim existing = accidentClaimMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AccidentClaim", "id", id);
        }
        accidentClaimMapper.updateStatus(id, status);
        log.info("Updated accident claim status: {} -> {}", existing.getClaimId(), status);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        AccidentClaim existing = accidentClaimMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("AccidentClaim", "id", id);
        }
        accidentClaimMapper.softDelete(id);
        log.info("Soft deleted accident claim with id: {}", id);
    }

    @Transactional(readOnly = true)
    public List<AccidentClaimDoc> findDocsByClaimId(Long claimId) {
        // Verify claim exists
        findById(claimId);
        return accidentClaimDocMapper.findByClaimId(claimId);
    }

    @Transactional
    public void toggleDocSubmitted(Long docId) {
        accidentClaimDocMapper.toggleSubmitted(docId);
        log.info("Toggled doc {} submitted status", docId);
    }

    private String generateClaimId() {
        String prefix = "AC-" + LocalDate.now().getYear() + "-";
        int count = accidentClaimMapper.countByClaimIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
