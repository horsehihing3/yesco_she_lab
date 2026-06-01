package com.smartehs.mapper;

import com.smartehs.model.EvalSheetMeta;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface EvalSheetMetaMapper {
    EvalSheetMeta findFirst();
    int update(EvalSheetMeta meta);
    void insert(EvalSheetMeta meta);
}
