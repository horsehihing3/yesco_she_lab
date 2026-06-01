package com.smartehs.service;

import com.smartehs.dto.request.ChemicalWarehouseRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChemicalWarehouseMapper;
import com.smartehs.model.ChemicalWarehouse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChemicalWarehouseService {

    private final ChemicalWarehouseMapper chemicalWarehouseMapper;

    @Transactional(readOnly = true)
    public Page<ChemicalWarehouse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalWarehouse> content = chemicalWarehouseMapper.findAll(offset, limit);
        int total = chemicalWarehouseMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChemicalWarehouse> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalWarehouse> content = chemicalWarehouseMapper.search(keyword, offset, limit);
        int total = chemicalWarehouseMapper.countSearch(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChemicalWarehouse findById(Long id) {
        ChemicalWarehouse chemicalWarehouse = chemicalWarehouseMapper.findById(id);
        if (chemicalWarehouse == null) {
            throw new ResourceNotFoundException("ChemicalWarehouse", "id", id);
        }
        return chemicalWarehouse;
    }

    @Transactional
    public ChemicalWarehouse create(ChemicalWarehouseRequest request) {
        String warehouseCode = generateWarehouseCode();

        ChemicalWarehouse chemicalWarehouse = ChemicalWarehouse.builder()
                .warehouseCode(warehouseCode)
                .warehouseName(request.getWarehouseName())
                .storageType(request.getStorageType())
                .location(request.getLocation())
                .storedItemsCount(request.getStoredItemsCount())
                .totalStock(request.getTotalStock())
                .temperature(request.getTemperature())
                .humidity(request.getHumidity())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .deleted(false)
                .build();

        chemicalWarehouseMapper.insert(chemicalWarehouse);
        log.info("Created chemical warehouse: {}", warehouseCode);

        return findById(chemicalWarehouse.getId());
    }

    @Transactional
    public ChemicalWarehouse update(Long id, ChemicalWarehouseRequest request) {
        ChemicalWarehouse chemicalWarehouse = chemicalWarehouseMapper.findById(id);
        if (chemicalWarehouse == null) {
            throw new ResourceNotFoundException("ChemicalWarehouse", "id", id);
        }

        chemicalWarehouse.setWarehouseName(request.getWarehouseName());
        chemicalWarehouse.setStorageType(request.getStorageType());
        chemicalWarehouse.setLocation(request.getLocation());
        chemicalWarehouse.setStoredItemsCount(request.getStoredItemsCount());
        chemicalWarehouse.setTotalStock(request.getTotalStock());
        chemicalWarehouse.setTemperature(request.getTemperature());
        chemicalWarehouse.setHumidity(request.getHumidity());
        chemicalWarehouse.setStatus(request.getStatus());

        chemicalWarehouseMapper.update(chemicalWarehouse);
        log.info("Updated chemical warehouse: {}", chemicalWarehouse.getWarehouseCode());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ChemicalWarehouse chemicalWarehouse = chemicalWarehouseMapper.findById(id);
        if (chemicalWarehouse == null) {
            throw new ResourceNotFoundException("ChemicalWarehouse", "id", id);
        }
        chemicalWarehouseMapper.softDelete(id);
        log.info("Soft deleted chemical warehouse with id: {}", id);
    }

    private String generateWarehouseCode() {
        String prefix = "WH-";
        int count = chemicalWarehouseMapper.countByWarehouseCodeStartingWith(prefix);
        return String.format("%s%02d", prefix, count + 1);
    }
}
