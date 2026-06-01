package com.smartehs.mapper;

import com.smartehs.model.TrainingCourse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TrainingCourseMapper {
    List<TrainingCourse> findAllWithPaging(
            @Param("category") String category,
            @Param("isActive") Boolean isActive,
            @Param("keyword") String keyword,
            @Param("offset") int offset,
            @Param("limit") int limit);

    int countAll(@Param("category") String category,
                 @Param("isActive") Boolean isActive,
                 @Param("keyword") String keyword);

    TrainingCourse findById(@Param("id") Long id);
    TrainingCourse findByCourseCode(@Param("courseCode") String courseCode);

    void insert(TrainingCourse course);
    void update(TrainingCourse course);
    void delete(@Param("id") Long id);
    void incrementCurrentSeats(@Param("id") Long id, @Param("delta") int delta);
}
