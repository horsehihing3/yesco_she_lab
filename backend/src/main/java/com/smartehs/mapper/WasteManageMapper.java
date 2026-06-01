package com.smartehs.mapper;

import com.smartehs.model.WasteManage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WasteManageMapper {

    List<WasteManage> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    WasteManage findById(@Param("id") Long id);

    List<WasteManage> findByWasteNameContaining(@Param("wasteName") String wasteName, @Param("offset") int offset, @Param("limit") int limit);

    int countByWasteNameContaining(@Param("wasteName") String wasteName);

    List<WasteManage> findByStatus(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatus(@Param("status") String status);

    List<WasteManage> findAllList();

    int countByStatusValue(@Param("status") String status);

    String generateWasteCode();

    void insert(WasteManage wasteManage);

    void update(WasteManage wasteManage);

    void updateStatus(@Param("id") Long id, @Param("status") String status);

    void delete(@Param("id") Long id);
}
