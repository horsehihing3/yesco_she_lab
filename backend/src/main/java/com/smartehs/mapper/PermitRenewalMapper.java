package com.smartehs.mapper;

import com.smartehs.model.PermitRenewal;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PermitRenewalMapper {
    List<PermitRenewal> findAll();
    PermitRenewal findById(@Param("id") Long id);
    int countByStage(@Param("stage") String stage);
    int countActive();
    int countDone();
    void insert(PermitRenewal e);
    void update(PermitRenewal e);
    void softDelete(@Param("id") Long id);
}
