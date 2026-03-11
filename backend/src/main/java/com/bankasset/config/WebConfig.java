package com.bankasset.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.asset-images.directory:./asset-images}")
    private String imageDirectory;

    // CORS is now handled by SecurityConfig

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Keep local file serving as fallback when S3 is not configured
        registry.addResourceHandler("/asset-images/**")
                .addResourceLocations("file:" + imageDirectory + "/");
    }
}
