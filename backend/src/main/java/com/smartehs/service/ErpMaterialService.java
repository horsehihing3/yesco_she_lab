package com.smartehs.service;

import com.smartehs.dto.request.ErpMaterialRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ErpMaterialMapper;
import com.smartehs.model.ErpMaterial;
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
public class ErpMaterialService {

    private final ErpMaterialMapper erpMaterialMapper;

    @Transactional(readOnly = true)
    public Page<ErpMaterial> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ErpMaterial> content = erpMaterialMapper.findAll(offset, limit);
        int total = erpMaterialMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ErpMaterial> search(String keyword, String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ErpMaterial> content = erpMaterialMapper.search(keyword, status, offset, limit);
        int total = erpMaterialMapper.countSearch(keyword, status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ErpMaterial findById(Long id) {
        ErpMaterial erpMaterial = erpMaterialMapper.findById(id);
        if (erpMaterial == null) {
            throw new ResourceNotFoundException("ErpMaterial", "id", id);
        }
        return erpMaterial;
    }

    @Transactional
    public ErpMaterial create(ErpMaterialRequest request) {
        ErpMaterial erpMaterial = ErpMaterial.builder()
                .materialCode(request.getMaterialCode())
                .materialName(request.getMaterialName())
                .chemicalName(request.getChemicalName())
                .casNumber(request.getCasNumber())
                .supplier(request.getSupplier())
                .stockQuantity(request.getStockQuantity())
                .unit(request.getUnit())
                .unitPrice(request.getUnitPrice())
                .lastIncomingDate(request.getLastIncomingDate())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .deleted(false)
                .build();

        erpMaterialMapper.insert(erpMaterial);
        log.info("Created ERP material: {}", erpMaterial.getMaterialCode());

        return findById(erpMaterial.getId());
    }

    @Transactional
    public ErpMaterial update(Long id, ErpMaterialRequest request) {
        ErpMaterial erpMaterial = erpMaterialMapper.findById(id);
        if (erpMaterial == null) {
            throw new ResourceNotFoundException("ErpMaterial", "id", id);
        }

        erpMaterial.setMaterialCode(request.getMaterialCode());
        erpMaterial.setMaterialName(request.getMaterialName());
        erpMaterial.setChemicalName(request.getChemicalName());
        erpMaterial.setCasNumber(request.getCasNumber());
        erpMaterial.setSupplier(request.getSupplier());
        erpMaterial.setStockQuantity(request.getStockQuantity());
        erpMaterial.setUnit(request.getUnit());
        erpMaterial.setUnitPrice(request.getUnitPrice());
        erpMaterial.setLastIncomingDate(request.getLastIncomingDate());
        erpMaterial.setStatus(request.getStatus());

        erpMaterialMapper.update(erpMaterial);
        log.info("Updated ERP material: {}", erpMaterial.getMaterialCode());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ErpMaterial erpMaterial = erpMaterialMapper.findById(id);
        if (erpMaterial == null) {
            throw new ResourceNotFoundException("ErpMaterial", "id", id);
        }
        erpMaterialMapper.softDelete(id);
        log.info("Soft deleted ERP material with id: {}", id);
    }
}
