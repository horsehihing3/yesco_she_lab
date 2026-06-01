package com.smartehs.service;

import com.smartehs.dto.request.EnvMonitoringRequest;
import com.smartehs.dto.response.EnvMonitoringResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EnvMonitoringMapper;
import com.smartehs.model.EnvMonitoring;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnvMonitoringService {

    private final EnvMonitoringMapper envMonitoringMapper;

    @Transactional(readOnly = true)
    public Page<EnvMonitoringResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EnvMonitoringResponse> content = envMonitoringMapper.findByDeletedFalse(offset, limit).stream()
                .map(EnvMonitoringResponse::from)
                .collect(Collectors.toList());
        int total = envMonitoringMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EnvMonitoringResponse> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EnvMonitoringResponse> content = envMonitoringMapper.searchByKeyword(keyword, offset, limit).stream()
                .map(EnvMonitoringResponse::from)
                .collect(Collectors.toList());
        int total = envMonitoringMapper.countByKeyword(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EnvMonitoringResponse> findByType(String monitorType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EnvMonitoringResponse> content = envMonitoringMapper.findByMonitorTypeAndDeletedFalse(monitorType, offset, limit).stream()
                .map(EnvMonitoringResponse::from)
                .collect(Collectors.toList());
        int total = envMonitoringMapper.countByMonitorTypeAndDeletedFalse(monitorType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EnvMonitoringResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EnvMonitoringResponse> content = envMonitoringMapper.findByStatusAndDeletedFalse(status, offset, limit).stream()
                .map(EnvMonitoringResponse::from)
                .collect(Collectors.toList());
        int total = envMonitoringMapper.countByStatusAndDeletedFalse(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public EnvMonitoringResponse findById(Long id) {
        EnvMonitoring entity = envMonitoringMapper.findByIdAndDeletedFalse(id);
        if (entity == null) {
            throw new ResourceNotFoundException("EnvMonitoring", "id", id);
        }
        return EnvMonitoringResponse.from(entity);
    }

    @Transactional(readOnly = true)
    public Map<String, Integer> getKpiCounts() {
        Map<String, Integer> kpi = new HashMap<>();
        kpi.put("NORMAL", envMonitoringMapper.countByStatusForKpi("NORMAL"));
        kpi.put("CAUTION", envMonitoringMapper.countByStatusForKpi("CAUTION"));
        kpi.put("WARNING", envMonitoringMapper.countByStatusForKpi("WARNING"));
        kpi.put("DANGER", envMonitoringMapper.countByStatusForKpi("DANGER"));
        return kpi;
    }

    @Transactional
    public EnvMonitoringResponse create(EnvMonitoringRequest request) {
        String newMonitorId = generateMonitorId();

        EnvMonitoring entity = EnvMonitoring.builder()
                .monitorId(newMonitorId)
                .monitorType(request.getMonitorType())
                .status(request.getStatus() != null ? request.getStatus() : "NORMAL")
                .location(request.getLocation())
                .measurementDate(request.getMeasurementDate())
                .parameterName(request.getParameterName())
                .measuredValue(request.getMeasuredValue())
                .unit(request.getUnit())
                .standardValue(request.getStandardValue())
                .standardName(request.getStandardName())
                .exceedYn(request.getExceedYn() != null ? request.getExceedYn() : false)
                .exceedRate(request.getExceedRate())
                .measurerName(request.getMeasurerName())
                .measurerDept(request.getMeasurerDept())
                .equipmentName(request.getEquipmentName())
                .equipmentModel(request.getEquipmentModel())
                .correctiveAction(request.getCorrectiveAction())
                .notes(request.getNotes())
                .deleted(false)
                .build();

        envMonitoringMapper.insert(entity);
        log.info("Created env monitoring record: {}", entity.getMonitorId());
        return EnvMonitoringResponse.from(entity);
    }

    @Transactional
    public EnvMonitoringResponse update(Long id, EnvMonitoringRequest request) {
        EnvMonitoring entity = envMonitoringMapper.findByIdAndDeletedFalse(id);
        if (entity == null) {
            throw new ResourceNotFoundException("EnvMonitoring", "id", id);
        }

        entity.setMonitorType(request.getMonitorType());
        entity.setStatus(request.getStatus());
        entity.setLocation(request.getLocation());
        entity.setMeasurementDate(request.getMeasurementDate());
        entity.setParameterName(request.getParameterName());
        entity.setMeasuredValue(request.getMeasuredValue());
        entity.setUnit(request.getUnit());
        entity.setStandardValue(request.getStandardValue());
        entity.setStandardName(request.getStandardName());
        entity.setExceedYn(request.getExceedYn());
        entity.setExceedRate(request.getExceedRate());
        entity.setMeasurerName(request.getMeasurerName());
        entity.setMeasurerDept(request.getMeasurerDept());
        entity.setEquipmentName(request.getEquipmentName());
        entity.setEquipmentModel(request.getEquipmentModel());
        entity.setCorrectiveAction(request.getCorrectiveAction());
        entity.setNotes(request.getNotes());

        envMonitoringMapper.update(entity);
        log.info("Updated env monitoring record: {}", entity.getMonitorId());
        return EnvMonitoringResponse.from(entity);
    }

    @Transactional
    public void delete(Long id) {
        EnvMonitoring entity = envMonitoringMapper.findByIdAndDeletedFalse(id);
        if (entity == null) {
            throw new ResourceNotFoundException("EnvMonitoring", "id", id);
        }
        envMonitoringMapper.softDelete(id);
        log.info("Soft deleted env monitoring record with id: {}", id);
    }

    private String generateMonitorId() {
        String prefix = "ENV-MON-" + LocalDate.now().getYear() + "-";
        int count = envMonitoringMapper.countByMonitorIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
