package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EmergencyContactMapper;
import com.smartehs.model.EmergencyContact;
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
public class EmergencyContactService {

    private final EmergencyContactMapper emergencyContactMapper;

    @Transactional(readOnly = true)
    public Page<EmergencyContact> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmergencyContact> content = emergencyContactMapper.findByDeletedFalse(offset, limit);
        int total = emergencyContactMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public EmergencyContact findById(Long id) {
        EmergencyContact contact = emergencyContactMapper.findById(id);
        if (contact == null) {
            throw new ResourceNotFoundException("EmergencyContact", "id", id);
        }
        return contact;
    }

    @Transactional(readOnly = true)
    public Page<EmergencyContact> findByContactType(String contactType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmergencyContact> content = emergencyContactMapper.findByContactType(contactType, offset, limit);
        int total = emergencyContactMapper.countByContactType(contactType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public EmergencyContact create(EmergencyContact emergencyContact) {
        String newId = generateContactId();
        emergencyContact.setContactId(newId);
        if (emergencyContact.getContactType() == null) {
            emergencyContact.setContactType("INTERNAL");
        }
        emergencyContact.setDeleted(false);
        emergencyContactMapper.insert(emergencyContact);
        log.info("Created emergency contact: {}", newId);
        return findById(emergencyContact.getId());
    }

    @Transactional
    public EmergencyContact update(Long id, EmergencyContact emergencyContact) {
        EmergencyContact existing = emergencyContactMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("EmergencyContact", "id", id);
        }
        emergencyContact.setId(id);
        emergencyContactMapper.update(emergencyContact);
        log.info("Updated emergency contact: {}", existing.getContactId());
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        EmergencyContact existing = emergencyContactMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("EmergencyContact", "id", id);
        }
        emergencyContactMapper.softDelete(id);
        log.info("Soft deleted emergency contact with id: {}", id);
    }

    private String generateContactId() {
        String prefix = "EC-";
        int count = emergencyContactMapper.countByContactIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
