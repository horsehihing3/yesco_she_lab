package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.mapper.EvalSheetItemMapper;
import com.smartehs.mapper.EvalSheetMetaMapper;
import com.smartehs.model.EvalSheetItem;
import com.smartehs.model.EvalSheetMeta;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/eval-sheet")
@RequiredArgsConstructor
public class EvalSheetController {

    private final EvalSheetItemMapper itemMapper;
    private final EvalSheetMetaMapper metaMapper;

    // ==================== Items ====================

    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<EvalSheetItem>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(itemMapper.findAll()));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<EvalSheetItem>> create(@RequestBody EvalSheetItem body) {
        if (body.getSortOrder() == null) {
            body.setSortOrder(itemMapper.nextSortOrder());
        }
        if (body.getMaxScore() == null) {
            body.setMaxScore(BigDecimal.ZERO);
        }
        itemMapper.insert(body);
        return ResponseEntity.ok(ApiResponse.success(itemMapper.findById(body.getId())));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<ApiResponse<EvalSheetItem>> update(
            @PathVariable Long id,
            @RequestBody EvalSheetItem body) {
        body.setId(id);
        itemMapper.update(body);
        return ResponseEntity.ok(ApiResponse.success(itemMapper.findById(id)));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        itemMapper.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/save")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> saveAll(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        Map<String, Object> metaMap = (Map<String, Object>) body.get("meta");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
        @SuppressWarnings("unchecked")
        List<Number> removedIds = (List<Number>) body.get("removedIds");

        // Meta upsert
        if (metaMap != null) {
            EvalSheetMeta existing = metaMetaFindFirst();
            EvalSheetMeta payload = EvalSheetMeta.builder()
                    .title((String) metaMap.get("title"))
                    .description((String) metaMap.get("description"))
                    .build();
            if (existing == null) {
                metaMapper.insert(payload);
            } else {
                payload.setId(existing.getId());
                metaMapper.update(payload);
            }
        }

        // Removals
        if (removedIds != null) {
            for (Number rid : removedIds) {
                if (rid != null) itemMapper.delete(rid.longValue());
            }
        }

        // Insert / Update
        if (items != null) {
            int sortOrder = 0;
            for (Map<String, Object> raw : items) {
                sortOrder++;
                EvalSheetItem item = new EvalSheetItem();
                Object idVal = raw.get("id");
                if (idVal instanceof Number) item.setId(((Number) idVal).longValue());
                item.setSortOrder(sortOrder);
                item.setCategory((String) raw.get("category"));
                item.setEvalItem((String) raw.get("evalItem"));
                item.setEvalContent((String) raw.get("evalContent"));
                Object ms = raw.get("maxScore");
                item.setMaxScore(ms == null ? BigDecimal.ZERO : new BigDecimal(ms.toString()));
                if (item.getId() != null) itemMapper.update(item);
                else itemMapper.insert(item);
            }
        }

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "items", itemMapper.findAll(),
                "meta", metaMetaFindFirst()
        )));
    }

    private EvalSheetMeta metaMetaFindFirst() {
        return metaMapper.findFirst();
    }

    @PatchMapping("/items/{id}/score")
    public ResponseEntity<ApiResponse<EvalSheetItem>> updateScore(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Object scoreVal = body.get("score");
        BigDecimal score = null;
        if (scoreVal != null) {
            String s = scoreVal.toString().trim();
            if (!s.isEmpty()) {
                try { score = new BigDecimal(s); }
                catch (NumberFormatException ignored) { /* keep null */ }
            }
        }
        itemMapper.updateScore(id, score);
        return ResponseEntity.ok(ApiResponse.success(itemMapper.findById(id)));
    }

    // ==================== Meta (제목/설명) ====================

    @GetMapping("/meta")
    public ResponseEntity<ApiResponse<EvalSheetMeta>> getMeta() {
        EvalSheetMeta meta = metaMapper.findFirst();
        if (meta == null) {
            meta = EvalSheetMeta.builder().title("수급업체 평가표").description("").build();
            metaMapper.insert(meta);
        }
        return ResponseEntity.ok(ApiResponse.success(meta));
    }

    @PutMapping("/meta")
    public ResponseEntity<ApiResponse<EvalSheetMeta>> updateMeta(@RequestBody EvalSheetMeta body) {
        EvalSheetMeta existing = metaMapper.findFirst();
        if (existing == null) {
            metaMapper.insert(body);
            return ResponseEntity.ok(ApiResponse.success(metaMapper.findFirst()));
        }
        body.setId(existing.getId());
        metaMapper.update(body);
        return ResponseEntity.ok(ApiResponse.success(metaMapper.findFirst()));
    }
}
