package com.smartehs.service;

import com.smartehs.dto.request.RegulationCheckRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.RegulationCheckMapper;
import com.smartehs.model.RegulationCheck;
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
public class RegulationCheckService {

    private final RegulationCheckMapper regulationCheckMapper;

    @Transactional(readOnly = true)
    public Page<RegulationCheck> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<RegulationCheck> content = regulationCheckMapper.findAll(offset, limit);
        int total = regulationCheckMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<RegulationCheck> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<RegulationCheck> content = regulationCheckMapper.search(keyword, offset, limit);
        int total = regulationCheckMapper.countSearch(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public RegulationCheck findById(Long id) {
        RegulationCheck regulationCheck = regulationCheckMapper.findById(id);
        if (regulationCheck == null) {
            throw new ResourceNotFoundException("RegulationCheck", "id", id);
        }
        return regulationCheck;
    }

    @Transactional
    public RegulationCheck create(RegulationCheckRequest request) {
        String checkId = generateCheckId();

        RegulationCheck regulationCheck = RegulationCheck.builder()
                .checkId(checkId)
                .checkName(request.getCheckName())
                .relatedRegulation(request.getRelatedRegulation())
                .checkType(request.getCheckType())
                .assignee(request.getAssignee())
                .dueDate(request.getDueDate())
                .progress(request.getProgress() != null ? request.getProgress() : 0)
                .status(request.getStatus() != null ? request.getStatus() : "PENDING")
                .deleted(false)
                .build();

        regulationCheckMapper.insert(regulationCheck);
        log.info("Created regulation check: {}", checkId);

        return findById(regulationCheck.getId());
    }

    @Transactional
    public RegulationCheck update(Long id, RegulationCheckRequest request) {
        RegulationCheck regulationCheck = regulationCheckMapper.findById(id);
        if (regulationCheck == null) {
            throw new ResourceNotFoundException("RegulationCheck", "id", id);
        }

        regulationCheck.setCheckName(request.getCheckName());
        regulationCheck.setRelatedRegulation(request.getRelatedRegulation());
        regulationCheck.setCheckType(request.getCheckType());
        regulationCheck.setAssignee(request.getAssignee());
        regulationCheck.setDueDate(request.getDueDate());
        regulationCheck.setProgress(request.getProgress());
        regulationCheck.setStatus(request.getStatus());

        regulationCheckMapper.update(regulationCheck);
        log.info("Updated regulation check: {}", regulationCheck.getCheckId());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        RegulationCheck regulationCheck = regulationCheckMapper.findById(id);
        if (regulationCheck == null) {
            throw new ResourceNotFoundException("RegulationCheck", "id", id);
        }
        regulationCheckMapper.softDelete(id);
        log.info("Soft deleted regulation check with id: {}", id);
    }

    private String generateCheckId() {
        String prefix = "CHK-" + LocalDate.now().getYear() + "-";
        int count = regulationCheckMapper.countByCheckIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
