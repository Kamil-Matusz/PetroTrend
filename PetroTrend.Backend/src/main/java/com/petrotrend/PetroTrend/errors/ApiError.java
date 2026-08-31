package com.petrotrend.PetroTrend.errors;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.petrotrend.PetroTrend.exceptions.BaseRuntimeException;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {

    private Integer status;
    private String message;
    private String reasonCode;
    @JsonIgnore
    private Exception exception;

    public ApiError(HttpStatus httpStatus) {
        this.status = httpStatus.value();
    }

    public ApiError(HttpStatus status, Exception e) {
        this(status);
        this.message = e.getMessage();
        this.exception = e;

        if (e instanceof BaseRuntimeException baseRuntimeException) {
            this.reasonCode = baseRuntimeException.getReasonCode();
        }
    }
}
