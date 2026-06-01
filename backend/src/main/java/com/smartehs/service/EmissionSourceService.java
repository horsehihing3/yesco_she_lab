package com.smartehs.service;

import com.smartehs.dto.request.EmissionSourceRequest;
import com.smartehs.dto.response.EmissionSourceResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EmissionSourceMapper;
import com.smartehs.model.EmissionSource;
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
public class EmissionSourceService {

    private final EmissionSourceMapper emissionSourceMapper;

    @Transactional(readOnly = true)
    public Page<EmissionSourceResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmissionSourceResponse> content = emissionSourceMapper.findAllWithPaging(offset, limit).stream()
                .map(EmissionSourceResponse::from)
                .collect(Collectors.toList());
        int total = emissionSourceMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EmissionSourceResponse> search(String sourceName, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmissionSourceResponse> content = emissionSourceMapper.findBySourceNameContaining(sourceName, offset, limit).stream()
                .map(EmissionSourceResponse::from)
                .collect(Collectors.toList());
        int total = emissionSourceMapper.countBySourceNameContaining(sourceName);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public EmissionSourceResponse findById(Long id) {
        EmissionSource entity = emissionSourceMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("EmissionSource", "id", id);
        }
        return EmissionSourceResponse.from(entity);
    }

    @Transactional(readOnly = true)
    public List<EmissionSourceResponse> findAllActive() {
        return emissionSourceMapper.findAllActive().stream()
                .map(EmissionSourceResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmissionSourceResponse create(EmissionSourceRequest request, String regUser) {
        String sourceCode = request.getSourceCode();
        if (sourceCode == null || sourceCode.isBlank()) {
            int total = emissionSourceMapper.countAll();
            sourceCode = "SRC-" + String.format("%04d", total + 1);
        }
        EmissionSource entity = EmissionSource.builder()
                .sourceCode(sourceCode)
                .sourceName(request.getSourceName())
                .sourceType(request.getSourceType())
                .scope(request.getScope())
                .location(request.getLocation())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .annualEmission(request.getAnnualEmission())
                .remark(request.getRemark())
                .regUser(regUser)
                .build();
        emissionSourceMapper.insert(entity);
        log.info("Created emission source record: {}", entity.getId());
        return EmissionSourceResponse.from(entity);
    }

    @Transactional
    public EmissionSourceResponse update(Long id, EmissionSourceRequest request) {
        EmissionSource entity = emissionSourceMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("EmissionSource", "id", id);
        }
        entity.setSourceCode(request.getSourceCode());
        entity.setSourceName(request.getSourceName());
        entity.setSourceType(request.getSourceType());
        entity.setScope(request.getScope());
        entity.setLocation(request.getLocation());
        entity.setStatus(request.getStatus());
        entity.setAnnualEmission(request.getAnnualEmission());
        entity.setRemark(request.getRemark());
        emissionSourceMapper.update(entity);
        log.info("Updated emission source record: {}", id);
        return EmissionSourceResponse.from(entity);
    }

    @Transactional
    public void delete(Long id) {
        EmissionSource entity = emissionSourceMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("EmissionSource", "id", id);
        }
        emissionSourceMapper.delete(id);
        log.info("Deleted emission source record: {}", id);
    }
}
