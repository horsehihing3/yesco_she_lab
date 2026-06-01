package com.smartehs.mapper;

import com.smartehs.model.RadWorker;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface RadWorkerMapper {
    List<RadWorker> findAll();
    RadWorker findById(@Param("id") Long id);
    int countAll();
    int countByType(@Param("type") String type);
    int countByStatus(@Param("status") String status);
    void insert(RadWorker e);
    void update(RadWorker e);
    void softDelete(@Param("id") Long id);
}
