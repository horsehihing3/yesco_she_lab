package com.smartehs.service;

import com.smartehs.dto.request.ChemicalClpRequest;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChemicalClpMapper;
import com.smartehs.model.ChemicalClp;
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
public class ChemicalClpService {

    private final ChemicalClpMapper chemicalClpMapper;

    @Transactional(readOnly = true)
    public Page<ChemicalClp> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalClp> content = chemicalClpMapper.findAll(offset, limit);
        int total = chemicalClpMapper.count();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChemicalClp> search(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalClp> content = chemicalClpMapper.search(keyword, offset, limit);
        int total = chemicalClpMapper.countSearch(keyword);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChemicalClp findById(Long id) {
        ChemicalClp chemicalClp = chemicalClpMapper.findById(id);
        if (chemicalClp == null) {
            throw new ResourceNotFoundException("ChemicalClp", "id", id);
        }
        return chemicalClp;
    }

    @Transactional
    public ChemicalClp create(ChemicalClpRequest request) {
        ChemicalClp chemicalClp = ChemicalClp.builder()
                .chemicalName(request.getChemicalName())
                .casNumber(request.getCasNumber())
                .clpClassification(request.getClpClassification())
                .signalWord(request.getSignalWord())
                .hCodes(request.getHCodes())
                .pCodes(request.getPCodes())
                .lastUpdated(request.getLastUpdated())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .deleted(false)
                .build();

        chemicalClpMapper.insert(chemicalClp);
        log.info("Created chemical CLP: {}", chemicalClp.getChemicalName());

        return findById(chemicalClp.getId());
    }

    @Transactional
    public ChemicalClp update(Long id, ChemicalClpRequest request) {
        ChemicalClp chemicalClp = chemicalClpMapper.findById(id);
        if (chemicalClp == null) {
            throw new ResourceNotFoundException("ChemicalClp", "id", id);
        }

        chemicalClp.setChemicalName(request.getChemicalName());
        chemicalClp.setCasNumber(request.getCasNumber());
        chemicalClp.setClpClassification(request.getClpClassification());
        chemicalClp.setSignalWord(request.getSignalWord());
        chemicalClp.setHCodes(request.getHCodes());
        chemicalClp.setPCodes(request.getPCodes());
        chemicalClp.setLastUpdated(request.getLastUpdated());
        chemicalClp.setStatus(request.getStatus());

        chemicalClpMapper.update(chemicalClp);
        log.info("Updated chemical CLP: {}", chemicalClp.getChemicalName());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        ChemicalClp chemicalClp = chemicalClpMapper.findById(id);
        if (chemicalClp == null) {
            throw new ResourceNotFoundException("ChemicalClp", "id", id);
        }
        chemicalClpMapper.softDelete(id);
        log.info("Soft deleted chemical CLP with id: {}", id);
    }
}
