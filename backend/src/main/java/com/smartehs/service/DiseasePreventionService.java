package com.smartehs.service;

import com.smartehs.dto.request.DiseasePreventionRequest;
import com.smartehs.dto.response.DiseasePreventionResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.DiseasePreventionMapper;
import com.smartehs.model.DiseasePrevention;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiseasePreventionService {

    private final DiseasePreventionMapper diseasePreventionMapper;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Transactional(readOnly = true)
    public Page<DiseasePreventionResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<DiseasePreventionResponse> content = diseasePreventionMapper.findAll(offset, limit).stream()
                .map(DiseasePreventionResponse::from)
                .collect(Collectors.toList());
        int total = diseasePreventionMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<DiseasePreventionResponse> search(String keyword, String hazardType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<DiseasePreventionResponse> content = diseasePreventionMapper.search(keyword, hazardType, offset, limit).stream()
                .map(DiseasePreventionResponse::from)
                .collect(Collectors.toList());
        int total = diseasePreventionMapper.countSearch(keyword, hazardType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public DiseasePreventionResponse findById(Long id) {
        DiseasePrevention entity = diseasePreventionMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("DiseasePrevention", "id", id);
        }
        return DiseasePreventionResponse.from(entity);
    }

    @Transactional
    public DiseasePreventionResponse create(DiseasePreventionRequest request) {
        String newCaseId = generateCaseId();

        DiseasePrevention entity = DiseasePrevention.builder()
                .caseId(newCaseId)
                .hazardType(request.getHazardType())
                .hazardName(request.getHazardName())
                .description(request.getDescription())
                .affectedArea(request.getAffectedArea())
                .affectedWorkers(request.getAffectedWorkers())
                .riskLevel(request.getRiskLevel())
                .exposureLevel(request.getExposureLevel())
                .preventionMeasure(request.getPreventionMeasure())
                .responsiblePerson(request.getResponsiblePerson())
                .responsibleDept(request.getResponsibleDept())
                .assessmentDate(parseDate(request.getAssessmentDate()))
                .nextAssessment(parseDate(request.getNextAssessment()))
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .notes(request.getNotes())
                .deleted(false)
                .build();

        diseasePreventionMapper.insert(entity);
        log.info("Created disease prevention: {}", newCaseId);

        return findById(entity.getId());
    }

    @Transactional
    public DiseasePreventionResponse update(Long id, DiseasePreventionRequest request) {
        DiseasePrevention entity = diseasePreventionMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("DiseasePrevention", "id", id);
        }

        entity.setHazardType(request.getHazardType());
        entity.setHazardName(request.getHazardName());
        entity.setDescription(request.getDescription());
        entity.setAffectedArea(request.getAffectedArea());
        entity.setAffectedWorkers(request.getAffectedWorkers());
        entity.setRiskLevel(request.getRiskLevel());
        entity.setExposureLevel(request.getExposureLevel());
        entity.setPreventionMeasure(request.getPreventionMeasure());
        entity.setResponsiblePerson(request.getResponsiblePerson());
        entity.setResponsibleDept(request.getResponsibleDept());
        entity.setAssessmentDate(parseDate(request.getAssessmentDate()));
        entity.setNextAssessment(parseDate(request.getNextAssessment()));
        entity.setStatus(request.getStatus());
        entity.setNotes(request.getNotes());

        diseasePreventionMapper.update(entity);
        log.info("Updated disease prevention: {}", entity.getCaseId());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        DiseasePrevention entity = diseasePreventionMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("DiseasePrevention", "id", id);
        }
        diseasePreventionMapper.softDelete(id);
        log.info("Soft deleted disease prevention with id: {}", id);
    }

    private String generateCaseId() {
        String prefix = "DP-" + LocalDate.now().getYear() + "-";
        int count = diseasePreventionMapper.countByCaseIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr.substring(0, 10), DATE_FMT);
        } catch (Exception e) {
            return null;
        }
    }
}
