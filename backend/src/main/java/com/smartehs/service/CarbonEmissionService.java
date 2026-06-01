package com.smartehs.service;

import com.smartehs.dto.request.CarbonEmissionRequest;
import com.smartehs.dto.response.CarbonEmissionResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.CarbonEmissionMapper;
import com.smartehs.model.CarbonEmission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CarbonEmissionService {

    private final CarbonEmissionMapper carbonEmissionMapper;

    @Transactional(readOnly = true)
    public Page<CarbonEmissionResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<CarbonEmissionResponse> content = carbonEmissionMapper.findAllWithPaging(offset, limit).stream()
                .map(CarbonEmissionResponse::from)
                .collect(Collectors.toList());
        int total = carbonEmissionMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<CarbonEmissionResponse> search(String sourceName, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<CarbonEmissionResponse> content = carbonEmissionMapper.findBySourceNameContaining(sourceName, offset, limit).stream()
                .map(CarbonEmissionResponse::from)
                .collect(Collectors.toList());
        int total = carbonEmissionMapper.countBySourceNameContaining(sourceName);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<CarbonEmissionResponse> findByScope(int scope, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<CarbonEmissionResponse> content = carbonEmissionMapper.findByScope(scope, offset, limit).stream()
                .map(CarbonEmissionResponse::from)
                .collect(Collectors.toList());
        int total = carbonEmissionMapper.countByScope(scope);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public CarbonEmissionResponse findById(Long id) {
        CarbonEmission entity = carbonEmissionMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("CarbonEmission", "id", id);
        }
        return CarbonEmissionResponse.from(entity);
    }

    @Transactional(readOnly = true)
    public List<CarbonEmissionResponse> findAllList() {
        return carbonEmissionMapper.findAllList().stream()
                .map(CarbonEmissionResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        return carbonEmissionMapper.getDashboardStats();
    }

    @Transactional
    public CarbonEmissionResponse create(CarbonEmissionRequest request, String regUser) {
        CarbonEmission entity = CarbonEmission.builder()
                .recordDate(request.getRecordDate() != null ? LocalDate.parse(request.getRecordDate()) : null)
                .sourceName(request.getSourceName())
                .scope(request.getScope())
                .energyUsage(request.getEnergyUsage())
                .energyUnit(request.getEnergyUnit())
                .co2Emission(request.getCo2Emission())
                .factorId(request.getFactorId())
                .manager(request.getManager())
                .remark(request.getRemark())
                .regUser(regUser)
                .build();
        carbonEmissionMapper.insert(entity);
        log.info("Created carbon emission record: {}", entity.getId());
        return CarbonEmissionResponse.from(entity);
    }

    @Transactional
    public CarbonEmissionResponse update(Long id, CarbonEmissionRequest request) {
        CarbonEmission entity = carbonEmissionMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("CarbonEmission", "id", id);
        }
        entity.setRecordDate(request.getRecordDate() != null ? LocalDate.parse(request.getRecordDate()) : null);
        entity.setSourceName(request.getSourceName());
        entity.setScope(request.getScope());
        entity.setEnergyUsage(request.getEnergyUsage());
        entity.setEnergyUnit(request.getEnergyUnit());
        entity.setCo2Emission(request.getCo2Emission());
        entity.setFactorId(request.getFactorId());
        entity.setManager(request.getManager());
        entity.setRemark(request.getRemark());
        carbonEmissionMapper.update(entity);
        log.info("Updated carbon emission record: {}", id);
        return CarbonEmissionResponse.from(entity);
    }

    @Transactional
    public void delete(Long id) {
        CarbonEmission entity = carbonEmissionMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("CarbonEmission", "id", id);
        }
        carbonEmissionMapper.delete(id);
        log.info("Deleted carbon emission record: {}", id);
    }
}
