package com.auto.tech.configuration;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.auto.tech.dto.ApiResponse;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
                errors.put(err.getField(), err.getDefaultMessage())
        );
        
        // Create a user-friendly message from validation errors
        String errorMessage = errors.values().stream()
                .collect(Collectors.joining(", "));
        
        return new ResponseEntity<>(
            ApiResponse.error("Validation failed: " + errorMessage), 
            HttpStatus.BAD_REQUEST
        );
    }
    
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDatabaseErrors(DataIntegrityViolationException ex) {
        String message = "Email already exists. Please try to Login.";
        return new ResponseEntity<>(
            ApiResponse.error(message), 
            HttpStatus.BAD_REQUEST
        );
    }
}