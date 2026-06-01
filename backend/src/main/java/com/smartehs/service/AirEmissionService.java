package com.smartehs.service;

import com.smartehs.dto.request.AirEmissionRequest;
import com.smartehs.dto.response.AirEmissionResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.AirEmissionMapper;
import com.smartehs.model.AirEmission;
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
public class AirEmissionService {

    private final AirEmissionMapper airEmissionMapper;

    @Transactional(readOnly = true)
    public Page<AirEmissionResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AirEmissionResponse> content = airEmissionMapper.findAllWithPaging(offset, limit).stream()
                .map(AirEmissionResponse::from)
                .collect(Collectors.toList());
        int total = airEmissionMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<AirEmissionResponse> search(String facility, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<AirEmissionResponse> content = airEmissionMapper.findByFacilityContaining(facility, offset, limit).stream()
                .map(AirEmissionResponse::from)
                .collect(Collectors.toList());
        int total = airEmissionMapper.countByFacilityContaining(facility);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public List<AirEmissionResponse> findAllList() {
        return airEmissionMapper.findAllList().stream()
                .map(AirEmissionResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AirEmissionResponse findById(Long id) {
        AirEmission entity = airEmissionMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("AirEmission", "id", id);
        }
        return AirEmissionResponse.from(entity);
    }

    @Transactional
    public AirEmissionResponse create(AirEmissionRequest request, String regUser) {
        AirEmission entity = AirEmission.builder()
                .measurementDate(request.getMeasurementDate() != null ? LocalDate.parse(request.getMeasurementDate()) : null)
                .facility(request.getFacility())
                .pollutant(request.getPollutant())
                .emissionConcentration(request.getEmissionConcentration())
                .unit(request.getUnit())
                .emissionStandard(request.getEmissionStandard())
                .compliance(request.getCompliance())
                .manager(request.getManager())
                .remark(request.getRemark())
                .regUser(regUser)
                .build();
        airEmissionMapper.insert(entity);
        log.info("Created air emission record: {}", entity.getId());
        return AirEmissionResponse.from(entity);
    }

    @Transactional
    public AirEmissionResponse update(Long id, AirEmissionRequest request) {
        AirEmission entity = airEmissionMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("AirEmission", "id", id);
        }
        entity.setMeasurementDate(request.getMeasurementDate() != null ? LocalDate.parse(request.getMeasurementDate()) : null);
        entity.setFacility(request.getFacility());
        entity.setPollutant(request.getPollutant());
        entity.setEmissionConcentration(request.getEmissionConcentration());
        entity.setUnit(request.getUnit());
        entity.setEmissionStandard(request.getEmissionStandard());
        entity.setCompliance(request.getCompliance());
        entity.setManager(request.getManager());
        entity.setRemark(request.getRemark());
        airEmissionMapper.update(entity);
        log.info("Updated air emission record: {}", id);
        return AirEmissionResponse.from(entity);
    }

    @Transactional
    public void delete(Long id) {
        AirEmission entity = airEmissionMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("AirEmission", "id", id);
        }
        airEmissionMapper.delete(id);
        log.info("Deleted air emission record: {}", id);
    }
}
