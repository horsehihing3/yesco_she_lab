package com.smartehs.service;

import com.smartehs.dto.response.LegalSearchResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * 법제처 국가법령정보센터 OpenAPI 클라이언트
 * - 검색: GET https://www.law.go.kr/DRF/lawSearch.do?OC=...&target=law&type=XML&query=...
 * - 상세 링크 형식: https://www.law.go.kr/lsInfoP.do?lsiSeq={lawId}
 *
 * OC(기관코드)는 회원가입 후 발급. 미발급 시 "test"로 일부 호출 가능하지만 제한적임.
 * application.yml 의 law-api.oc 로 지정.
 */
@Slf4j
@Component
public class LawApiClient {

    private static final String SEARCH_URL = "https://www.law.go.kr/DRF/lawSearch.do";
    private static final String DETAIL_BASE = "https://www.law.go.kr/lsInfoP.do?lsiSeq=";

    private final RestTemplate rest = new RestTemplate();

    @Value("${law-api.oc:test}")
    private String oc;

    /**
     * 법령 검색 — 일반 법령
     *
     * @param query   검색어 (법령명)
     * @param page    페이지 (1부터)
     * @param display 페이지당 항목 수 (최대 100)
     */
    public LegalSearchResult searchLaws(String query, int page, int display) {
        URI uri = UriComponentsBuilder.fromHttpUrl(SEARCH_URL)
                .queryParam("OC", oc)
                .queryParam("target", "law")
                .queryParam("type", "XML")
                .queryParam("query", query == null ? "" : query)
                .queryParam("display", Math.min(display, 100))
                .queryParam("page", Math.max(1, page))
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri();

        log.info("[법제처 API] 호출 URL: {}", uri);
        try {
            ResponseEntity<String> resp = rest.getForEntity(uri, String.class);
            String body = resp.getBody();
            log.info("[법제처 API] 응답 일부: {}", body == null ? "(null)" : body.substring(0, Math.min(400, body.length())));
            // 인증 실패 응답: <Response><result>...</result><msg>...</msg></Response>
            if (body != null && body.contains("<Response>") && body.contains("<result>")) {
                String reason = body.replaceAll("(?s).*?<result>(.*?)</result>.*", "$1");
                String msg = body.replaceAll("(?s).*?<msg>(.*?)</msg>.*", "$1");
                log.error("[법제처 API] 인증 실패: result={} msg={}", reason, msg);
                throw new IllegalStateException("법제처 API 인증 실패: " + reason + " (" + msg + ")");
            }
            return parseSearchXml(body, page, display);
        } catch (IllegalStateException ie) {
            throw new RuntimeException(ie.getMessage(), ie);
        } catch (Exception e) {
            log.warn("법제처 API 호출 실패: {}", e.getMessage());
            return LegalSearchResult.builder()
                    .totalCount(0).page(page).size(display)
                    .items(new ArrayList<>())
                    .build();
        }
    }

    /** 최근 개정 법령 — page=1 기본 */
    public LegalSearchResult fetchRecentRevisions(int display) {
        return fetchRecentRevisions(display, 1);
    }

    /**
     * 최근 개정 법령 — 페이지 지정
     * @param display 페이지당 항목 수 (최대 100)
     * @param page    페이지 (1부터)
     */
    public LegalSearchResult fetchRecentRevisions(int display, int page) {
        URI uri = UriComponentsBuilder.fromHttpUrl(SEARCH_URL)
                .queryParam("OC", oc)
                .queryParam("target", "law")
                .queryParam("type", "XML")
                .queryParam("display", Math.min(display, 100))
                .queryParam("page", Math.max(1, page))
                .queryParam("sort", "ddes")  // 공포일 내림차순
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri();
        log.info("[법제처 API] 최근개정 호출 URL (page={}): {}", page, uri);
        try {
            ResponseEntity<String> resp = rest.getForEntity(uri, String.class);
            return parseSearchXml(resp.getBody(), page, display);
        } catch (Exception e) {
            log.warn("법제처 최근개정 호출 실패: {}", e.getMessage());
            return LegalSearchResult.builder()
                    .totalCount(0).page(page).size(display)
                    .items(new ArrayList<>())
                    .build();
        }
    }

    private LegalSearchResult parseSearchXml(String xml, int page, int display) throws Exception {
        if (xml == null || xml.isEmpty()) {
            return LegalSearchResult.builder()
                    .totalCount(0).page(page).size(display)
                    .items(new ArrayList<>()).build();
        }
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        DocumentBuilder db = dbf.newDocumentBuilder();
        Document doc = db.parse(new InputSource(new StringReader(xml)));
        doc.getDocumentElement().normalize();

        int total = 0;
        NodeList tcNodes = doc.getElementsByTagName("totalCnt");
        if (tcNodes.getLength() > 0) {
            try { total = Integer.parseInt(tcNodes.item(0).getTextContent().trim()); }
            catch (NumberFormatException ignored) {}
        }

        List<LegalSearchResult.Item> items = new ArrayList<>();
        NodeList lawNodes = doc.getElementsByTagName("law");
        for (int i = 0; i < lawNodes.getLength(); i++) {
            Element e = (Element) lawNodes.item(i);
            String lawId = tag(e, "법령일련번호");
            String detail = (lawId != null && !lawId.isEmpty()) ? DETAIL_BASE + lawId : null;
            items.add(LegalSearchResult.Item.builder()
                    .lawId(lawId)
                    .lawName(tag(e, "법령명한글"))
                    .lawType(tag(e, "법령구분명"))
                    .competentOrg(tag(e, "소관부처명"))
                    .promulgationNo(tag(e, "공포번호"))
                    .promulgationDt(formatDate(tag(e, "공포일자")))
                    .enforceDt(formatDate(tag(e, "시행일자")))
                    .revisionType(tag(e, "제개정구분명"))
                    .detailLink(detail)
                    .build());
        }
        return LegalSearchResult.builder()
                .totalCount(total).page(page).size(display).items(items).build();
    }

    private String tag(Element parent, String name) {
        NodeList list = parent.getElementsByTagName(name);
        if (list.getLength() == 0) return null;
        String v = list.item(0).getTextContent();
        return v == null ? null : v.trim();
    }

    /** "20250115" -> "2025-01-15" */
    private String formatDate(String raw) {
        if (raw == null || raw.length() != 8) return raw;
        return raw.substring(0,4) + "-" + raw.substring(4,6) + "-" + raw.substring(6,8);
    }
}
