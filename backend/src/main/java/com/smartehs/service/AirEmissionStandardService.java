package com.smartehs.service;

import com.smartehs.dto.request.AirEmissionStandardRequest;
import com.smartehs.dto.response.AirEmissionStandardResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.AirEmissionStandardMapper;
import com.smartehs.model.AirEmissionStandard;
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
public class AirEmissionStandardService {

    private final AirEmissionStandardMapper airEmissionStandardMapper;

    @Transactional(readOnly = true)
    public Page<AirEmissionStandardResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AirEmissionStandardResponse> content = airEmissionStandardMapper.findAllWithPaging(offset, limit).stream()
                .map(AirEmissionStandardResponse::from)
                .collect(Collectors.toList());
        int total = airEmissionStandardMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public List<AirEmissionStandardResponse> findAllList() {
        return airEmissionStandardMapper.findAllList().stream()
                .map(AirEmissionStandardResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AirEmissionStandardResponse findById(Long id) {
        AirEmissionStandard entity = airEmissionStandardMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("AirEmissionStandard", "id", id);
        }
        return AirEmissionStandardResponse.from(entity);
    }

    @Transactional
    public AirEmissionStandardResponse create(AirEmissionStandardRequest request, String regUser) {
        AirEmissionStandard entity = AirEmissionStandard.builder()
                .itemName(request.getItemName())
                .unit(request.getUnit())
                .minValue(request.getMinValue())
                .maxValue(request.getMaxValue())
                .remark(request.getRemark())
                .regUser(regUser)
                .build();
        airEmissionStandardMapper.insert(entity);
        log.info("Created air emission standard: {}", entity.getId());
        return AirEmissionStandardResponse.from(entity);
    }

    @Transactional
    public AirEmissionStandardResponse update(Long id, AirEmissionStandardRequest request) {
        AirEmissionStandard entity = airEmissionStandardMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("AirEmissionStandard", "id", id);
        }
        entity.setItemName(request.getItemName());
        entity.setUnit(request.getUnit());
        entity.setMinValue(request.getMinValue());
        entity.setMaxValue(request.getMaxValue());
        entity.setRemark(request.getRemark());
        airEmissionStandardMapper.update(entity);
        log.info("Updated air emission standard: {}", id);
        return AirEmissionStandardResponse.from(entity);
    }

    @Transactional
    public void delete(Long id) {
        AirEmissionStandard entity = airEmissionStandardMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("AirEmissionStandard", "id", id);
        }
        airEmissionStandardMapper.delete(id);
        log.info("Deleted air emission standard: {}", id);
    }
}
