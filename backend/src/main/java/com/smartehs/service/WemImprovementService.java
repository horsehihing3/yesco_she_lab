package com.smartehs.service;

import com.smartehs.dto.request.WemImprovementRequest;
import com.smartehs.dto.response.WemImprovementResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.WemImprovementMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.model.WemImprovement;
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
public class WemImprovementService {

    private final WemImprovementMapper wemImprovementMapper;

    @Transactional(readOnly = true)
    public Page<WemImprovementResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WemImprovementResponse> content = wemImprovementMapper.findAllWithPaging(offset, limit).stream()
                .map(WemImprovementResponse::from)
                .collect(Collectors.toList());
        int total = wemImprovementMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WemImprovementResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WemImprovementResponse> content = wemImprovementMapper.findByStatus(status, offset, limit).stream()
                .map(WemImprovementResponse::from)
                .collect(Collectors.toList());
        int total = wemImprovementMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WemImprovementResponse> findByExceedLevel(String exceedLevel, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WemImprovementResponse> content = wemImprovementMapper.findByExceedLevel(exceedLevel, offset, limit).stream()
                .map(WemImprovementResponse::from)
                .collect(Collectors.toList());
        int total = wemImprovementMapper.countByExceedLevel(exceedLevel);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public WemImprovementResponse findById(Long id) {
        WemImprovement improvement = wemImprovementMapper.findById(id);
        if (improvement == null) {
            throw new ResourceNotFoundException("WemImprovement", "id", id);
        }
        return WemImprovementResponse.from(improvement);
    }

    @Transactional
    public WemImprovementResponse create(WemImprovementRequest request, IdmUser currentUser) {
        WemImprovement improvement = WemImprovement.builder()
                .processName(request.getProcessName())
                .factorName(request.getFactorName())
                .measuredValue(request.getMeasuredValue())
                .exposureStandard(request.getExposureStandard())
                .exceedRate(request.getExceedRate())
                .exceedLevel(request.getExceedLevel())
                .department(request.getDepartment())
                .measurementDate(request.getMeasurementDate())
                .measurementAgency(request.getMeasurementAgency())
                .deadline(request.getDeadline())
                .remainingDays(request.getRemainingDays())
                .improvementPlan(request.getImprovementPlan())
                .status(request.getStatus() != null ? request.getStatus() : "PLANNED")
                .completionDate(request.getCompletionDate())
                .remarks(request.getRemarks())
                .build();
        if (currentUser != null) {
            improvement.setCreatedByUserId(currentUser.getUidNumber());
            improvement.setCreatedByName(currentUser.getUserName());
            improvement.setModifiedByUserId(currentUser.getUidNumber());
            improvement.setModifiedByName(currentUser.getUserName());
        }

        wemImprovementMapper.insert(improvement);
        log.info("Created WEM improvement: {}", improvement.getId());
        return WemImprovementResponse.from(improvement);
    }

    @Transactional
    public WemImprovementResponse update(Long id, WemImprovementRequest request, IdmUser currentUser) {
        WemImprovement improvement = wemImprovementMapper.findById(id);
        if (improvement == null) {
            throw new ResourceNotFoundException("WemImprovement", "id", id);
        }

        improvement.setProcessName(request.getProcessName());
        improvement.setFactorName(request.getFactorName());
        improvement.setMeasuredValue(request.getMeasuredValue());
        improvement.setExposureStandard(request.getExposureStandard());
        improvement.setExceedRate(request.getExceedRate());
        improvement.setExceedLevel(request.getExceedLevel());
        improvement.setDepartment(request.getDepartment());
        improvement.setMeasurementDate(request.getMeasurementDate());
        improvement.setMeasurementAgency(request.getMeasurementAgency());
        improvement.setDeadline(request.getDeadline());
        improvement.setRemainingDays(request.getRemainingDays());
        improvement.setImprovementPlan(request.getImprovementPlan());
        improvement.setStatus(request.getStatus());
        improvement.setCompletionDate(request.getCompletionDate());
        improvement.setRemarks(request.getRemarks());
        if (currentUser != null) {
            improvement.setModifiedByUserId(currentUser.getUidNumber());
            improvement.setModifiedByName(currentUser.getUserName());
        }

        wemImprovementMapper.update(improvement);
        log.info("Updated WEM improvement: {}", id);
        return WemImprovementResponse.from(improvement);
    }

    @Transactional
    public void delete(Long id) {
        WemImprovement improvement = wemImprovementMapper.findById(id);
        if (improvement == null) {
            throw new ResourceNotFoundException("WemImprovement", "id", id);
        }
        wemImprovementMapper.delete(id);
        log.info("Deleted WEM improvement with id: {}", id);
    }
}
