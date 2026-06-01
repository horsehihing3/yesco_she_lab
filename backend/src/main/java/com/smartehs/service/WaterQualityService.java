package com.smartehs.service;

import com.smartehs.dto.request.WaterQualityRequest;
import com.smartehs.dto.response.WaterQualityResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.WaterQualityMapper;
import com.smartehs.model.WaterQuality;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WaterQualityService {

    private final WaterQualityMapper waterQualityMapper;

    @Transactional(readOnly = true)
    public Page<WaterQualityResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WaterQualityResponse> content = waterQualityMapper.findAllWithPaging(offset, limit).stream()
                .map(WaterQualityResponse::from)
                .collect(Collectors.toList());
        int total = waterQualityMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WaterQualityResponse> search(String measurementPoint, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WaterQualityResponse> content = waterQualityMapper.findByMeasurementPointContaining(measurementPoint, offset, limit).stream()
                .map(WaterQualityResponse::from)
                .collect(Collectors.toList());
        int total = waterQualityMapper.countByMeasurementPointContaining(measurementPoint);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public WaterQualityResponse findById(Long id) {
        WaterQuality entity = waterQualityMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WaterQuality", "id", id);
        }
        return WaterQualityResponse.from(entity);
    }

    @Transactional
    public WaterQualityResponse create(WaterQualityRequest request, String regUser) {
        WaterQuality entity = WaterQuality.builder()
                .measurementDate(request.getMeasurementDate() != null ? LocalDate.parse(request.getMeasurementDate()) : null)
                .measurementPoint(request.getMeasurementPoint())
                .ph(request.getPh())
                .bod(request.getBod())
                .cod(request.getCod())
                .ss(request.getSs())
                .tN(request.getTN())
                .tP(request.getTP())
                .manager(request.getManager())
                .remark(request.getRemark())
                .regUser(regUser)
                .build();
        waterQualityMapper.insert(entity);
        log.info("Created water quality record: {}", entity.getId());
        return WaterQualityResponse.from(entity);
    }

    @Transactional
    public WaterQualityResponse update(Long id, WaterQualityRequest request) {
        WaterQuality entity = waterQualityMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WaterQuality", "id", id);
        }
        entity.setMeasurementDate(request.getMeasurementDate() != null ? LocalDate.parse(request.getMeasurementDate()) : null);
        entity.setMeasurementPoint(request.getMeasurementPoint());
        entity.setPh(request.getPh());
        entity.setBod(request.getBod());
        entity.setCod(request.getCod());
        entity.setSs(request.getSs());
        entity.setTN(request.getTN());
        entity.setTP(request.getTP());
        entity.setManager(request.getManager());
        entity.setRemark(request.getRemark());
        waterQualityMapper.update(entity);
        log.info("Updated water quality record: {}", id);
        return WaterQualityResponse.from(entity);
    }

    @Transactional
    public void delete(Long id) {
        WaterQuality entity = waterQualityMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WaterQuality", "id", id);
        }
        waterQualityMapper.delete(id);
        log.info("Deleted water quality record: {}", id);
    }
}
