export declare function parseISODate(dateString: string | null): number;
export declare function formatISODate(timestamp: number): string;
export declare function timeDiffMs(startDate: string | null, endDate: string | null): number;
export declare function timeDiffSeconds(startDate: string | null, endDate: string | null): number;
export declare function timeDiffMinutes(startDate: string | null, endDate: string | null): number;
export declare function nowISO(): string;
export declare function averageInterEventInterval(timestamps: string[]): number;
export declare function calculateRate(count: number, startTime: string | null, endTime: string | null): number;
