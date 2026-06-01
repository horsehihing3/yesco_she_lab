package com.smartehs.mapper;

import com.smartehs.model.OdWorker;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OdWorkerMapper {
    List<OdWorker> findAll();
    OdWorker findById(@Param("id") Long id);
    int countAll();
    int countByJudge(@Param("judge") String judge);
    int countByDivision(@Param("division") String division);
    void insert(OdWorker e);
    void update(OdWorker e);
    void softDelete(@Param("id") Long id);
}
