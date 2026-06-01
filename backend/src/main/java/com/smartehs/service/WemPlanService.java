package com.smartehs.service;

import com.smartehs.dto.request.WemPlanRequest;
import com.smartehs.dto.response.WemPlanResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.WemPlanMapper;
import com.smartehs.model.WemPlan;
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
public class WemPlanService {

    private final WemPlanMapper wemPlanMapper;

    @Transactional(readOnly = true)
    public Page<WemPlanResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WemPlanResponse> content = wemPlanMapper.findAllWithPaging(offset, limit).stream()
                .map(WemPlanResponse::from)
                .collect(Collectors.toList());
        int total = wemPlanMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WemPlanResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WemPlanResponse> content = wemPlanMapper.findByStatus(status, offset, limit).stream()
                .map(WemPlanResponse::from)
                .collect(Collectors.toList());
        int total = wemPlanMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public WemPlanResponse findById(Long id) {
        WemPlan plan = wemPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("WemPlan", "id", id);
        }
        return WemPlanResponse.from(plan);
    }

    @Transactional
    public WemPlanResponse create(WemPlanRequest request) {
        WemPlan plan = WemPlan.builder()
                .planYear(request.getPlanYear())
                .processName(request.getProcessName())
                .department(request.getDepartment())
                .hazardType(request.getHazardType())
                .measurementCycle(request.getMeasurementCycle())
                .lastMeasurementDate(request.getLastMeasurementDate())
                .nextMeasurementDate(request.getNextMeasurementDate())
                .status(request.getStatus() != null ? request.getStatus() : "PLANNED")
                .measurementAgency(request.getMeasurementAgency())
                .agencyCode(request.getAgencyCode())
                .contractPeriod(request.getContractPeriod())
                .remarks(request.getRemarks())
                .build();

        wemPlanMapper.insert(plan);
        log.info("Created WEM plan: {}", plan.getId());
        return WemPlanResponse.from(plan);
    }

    @Transactional
    public WemPlanResponse update(Long id, WemPlanRequest request) {
        WemPlan plan = wemPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("WemPlan", "id", id);
        }

        plan.setPlanYear(request.getPlanYear());
        plan.setProcessName(request.getProcessName());
        plan.setDepartment(request.getDepartment());
        plan.setHazardType(request.getHazardType());
        plan.setMeasurementCycle(request.getMeasurementCycle());
        plan.setLastMeasurementDate(request.getLastMeasurementDate());
        plan.setNextMeasurementDate(request.getNextMeasurementDate());
        plan.setStatus(request.getStatus());
        plan.setMeasurementAgency(request.getMeasurementAgency());
        plan.setAgencyCode(request.getAgencyCode());
        plan.setContractPeriod(request.getContractPeriod());
        plan.setRemarks(request.getRemarks());

        wemPlanMapper.update(plan);
        log.info("Updated WEM plan: {}", id);
        return WemPlanResponse.from(plan);
    }

    @Transactional
    public void delete(Long id) {
        WemPlan plan = wemPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("WemPlan", "id", id);
        }
        wemPlanMapper.delete(id);
        log.info("Deleted WEM plan with id: {}", id);
    }
}
