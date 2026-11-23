package edu.yildiz.ecommerce.segmentation.web;

import java.util.List;

import edu.yildiz.ecommerce.segmentation.model.ClusterOverview;
import edu.yildiz.ecommerce.segmentation.model.CustomerQuery;
import edu.yildiz.ecommerce.segmentation.model.CustomerRow;
import edu.yildiz.ecommerce.segmentation.model.PageResult;
import edu.yildiz.ecommerce.segmentation.model.RfmGridCell;
import edu.yildiz.ecommerce.segmentation.model.SegmentSummary;
import edu.yildiz.ecommerce.segmentation.service.SegmentationReadService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/segmentation")
public class SegmentationController {

    private final SegmentationReadService service;

    public SegmentationController(SegmentationReadService service) {
        this.service = service;
    }

    @GetMapping("/segments")
    public List<SegmentSummary> segments() {
        return service.segments();
    }

    @GetMapping("/rfm-grid")
    public List<RfmGridCell> rfmGrid() {
        return service.rfmGrid();
    }

    @GetMapping("/clusters")
    public ClusterOverview clusters() {
        return service.clusters();
    }

    @GetMapping("/customers")
    public PageResult<CustomerRow> customers(@RequestParam(required = false) String segment,
                                             @RequestParam(required = false) Integer cluster,
                                             @RequestParam(required = false) String search,
                                             @RequestParam(required = false) String sort,
                                             @RequestParam(required = false) String direction,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return service.customers(CustomerQuery.of(segment, cluster, search, sort, direction, page, size));
    }
}
