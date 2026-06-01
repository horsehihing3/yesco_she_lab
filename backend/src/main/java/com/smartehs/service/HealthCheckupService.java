package com.smartehs.service;

import com.smartehs.dto.request.HealthCheckupDetailRequest;
import com.smartehs.dto.request.HealthCheckupRequest;
import com.smartehs.dto.response.HealthCheckupDetailResponse;
import com.smartehs.dto.response.HealthCheckupResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.HealthCheckupDetailMapper;
import com.smartehs.mapper.HealthCheckupMapper;
import com.smartehs.model.HealthCheckup;
import com.smartehs.model.HealthCheckupDetail;
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
public class HealthCheckupService {

    private final HealthCheckupMapper healthCheckupMapper;
    private final HealthCheckupDetailMapper healthCheckupDetailMapper;

    @Transactional(readOnly = true)
    public Page<HealthCheckupResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<HealthCheckupResponse> content = healthCheckupMapper.findByDeletedFalse(offset, limit).stream()
                .map(HealthCheckupResponse::from)
                .collect(Collectors.toList());
        int total = healthCheckupMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<HealthCheckupResponse> searchByName(String name, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<HealthCheckupResponse> content = healthCheckupMapper.searchByEmployeeNameAndDeletedFalse(name, offset, limit).stream()
                .map(HealthCheckupResponse::from)
                .collect(Collectors.toList());
        int total = healthCheckupMapper.countByEmployeeNameAndDeletedFalse(name);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<HealthCheckupResponse> findByYear(int year, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<HealthCheckupResponse> content = healthCheckupMapper.findByCheckupYearAndDeletedFalse(year, offset, limit).stream()
                .map(HealthCheckupResponse::from)
                .collect(Collectors.toList());
        int total = healthCheckupMapper.countByCheckupYearAndDeletedFalse(year);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<HealthCheckupResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<HealthCheckupResponse> content = healthCheckupMapper.findByStatusAndDeletedFalse(status, offset, limit).stream()
                .map(HealthCheckupResponse::from)
                .collect(Collectors.toList());
        int total = healthCheckupMapper.countByStatusAndDeletedFalse(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<HealthCheckupResponse> findByEmployee(String employeeId, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<HealthCheckupResponse> content = healthCheckupMapper.findByEmployeeIdAndDeletedFalse(employeeId, offset, limit).stream()
                .map(HealthCheckupResponse::from)
                .collect(Collectors.toList());
        int total = healthCheckupMapper.countByEmployeeIdAndDeletedFalse(employeeId);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public List<HealthCheckupResponse> findAllByEmail(String email) {
        return healthCheckupMapper.findAllByEmployeeEmailAndDeletedFalse(email).stream()
                .map(checkup -> {
                    HealthCheckupResponse response = HealthCheckupResponse.from(checkup);
                    List<HealthCheckupDetailResponse> details = healthCheckupDetailMapper
                            .findByCheckupId(checkup.getCheckupId()).stream()
                            .map(HealthCheckupDetailResponse::from)
                            .collect(Collectors.toList());
                    response.setDetails(details);
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<HealthCheckupResponse> findTargets(int year, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<HealthCheckupResponse> content = healthCheckupMapper.findTargetsByYearAndDeletedFalse(year, offset, limit).stream()
                .map(HealthCheckupResponse::from)
                .collect(Collectors.toList());
        int total = healthCheckupMapper.countTargetsByYearAndDeletedFalse(year);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public HealthCheckupResponse findById(Long id) {
        HealthCheckup checkup = healthCheckupMapper.findByIdAndDeletedFalse(id);
        if (checkup == null) {
            throw new ResourceNotFoundException("HealthCheckup", "id", id);
        }
        HealthCheckupResponse response = HealthCheckupResponse.from(checkup);
        List<HealthCheckupDetailResponse> details = healthCheckupDetailMapper.findByCheckupId(checkup.getCheckupId()).stream()
                .map(HealthCheckupDetailResponse::from)
                .collect(Collectors.toList());
        response.setDetails(details);
        return response;
    }

    @Transactional
    public HealthCheckupResponse create(HealthCheckupRequest request) {
        String newCheckupId = generateCheckupId();

        HealthCheckup checkup = HealthCheckup.builder()
                .checkupId(newCheckupId)
                .employeeId(request.getEmployeeId())
                .employeeName(request.getEmployeeName())
                .employeeDept(request.getEmployeeDept())
                .employeeEmail(request.getEmployeeEmail())
                .checkupYear(request.getCheckupYear())
                .checkupType(request.getCheckupType())
                .isTarget(request.getIsTarget() != null ? request.getIsTarget() : false)
                .checkupStatus(request.getCheckupStatus() != null ? request.getCheckupStatus() : "PENDING")
                .checkupDate(request.getCheckupDate())
                .hospital(request.getHospital())
                .overallResult(request.getOverallResult())
                .nextCheckupDate(request.getNextCheckupDate())
                .notes(request.getNotes())
                .authorName(request.getAuthorName())
                .authorEmail(request.getAuthorEmail())
                .authorDept(request.getAuthorDept())
                .deleted(false)
                .build();

        healthCheckupMapper.insert(checkup);
        log.info("Created health checkup: {}", checkup.getCheckupId());

        if (request.getDetails() != null && !request.getDetails().isEmpty()) {
            for (HealthCheckupDetailRequest detailReq : request.getDetails()) {
                HealthCheckupDetail detail = HealthCheckupDetail.builder()
                        .checkupId(newCheckupId)
                        .bodyPart(detailReq.getBodyPart())
                        .category(detailReq.getCategory())
                        .resultValue(detailReq.getResultValue())
                        .referenceRange(detailReq.getReferenceRange())
                        .resultStatus(detailReq.getResultStatus())
                        .notes(detailReq.getNotes())
                        .build();
                healthCheckupDetailMapper.insert(detail);
            }
            log.info("Inserted {} detail records for checkup: {}", request.getDetails().size(), newCheckupId);
        }

        return findById(checkup.getId());
    }

    @Transactional
    public HealthCheckupResponse update(Long id, HealthCheckupRequest request) {
        HealthCheckup checkup = healthCheckupMapper.findByIdAndDeletedFalse(id);
        if (checkup == null) {
            throw new ResourceNotFoundException("HealthCheckup", "id", id);
        }

        checkup.setEmployeeId(request.getEmployeeId());
        checkup.setEmployeeName(request.getEmployeeName());
        checkup.setEmployeeDept(request.getEmployeeDept());
        checkup.setEmployeeEmail(request.getEmployeeEmail());
        checkup.setCheckupYear(request.getCheckupYear());
        checkup.setCheckupType(request.getCheckupType());
        checkup.setIsTarget(request.getIsTarget());
        checkup.setCheckupStatus(request.getCheckupStatus());
        checkup.setCheckupDate(request.getCheckupDate());
        checkup.setHospital(request.getHospital());
        checkup.setOverallResult(request.getOverallResult());
        checkup.setNextCheckupDate(request.getNextCheckupDate());
        checkup.setNotes(request.getNotes());
        checkup.setAuthorName(request.getAuthorName());
        checkup.setAuthorEmail(request.getAuthorEmail());
        checkup.setAuthorDept(request.getAuthorDept());

        healthCheckupMapper.update(checkup);
        log.info("Updated health checkup: {}", checkup.getCheckupId());

        if (request.getDetails() != null) {
            healthCheckupDetailMapper.deleteByCheckupId(checkup.getCheckupId());
            for (HealthCheckupDetailRequest detailReq : request.getDetails()) {
                HealthCheckupDetail detail = HealthCheckupDetail.builder()
                        .checkupId(checkup.getCheckupId())
                        .bodyPart(detailReq.getBodyPart())
                        .category(detailReq.getCategory())
                        .resultValue(detailReq.getResultValue())
                        .referenceRange(detailReq.getReferenceRange())
                        .resultStatus(detailReq.getResultStatus())
                        .notes(detailReq.getNotes())
                        .build();
                healthCheckupDetailMapper.insert(detail);
            }
            log.info("Updated {} detail records for checkup: {}", request.getDetails().size(), checkup.getCheckupId());
        }

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        HealthCheckup checkup = healthCheckupMapper.findByIdAndDeletedFalse(id);
        if (checkup == null) {
            throw new ResourceNotFoundException("HealthCheckup", "id", id);
        }
        healthCheckupMapper.softDelete(id);
        log.info("Soft deleted health checkup with id: {}", id);
    }

    private String generateCheckupId() {
        String prefix = "HC-" + LocalDate.now().getYear() + "-";
        int count = healthCheckupMapper.countByCheckupIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
