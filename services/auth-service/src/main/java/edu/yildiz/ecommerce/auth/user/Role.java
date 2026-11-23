package edu.yildiz.ecommerce.auth.user;

public enum Role {
    /** Manages users and starts ETL runs. */
    ADMIN,
    /** Reads every report and the customer segments. */
    ANALYST,
    /** Reads the public dashboards. */
    VIEWER
}
