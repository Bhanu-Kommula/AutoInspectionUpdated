package com.auto.tech.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url}")
    private String dataSourceUrl;

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        DataSourceProperties properties = new DataSourceProperties();
        
        // Fix for Render: Ensure jdbc: prefix is present
        String fixedUrl = dataSourceUrl;
        if (fixedUrl != null && !fixedUrl.startsWith("jdbc:")) {
            if (fixedUrl.startsWith("postgresql://")) {
                fixedUrl = "jdbc:" + fixedUrl;
            } else if (fixedUrl.startsWith("postgres://")) {
                fixedUrl = "jdbc:" + fixedUrl;
            }
        }
        
        properties.setUrl(fixedUrl);
        return properties;
    }

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().build();
    }
}
