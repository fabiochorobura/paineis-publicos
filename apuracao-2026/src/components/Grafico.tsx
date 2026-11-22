import ChartModulo from 'react-apexcharts';

/**
 * react-apexcharts é CommonJS: no Vite 8 o import padrão às vezes chega como o módulo inteiro ({ default }),
 * e o React recusa um objeto como componente. Aqui sai sempre o componente.
 */
const Chart = ((ChartModulo as unknown as { default?: typeof ChartModulo }).default ?? ChartModulo) as typeof ChartModulo;

export default Chart;
