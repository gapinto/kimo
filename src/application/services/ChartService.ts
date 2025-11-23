import { logger } from '../../shared/utils/logger';

/**
 * ChartService
 * Gera gráficos usando QuickChart API (gratuita)
 * Documentação: https://quickchart.io/documentation/
 */
export class ChartService {
  private readonly baseUrl = 'https://quickchart.io/chart';

  /**
   * Gera gráfico de barras de progresso semanal
   */
  generateWeeklyProgressChart(data: {
    labels: string[]; // ['Seg', 'Ter', 'Qua', ...]
    earnings: number[];
    expenses: number[];
    profit: number[];
  }): string {
    const config = {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Ganhos',
            data: data.earnings,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
          {
            label: 'Despesas',
            data: data.expenses,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
          {
            label: 'Lucro',
            data: data.profit,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: 'Progresso Semanal',
          fontSize: 18,
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                callback: (value: number) => `R$ ${value.toFixed(0)}`,
              },
            },
          ],
        },
        legend: {
          display: true,
          position: 'bottom',
        },
      },
    };

    const chartUrl = this.buildUrl(config, { width: 800, height: 500 });
    logger.info('Generated weekly progress chart', { url: chartUrl });
    return chartUrl;
  }

  /**
   * Gera gráfico de linha de evolução de lucro
   */
  generateProfitTrendChart(data: {
    labels: string[]; // Datas
    profit: number[];
    goal?: number; // Meta opcional
  }): string {
    const datasets: any[] = [
      {
        label: 'Lucro Diário',
        data: data.profit,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ];

    // Adicionar linha de meta se fornecida
    if (data.goal) {
      datasets.push({
        label: 'Meta',
        data: Array(data.labels.length).fill(data.goal / 7), // Meta diária
        borderColor: 'rgba(255, 206, 86, 1)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      });
    }

    const config = {
      type: 'line',
      data: {
        labels: data.labels,
        datasets,
      },
      options: {
        title: {
          display: true,
          text: 'Evolução do Lucro',
          fontSize: 18,
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                callback: (value: number) => `R$ ${value.toFixed(0)}`,
              },
            },
          ],
        },
        legend: {
          display: true,
          position: 'bottom',
        },
      },
    };

    const chartUrl = this.buildUrl(config, { width: 800, height: 500 });
    logger.info('Generated profit trend chart', { url: chartUrl });
    return chartUrl;
  }

  /**
   * Gera gráfico de pizza de despesas por tipo
   */
  generateExpensesPieChart(data: {
    labels: string[]; // ['Combustível', 'Manutenção', ...]
    values: number[];
  }): string {
    const config = {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(255, 159, 64, 0.8)',
            ],
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: 'Despesas por Tipo',
          fontSize: 18,
        },
        legend: {
          display: true,
          position: 'right',
        },
        plugins: {
          datalabels: {
            formatter: (value: number, ctx: any) => {
              const sum = ctx.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / sum) * 100).toFixed(1);
              return `${percentage}%`;
            },
            color: '#fff',
            font: {
              weight: 'bold',
              size: 14,
            },
          },
        },
      },
    };

    const chartUrl = this.buildUrl(config, { width: 800, height: 500 });
    logger.info('Generated expenses pie chart', { url: chartUrl });
    return chartUrl;
  }

  /**
   * Gera gráfico de progresso da meta (gauge/medidor)
   */
  generateGoalProgressChart(data: {
    current: number;
    goal: number;
    percentage: number;
  }): string {
    const config = {
      type: 'radialGauge',
      data: {
        datasets: [
          {
            data: [data.percentage],
            backgroundColor: this.getColorByPercentage(data.percentage),
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: `Meta Semanal: ${data.percentage.toFixed(0)}%`,
          fontSize: 20,
        },
        centerPercentage: 80,
        centerArea: {
          text: (val: number) => `R$ ${data.current.toFixed(0)}\nde R$ ${data.goal.toFixed(0)}`,
          fontSize: 24,
          fontColor: '#000',
        },
      },
    };

    const chartUrl = this.buildUrl(config, { width: 600, height: 400 });
    logger.info('Generated goal progress chart', { url: chartUrl });
    return chartUrl;
  }

  /**
   * Constrói URL do QuickChart
   */
  private buildUrl(
    config: any,
    options: { width?: number; height?: number } = {}
  ): string {
    const width = options.width || 800;
    const height = options.height || 500;

    // Encode config as JSON
    const configJson = JSON.stringify(config);
    const encodedConfig = encodeURIComponent(configJson);

    return `${this.baseUrl}?width=${width}&height=${height}&chart=${encodedConfig}`;
  }

  /**
   * Retorna cor baseada na porcentagem de progresso
   */
  private getColorByPercentage(percentage: number): string {
    if (percentage >= 100) return 'rgba(75, 192, 192, 0.8)'; // Verde
    if (percentage >= 70) return 'rgba(255, 206, 86, 0.8)'; // Amarelo
    if (percentage >= 40) return 'rgba(255, 159, 64, 0.8)'; // Laranja
    return 'rgba(255, 99, 132, 0.8)'; // Vermelho
  }
}

