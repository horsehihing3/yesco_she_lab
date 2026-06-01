package com.smartehs.service;

import com.smartehs.dto.request.NearMissActionRequest;
import com.smartehs.dto.request.NearMissRequest;
import com.smartehs.dto.response.NearMissResponse;
import com.smartehs.model.NearMiss;
import com.smartehs.model.NearMissAction;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.NearMissActionMapper;
import com.smartehs.mapper.NearMissMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NearMissService {

    private final NearMissMapper nearMissMapper;
    private final NearMissActionMapper nearMissActionMapper;

    @Transactional(readOnly = true)
    public Page<NearMissResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<NearMissResponse> content = nearMissMapper.findByDeletedFalse(offset, limit).stream()
                .map(NearMissResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = nearMissMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<NearMissResponse> search(String title, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<NearMissResponse> content = nearMissMapper.findByOccTitleContainingAndDeletedFalse(title, offset, limit).stream()
                .map(NearMissResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = nearMissMapper.countByOccTitleContainingAndDeletedFalse(title);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<NearMissResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<NearMissResponse> content = nearMissMapper.findByStatusAndDeletedFalse(status, offset, limit).stream()
                .map(NearMissResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = nearMissMapper.countByStatusAndDeletedFalse(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<NearMissResponse> findByIncidentType(String incidentType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<NearMissResponse> content = nearMissMapper.findByIncidentTypeAndDeletedFalse(incidentType, offset, limit).stream()
                .map(NearMissResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = nearMissMapper.countByIncidentTypeAndDeletedFalse(incidentType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<NearMissResponse> findByWorkPlace(Long workPlaceId, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<NearMissResponse> content = nearMissMapper.findByWorkPlaceIdAndDeletedFalse(workPlaceId, offset, limit).stream()
                .map(NearMissResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = nearMissMapper.countByWorkPlaceIdAndDeletedFalse(workPlaceId);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public NearMissResponse findById(Long id) {
        NearMiss nearMiss = nearMissMapper.findByIdAndDeletedFalse(id);
        if (nearMiss == null) {
            throw new ResourceNotFoundException("NearMiss", "id", id);
        }
        NearMissResponse response = NearMissResponse.fromLocalized(nearMiss);
        response.setActions(nearMissActionMapper.findByNearMissId(nearMiss.getNearMissId()));
        return response;
    }

    @Transactional(readOnly = true)
    public NearMissResponse findByNearMissId(String nearMissId) {
        NearMiss nearMiss = nearMissMapper.findByNearMissIdAndDeletedFalse(nearMissId);
        if (nearMiss == null) {
            throw new ResourceNotFoundException("NearMiss", "nearMissId", nearMissId);
        }
        NearMissResponse response = NearMissResponse.fromLocalized(nearMiss);
        response.setActions(nearMissActionMapper.findByNearMissId(nearMiss.getNearMissId()));
        return response;
    }

    @Transactional
    public NearMissResponse create(NearMissRequest request) {
        String newNearMissId = generateNearMissId();

        NearMiss nearMiss = NearMiss.builder()
                .nearMissId(newNearMissId)
                .incidentType(request.getIncidentType() != null ? request.getIncidentType() : "NEAR_MISS")
                .workPlaceId(request.getWorkPlaceId())
                .occTitle(request.getOccTitle())
                .occDate(request.getOccDate())
                .occSite(request.getOccSite())
                .occFloor(request.getOccFloor())
                .occSiteInfo(request.getOccSiteInfo())
                .occSiteX(request.getOccSiteX())
                .occSiteY(request.getOccSiteY())
                .occImageFileId(request.getOccImageFileId())
                .occInfo(request.getOccInfo())
                .company(request.getCompany())
                .authorName(request.getAuthorName())
                .authorEmail(request.getAuthorEmail())
                .authorDept(request.getAuthorDept())
                .intensity(request.getIntensity())
                .frequency(request.getFrequency())
                .status(request.getStatus() != null ? request.getStatus() : "PENDING")
                .deleted(false)
                .build();

        nearMissMapper.insert(nearMiss);
        saveActions(newNearMissId, request.getActions());
        log.info("Created near miss: {}", nearMiss.getNearMissId());

        NearMissResponse response = NearMissResponse.from(nearMiss);
        response.setActions(nearMissActionMapper.findByNearMissId(newNearMissId));
        return response;
    }

    @Transactional
    public NearMissResponse update(Long id, NearMissRequest request) {
        NearMiss nearMiss = nearMissMapper.findByIdAndDeletedFalse(id);
        if (nearMiss == null) {
            throw new ResourceNotFoundException("NearMiss", "id", id);
        }

        if (request.getIncidentType() != null) {
            nearMiss.setIncidentType(request.getIncidentType());
        }
        nearMiss.setWorkPlaceId(request.getWorkPlaceId());
        nearMiss.setOccTitle(request.getOccTitle());
        nearMiss.setOccDate(request.getOccDate());
        nearMiss.setOccSite(request.getOccSite());
        nearMiss.setOccFloor(request.getOccFloor());
        nearMiss.setOccSiteInfo(request.getOccSiteInfo());
        nearMiss.setOccSiteX(request.getOccSiteX());
        nearMiss.setOccSiteY(request.getOccSiteY());
        nearMiss.setOccImageFileId(request.getOccImageFileId());
        nearMiss.setOccInfo(request.getOccInfo());
        nearMiss.setCompany(request.getCompany());
        nearMiss.setAuthorName(request.getAuthorName());
        nearMiss.setAuthorEmail(request.getAuthorEmail());
        nearMiss.setAuthorDept(request.getAuthorDept());
        nearMiss.setIntensity(request.getIntensity());
        nearMiss.setFrequency(request.getFrequency());
        if (request.getStatus() != null) {
            nearMiss.setStatus(request.getStatus());
        }
        nearMiss.setModifiedAt(LocalDateTime.now());

        nearMissMapper.update(nearMiss);

        // 조치사항: 기존 삭제 후 새로 저장
        nearMissActionMapper.deleteByNearMissId(nearMiss.getNearMissId());
        saveActions(nearMiss.getNearMissId(), request.getActions());

        log.info("Updated near miss: {}", nearMiss.getNearMissId());

        NearMissResponse response = NearMissResponse.from(nearMiss);
        response.setActions(nearMissActionMapper.findByNearMissId(nearMiss.getNearMissId()));
        return response;
    }

    @Transactional
    public void delete(Long id) {
        NearMiss nearMiss = nearMissMapper.findByIdAndDeletedFalse(id);
        if (nearMiss == null) {
            throw new ResourceNotFoundException("NearMiss", "id", id);
        }

        nearMissMapper.softDelete(id);
        log.info("Soft deleted near miss with id: {}", id);
    }

    private void saveActions(String nearMissId, List<NearMissActionRequest> actions) {
        if (actions == null || actions.isEmpty()) return;

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (NearMissActionRequest actionReq : actions) {
            NearMissAction action = NearMissAction.builder()
                    .nearMissId(nearMissId)
                    .improvementMeasures(actionReq.getImprovementMeasures())
                    .manageDept(actionReq.getManageDept())
                    .responsiblePerson(actionReq.getResponsiblePerson())
                    .responsiblePersonMail(actionReq.getResponsiblePersonMail())
                    .responsiblePersonCompany(actionReq.getResponsiblePersonCompany())
                    .planDate(parseDate(actionReq.getPlanDate(), fmt))
                    .completeDate(parseDate(actionReq.getCompleteDate(), fmt))
                    .build();
            nearMissActionMapper.insert(action);
        }
    }

    private LocalDateTime parseDate(String dateStr, DateTimeFormatter fmt) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr.substring(0, 10), fmt).atStartOfDay();
        } catch (Exception e) {
            return null;
        }
    }

    private String generateNearMissId() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int count = nearMissMapper.countByNearMissIdStartingWith(datePrefix);
        return String.format("%s_%03d", datePrefix, count + 1);
    }
}
