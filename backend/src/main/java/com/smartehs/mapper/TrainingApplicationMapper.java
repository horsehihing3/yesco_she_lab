package com.smartehs.mapper;

import com.smartehs.model.TrainingApplication;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TrainingApplicationMapper {
    List<TrainingApplication> findAllWithPaging(
            @Param("status") String status,
            @Param("dept") String dept,
            @Param("courseId") Long courseId,
            @Param("username") String username,
            @Param("keyword") String keyword,
            @Param("name") String name,
            @Param("courseName") String courseName,
            @Param("offset") int offset,
            @Param("limit") int limit);

    int countAll(@Param("status") String status,
                 @Param("dept") String dept,
                 @Param("courseId") Long courseId,
                 @Param("username") String username,
                 @Param("keyword") String keyword,
                 @Param("name") String name,
                 @Param("courseName") String courseName);

    TrainingApplication findById(@Param("id") Long id);
    int countByApplicationNoStartingWith(@Param("prefix") String prefix);

    void insert(TrainingApplication a);
    void update(TrainingApplication a);
    void updateStatus(@Param("id") Long id,
                      @Param("status") String status,
                      @Param("approvedBy") String approvedBy,
                      @Param("rejectReason") String rejectReason,
                      @Param("completionDate") java.time.LocalDate completionDate);
    void delete(@Param("id") Long id);
}
