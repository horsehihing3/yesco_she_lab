package com.smartehs.mapper;

import com.smartehs.model.SafetyAccidentForm;
import com.smartehs.model.SafetyAccidentItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SafetyAccidentMapper {

    List<SafetyAccidentForm> findAllForms(@Param("offset") int offset, @Param("limit") int limit);
    int countAllForms();
    SafetyAccidentForm findFormById(@Param("id") Long id);
    void insertForm(SafetyAccidentForm form);
    void updateForm(SafetyAccidentForm form);
    void deleteForm(@Param("id") Long id);

    List<SafetyAccidentItem> findItemsByFormId(@Param("formId") Long formId);
    void insertItem(SafetyAccidentItem item);
    void deleteItemsByFormId(@Param("formId") Long formId);
}
