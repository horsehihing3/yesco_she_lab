package com.smartehs.mapper;

import com.smartehs.model.EmergencyResource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EmergencyResourceMapper {
    List<EmergencyResource> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();
    EmergencyResource findById(@Param("id") Long id);
    List<EmergencyResource> findByResourceType(@Param("resourceType") String resourceType, @Param("offset") int offset, @Param("limit") int limit);
    int countByResourceType(@Param("resourceType") String resourceType);
    void insert(EmergencyResource emergencyResource);
    void update(EmergencyResource emergencyResource);
    void softDelete(@Param("id") Long id);
    int countByResourceIdStartingWith(@Param("prefix") String prefix);
}
