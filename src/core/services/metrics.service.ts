import { Injectable } from '@nestjs/common';

export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

@Injectable()
export class MetricsService {
  private metrics: Metric[] = [];

  recordMetric(metric: Metric): void {
    this.metrics.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    });
  }

  recordCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    const metric: Metric = { name, value };
    if (tags) {
      metric.tags = tags;
    }
    this.recordMetric(metric);
  }

  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = { name, value };
    if (tags) {
      metric.tags = tags;
    }
    this.recordMetric(metric);
  }

  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = { name, value };
    if (tags) {
      metric.tags = tags;
    }
    this.recordMetric(metric);
  }

  recordTiming(name: string, durationMs: number, tags?: Record<string, string>): void {
    const metric: Metric = { name, value: durationMs, timestamp: new Date() };
    if (tags) {
      metric.tags = tags;
    }
    this.recordMetric(metric);
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  // Export metrics in Prometheus format
  exportPrometheus(): string {
    const lines: string[] = [];
    const metricGroups = new Map<string, Metric[]>();

    // Group metrics by name
    this.metrics.forEach((metric) => {
      const key = metric.name;
      if (!metricGroups.has(key)) {
        metricGroups.set(key, []);
      }
      metricGroups.get(key)!.push(metric);
    });

    // Format as Prometheus metrics
    metricGroups.forEach((metrics, name) => {
      metrics.forEach((metric) => {
        const tags = metric.tags
          ? `{${Object.entries(metric.tags)
              .map(([k, v]) => `${k}="${v}"`)
              .join(',')}}`
          : '';
        lines.push(`${name}${tags} ${metric.value} ${metric.timestamp?.getTime() || Date.now()}`);
      });
    });

    return lines.join('\n');
  }
}
