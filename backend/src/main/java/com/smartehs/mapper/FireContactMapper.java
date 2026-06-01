package com.smartehs.mapper;

import com.smartehs.model.FireContact;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface FireContactMapper {
    List<FireContact> findAll();
    FireContact findById(@Param("id") Long id);
    int countAll();
    void insert(FireContact e);
    void update(FireContact e);
    void softDelete(@Param("id") Long id);
}
