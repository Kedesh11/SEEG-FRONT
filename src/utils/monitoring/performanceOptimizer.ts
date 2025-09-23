// Utilitaire pour optimiser les performances et surveiller la charge IO

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: Map<string, number[]> = new Map();
  private slowQueries: Array<{ query: string; duration: number; timestamp: Date }> = [];

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Mesurer le temps d'exécution d'une fonction
  async measureExecution<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      this.recordMetric(operationName, duration);
      
      // Alerter si l'opération est lente (> 2 secondes)
      if (duration > 2000) {
        this.recordSlowQuery(operationName, duration);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(operationName, duration);
      throw error;
    }
  }

  // Enregistrer une métrique pour une opération
  private recordMetric(operationName: string, duration: number) {
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, []);
    }
    this.metrics.get(operationName)!.push(duration);
  }

  // Enregistrer une requête lente
  private recordSlowQuery(query: string, duration: number) {
    this.slowQueries.push({
      query,
      duration,
      timestamp: new Date()
    });
    
    // Garder seulement les 50 dernières requêtes lentes
    if (this.slowQueries.length > 50) {
      this.slowQueries.shift();
    }
  }

  // Obtenir les statistiques de performance
  getPerformanceStats(): Record<string, { count: number; average: number; min: number; max: number; p95: number }> {
    const stats: Record<string, { count: number; average: number; min: number; max: number; p95: number }> = {};
    
    for (const [operationName, durations] of this.metrics.entries()) {
      if (durations.length > 0) {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        const p95 = this.percentile(durations, 0.95);
        
        stats[operationName] = {
          count: durations.length,
          average: Math.round(avg),
          min: Math.round(min),
          max: Math.round(max),
          p95: Math.round(p95)
        };
      }
    }
    
    return stats;
  }

  // Calculer un percentile sur un tableau de durées
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(p * (sorted.length - 1));
    return sorted[index];
  }

  // Réinitialiser les métriques
  reset() {
    this.metrics.clear();
    this.slowQueries = [];
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();
