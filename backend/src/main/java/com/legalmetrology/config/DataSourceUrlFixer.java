package com.legalmetrology.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;

public class DataSourceUrlFixer implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String dbUrl = environment.getProperty("DATABASE_URL");
        if (dbUrl == null || dbUrl.isEmpty()) return;

        Map<String, Object> props = new HashMap<>();

        // Fix URL format: postgresql:// -> jdbc:postgresql://
        if (dbUrl.startsWith("postgresql://")) {
            props.put("spring.datasource.url", "jdbc:" + dbUrl);
        } else if (!dbUrl.startsWith("jdbc:")) {
            props.put("spring.datasource.url", "jdbc:" + dbUrl);
        }

        // Parse username/password from DATABASE_URL if not set separately
        if (environment.getProperty("DB_USERNAME") == null || environment.getProperty("DB_USERNAME").isEmpty()) {
            try {
                URI uri = URI.create(dbUrl.replace("jdbc:", ""));
                if (uri.getUserInfo() != null) {
                    String[] parts = uri.getUserInfo().split(":");
                    props.put("spring.datasource.username", parts[0]);
                    if (parts.length > 1) {
                        props.put("spring.datasource.password", parts[1]);
                    }
                }
            } catch (Exception ignored) {}
        }

        if (!props.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource("dataSourceFix", props));
        }
    }
}
