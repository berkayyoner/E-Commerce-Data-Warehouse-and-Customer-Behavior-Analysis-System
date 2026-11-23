package edu.yildiz.ecommerce.segmentation.web;

import edu.yildiz.ecommerce.segmentation.service.SegmentationAlreadyRunningException;
import edu.yildiz.ecommerce.segmentation.service.SegmentationRunNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    /** An unknown sort, direction or segment, or a page or size out of range. */
    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail invalidArgument(IllegalArgumentException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    /** A number that is not a whole number. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail invalidParameter(MethodArgumentTypeMismatchException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Invalid value for parameter " + e.getName());
    }

    @ExceptionHandler(SegmentationAlreadyRunningException.class)
    public ProblemDetail alreadyRunning(SegmentationAlreadyRunningException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(SegmentationRunNotFoundException.class)
    public ProblemDetail notFound(SegmentationRunNotFoundException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }

    /** The warehouse cannot be reached while the request runs. */
    @ExceptionHandler(DataAccessException.class)
    public ProblemDetail unavailable(DataAccessException e) {
        log.error("The segmentation query failed", e);
        return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE,
                "The segmentation data source is unavailable");
    }
}
