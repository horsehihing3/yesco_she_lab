package com.smartehs.mapper;

import com.smartehs.model.LegalLaw;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LegalLawMapper {
    List<LegalLaw> findAll();
    LegalLaw findById(@Param("id") Long id);
    int countByReviewStatus(@Param("status") String status);
    int countByApplyYn(@Param("apply") String apply);
    int countAll();
    int countUrgent();
    void insert(LegalLaw entity);
    void update(LegalLaw entity);
    void softDelete(@Param("id") Long id);
}
