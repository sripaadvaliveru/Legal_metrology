package com.legalmetrology.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import java.util.HashMap;
import java.util.Map;

public class DataSourceUrlFixer implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String dbUrl = environment.getProperty("DATABASE_URL");
        if (dbUrl != null && !dbUrl.isEmpty()) {
            Map<String, Object> props = new HashMap<>();
            if (dbUrl.startsWith("postgresql://")) {
                props.put("spring.datasource.url", "jdbc:" + dbUrl);
            } else if (!dbUrl.startsWith("jdbc:")) {
                props.put("spring.datasource.url", "jdbc:" + dbUrl);
            }
            String username = environment.getProperty("DB_USERNAME");
            String password = environment.getProperty("DB_PASSWORD");
            if (username != null) props.put("spring.datasource.username", username);
            if (password != null) props.put("spring.datasource.password", password);
            environment.getPropertySources().addLast(new MapPropertySource("dataSourceFix", props));
        }
    }
}
