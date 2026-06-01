package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EmergencyDrillMapper;
import com.smartehs.mapper.DrillLogMapper;
import com.smartehs.model.EmergencyDrill;
import com.smartehs.model.DrillLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmergencyDrillService {

    private final EmergencyDrillMapper emergencyDrillMapper;
    private final DrillLogMapper drillLogMapper;

    @Transactional(readOnly = true)
    public Page<EmergencyDrill> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmergencyDrill> content = emergencyDrillMapper.findByDeletedFalse(offset, limit);
        int total = emergencyDrillMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public EmergencyDrill findById(Long id) {
        EmergencyDrill drill = emergencyDrillMapper.findById(id);
        if (drill == null) {
            throw new ResourceNotFoundException("EmergencyDrill", "id", id);
        }
        return drill;
    }

    @Transactional(readOnly = true)
    public Page<EmergencyDrill> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmergencyDrill> content = emergencyDrillMapper.findByStatus(status, offset, limit);
        int total = emergencyDrillMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EmergencyDrill> findByDrillType(String drillType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmergencyDrill> content = emergencyDrillMapper.findByDrillType(drillType, offset, limit);
        int total = emergencyDrillMapper.countByDrillType(drillType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public EmergencyDrill create(EmergencyDrill emergencyDrill) {
        String newId = generateDrillId();
        emergencyDrill.setDrillId(newId);
        if (emergencyDrill.getStatus() == null) {
            emergencyDrill.setStatus("SCHEDULED");
        }
        emergencyDrill.setDeleted(false);
        emergencyDrillMapper.insert(emergencyDrill);
        log.info("Created emergency drill: {}", newId);
        return findById(emergencyDrill.getId());
    }

    @Transactional
    public EmergencyDrill update(Long id, EmergencyDrill emergencyDrill) {
        EmergencyDrill existing = emergencyDrillMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("EmergencyDrill", "id", id);
        }
        emergencyDrill.setId(id);
        // planId 누락 시 기존 값 보존 — 부분 업데이트로 plan_id 가 NULL 로 덮어쓰이지 않도록 방어
        if (emergencyDrill.getPlanId() == null && existing.getPlanId() != null) {
            emergencyDrill.setPlanId(existing.getPlanId());
        }
        String oldStatus = existing.getStatus();
        String newStatus = emergencyDrill.getStatus();
        emergencyDrillMapper.update(emergencyDrill);
        if (newStatus != null && !newStatus.equals(oldStatus)) {
            drillLogMapper.insert(DrillLog.builder()
                    .drillId(id)
                    .action("STATUS_CHANGE")
                    .changedBy(emergencyDrill.getModifiedBy())
                    .detail(String.format("상태 변경: %s → %s", oldStatus, newStatus))
                    .build());
        }
        log.info("Updated emergency drill: {}", existing.getDrillId());
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        EmergencyDrill existing = emergencyDrillMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("EmergencyDrill", "id", id);
        }
        emergencyDrillMapper.softDelete(id);
        log.info("Soft deleted emergency drill with id: {}", id);
    }

    private String generateDrillId() {
        String prefix = "DR-" + LocalDate.now().getYear() + "-";
        int count = emergencyDrillMapper.countByDrillIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
