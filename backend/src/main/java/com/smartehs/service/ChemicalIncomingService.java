package com.smartehs.service;

import com.smartehs.dto.request.ChemicalIncomingRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChemicalIncomingMapper;
import com.smartehs.model.ChemicalIncoming;
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
public class ChemicalIncomingService {

    private final ChemicalIncomingMapper chemicalIncomingMapper;

    @Transactional(readOnly = true)
    public Page<ChemicalIncoming> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalIncoming> content = chemicalIncomingMapper.findAll(offset, limit);
        int total = chemicalIncomingMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChemicalIncoming> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalIncoming> content = chemicalIncomingMapper.search(keyword, offset, limit);
        int total = chemicalIncomingMapper.countSearch(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChemicalIncoming findById(Long id) {
        ChemicalIncoming chemicalIncoming = chemicalIncomingMapper.findById(id);
        if (chemicalIncoming == null) {
            throw new ResourceNotFoundException("ChemicalIncoming", "id", id);
        }
        return chemicalIncoming;
    }

    @Transactional
    public ChemicalIncoming create(ChemicalIncomingRequest request) {
        String incomingNo = generateIncomingNo();

        ChemicalIncoming chemicalIncoming = ChemicalIncoming.builder()
                .incomingDate(request.getIncomingDate())
                .incomingNo(incomingNo)
                .chemicalName(request.getChemicalName())
                .supplier(request.getSupplier())
                .quantity(request.getQuantity())
                .unit(request.getUnit())
                .warehouseCode(request.getWarehouseCode())
                .handler(request.getHandler())
                .msdsConfirmed(request.getMsdsConfirmed() != null ? request.getMsdsConfirmed() : false)
                .deleted(false)
                .build();

        chemicalIncomingMapper.insert(chemicalIncoming);
        log.info("Created chemical incoming: {}", incomingNo);

        return findById(chemicalIncoming.getId());
    }

    @Transactional
    public ChemicalIncoming update(Long id, ChemicalIncomingRequest request) {
        ChemicalIncoming chemicalIncoming = chemicalIncomingMapper.findById(id);
        if (chemicalIncoming == null) {
            throw new ResourceNotFoundException("ChemicalIncoming", "id", id);
        }

        chemicalIncoming.setIncomingDate(request.getIncomingDate());
        chemicalIncoming.setChemicalName(request.getChemicalName());
        chemicalIncoming.setSupplier(request.getSupplier());
        chemicalIncoming.setQuantity(request.getQuantity());
        chemicalIncoming.setUnit(request.getUnit());
        chemicalIncoming.setWarehouseCode(request.getWarehouseCode());
        chemicalIncoming.setHandler(request.getHandler());
        chemicalIncoming.setMsdsConfirmed(request.getMsdsConfirmed());

        chemicalIncomingMapper.update(chemicalIncoming);
        log.info("Updated chemical incoming: {}", chemicalIncoming.getIncomingNo());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ChemicalIncoming chemicalIncoming = chemicalIncomingMapper.findById(id);
        if (chemicalIncoming == null) {
            throw new ResourceNotFoundException("ChemicalIncoming", "id", id);
        }
        chemicalIncomingMapper.softDelete(id);
        log.info("Soft deleted chemical incoming with id: {}", id);
    }

    private String generateIncomingNo() {
        String prefix = "IN-" + LocalDate.now().getYear() + "-";
        int count = chemicalIncomingMapper.countByIncomingNoStartingWith(prefix);
        return String.format("%s%04d", prefix, count + 1);
    }
}
