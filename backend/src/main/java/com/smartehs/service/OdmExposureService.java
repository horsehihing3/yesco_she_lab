package com.smartehs.service;

import com.smartehs.dto.request.OdmExposureRequest;
import com.smartehs.dto.response.OdmExposureResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.OdmExposureMapper;
import com.smartehs.model.OdmExposure;
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
public class OdmExposureService {

    private final OdmExposureMapper odmExposureMapper;

    @Transactional(readOnly = true)
    public Page<OdmExposureResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<OdmExposureResponse> content = odmExposureMapper.findAllWithPaging(offset, limit).stream()
                .map(OdmExposureResponse::from)
                .collect(Collectors.toList());
        int total = odmExposureMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<OdmExposureResponse> findByRiskLevel(String riskLevel, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<OdmExposureResponse> content = odmExposureMapper.findByRiskLevel(riskLevel, offset, limit).stream()
                .map(OdmExposureResponse::from)
                .collect(Collectors.toList());
        int total = odmExposureMapper.countByRiskLevel(riskLevel);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public OdmExposureResponse findById(Long id) {
        OdmExposure exposure = odmExposureMapper.findById(id);
        if (exposure == null) {
            throw new ResourceNotFoundException("OdmExposure", "id", id);
        }
        return OdmExposureResponse.from(exposure);
    }

    @Transactional
    public OdmExposureResponse create(OdmExposureRequest request) {
        OdmExposure exposure = OdmExposure.builder()
                .employeeName(request.getEmployeeName())
                .employeeNo(request.getEmployeeNo())
                .department(request.getDepartment())
                .hazardFactor(request.getHazardFactor())
                .exposureLevel(request.getExposureLevel())
                .exposureStandard(request.getExposureStandard())
                .exposurePeriod(request.getExposurePeriod())
                .riskLevel(request.getRiskLevel())
                .exceedCount(request.getExceedCount() != null ? request.getExceedCount() : 0)
                .exposedWorkers(request.getExposedWorkers() != null ? request.getExposedWorkers() : 0)
                .measurementDate(request.getMeasurementDate())
                .remarks(request.getRemarks())
                .build();

        odmExposureMapper.insert(exposure);
        log.info("Created ODM exposure: {}", exposure.getId());
        return OdmExposureResponse.from(exposure);
    }

    @Transactional
    public OdmExposureResponse update(Long id, OdmExposureRequest request) {
        OdmExposure exposure = odmExposureMapper.findById(id);
        if (exposure == null) {
            throw new ResourceNotFoundException("OdmExposure", "id", id);
        }

        exposure.setEmployeeName(request.getEmployeeName());
        exposure.setEmployeeNo(request.getEmployeeNo());
        exposure.setDepartment(request.getDepartment());
        exposure.setHazardFactor(request.getHazardFactor());
        exposure.setExposureLevel(request.getExposureLevel());
        exposure.setExposureStandard(request.getExposureStandard());
        exposure.setExposurePeriod(request.getExposurePeriod());
        exposure.setRiskLevel(request.getRiskLevel());
        exposure.setExceedCount(request.getExceedCount());
        exposure.setExposedWorkers(request.getExposedWorkers());
        exposure.setMeasurementDate(request.getMeasurementDate());
        exposure.setRemarks(request.getRemarks());

        odmExposureMapper.update(exposure);
        log.info("Updated ODM exposure: {}", id);
        return OdmExposureResponse.from(exposure);
    }

    @Transactional
    public void delete(Long id) {
        OdmExposure exposure = odmExposureMapper.findById(id);
        if (exposure == null) {
            throw new ResourceNotFoundException("OdmExposure", "id", id);
        }
        odmExposureMapper.delete(id);
        log.info("Deleted ODM exposure with id: {}", id);
    }
}
