package com.smartehs.mapper;

import com.smartehs.model.SafetyHazardForm;
import com.smartehs.model.SafetyHazardItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SafetyHazardMapper {

    // Form
    List<SafetyHazardForm> findAllForms(@Param("offset") int offset, @Param("limit") int limit);
    int countAllForms();
    SafetyHazardForm findFormById(@Param("id") Long id);
    void insertForm(SafetyHazardForm form);
    void updateForm(SafetyHazardForm form);
    void deleteForm(@Param("id") Long id);

    // Item
    List<SafetyHazardItem> findItemsByFormId(@Param("formId") Long formId);
    void insertItem(SafetyHazardItem item);
    void deleteItemsByFormId(@Param("formId") Long formId);
}
