export interface VisitLog {
    id: string;
    linkHash: string;
    dealerId: number | string; // which dealer was visited 

    ip: string; // visitor IP address for geo-location IN THE FUTURE
    userAgent: string; // browser info 
    timestamp: Date;
}