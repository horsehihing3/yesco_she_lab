package com.smartehs.mapper;

import com.smartehs.model.WorkplaceMeasurement;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WorkplaceMeasurementMapper {

    List<WorkplaceMeasurement> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();

    WorkplaceMeasurement findByIdAndDeletedFalse(@Param("id") Long id);
    WorkplaceMeasurement findByMeasurementIdAndDeletedFalse(@Param("measurementId") String measurementId);

    List<WorkplaceMeasurement> findByYearAndDeletedFalse(@Param("measurementYear") int measurementYear, @Param("offset") int offset, @Param("limit") int limit);
    int countByYearAndDeletedFalse(@Param("measurementYear") int measurementYear);

    List<WorkplaceMeasurement> searchByKeywordAndDeletedFalse(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);
    int countByKeywordAndDeletedFalse(@Param("keyword") String keyword);

    int countByMeasurementIdStartingWith(@Param("prefix") String prefix);

    void insert(WorkplaceMeasurement workplaceMeasurement);
    void update(WorkplaceMeasurement workplaceMeasurement);
    void softDelete(@Param("id") Long id);
}
