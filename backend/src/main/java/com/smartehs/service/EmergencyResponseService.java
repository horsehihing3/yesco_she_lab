package com.smartehs.service;

import com.smartehs.dto.request.EmergencyResponseRequest;
import com.smartehs.dto.response.EmergencyResponseResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EmergencyResponseMapper;
import com.smartehs.model.EmergencyResponse;
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
public class EmergencyResponseService {

    private final EmergencyResponseMapper mapper;

    @Transactional(readOnly = true)
    public Page<EmergencyResponseResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmergencyResponseResponse> content = mapper.findByDeletedFalse(offset, limit).stream()
                .map(EmergencyResponseResponse::from).collect(Collectors.toList());
        int total = mapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public EmergencyResponseResponse findById(Long id) {
        EmergencyResponse entity = mapper.findByIdAndDeletedFalse(id);
        if (entity == null) throw new ResourceNotFoundException("EmergencyResponse", "id", id);
        return EmergencyResponseResponse.from(entity);
    }

    @Transactional(readOnly = true)
    public Page<EmergencyResponseResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmergencyResponseResponse> content = mapper.findByStatusAndDeletedFalse(status, offset, limit).stream()
                .map(EmergencyResponseResponse::from).collect(Collectors.toList());
        int total = mapper.countByStatusAndDeletedFalse(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EmergencyResponseResponse> findByType(String emergencyType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmergencyResponseResponse> content = mapper.findByEmergencyTypeAndDeletedFalse(emergencyType, offset, limit).stream()
                .map(EmergencyResponseResponse::from).collect(Collectors.toList());
        int total = mapper.countByEmergencyTypeAndDeletedFalse(emergencyType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EmergencyResponseResponse> searchByTitle(String title, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmergencyResponseResponse> content = mapper.searchByTitleAndDeletedFalse(title, offset, limit).stream()
                .map(EmergencyResponseResponse::from).collect(Collectors.toList());
        int total = mapper.countBySearchTitleAndDeletedFalse(title);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public EmergencyResponseResponse create(EmergencyResponseRequest request) {
        String newId = generateResponseId();
        EmergencyResponse entity = EmergencyResponse.builder()
                .responseId(newId)
                .emergencyType(request.getEmergencyType())
                .status(request.getStatus() != null ? request.getStatus() : "STANDBY")
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .reportedAt(request.getReportedAt())
                .respondedAt(request.getRespondedAt())
                .resolvedAt(request.getResolvedAt())
                .reporterName(request.getReporterName())
                .reporterDept(request.getReporterDept())
                .commanderName(request.getCommanderName())
                .commanderDept(request.getCommanderDept())
                .casualtiesCount(request.getCasualtiesCount() != null ? request.getCasualtiesCount() : 0)
                .damageDescription(request.getDamageDescription())
                .actionsTaken(request.getActionsTaken())
                .lessonsLearned(request.getLessonsLearned())
                .drillYn(request.getDrillYn() != null ? request.getDrillYn() : false)
                .notes(request.getNotes())
                .deleted(false)
                .build();
        mapper.insert(entity);
        log.info("Created emergency response: {}", newId);
        return findById(entity.getId());
    }

    @Transactional
    public EmergencyResponseResponse update(Long id, EmergencyResponseRequest request) {
        EmergencyResponse entity = mapper.findByIdAndDeletedFalse(id);
        if (entity == null) throw new ResourceNotFoundException("EmergencyResponse", "id", id);

        entity.setEmergencyType(request.getEmergencyType());
        entity.setStatus(request.getStatus());
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setLocation(request.getLocation());
        entity.setReportedAt(request.getReportedAt());
        entity.setRespondedAt(request.getRespondedAt());
        entity.setResolvedAt(request.getResolvedAt());
        entity.setReporterName(request.getReporterName());
        entity.setReporterDept(request.getReporterDept());
        entity.setCommanderName(request.getCommanderName());
        entity.setCommanderDept(request.getCommanderDept());
        entity.setCasualtiesCount(request.getCasualtiesCount());
        entity.setDamageDescription(request.getDamageDescription());
        entity.setActionsTaken(request.getActionsTaken());
        entity.setLessonsLearned(request.getLessonsLearned());
        entity.setDrillYn(request.getDrillYn());
        entity.setNotes(request.getNotes());
        mapper.update(entity);
        log.info("Updated emergency response: {}", entity.getResponseId());
        return findById(id);
    }

    @Transactional
    public EmergencyResponseResponse updateStatus(Long id, String status) {
        EmergencyResponse entity = mapper.findByIdAndDeletedFalse(id);
        if (entity == null) throw new ResourceNotFoundException("EmergencyResponse", "id", id);
        mapper.updateStatus(id, status);
        log.info("Updated emergency response status: {} -> {}", entity.getResponseId(), status);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        EmergencyResponse entity = mapper.findByIdAndDeletedFalse(id);
        if (entity == null) throw new ResourceNotFoundException("EmergencyResponse", "id", id);
        mapper.softDelete(id);
        log.info("Soft deleted emergency response: {}", id);
    }

    private String generateResponseId() {
        String prefix = "ER-" + LocalDate.now().getYear() + "-";
        int count = mapper.countByResponseIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
