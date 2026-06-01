package com.smartehs.mapper;

import com.smartehs.model.DrillLog;
import com.smartehs.model.DrillLogItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DrillLogMapper {

    void insert(DrillLog log);

    void insertItem(DrillLogItem item);

    List<DrillLog> findByDrillId(@Param("drillId") Long drillId);

    List<DrillLogItem> findItemsByLogId(@Param("logId") Long logId);
}
