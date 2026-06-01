package com.smartehs.mapper;

import com.smartehs.model.DpCvd;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface DpCvdMapper {
    List<DpCvd> findAll();
    DpCvd findById(@Param("id") Long id);
    int countAll();
    int countByRiskLevel(@Param("riskLevel") String riskLevel);
    void insert(DpCvd e);
    void update(DpCvd e);
    void softDelete(@Param("id") Long id);
}
