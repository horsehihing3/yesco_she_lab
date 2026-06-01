package com.smartehs.service;

import com.smartehs.dto.request.WasteManageRequest;
import com.smartehs.dto.response.WasteManageResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.WasteManageMapper;
import com.smartehs.model.WasteManage;
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
public class WasteManageService {

    private final WasteManageMapper wasteManageMapper;

    @Transactional(readOnly = true)
    public Page<WasteManageResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WasteManageResponse> content = wasteManageMapper.findAllWithPaging(offset, limit).stream()
                .map(WasteManageResponse::from)
                .collect(Collectors.toList());
        int total = wasteManageMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WasteManageResponse> search(String wasteName, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WasteManageResponse> content = wasteManageMapper.findByWasteNameContaining(wasteName, offset, limit).stream()
                .map(WasteManageResponse::from)
                .collect(Collectors.toList());
        int total = wasteManageMapper.countByWasteNameContaining(wasteName);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<WasteManageResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<WasteManageResponse> content = wasteManageMapper.findByStatus(status, offset, limit).stream()
                .map(WasteManageResponse::from)
                .collect(Collectors.toList());
        int total = wasteManageMapper.countByStatus(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public WasteManageResponse findById(Long id) {
        WasteManage entity = wasteManageMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WasteManage", "id", id);
        }
        return WasteManageResponse.from(entity);
    }

    @Transactional(readOnly = true)
    public List<WasteManageResponse> findAllList() {
        return wasteManageMapper.findAllList().stream()
                .map(WasteManageResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCount", wasteManageMapper.countAll());
        stats.put("storingCount", wasteManageMapper.countByStatusValue("STORING"));
        stats.put("disposalRequestCount", wasteManageMapper.countByStatusValue("DISPOSAL_REQUEST"));
        stats.put("processingCount", wasteManageMapper.countByStatusValue("PROCESSING"));
        stats.put("completedCount", wasteManageMapper.countByStatusValue("COMPLETED"));
        return stats;
    }

    @Transactional(readOnly = true)
    public String generateWasteCode() {
        return wasteManageMapper.generateWasteCode();
    }

    @Transactional
    public WasteManageResponse create(WasteManageRequest request, String regUser) {
        String wasteCode = request.getWasteCode();
        if (wasteCode == null || wasteCode.isBlank()) {
            wasteCode = wasteManageMapper.generateWasteCode();
        }
        WasteManage entity = WasteManage.builder()
                .wasteCode(wasteCode)
                .wasteType(request.getWasteType())
                .wasteName(request.getWasteName())
                .wasteCategory(request.getWasteCategory())
                .generationAmount(request.getGenerationAmount())
                .unit(request.getUnit())
                .generationDate(request.getGenerationDate() != null ? LocalDate.parse(request.getGenerationDate()) : null)
                .department(request.getDepartment())
                .storageLocation(request.getStorageLocation())
                .status(request.getStatus() != null ? request.getStatus() : "STORING")
                .disposalMethod(request.getDisposalMethod())
                .disposalCompany(request.getDisposalCompany())
                .disposalDate(request.getDisposalDate() != null ? LocalDate.parse(request.getDisposalDate()) : null)
                .vehicleNumber(request.getVehicleNumber())
                .disposalNotes(request.getDisposalNotes())
                .manager(request.getManager())
                .remark(request.getRemark())
                .regUser(regUser)
                .build();
        wasteManageMapper.insert(entity);
        log.info("Created waste manage record: {}", entity.getId());
        return WasteManageResponse.from(entity);
    }

    @Transactional
    public WasteManageResponse update(Long id, WasteManageRequest request) {
        WasteManage entity = wasteManageMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WasteManage", "id", id);
        }
        entity.setWasteCode(request.getWasteCode());
        entity.setWasteType(request.getWasteType());
        entity.setWasteName(request.getWasteName());
        entity.setWasteCategory(request.getWasteCategory());
        entity.setGenerationAmount(request.getGenerationAmount());
        entity.setUnit(request.getUnit());
        entity.setGenerationDate(request.getGenerationDate() != null ? LocalDate.parse(request.getGenerationDate()) : null);
        entity.setDepartment(request.getDepartment());
        entity.setStorageLocation(request.getStorageLocation());
        entity.setStatus(request.getStatus());
        entity.setDisposalMethod(request.getDisposalMethod());
        entity.setDisposalCompany(request.getDisposalCompany());
        entity.setDisposalDate(request.getDisposalDate() != null ? LocalDate.parse(request.getDisposalDate()) : null);
        entity.setVehicleNumber(request.getVehicleNumber());
        entity.setDisposalNotes(request.getDisposalNotes());
        entity.setManager(request.getManager());
        entity.setRemark(request.getRemark());
        wasteManageMapper.update(entity);
        log.info("Updated waste manage record: {}", id);
        return WasteManageResponse.from(entity);
    }

    @Transactional
    public void updateStatus(Long id, String status) {
        WasteManage entity = wasteManageMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WasteManage", "id", id);
        }
        wasteManageMapper.updateStatus(id, status);
        log.info("Updated waste status: {} -> {}", id, status);
    }

    @Transactional
    public void delete(Long id) {
        WasteManage entity = wasteManageMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("WasteManage", "id", id);
        }
        wasteManageMapper.delete(id);
        log.info("Deleted waste manage record: {}", id);
    }
}
