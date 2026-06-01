package com.smartehs.mapper;

import com.smartehs.model.ErgonomicsAssessment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ErgonomicsAssessmentMapper {
    List<ErgonomicsAssessment> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();
    ErgonomicsAssessment findByIdAndDeletedFalse(@Param("id") Long id);
    List<ErgonomicsAssessment> findByRiskLevelAndDeletedFalse(@Param("riskLevel") String riskLevel, @Param("offset") int offset, @Param("limit") int limit);
    int countByRiskLevelAndDeletedFalse(@Param("riskLevel") String riskLevel);
    List<ErgonomicsAssessment> searchAndDeletedFalse(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);
    int countBySearchAndDeletedFalse(@Param("keyword") String keyword);
    int countByAssessmentIdStartingWith(@Param("prefix") String prefix);
    void insert(ErgonomicsAssessment assessment);
    void update(ErgonomicsAssessment assessment);
    void softDelete(@Param("id") Long id);
}
