package com.smartehs.mapper;

import com.smartehs.model.PrePlacementExam;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PrePlacementExamMapper {

    List<PrePlacementExam> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();

    PrePlacementExam findByIdAndDeletedFalse(@Param("id") Long id);
    PrePlacementExam findByExamIdAndDeletedFalse(@Param("examId") String examId);

    List<PrePlacementExam> findByEmployeeIdAndDeletedFalse(@Param("employeeId") String employeeId, @Param("offset") int offset, @Param("limit") int limit);
    int countByEmployeeIdAndDeletedFalse(@Param("employeeId") String employeeId);

    List<PrePlacementExam> findByYearAndDeletedFalse(@Param("examYear") int examYear, @Param("offset") int offset, @Param("limit") int limit);
    int countByYearAndDeletedFalse(@Param("examYear") int examYear);

    List<PrePlacementExam> findByStatusAndDeletedFalse(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);
    int countByStatusAndDeletedFalse(@Param("status") String status);

    List<PrePlacementExam> searchByEmployeeNameAndDeletedFalse(@Param("name") String name, @Param("offset") int offset, @Param("limit") int limit);
    int countByEmployeeNameAndDeletedFalse(@Param("name") String name);

    int countByExamIdStartingWith(@Param("prefix") String prefix);

    void insert(PrePlacementExam exam);
    void update(PrePlacementExam exam);
    void softDelete(@Param("id") Long id);
}
