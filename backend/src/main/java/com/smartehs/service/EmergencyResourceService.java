package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EmergencyResourceMapper;
import com.smartehs.model.EmergencyResource;
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
public class EmergencyResourceService {

    private final EmergencyResourceMapper emergencyResourceMapper;

    @Transactional(readOnly = true)
    public Page<EmergencyResource> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmergencyResource> content = emergencyResourceMapper.findByDeletedFalse(offset, limit);
        int total = emergencyResourceMapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public EmergencyResource findById(Long id) {
        EmergencyResource resource = emergencyResourceMapper.findById(id);
        if (resource == null) {
            throw new ResourceNotFoundException("EmergencyResource", "id", id);
        }
        return resource;
    }

    @Transactional(readOnly = true)
    public Page<EmergencyResource> findByResourceType(String resourceType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EmergencyResource> content = emergencyResourceMapper.findByResourceType(resourceType, offset, limit);
        int total = emergencyResourceMapper.countByResourceType(resourceType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public EmergencyResource create(EmergencyResource emergencyResource) {
        String newId = generateResourceId();
        emergencyResource.setResourceId(newId);
        if (emergencyResource.getStatus() == null) {
            emergencyResource.setStatus("NORMAL");
        }
        emergencyResource.setDeleted(false);
        emergencyResourceMapper.insert(emergencyResource);
        log.info("Created emergency resource: {}", newId);
        return findById(emergencyResource.getId());
    }

    @Transactional
    public EmergencyResource update(Long id, EmergencyResource emergencyResource) {
        EmergencyResource existing = emergencyResourceMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("EmergencyResource", "id", id);
        }
        emergencyResource.setId(id);
        emergencyResourceMapper.update(emergencyResource);
        log.info("Updated emergency resource: {}", existing.getResourceId());
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        EmergencyResource existing = emergencyResourceMapper.findById(id);
        if (existing == null) {
            throw new ResourceNotFoundException("EmergencyResource", "id", id);
        }
        emergencyResourceMapper.softDelete(id);
        log.info("Soft deleted emergency resource with id: {}", id);
    }

    private String generateResourceId() {
        String prefix = "RES-";
        int count = emergencyResourceMapper.countByResourceIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
