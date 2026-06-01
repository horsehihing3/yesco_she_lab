package com.smartehs.service;

import com.smartehs.dto.request.PpeEquipmentRequest;
import com.smartehs.dto.response.PpeEquipmentResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.PpeEquipmentMapper;
import com.smartehs.model.PpeEquipment;
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
public class PpeEquipmentService {

    private final PpeEquipmentMapper equipmentMapper;

    @Transactional(readOnly = true)
    public Page<PpeEquipmentResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PpeEquipmentResponse> content = equipmentMapper.findByDeletedFalse(offset, limit).stream()
                .map(PpeEquipmentResponse::from)
                .collect(Collectors.toList());
        int total = equipmentMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public PpeEquipmentResponse findById(Long id) {
        PpeEquipment equipment = equipmentMapper.findByIdAndDeletedFalse(id);
        if (equipment == null) {
            throw new ResourceNotFoundException("PpeEquipment", "id", id);
        }
        return PpeEquipmentResponse.from(equipment);
    }

    @Transactional(readOnly = true)
    public Page<PpeEquipmentResponse> findByCategory(String category, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PpeEquipmentResponse> content = equipmentMapper.findByCategoryAndDeletedFalse(category, offset, limit).stream()
                .map(PpeEquipmentResponse::from)
                .collect(Collectors.toList());
        int total = equipmentMapper.countByCategoryAndDeletedFalse(category);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<PpeEquipmentResponse> searchByName(String name, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PpeEquipmentResponse> content = equipmentMapper.searchByNameAndDeletedFalse(name, offset, limit).stream()
                .map(PpeEquipmentResponse::from)
                .collect(Collectors.toList());
        int total = equipmentMapper.countBySearchNameAndDeletedFalse(name);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<PpeEquipmentResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PpeEquipmentResponse> content = equipmentMapper.findByStatusAndDeletedFalse(status, offset, limit).stream()
                .map(PpeEquipmentResponse::from)
                .collect(Collectors.toList());
        int total = equipmentMapper.countByStatusAndDeletedFalse(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getKpiStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalItems", equipmentMapper.countTotalItems());
        stats.put("expirySoonCount", equipmentMapper.countByStatusEquals("EXPIRY_SOON"));
        stats.put("expiredCount", equipmentMapper.countByStatusEquals("EXPIRED"));
        stats.put("lowStockCount", equipmentMapper.countByStatusEquals("LOW_STOCK"));
        Map<String, Object> avgRate = equipmentMapper.getAverageWearRate();
        stats.put("avgWearRate", avgRate != null ? avgRate.get("avgWearRate") : 0);
        return stats;
    }

    @Transactional
    public PpeEquipmentResponse create(PpeEquipmentRequest request) {
        String newId = generateEquipmentId();

        PpeEquipment equipment = PpeEquipment.builder()
                .equipmentId(newId)
                .name(request.getName())
                .nameEn(request.getNameEn())
                .nameZh(request.getNameZh())
                .category(request.getCategory())
                .categoryEn(request.getCategoryEn())
                .categoryZh(request.getCategoryZh())
                .model(request.getModel())
                .certification(request.getCertification())
                .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
                .minStock(request.getMinStock() != null ? request.getMinStock() : 0)
                .wearRate(request.getWearRate())
                .expiryDate(request.getExpiryDate())
                .inspectCycle(request.getInspectCycle())
                .lastInspectDate(request.getLastInspectDate())
                .nextInspectDate(request.getNextInspectDate())
                .storageLocation(request.getStorageLocation())
                .department(request.getDepartment())
                .status(request.getStatus() != null ? request.getStatus() : "NORMAL")
                .notes(request.getNotes())
                .deleted(false)
                .build();

        equipmentMapper.insert(equipment);
        log.info("Created PPE equipment: {}", newId);

        return findById(equipment.getId());
    }

    @Transactional
    public PpeEquipmentResponse update(Long id, PpeEquipmentRequest request) {
        PpeEquipment equipment = equipmentMapper.findByIdAndDeletedFalse(id);
        if (equipment == null) {
            throw new ResourceNotFoundException("PpeEquipment", "id", id);
        }

        equipment.setName(request.getName());
        equipment.setNameEn(request.getNameEn());
        equipment.setNameZh(request.getNameZh());
        equipment.setCategory(request.getCategory());
        equipment.setCategoryEn(request.getCategoryEn());
        equipment.setCategoryZh(request.getCategoryZh());
        equipment.setModel(request.getModel());
        equipment.setCertification(request.getCertification());
        equipment.setStockQuantity(request.getStockQuantity());
        equipment.setMinStock(request.getMinStock());
        equipment.setWearRate(request.getWearRate());
        equipment.setExpiryDate(request.getExpiryDate());
        equipment.setInspectCycle(request.getInspectCycle());
        equipment.setLastInspectDate(request.getLastInspectDate());
        equipment.setNextInspectDate(request.getNextInspectDate());
        equipment.setStorageLocation(request.getStorageLocation());
        equipment.setDepartment(request.getDepartment());
        equipment.setStatus(request.getStatus());
        equipment.setNotes(request.getNotes());

        equipmentMapper.update(equipment);
        log.info("Updated PPE equipment: {}", equipment.getEquipmentId());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        PpeEquipment equipment = equipmentMapper.findByIdAndDeletedFalse(id);
        if (equipment == null) {
            throw new ResourceNotFoundException("PpeEquipment", "id", id);
        }
        equipmentMapper.softDelete(id);
        log.info("Soft deleted PPE equipment with id: {}", id);
    }

    private String generateEquipmentId() {
        String prefix = "PPE-EQ-" + LocalDate.now().getYear() + "-";
        int count = equipmentMapper.countByEquipmentIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
