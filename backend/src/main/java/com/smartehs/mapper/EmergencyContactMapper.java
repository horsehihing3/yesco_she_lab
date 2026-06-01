package com.smartehs.mapper;

import com.smartehs.model.EmergencyContact;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EmergencyContactMapper {
    List<EmergencyContact> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();
    EmergencyContact findById(@Param("id") Long id);
    List<EmergencyContact> findByContactType(@Param("contactType") String contactType, @Param("offset") int offset, @Param("limit") int limit);
    int countByContactType(@Param("contactType") String contactType);
    void insert(EmergencyContact emergencyContact);
    void update(EmergencyContact emergencyContact);
    void softDelete(@Param("id") Long id);
    int countByContactIdStartingWith(@Param("prefix") String prefix);
}
