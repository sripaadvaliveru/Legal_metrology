package com.legalmetrology.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class FlexibleDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    @Override
    public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String text = p.getText();
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        text = text.trim();

        // 1. Try ISO-8601 Offset / UTC format (e.g. 2026-09-20T10:00:00.000Z or 2026-09-20T10:00:00+05:30)
        try {
            return OffsetDateTime.parse(text).toLocalDateTime();
        } catch (Exception ignored) {}

        // 2. Try Instant (e.g. 2026-09-20T10:00:00Z)
        try {
            return Instant.parse(text).atZone(ZoneId.systemDefault()).toLocalDateTime();
        } catch (Exception ignored) {}

        // 3. Try standard ISO Local Date Time (e.g. 2026-09-20T10:00:00)
        try {
            return LocalDateTime.parse(text, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception ignored) {}

        // 4. Try HTML datetime-local input format (e.g. 2026-09-20T10:00)
        try {
            return LocalDateTime.parse(text);
        } catch (Exception ignored) {}

        // 5. Fallback - current time
        return LocalDateTime.now();
    }
}
