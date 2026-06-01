package com.smartehs.service;

import com.smartehs.dto.request.EmissionFactorRequest;
import com.smartehs.dto.response.EmissionFactorResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EmissionFactorMapper;
import com.smartehs.model.EmissionFactor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmissionFactorService {

    private final EmissionFactorMapper emissionFactorMapper;

    @Transactional(readOnly = true)
    public Page<EmissionFactorResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmissionFactorResponse> content = emissionFactorMapper.findAllWithPaging(offset, limit).stream()
                .map(EmissionFactorResponse::from)
                .collect(Collectors.toList());
        int total = emissionFactorMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EmissionFactorResponse> search(String energySource, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmissionFactorResponse> content = emissionFactorMapper.findByEnergySourceContaining(energySource, offset, limit).stream()
                .map(EmissionFactorResponse::from)
                .collect(Collectors.toList());
        int total = emissionFactorMapper.countByEnergySourceContaining(energySource);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public EmissionFactorResponse findById(Long id) {
        EmissionFactor entity = emissionFactorMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("EmissionFactor", "id", id);
        }
        return EmissionFactorResponse.from(entity);
    }

    @Transactional(readOnly = true)
    public List<EmissionFactorResponse> findAllList() {
        return emissionFactorMapper.findAllList().stream()
                .map(EmissionFactorResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmissionFactorResponse create(EmissionFactorRequest request, String regUser) {
        EmissionFactor entity = EmissionFactor.builder()
                .energySource(request.getEnergySource())
                .unit(request.getUnit())
                .factorValue(request.getFactorValue())
                .baseYear(request.getBaseYear())
                .referenceOrg(request.getReferenceOrg())
                .scope(request.getScope())
                .remark(request.getRemark())
                .regUser(regUser)
                .build();
        emissionFactorMapper.insert(entity);
        log.info("Created emission factor record: {}", entity.getId());
        return EmissionFactorResponse.from(entity);
    }

    @Transactional
    public EmissionFactorResponse update(Long id, EmissionFactorRequest request) {
        EmissionFactor entity = emissionFactorMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("EmissionFactor", "id", id);
        }
        entity.setEnergySource(request.getEnergySource());
        entity.setUnit(request.getUnit());
        entity.setFactorValue(request.getFactorValue());
        entity.setBaseYear(request.getBaseYear());
        entity.setReferenceOrg(request.getReferenceOrg());
        entity.setScope(request.getScope());
        entity.setRemark(request.getRemark());
        emissionFactorMapper.update(entity);
        log.info("Updated emission factor record: {}", id);
        return EmissionFactorResponse.from(entity);
    }

    @Transactional
    public void delete(Long id) {
        EmissionFactor entity = emissionFactorMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("EmissionFactor", "id", id);
        }
        emissionFactorMapper.delete(id);
        log.info("Deleted emission factor record: {}", id);
    }
}
