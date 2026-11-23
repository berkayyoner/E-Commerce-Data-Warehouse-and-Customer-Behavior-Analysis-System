package edu.yildiz.ecommerce.segmentation.web;

import java.net.URI;

import edu.yildiz.ecommerce.segmentation.model.PageResult;
import edu.yildiz.ecommerce.segmentation.model.RunDetail;
import edu.yildiz.ecommerce.segmentation.model.SegmentationRun;
import edu.yildiz.ecommerce.segmentation.service.SegmentationRunService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/segmentation/runs")
public class SegmentationRunController {

    private final SegmentationRunService service;

    public SegmentationRunController(SegmentationRunService service) {
        this.service = service;
    }

    /** Starts a run in the background and answers right away with the registered run. */
    @PostMapping
    public ResponseEntity<SegmentationRun> start() {
        SegmentationRun run = service.start();
        return ResponseEntity.accepted().location(URI.create("/api/segmentation/runs/" + run.id())).body(run);
    }

    @GetMapping
    public PageResult<SegmentationRun> list(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return service.list(page, size);
    }

    @GetMapping("/{id}")
    public RunDetail get(@PathVariable long id) {
        return service.get(id);
    }
}
