package com.smartehs.service;

import com.smartehs.dto.request.ChemicalRequest;
import com.smartehs.dto.response.ChemicalResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ChemicalMapper;
import com.smartehs.model.Chemical;
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
public class ChemicalService {

    private final ChemicalMapper chemicalMapper;

    @Transactional(readOnly = true)
    public Page<ChemicalResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalResponse> content = chemicalMapper.findByDeletedFalse(offset, limit).stream()
                .map(ChemicalResponse::from)
                .collect(Collectors.toList());
        int total = chemicalMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ChemicalResponse> search(String keyword, String hazardClass, String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<ChemicalResponse> content = chemicalMapper.searchByKeywordAndDeletedFalse(keyword, hazardClass, status, offset, limit).stream()
                .map(ChemicalResponse::from)
                .collect(Collectors.toList());
        int total = chemicalMapper.countByKeywordAndDeletedFalse(keyword, hazardClass, status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ChemicalResponse findById(Long id) {
        Chemical chemical = chemicalMapper.findByIdAndDeletedFalse(id);
        if (chemical == null) {
            throw new ResourceNotFoundException("Chemical", "id", id);
        }
        return ChemicalResponse.from(chemical);
    }

    @Transactional
    public ChemicalResponse create(ChemicalRequest request) {
        String newId = generateChemicalId();

        Chemical chemical = Chemical.builder()
                .chemicalId(newId)
                .chemicalNameKo(request.getChemicalNameKo())
                .chemicalNameEn(request.getChemicalNameEn())
                .casNumber(request.getCasNumber())
                .hazardClass(request.getHazardClass())
                .status(request.getStatus() != null ? request.getStatus() : "IN_USE")
                .msdsFileId(request.getMsdsFileId())
                .storageLocation(request.getStorageLocation())
                .storageQuantity(request.getStorageQuantity())
                .unit(request.getUnit())
                .maxStorageLimit(request.getMaxStorageLimit())
                .supplier(request.getSupplier())
                .department(request.getDepartment())
                .handlerName(request.getHandlerName())
                .emergencyProcedure(request.getEmergencyProcedure())
                .lastInspectionDate(request.getLastInspectionDate())
                .nextInspectionDate(request.getNextInspectionDate())
                .ghsPictogram(request.getGhsPictogram())
                .signalWord(request.getSignalWord())
                .hazardStatements(request.getHazardStatements())
                .precautionaryStatements(request.getPrecautionaryStatements())
                .molecularFormula(request.getMolecularFormula())
                .applicableRegulation(request.getApplicableRegulation())
                .ghsClassification(request.getGhsClassification())
                .exposureLimit(request.getExposureLimit())
                .notes(request.getNotes())
                .deleted(false)
                .build();

        chemicalMapper.insert(chemical);
        log.info("Created chemical: {}", newId);

        return findById(chemical.getId());
    }

    @Transactional
    public ChemicalResponse update(Long id, ChemicalRequest request) {
        Chemical chemical = chemicalMapper.findByIdAndDeletedFalse(id);
        if (chemical == null) {
            throw new ResourceNotFoundException("Chemical", "id", id);
        }

        chemical.setChemicalNameKo(request.getChemicalNameKo());
        chemical.setChemicalNameEn(request.getChemicalNameEn());
        chemical.setCasNumber(request.getCasNumber());
        chemical.setHazardClass(request.getHazardClass());
        chemical.setStatus(request.getStatus());
        chemical.setMsdsFileId(request.getMsdsFileId());
        chemical.setStorageLocation(request.getStorageLocation());
        chemical.setStorageQuantity(request.getStorageQuantity());
        chemical.setUnit(request.getUnit());
        chemical.setMaxStorageLimit(request.getMaxStorageLimit());
        chemical.setSupplier(request.getSupplier());
        chemical.setDepartment(request.getDepartment());
        chemical.setHandlerName(request.getHandlerName());
        chemical.setEmergencyProcedure(request.getEmergencyProcedure());
        chemical.setLastInspectionDate(request.getLastInspectionDate());
        chemical.setNextInspectionDate(request.getNextInspectionDate());
        chemical.setGhsPictogram(request.getGhsPictogram());
        chemical.setSignalWord(request.getSignalWord());
        chemical.setHazardStatements(request.getHazardStatements());
        chemical.setPrecautionaryStatements(request.getPrecautionaryStatements());
        chemical.setMolecularFormula(request.getMolecularFormula());
        chemical.setApplicableRegulation(request.getApplicableRegulation());
        chemical.setGhsClassification(request.getGhsClassification());
        chemical.setExposureLimit(request.getExposureLimit());
        chemical.setNotes(request.getNotes());

        chemicalMapper.update(chemical);
        log.info("Updated chemical: {}", chemical.getChemicalId());

        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        Chemical chemical = chemicalMapper.findByIdAndDeletedFalse(id);
        if (chemical == null) {
            throw new ResourceNotFoundException("Chemical", "id", id);
        }
        chemicalMapper.softDelete(id);
        log.info("Soft deleted chemical with id: {}", id);
    }

    private String generateChemicalId() {
        String prefix = "CHEM-" + LocalDate.now().getYear() + "-";
        int count = chemicalMapper.countByChemicalIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
