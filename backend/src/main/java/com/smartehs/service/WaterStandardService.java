package com.smartehs.service;

import com.smartehs.dto.request.WaterStandardRequest;
import com.smartehs.dto.response.WaterStandardResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.WaterStandardMapper;
import com.smartehs.model.WaterStandard;
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
public class WaterStandardService {

    private final WaterStandardMapper waterStandardMapper;

    @Transactional(readOnly = true)
    public Page<WaterStandardResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WaterStandardResponse> content = waterStandardMapper.findAllWithPaging(offset, limit).stream()
                .map(WaterStandardResponse::from)
                .collect(Collectors.toList());
        int total = waterStandardMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public List<WaterStandardResponse> findAllList() {
        return waterStandardMapper.findAll().stream()
                .map(WaterStandardResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WaterStandardResponse findById(Long id) {
        WaterStandard entity = waterStandardMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WaterStandard", "id", id);
        }
        return WaterStandardResponse.from(entity);
    }

    @Transactional
    public WaterStandardResponse create(WaterStandardRequest request, String regUser) {
        WaterStandard entity = WaterStandard.builder()
                .itemName(request.getItemName())
                .unit(request.getUnit())
                .minValue(request.getMinValue())
                .maxValue(request.getMaxValue())
                .remark(request.getRemark())
                .regUser(regUser)
                .build();
        waterStandardMapper.insert(entity);
        log.info("Created water standard record: {}", entity.getId());
        return WaterStandardResponse.from(entity);
    }

    @Transactional
    public WaterStandardResponse update(Long id, WaterStandardRequest request) {
        WaterStandard entity = waterStandardMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WaterStandard", "id", id);
        }
        entity.setItemName(request.getItemName());
        entity.setUnit(request.getUnit());
        entity.setMinValue(request.getMinValue());
        entity.setMaxValue(request.getMaxValue());
        entity.setRemark(request.getRemark());
        waterStandardMapper.update(entity);
        log.info("Updated water standard record: {}", id);
        return WaterStandardResponse.from(entity);
    }

    @Transactional
    public void delete(Long id) {
        WaterStandard entity = waterStandardMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WaterStandard", "id", id);
        }
        waterStandardMapper.delete(id);
        log.info("Deleted water standard record: {}", id);
    }
}
