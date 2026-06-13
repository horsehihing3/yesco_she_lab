package com.smartehs.service;

import com.smartehs.dto.request.WorkplaceSiteRequest;
import com.smartehs.mapper.FloorDrawingMapper;
import com.smartehs.mapper.WorkplaceSiteMapper;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.model.WorkplaceSite;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkplaceSiteService {

    private static final String BUILDING_NUMBER_PREFIX = "B30-";

    private final WorkplaceSiteMapper mapper;
    private final FloorDrawingMapper floorDrawingMapper;

    public List<WorkplaceSite> findAll() {
        return mapper.findAll();
    }

    public WorkplaceSite findById(Long id) {
        WorkplaceSite site = mapper.findById(id);
        if (site == null) throw new ResourceNotFoundException("사업장을 찾을 수 없습니다: " + id);
        return site;
    }

    @Transactional
    public WorkplaceSite create(WorkplaceSiteRequest req) {
        WorkplaceSite site = WorkplaceSite.builder()
                .buildingNumber(generateNextBuildingNumber())
                .siteName(req.getSiteName())
                .siteCode(req.getSiteCode())
                .siteType(req.getSiteType())
                .industry(req.getIndustry())
                .address(req.getAddress())
                .businessRegNo(req.getBusinessRegNo())
                .sheManager(req.getSheManager())
                .establishedDate(req.getEstablishedDate())
                .representativeContact(req.getRepresentativeContact())
                .riskGrade(req.getRiskGrade())
                .operationStatus(req.getOperationStatus() != null ? req.getOperationStatus() : "ACTIVE")
                .notes(req.getNotes())
                .build();
        mapper.insert(site);
        return site;
    }

    @Transactional
    public WorkplaceSite update(Long id, WorkplaceSiteRequest req) {
        WorkplaceSite site = findById(id);
        String oldName = site.getSiteName();
        String newName = req.getSiteName();
        // 사업장명이 바뀌면 도면 테이블에 매칭되어 있는 행도 함께 rename
        // (도면은 siteName 문자열로 매칭되므로 이름이 바뀌면 미지정 그룹으로 떨어짐)
        if (newName != null && !Objects.equals(oldName, newName)) {
            int updated = floorDrawingMapper.renameSite(oldName, newName);
            if (updated > 0) {
                log.info("Cascade renamed {} floor drawings: {} -> {}", updated, oldName, newName);
            }
        }
        site.setSiteName(newName);
        site.setSiteCode(req.getSiteCode());
        site.setSiteType(req.getSiteType());
        site.setIndustry(req.getIndustry());
        site.setAddress(req.getAddress());
        site.setBusinessRegNo(req.getBusinessRegNo());
        site.setSheManager(req.getSheManager());
        site.setEstablishedDate(req.getEstablishedDate());
        site.setRepresentativeContact(req.getRepresentativeContact());
        site.setRiskGrade(req.getRiskGrade());
        site.setOperationStatus(req.getOperationStatus());
        site.setNotes(req.getNotes());
        mapper.update(site);
        return site;
    }

    @Transactional
    public void delete(Long id) {
        mapper.softDelete(id);
    }

    /** 다음 건물 넘버 생성: B30-0001 → B30-0002 ... */
    private String generateNextBuildingNumber() {
        String max = mapper.findMaxBuildingNumber();
        int next = 1;
        if (max != null && max.startsWith(BUILDING_NUMBER_PREFIX)) {
            try {
                next = Integer.parseInt(max.substring(BUILDING_NUMBER_PREFIX.length())) + 1;
            } catch (NumberFormatException ignore) {
                next = 1;
            }
        }
        return BUILDING_NUMBER_PREFIX + String.format("%04d", next);
    }
}
