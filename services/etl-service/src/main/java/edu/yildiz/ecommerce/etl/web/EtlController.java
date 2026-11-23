package edu.yildiz.ecommerce.etl.web;

import java.net.URI;

import edu.yildiz.ecommerce.etl.model.EtlRun;
import edu.yildiz.ecommerce.etl.model.EtlRunDetail;
import edu.yildiz.ecommerce.etl.model.PageResult;
import edu.yildiz.ecommerce.etl.service.EtlRunService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/etl/runs")
public class EtlController {

    private final EtlRunService service;

    public EtlController(EtlRunService service) {
        this.service = service;
    }

    /** Starts a run in the background and answers right away with the registered run. */
    @PostMapping
    public ResponseEntity<EtlRun> start(@Valid @RequestBody StartRunRequest request) {
        EtlRun run = service.start(request.runType());
        return ResponseEntity.accepted().location(URI.create("/api/etl/runs/" + run.id())).body(run);
    }

    @GetMapping
    public PageResult<EtlRun> list(@RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        return service.list(page, size);
    }

    @GetMapping("/{id}")
    public EtlRunDetail get(@PathVariable long id) {
        return service.get(id);
    }
}
