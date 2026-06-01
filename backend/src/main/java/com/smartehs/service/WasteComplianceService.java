package com.smartehs.service;

import com.smartehs.dto.request.WasteComplianceRequest;
import com.smartehs.dto.response.WasteComplianceResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.WasteComplianceMapper;
import com.smartehs.model.WasteCompliance;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WasteComplianceService {

    private final WasteComplianceMapper wasteComplianceMapper;

    @Transactional(readOnly = true)
    public Page<WasteComplianceResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WasteComplianceResponse> content = wasteComplianceMapper.findAllWithPaging(offset, limit).stream()
                .map(WasteComplianceResponse::from)
                .collect(Collectors.toList());
        int total = wasteComplianceMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WasteComplianceResponse> search(String regulationName, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WasteComplianceResponse> content = wasteComplianceMapper.findByRegulationNameContaining(regulationName, offset, limit).stream()
                .map(WasteComplianceResponse::from)
                .collect(Collectors.toList());
        int total = wasteComplianceMapper.countByRegulationNameContaining(regulationName);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public WasteComplianceResponse findById(Long id) {
        WasteCompliance entity = wasteComplianceMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WasteCompliance", "id", id);
        }
        return WasteComplianceResponse.from(entity);
    }

    @Transactional(readOnly = true)
    public List<WasteComplianceResponse> findByStatus(String status) {
        return wasteComplianceMapper.findByStatus(status).stream()
                .map(WasteComplianceResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getComplianceStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCount", wasteComplianceMapper.countAll());
        stats.put("compliantCount", wasteComplianceMapper.countByStatus("COMPLIANT"));
        stats.put("nonCompliantCount", wasteComplianceMapper.countByStatus("NON_COMPLIANT"));
        stats.put("notApplicableCount", wasteComplianceMapper.countByStatus("NOT_APPLICABLE"));
        return stats;
    }

    @Transactional
    public WasteComplianceResponse create(WasteComplianceRequest request, String regUser) {
        WasteCompliance entity = WasteCompliance.builder()
                .checkDate(request.getCheckDate() != null ? LocalDate.parse(request.getCheckDate()) : null)
                .regulationName(request.getRegulationName())
                .checkItem(request.getCheckItem())
                .status(request.getStatus())
                .violationDetails(request.getViolationDetails())
                .correctiveAction(request.getCorrectiveAction())
                .actionDeadline(request.getActionDeadline() != null ? LocalDate.parse(request.getActionDeadline()) : null)
                .responsiblePerson(request.getResponsiblePerson())
                .actionStatus(request.getActionStatus())
                .regUser(regUser)
                .build();
        wasteComplianceMapper.insert(entity);
        log.info("Created waste compliance record: {}", entity.getId());
        return WasteComplianceResponse.from(entity);
    }

    @Transactional
    public WasteComplianceResponse update(Long id, WasteComplianceRequest request) {
        WasteCompliance entity = wasteComplianceMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WasteCompliance", "id", id);
        }
        entity.setCheckDate(request.getCheckDate() != null ? LocalDate.parse(request.getCheckDate()) : null);
        entity.setRegulationName(request.getRegulationName());
        entity.setCheckItem(request.getCheckItem());
        entity.setStatus(request.getStatus());
        entity.setViolationDetails(request.getViolationDetails());
        entity.setCorrectiveAction(request.getCorrectiveAction());
        entity.setActionDeadline(request.getActionDeadline() != null ? LocalDate.parse(request.getActionDeadline()) : null);
        entity.setResponsiblePerson(request.getResponsiblePerson());
        entity.setActionStatus(request.getActionStatus());
        wasteComplianceMapper.update(entity);
        log.info("Updated waste compliance record: {}", id);
        return WasteComplianceResponse.from(entity);
    }

    @Transactional
    public void delete(Long id) {
        WasteCompliance entity = wasteComplianceMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WasteCompliance", "id", id);
        }
        wasteComplianceMapper.delete(id);
        log.info("Deleted waste compliance record: {}", id);
    }
}
