package com.smartehs.mapper;

import com.smartehs.model.PermitWorker;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PermitWorkerMapper {
    void insert(PermitWorker worker);
    List<PermitWorker> findByPermitId(@Param("permitId") Long permitId);
    void deleteByPermitId(@Param("permitId") Long permitId);
}
