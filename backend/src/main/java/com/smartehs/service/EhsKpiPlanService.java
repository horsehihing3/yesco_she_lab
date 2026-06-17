package com.smartehs.service;

import com.smartehs.dto.request.EhsKpiPlanRequest;
import com.smartehs.dto.response.EhsKpiPlanResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EhsKpiPlanMapper;
import com.smartehs.model.EhsKpiPlan;
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
public class EhsKpiPlanService {

    private final EhsKpiPlanMapper ehsKpiPlanMapper;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Transactional(readOnly = true)
    public Page<EhsKpiPlanResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsKpiPlanResponse> content = ehsKpiPlanMapper.findAll(offset, limit).stream()
                .map(EhsKpiPlanResponse::from)
                .collect(Collectors.toList());
        int total = ehsKpiPlanMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EhsKpiPlanResponse> search(String keyword, String indicatorType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsKpiPlanResponse> content = ehsKpiPlanMapper.search(keyword, indicatorType, offset, limit).stream()
                .map(EhsKpiPlanResponse::from)
                .collect(Collectors.toList());
        int total = ehsKpiPlanMapper.countSearch(keyword, indicatorType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public EhsKpiPlanResponse findById(Long id) {
        EhsKpiPlan entity = ehsKpiPlanMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("EhsKpiPlan", "id", id);
        }
        return EhsKpiPlanResponse.from(entity);
    }

    @Transactional
    public EhsKpiPlanResponse create(EhsKpiPlanRequest request) {
        EhsKpiPlan entity = EhsKpiPlan.builder()
                .planYear(request.getPlanYear() != null ? request.getPlanYear() : LocalDate.now().getYear())
                .indicatorType(request.getIndicatorType())
                .indicatorName(request.getIndicatorName())
                .description(request.getDescription())
                .department(request.getDepartment())
                .responsiblePerson(request.getResponsiblePerson())
                .measurementPeriod(request.getMeasurementPeriod())
                .unit(request.getUnit())
                .targetValue(request.getTargetValue())
                .currentValue(request.getCurrentValue())
                .achievementRate(request.getAchievementRate())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .startDate(parseDate(request.getStartDate()))
                .endDate(parseDate(request.getEndDate()))
                .notes(request.getNotes())
                .deleted(false)
                .build();

        ehsKpiPlanMapper.insert(entity);
        log.info("Created SHE KPI Plan: {}", entity.getId());

        return findById(entity.getId());
    }

    @Transactional
    public EhsKpiPlanResponse update(Long id, EhsKpiPlanRequest request) {
        EhsKpiPlan entity = ehsKpiPlanMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("EhsKpiPlan", "id", id);
        }

        entity.setPlanYear(request.getPlanYear() != null ? request.getPlanYear() : entity.getPlanYear());
        entity.setIndicatorType(request.getIndicatorType());
        entity.setIndicatorName(request.getIndicatorName());
        entity.setDescription(request.getDescription());
        entity.setDepartment(request.getDepartment());
        entity.setResponsiblePerson(request.getResponsiblePerson());
        entity.setMeasurementPeriod(request.getMeasurementPeriod());
        entity.setUnit(request.getUnit());
        entity.setTargetValue(request.getTargetValue());
        entity.setCurrentValue(request.getCurrentValue());
        entity.setAchievementRate(request.getAchievementRate());
        entity.setStatus(request.getStatus());
        entity.setStartDate(parseDate(request.getStartDate()));
        entity.setEndDate(parseDate(request.getEndDate()));
        entity.setNotes(request.getNotes());

        ehsKpiPlanMapper.update(entity);
        log.info("Updated SHE KPI Plan: {}", id);

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        EhsKpiPlan entity = ehsKpiPlanMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("EhsKpiPlan", "id", id);
        }
        ehsKpiPlanMapper.softDelete(id);
        log.info("Soft deleted SHE KPI Plan with id: {}", id);
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
