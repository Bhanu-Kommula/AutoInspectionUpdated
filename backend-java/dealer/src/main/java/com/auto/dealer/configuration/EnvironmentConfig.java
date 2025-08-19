package com.auto.dealer.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;

import jakarta.annotation.PostConstruct;
import javax.sql.DataSource;

@Configuration
public class EnvironmentConfig {

    @Autowired
    private Environment environment;

    @PostConstruct
    public void fixJdbcUrl() {
        // Fix the JDBC URL environment variable if it's missing the jdbc: prefix
        String dataSourceUrl = environment.getProperty("SPRING_DATASOURCE_URL");
        if (dataSourceUrl != null && !dataSourceUrl.startsWith("jdbc:")) {
            if (dataSourceUrl.startsWith("postgresql://")) {
                String fixedUrl = "jdbc:" + dataSourceUrl;
                System.setProperty("spring.datasource.url", fixedUrl);
                System.out.println("✅ Fixed JDBC URL: " + fixedUrl);
            }
        }
    }

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        DataSourceProperties properties = new DataSourceProperties();
        
        // Get the fixed URL from system properties
        String fixedUrl = System.getProperty("spring.datasource.url");
        if (fixedUrl != null) {
            properties.setUrl(fixedUrl);
        }
        
        return properties;
    }
}
