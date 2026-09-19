package com.legalmetrology.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    public DataSourceProperties dataSourceProperties() {
        DataSourceProperties properties = new DataSourceProperties();
        String url = databaseUrl;
        if (url != null && !url.isEmpty() && url.startsWith("postgresql://")) {
            url = "jdbc:" + url;
        }
        if (url != null && !url.isEmpty()) {
            properties.setUrl(url);
        }
        return properties;
    }
}
