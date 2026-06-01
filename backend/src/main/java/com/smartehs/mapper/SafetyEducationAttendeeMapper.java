package com.smartehs.mapper;

import com.smartehs.model.SafetyEducationAttendee;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SafetyEducationAttendeeMapper {

    List<SafetyEducationAttendee> findByEducationId(@Param("educationId") String educationId);
    SafetyEducationAttendee findById(@Param("id") Long id);
    int countByEducationId(@Param("educationId") String educationId);

    void insert(SafetyEducationAttendee attendee);
    void updateSignature(@Param("id") Long id);
    void delete(@Param("id") Long id);
    void deleteByEducationId(@Param("educationId") String educationId);
}
