package com.smartehs.service;

import com.smartehs.dto.request.HazardFactorRequest;
import com.smartehs.dto.response.HazardFactorResponse;
import com.smartehs.model.HazardFactor;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.HazardFactorMapper;
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
public class HazardFactorService {

    private final HazardFactorMapper hazardFactorMapper;

    @Transactional(readOnly = true)
    public Page<HazardFactorResponse> findByType(String hazardType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<HazardFactorResponse> content = hazardFactorMapper.findAllByType(hazardType, offset, limit).stream()
                .map(HazardFactorResponse::from)
                .collect(Collectors.toList());
        int total = hazardFactorMapper.countByType(hazardType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<HazardFactorResponse> findByTypeAndRiskLevel(String hazardType, String riskLevel, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<HazardFactorResponse> content = hazardFactorMapper.findByTypeAndRiskLevel(hazardType, riskLevel, offset, limit).stream()
                .map(HazardFactorResponse::from)
                .collect(Collectors.toList());
        int total = hazardFactorMapper.countByTypeAndRiskLevel(hazardType, riskLevel);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<HazardFactorResponse> searchByName(String hazardType, String name, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<HazardFactorResponse> content = hazardFactorMapper.searchByName(hazardType, name, offset, limit).stream()
                .map(HazardFactorResponse::from)
                .collect(Collectors.toList());
        int total = hazardFactorMapper.countBySearchName(hazardType, name);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public HazardFactorResponse findById(Long id) {
        HazardFactor hazardFactor = hazardFactorMapper.findById(id);
        if (hazardFactor == null) {
            throw new ResourceNotFoundException("HazardFactor", "id", id);
        }
        return HazardFactorResponse.from(hazardFactor);
    }

    @Transactional
    public HazardFactorResponse create(HazardFactorRequest request) {
        HazardFactor hazardFactor = HazardFactor.builder()
                .hazardType(request.getHazardType())
                .factorName(request.getFactorName())
                .category(request.getCategory())
                .process(request.getProcess())
                .riskLevel(request.getRiskLevel())
                .measuredValue(request.getMeasuredValue())
                .exposureStandard(request.getExposureStandard())
                .assessmentMethod(request.getAssessmentMethod())
                .assessmentScore(request.getAssessmentScore())
                .casNumber(request.getCasNumber())
                .exposureRoute(request.getExposureRoute())
                .vaccinationStatus(request.getVaccinationStatus())
                .targetGroup(request.getTargetGroup())
                .targetCount(request.getTargetCount())
                .highRiskCount(request.getHighRiskCount())
                .preventionStatus(request.getPreventionStatus())
                .preventionDetail(request.getPreventionDetail())
                .preventionRate(request.getPreventionRate() != null ? request.getPreventionRate() : 0)
                .lastCheckDate(request.getLastCheckDate())
                .managerName(request.getManagerName())
                .managerDept(request.getManagerDept())
                .remarks(request.getRemarks())
                .build();

        hazardFactorMapper.insert(hazardFactor);
        log.info("Created hazard factor: {} (type: {})", hazardFactor.getId(), hazardFactor.getHazardType());
        return HazardFactorResponse.from(hazardFactor);
    }

    @Transactional
    public HazardFactorResponse update(Long id, HazardFactorRequest request) {
        HazardFactor hazardFactor = hazardFactorMapper.findById(id);
        if (hazardFactor == null) {
            throw new ResourceNotFoundException("HazardFactor", "id", id);
        }

        hazardFactor.setHazardType(request.getHazardType());
        hazardFactor.setFactorName(request.getFactorName());
        hazardFactor.setCategory(request.getCategory());
        hazardFactor.setProcess(request.getProcess());
        hazardFactor.setRiskLevel(request.getRiskLevel());
        hazardFactor.setMeasuredValue(request.getMeasuredValue());
        hazardFactor.setExposureStandard(request.getExposureStandard());
        hazardFactor.setAssessmentMethod(request.getAssessmentMethod());
        hazardFactor.setAssessmentScore(request.getAssessmentScore());
        hazardFactor.setCasNumber(request.getCasNumber());
        hazardFactor.setExposureRoute(request.getExposureRoute());
        hazardFactor.setVaccinationStatus(request.getVaccinationStatus());
        hazardFactor.setTargetGroup(request.getTargetGroup());
        hazardFactor.setTargetCount(request.getTargetCount());
        hazardFactor.setHighRiskCount(request.getHighRiskCount());
        hazardFactor.setPreventionStatus(request.getPreventionStatus());
        hazardFactor.setPreventionDetail(request.getPreventionDetail());
        hazardFactor.setPreventionRate(request.getPreventionRate());
        hazardFactor.setLastCheckDate(request.getLastCheckDate());
        hazardFactor.setManagerName(request.getManagerName());
        hazardFactor.setManagerDept(request.getManagerDept());
        hazardFactor.setRemarks(request.getRemarks());

        hazardFactorMapper.update(hazardFactor);
        log.info("Updated hazard factor: {}", id);
        return HazardFactorResponse.from(hazardFactor);
    }

    @Transactional
    public void delete(Long id) {
        HazardFactor hazardFactor = hazardFactorMapper.findById(id);
        if (hazardFactor == null) {
            throw new ResourceNotFoundException("HazardFactor", "id", id);
        }
        hazardFactorMapper.delete(id);
        log.info("Deleted hazard factor with id: {}", id);
    }
}
