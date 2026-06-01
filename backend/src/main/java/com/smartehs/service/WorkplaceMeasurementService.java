package com.smartehs.service;

import com.smartehs.dto.request.WorkplaceMeasurementDetailRequest;
import com.smartehs.dto.request.WorkplaceMeasurementRequest;
import com.smartehs.dto.response.WorkplaceMeasurementDetailResponse;
import com.smartehs.dto.response.WorkplaceMeasurementResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.WorkplaceMeasurementDetailMapper;
import com.smartehs.mapper.WorkplaceMeasurementMapper;
import com.smartehs.model.WorkplaceMeasurement;
import com.smartehs.model.WorkplaceMeasurementDetail;
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
public class WorkplaceMeasurementService {

    private final WorkplaceMeasurementMapper measurementMapper;
    private final WorkplaceMeasurementDetailMapper detailMapper;

    @Transactional(readOnly = true)
    public Page<WorkplaceMeasurementResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WorkplaceMeasurementResponse> content = measurementMapper.findByDeletedFalse(offset, limit).stream()
                .map(WorkplaceMeasurementResponse::from)
                .collect(Collectors.toList());
        int total = measurementMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WorkplaceMeasurementResponse> findByYear(int year, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WorkplaceMeasurementResponse> content = measurementMapper.findByYearAndDeletedFalse(year, offset, limit).stream()
                .map(WorkplaceMeasurementResponse::from)
                .collect(Collectors.toList());
        int total = measurementMapper.countByYearAndDeletedFalse(year);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WorkplaceMeasurementResponse> searchByKeyword(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WorkplaceMeasurementResponse> content = measurementMapper.searchByKeywordAndDeletedFalse(keyword, offset, limit).stream()
                .map(WorkplaceMeasurementResponse::from)
                .collect(Collectors.toList());
        int total = measurementMapper.countByKeywordAndDeletedFalse(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public WorkplaceMeasurementResponse findById(Long id) {
        WorkplaceMeasurement measurement = measurementMapper.findByIdAndDeletedFalse(id);
        if (measurement == null) {
            throw new ResourceNotFoundException("WorkplaceMeasurement", "id", id);
        }
        WorkplaceMeasurementResponse response = WorkplaceMeasurementResponse.from(measurement);
        List<WorkplaceMeasurementDetailResponse> details = detailMapper.findByMeasurementId(measurement.getMeasurementId()).stream()
                .map(WorkplaceMeasurementDetailResponse::from)
                .collect(Collectors.toList());
        response.setDetails(details);
        return response;
    }

    @Transactional
    public WorkplaceMeasurementResponse create(WorkplaceMeasurementRequest request) {
        String newId = generateMeasurementId();

        WorkplaceMeasurement measurement = WorkplaceMeasurement.builder()
                .measurementId(newId)
                .workPlaceId(request.getWorkPlaceId())
                .measurementYear(request.getMeasurementYear())
                .measurementHalf(request.getMeasurementHalf())
                .measurementDate(request.getMeasurementDate())
                .measurementAgency(request.getMeasurementAgency())
                .measurementSite(request.getMeasurementSite())
                .measurementSiteDetail(request.getMeasurementSiteDetail())
                .status(request.getStatus() != null ? request.getStatus() : "PLANNED")
                .overallResult(request.getOverallResult())
                .notes(request.getNotes())
                .authorName(request.getAuthorName())
                .authorEmail(request.getAuthorEmail())
                .authorDept(request.getAuthorDept())
                .deleted(false)
                .build();

        measurementMapper.insert(measurement);
        log.info("Created workplace measurement: {}", newId);

        if (request.getDetails() != null && !request.getDetails().isEmpty()) {
            for (WorkplaceMeasurementDetailRequest detailReq : request.getDetails()) {
                WorkplaceMeasurementDetail detail = WorkplaceMeasurementDetail.builder()
                        .measurementId(newId)
                        .hazardousFactor(detailReq.getHazardousFactor())
                        .hazardousFactorEn(detailReq.getHazardousFactorEn())
                        .hazardousFactorZh(detailReq.getHazardousFactorZh())
                        .factorType(detailReq.getFactorType())
                        .workProcess(detailReq.getWorkProcess())
                        .measurementValue(detailReq.getMeasurementValue())
                        .exposureStandard(detailReq.getExposureStandard())
                        .unit(detailReq.getUnit())
                        .resultRatio(detailReq.getResultRatio())
                        .resultStatus(detailReq.getResultStatus())
                        .employeeCount(detailReq.getEmployeeCount())
                        .notes(detailReq.getNotes())
                        .build();
                detailMapper.insert(detail);
            }
            log.info("Inserted {} detail records for measurement: {}", request.getDetails().size(), newId);
        }

        return findById(measurement.getId());
    }

    @Transactional
    public WorkplaceMeasurementResponse update(Long id, WorkplaceMeasurementRequest request) {
        WorkplaceMeasurement measurement = measurementMapper.findByIdAndDeletedFalse(id);
        if (measurement == null) {
            throw new ResourceNotFoundException("WorkplaceMeasurement", "id", id);
        }

        measurement.setWorkPlaceId(request.getWorkPlaceId());
        measurement.setMeasurementYear(request.getMeasurementYear());
        measurement.setMeasurementHalf(request.getMeasurementHalf());
        measurement.setMeasurementDate(request.getMeasurementDate());
        measurement.setMeasurementAgency(request.getMeasurementAgency());
        measurement.setMeasurementSite(request.getMeasurementSite());
        measurement.setMeasurementSiteDetail(request.getMeasurementSiteDetail());
        measurement.setStatus(request.getStatus());
        measurement.setOverallResult(request.getOverallResult());
        measurement.setNotes(request.getNotes());
        measurement.setAuthorName(request.getAuthorName());
        measurement.setAuthorEmail(request.getAuthorEmail());
        measurement.setAuthorDept(request.getAuthorDept());

        measurementMapper.update(measurement);
        log.info("Updated workplace measurement: {}", measurement.getMeasurementId());

        if (request.getDetails() != null) {
            detailMapper.deleteByMeasurementId(measurement.getMeasurementId());
            for (WorkplaceMeasurementDetailRequest detailReq : request.getDetails()) {
                WorkplaceMeasurementDetail detail = WorkplaceMeasurementDetail.builder()
                        .measurementId(measurement.getMeasurementId())
                        .hazardousFactor(detailReq.getHazardousFactor())
                        .hazardousFactorEn(detailReq.getHazardousFactorEn())
                        .hazardousFactorZh(detailReq.getHazardousFactorZh())
                        .factorType(detailReq.getFactorType())
                        .workProcess(detailReq.getWorkProcess())
                        .measurementValue(detailReq.getMeasurementValue())
                        .exposureStandard(detailReq.getExposureStandard())
                        .unit(detailReq.getUnit())
                        .resultRatio(detailReq.getResultRatio())
                        .resultStatus(detailReq.getResultStatus())
                        .employeeCount(detailReq.getEmployeeCount())
                        .notes(detailReq.getNotes())
                        .build();
                detailMapper.insert(detail);
            }
            log.info("Updated {} detail records for measurement: {}", request.getDetails().size(), measurement.getMeasurementId());
        }

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        WorkplaceMeasurement measurement = measurementMapper.findByIdAndDeletedFalse(id);
        if (measurement == null) {
            throw new ResourceNotFoundException("WorkplaceMeasurement", "id", id);
        }
        measurementMapper.softDelete(id);
        log.info("Soft deleted workplace measurement with id: {}", id);
    }

    private String generateMeasurementId() {
        String prefix = "WM-" + LocalDate.now().getYear() + "-";
        int count = measurementMapper.countByMeasurementIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
