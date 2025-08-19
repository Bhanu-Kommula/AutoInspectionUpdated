package com.auto.tech.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import com.zaxxer.hikari.HikariDataSource;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url}")
    private String dataSourceUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    @ConditionalOnProperty(name = "spring.datasource.url")
    public DataSource dataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        
        // Fix for Render: Ensure jdbc: prefix is present
        String fixedUrl = dataSourceUrl;
        if (fixedUrl != null && !fixedUrl.startsWith("jdbc:")) {
            if (fixedUrl.startsWith("postgresql://")) {
                fixedUrl = "jdbc:" + fixedUrl;
            } else if (fixedUrl.startsWith("postgres://")) {
                fixedUrl = "jdbc:" + fixedUrl;
            }
        }
        
        dataSource.setJdbcUrl(fixedUrl);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName(driverClassName);
        
        // Connection pool settings
        dataSource.setMaximumPoolSize(20);
        dataSource.setMinimumIdle(5);
        dataSource.setConnectionTimeout(20000);
        
        return dataSource;
    }
}
