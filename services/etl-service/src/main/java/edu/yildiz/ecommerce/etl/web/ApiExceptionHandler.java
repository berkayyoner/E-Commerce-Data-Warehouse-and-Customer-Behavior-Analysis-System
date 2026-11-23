package edu.yildiz.ecommerce.etl.web;

import edu.yildiz.ecommerce.etl.service.EtlAlreadyRunningException;
import edu.yildiz.ecommerce.etl.service.EtlRunNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(EtlAlreadyRunningException.class)
    public ProblemDetail alreadyRunning(EtlAlreadyRunningException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(EtlRunNotFoundException.class)
    public ProblemDetail notFound(EtlRunNotFoundException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    public ProblemDetail badRequest(Exception e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "The request body must contain a runType of FULL or INCREMENTAL");
    }
}
