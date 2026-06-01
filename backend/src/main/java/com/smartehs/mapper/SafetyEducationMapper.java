package com.smartehs.mapper;

import com.smartehs.model.SafetyEducation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SafetyEducationMapper {

    List<SafetyEducation> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();

    SafetyEducation findByIdAndDeletedFalse(@Param("id") Long id);
    SafetyEducation findByEducationIdAndDeletedFalse(@Param("educationId") String educationId);

    List<SafetyEducation> findByYearAndDeletedFalse(@Param("year") int year, @Param("offset") int offset, @Param("limit") int limit);
    int countByYearAndDeletedFalse(@Param("year") int year);

    List<SafetyEducation> findByTypeAndDeletedFalse(@Param("educationType") String educationType, @Param("offset") int offset, @Param("limit") int limit);
    int countByTypeAndDeletedFalse(@Param("educationType") String educationType);

    List<SafetyEducation> searchByTitleAndDeletedFalse(@Param("title") String title, @Param("offset") int offset, @Param("limit") int limit);
    int countByTitleAndDeletedFalse(@Param("title") String title);

    int countByEducationIdStartingWith(@Param("prefix") String prefix);

    void insert(SafetyEducation safetyEducation);
    void update(SafetyEducation safetyEducation);
    void updateStatus(@Param("id") Long id, @Param("status") String status);
    void updateAttendeeCount(@Param("educationId") String educationId, @Param("count") int count);
    void softDelete(@Param("id") Long id);
}
