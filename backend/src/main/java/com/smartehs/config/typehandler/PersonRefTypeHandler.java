package com.smartehs.config.typehandler;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartehs.model.PersonRef;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedJdbcTypes;
import org.apache.ibatis.type.MappedTypes;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * PersonRef <-> JSON(NVARCHAR) 변환 TypeHandler.
 * 사람 필드(작성자/수정자/계획·완료승인자)를 컬럼 1개에 JSON 으로 저장한다.
 * 화면 필터/집계가 필요하면 JSON_VALUE(col,'$.team') 로 조회.
 */
@MappedTypes(PersonRef.class)
@MappedJdbcTypes(value = JdbcType.VARCHAR, includeNullJdbcType = true)
public class PersonRefTypeHandler extends BaseTypeHandler<PersonRef> {

    private static final ObjectMapper OM = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, PersonRef parameter, JdbcType jdbcType) throws SQLException {
        try {
            ps.setString(i, OM.writeValueAsString(parameter));
        } catch (Exception e) {
            throw new SQLException("PersonRef 직렬화 실패", e);
        }
    }

    @Override
    public PersonRef getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parse(rs.getString(columnName));
    }

    @Override
    public PersonRef getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parse(rs.getString(columnIndex));
    }

    @Override
    public PersonRef getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parse(cs.getString(columnIndex));
    }

    private PersonRef parse(String json) throws SQLException {
        if (json == null || json.isBlank()) return null;
        String trimmed = json.trim();
        // 레거시 평문(username 등 비-JSON) 값 방어: JSON 객체가 아니면 name 으로 감싸 graceful 처리(500 방지)
        if (trimmed.charAt(0) != '{') {
            PersonRef p = new PersonRef();
            p.setName(trimmed);
            return p;
        }
        try {
            return OM.readValue(trimmed, PersonRef.class);
        } catch (Exception e) {
            throw new SQLException("PersonRef 역직렬화 실패: " + json, e);
        }
    }
}
