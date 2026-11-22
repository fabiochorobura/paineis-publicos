// Painel do poder de compra: dados anuais e gráficos em SVG puro, sem biblioteca. Desenha dentro de #painel,
// que a página React monta com a marcação de painel.html.
let iniciado = false;

export function iniciarPainel() {
  if (iniciado) return;
  iniciado = true;
  const DATA = [{"y":1940,"w":2438.07,"m":null,"f":9.31,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1941,"w":2222.41,"m":null,"f":11.28,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1942,"w":1995.3,"m":null,"f":15.72,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1943,"w":1959.61,"m":null,"f":19.21,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1944,"w":2069.13,"m":null,"f":37.38,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1945,"w":1667.18,"m":null,"f":15.05,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1946,"w":1462.96,"m":null,"f":18.97,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1947,"w":1117.79,"m":null,"f":23.27,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1948,"w":1032.54,"m":null,"f":3.27,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1949,"w":1049.22,"m":null,"f":4.23,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1950,"w":990.98,"m":null,"f":3.72,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1951,"w":915.22,"m":null,"f":11.27,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1952,"w":2456.78,"m":null,"f":27.16,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1953,"w":2023.4,"m":null,"f":19.23,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1954,"w":2459.49,"m":null,"f":22.57,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1955,"w":2761.91,"m":null,"f":18.44,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1956,"w":2805.91,"m":null,"f":26.46,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1957,"w":3050.75,"m":null,"f":13.74,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1958,"w":2653.96,"m":null,"f":22.6,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1959,"w":2971.02,"m":null,"f":42.7,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":32.53},{"y":1960,"w":2494.72,"m":null,"f":32.2,"p":null,"c":44.6,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":29.4},{"y":1961,"w":2773.93,"m":null,"f":43.51,"p":null,"c":35.79,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":28.51},{"y":1962,"w":2371.86,"m":null,"f":61.73,"p":null,"c":59.52,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":45.48},{"y":1963,"w":2089.55,"m":null,"f":80.53,"p":null,"c":99.17,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":57.98},{"y":1964,"w":2142.2,"m":null,"f":85.6,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":null},{"y":1965,"w":2058.07,"m":null,"f":41.2,"p":null,"c":null,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":36.3},{"y":1966,"w":1757.95,"m":null,"f":46.29,"p":null,"c":76.55,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":50.35},{"y":1967,"w":1656.66,"m":null,"f":25.33,"p":null,"c":9.51,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":44.11},{"y":1968,"w":1621.24,"m":null,"f":25.22,"p":null,"c":25.19,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":44.75},{"y":1969,"w":1557.55,"m":null,"f":22.58,"p":null,"c":34.56,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":50.02},{"y":1970,"w":1583.31,"m":null,"f":17.46,"p":null,"c":4.28,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":43.47},{"y":1971,"w":1516.38,"m":null,"f":20.6,"p":null,"c":32.51,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":47.79},{"y":1972,"w":1490.76,"m":null,"f":17.46,"p":null,"c":38.17,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":55.42},{"y":1973,"w":1367.86,"m":null,"f":13.97,"p":null,"c":39.57,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":66.64},{"y":1974,"w":1247.28,"m":null,"f":33.05,"p":null,"c":32.72,"e":null,"s":17.27,"q":null,"a":null,"h":null,"wn":0.0,"cp":66.46},{"y":1975,"w":1307.35,"m":null,"f":29.26,"p":null,"c":25.05,"e":null,"s":21.86,"q":null,"a":null,"h":null,"wn":0.0,"cp":64.77},{"y":1976,"w":1298.72,"m":null,"f":38.07,"p":null,"c":40.17,"e":null,"s":41.15,"q":null,"a":null,"h":null,"wn":0.0,"cp":62.98},{"y":1977,"w":1350.83,"m":null,"f":41.1,"p":null,"c":35.38,"e":null,"s":41.94,"q":null,"a":null,"h":null,"wn":0.0,"cp":59.19},{"y":1978,"w":1394.88,"m":null,"f":39.91,"p":null,"c":44.76,"e":null,"s":46.4,"q":null,"a":null,"h":null,"wn":0.0,"cp":60.76},{"y":1979,"w":1395.88,"m":null,"f":67.19,"p":null,"c":87.65,"e":null,"s":42.57,"q":null,"a":null,"h":null,"wn":0.0,"cp":60.65},{"y":1980,"w":1409.87,"m":null,"f":84.77,"p":99.28,"c":112.77,"e":null,"s":46.35,"q":null,"a":null,"h":null,"wn":0.0,"cp":65.38},{"y":1981,"w":1434.94,"m":null,"f":90.87,"p":95.65,"c":59.22,"e":null,"s":89.27,"q":null,"a":null,"h":null,"wn":0.0,"cp":50.52},{"y":1982,"w":1500.16,"m":null,"f":94.63,"p":104.8,"c":107.49,"e":null,"s":119.35,"q":null,"a":null,"h":null,"wn":0.0,"cp":53.05},{"y":1983,"w":1277.88,"m":null,"f":164.09,"p":164.0,"c":214.73,"e":null,"s":199.73,"q":null,"a":null,"h":null,"wn":0.0,"cp":68.89},{"y":1984,"w":1178.38,"m":null,"f":178.56,"p":215.28,"c":194.54,"e":null,"s":255.51,"q":null,"a":null,"h":null,"wn":0.0,"cp":69.59},{"y":1985,"w":1206.09,"m":null,"f":228.22,"p":242.25,"c":267.28,"e":null,"s":276.53,"q":null,"a":null,"h":null,"wn":0.0,"cp":70.95},{"y":1986,"w":1166.96,"m":null,"f":68.08,"p":79.66,"c":83.98,"e":null,"s":null,"q":null,"a":null,"h":null,"wn":0.0,"cp":97.41},{"y":1987,"w":832.65,"m":null,"f":367.12,"p":363.41,"c":242.3,"e":null,"s":353.0,"q":null,"a":null,"h":null,"wn":0.0,"cp":74.47},{"y":1988,"w":866.6,"m":null,"f":891.67,"p":980.22,"c":1092.73,"e":null,"s":1057.69,"q":null,"a":null,"h":null,"wn":0.0,"cp":79.1},{"y":1989,"w":923.03,"m":null,"f":1636.61,"p":1972.91,"c":1561.67,"e":null,"s":2407.08,"q":null,"a":null,"h":null,"wn":0.0,"cp":67.41},{"y":1990,"w":674.01,"m":null,"f":1639.08,"p":1620.97,"c":1386.08,"e":null,"s":1153.22,"q":null,"a":null,"h":null,"wn":0.0,"cp":89.35},{"y":1991,"w":697.13,"m":null,"f":458.61,"p":472.69,"c":542.66,"e":null,"s":536.89,"q":null,"a":null,"h":null,"wn":0.02,"cp":120.82},{"y":1992,"w":608.06,"m":null,"f":1129.45,"p":1119.09,"c":1073.87,"e":null,"s":1549.37,"q":null,"a":null,"h":null,"wn":0.19,"cp":114.07},{"y":1993,"w":674.94,"m":null,"f":2490.99,"p":2477.15,"c":2746.14,"e":null,"s":3060.01,"q":null,"a":null,"h":null,"wn":6.82,"cp":90.37},{"y":1994,"w":576.12,"m":null,"f":941.25,"p":916.43,"c":1318.05,"e":null,"s":1153.6,"q":90.11,"a":null,"h":null,"wn":70.0,"cp":124.89},{"y":1995,"w":563.07,"m":null,"f":23.17,"p":22.41,"c":4.69,"e":41.76,"s":53.08,"q":73.61,"a":null,"h":null,"wn":100.0,"cp":91.52},{"y":1996,"w":571.75,"m":null,"f":10.04,"p":9.56,"c":1.22,"e":11.07,"s":27.41,"q":67.19,"a":null,"h":null,"wn":112.0,"cp":82.71},{"y":1997,"w":580.83,"m":null,"f":4.83,"p":5.22,"c":6.13,"e":11.94,"s":24.77,"q":63.85,"a":null,"h":null,"wn":120.0,"cp":81.93},{"y":1998,"w":608.06,"m":null,"f":-1.79,"p":1.66,"c":3.83,"e":3.82,"s":28.79,"q":62.81,"a":null,"h":null,"wn":130.0,"cp":78.53},{"y":1999,"w":612.91,"m":null,"f":8.64,"p":8.94,"c":9.67,"e":17.67,"s":25.59,"q":57.66,"a":null,"h":null,"wn":136.0,"cp":82.32},{"y":2000,"w":629.83,"m":null,"f":4.38,"p":5.97,"c":6.77,"e":11.56,"s":17.45,"q":54.41,"a":3.94,"h":null,"wn":151.0,"cp":79.17},{"y":2001,"w":681.73,"m":null,"f":7.13,"p":7.67,"c":7.58,"e":16.77,"s":17.32,"q":50.53,"a":2.42,"h":null,"wn":180.0,"cp":71.44},{"y":2002,"w":697.72,"m":null,"f":9.92,"p":12.53,"c":23.43,"e":9.16,"s":19.16,"q":44.9,"a":0.46,"h":null,"wn":200.0,"cp":79.36},{"y":2003,"w":703.94,"m":null,"f":8.17,"p":9.3,"c":3.82,"e":20.23,"s":23.33,"q":41.08,"a":1.01,"h":null,"wn":240.0,"cp":68.66},{"y":2004,"w":731.17,"m":null,"f":6.57,"p":7.6,"c":4.5,"e":10.16,"s":16.24,"q":38.18,"a":13.66,"h":null,"wn":260.0,"cp":66.23},{"y":2005,"w":785.49,"m":null,"f":4.53,"p":5.69,"c":6.52,"e":3.74,"s":19.04,"q":36.13,"a":3.24,"h":null,"wn":300.0,"cp":61.14},{"y":2006,"w":908.68,"m":null,"f":2.54,"p":3.14,"c":-0.75,"e":1.25,"s":15.08,"q":35.02,"a":0.92,"h":null,"wn":350.0,"cp":52.01},{"y":2007,"w":958.69,"m":null,"f":4.38,"p":4.46,"c":17.9,"e":-3.63,"s":11.85,"q":33.53,"a":1.76,"h":null,"wn":380.0,"cp":56.48},{"y":2008,"w":981.3,"m":null,"f":6.16,"p":5.9,"c":11.58,"e":-1.49,"s":12.48,"q":31.66,"a":-2.25,"h":null,"wn":415.0,"cp":57.71},{"y":2009,"w":1057.89,"m":null,"f":3.65,"p":4.31,"c":-4.72,"e":4.97,"s":9.92,"q":30.35,"a":-3.6,"h":21.58,"wn":465.0,"cp":49.07},{"y":2010,"w":1104.59,"m":null,"f":6.4,"p":5.91,"c":16.2,"e":1.54,"s":9.78,"q":28.66,"a":-1.04,"h":23.99,"wn":510.0,"cp":51.99},{"y":2011,"w":1104.76,"m":null,"f":5.81,"p":6.5,"c":4.57,"e":9.05,"s":11.62,"q":26.91,"a":-2.87,"h":26.96,"wn":545.0,"cp":50.88},{"y":2012,"w":1191.13,"m":2684.49,"f":5.1,"p":5.84,"c":9.97,"e":2.29,"s":8.48,"q":25.42,"a":-5.7,"h":15.78,"wn":622.0,"cp":49.02},{"y":2013,"w":1221.37,"m":2760.22,"f":3.88,"p":5.91,"c":7.33,"e":-16.22,"s":8.21,"q":24.01,"a":3.52,"h":13.91,"wn":678.0,"cp":48.27},{"y":2014,"w":1227.55,"m":2818.82,"f":5.2,"p":6.41,"c":8.24,"e":17.92,"s":10.91,"q":22.56,"a":4.63,"h":7.33,"wn":724.0,"cp":48.92},{"y":2015,"w":1205.93,"m":2792.48,"f":11.07,"p":10.67,"c":18.05,"e":38.51,"s":13.29,"q":20.38,"a":4.84,"h":2.51,"wn":788.0,"cp":53.06},{"y":2016,"w":1230.22,"m":2733.45,"f":6.54,"p":6.29,"c":4.96,"e":-4.39,"s":14.03,"q":19.18,"a":0.49,"h":0.41,"wn":880.0,"cp":49.87},{"y":2017,"w":1276.86,"m":2764.84,"f":2.27,"p":2.95,"c":-3.31,"e":9.99,"s":9.96,"q":18.63,"a":-0.83,"h":1.4,"wn":937.0,"cp":45.29},{"y":2018,"w":1261.91,"m":2801.79,"f":3.02,"p":3.75,"c":11.09,"e":8.31,"s":6.42,"q":17.96,"a":0.95,"h":1.79,"wn":954.0,"cp":49.42},{"y":2019,"w":1271.01,"m":2811.89,"f":4.4,"p":4.31,"c":7.44,"e":6.75,"s":5.95,"q":17.22,"a":-0.3,"h":2.26,"wn":998.0,"cp":50.75},{"y":2020,"w":1290.28,"m":2936.36,"f":5.62,"p":4.52,"c":24.67,"e":3.23,"s":2.75,"q":16.47,"a":4.01,"h":3.79,"wn":1045.0,"cp":60.43},{"y":2021,"w":1247.57,"m":2754.88,"f":9.73,"p":10.06,"c":9.35,"e":22.26,"s":4.44,"q":14.97,"a":16.17,"h":4.13,"wn":1100.0,"cp":62.77},{"y":2022,"w":1255.28,"m":2685.9,"f":7.32,"p":5.78,"c":14.6,"e":-9.55,"s":12.38,"q":14.15,"a":8.18,"h":5.06,"wn":1212.0,"cp":65.29},{"y":2023,"w":1310.92,"m":2834.76,"f":3.15,"p":4.62,"c":-3.83,"e":6.07,"s":13.03,"q":13.52,"a":2.37,"h":4.69,"wn":1320.0,"cp":57.65},{"y":2024,"w":1342.66,"m":2953.61,"f":4.68,"p":4.83,"c":10.55,"e":1.9,"s":10.89,"q":12.9,"a":null,"h":6.56,"wn":1412.0,"cp":59.58},{"y":2025,"w":1374.45,"m":3066.25,"f":3.83,"p":4.26,"c":0.55,"e":6.42,"s":14.33,"q":12.37,"a":null,"h":4.56,"wn":1518.0,"cp":55.73},{"y":2026,"w":1411.43,"m":3173.46,"f":2.6,"p":3.95,"c":9.05,"e":0.81,"s":10.5,"q":11.9,"a":null,"h":2.6,"wn":1621.0,"cp":56.91}];
  const D = {}; DATA.forEach(d => D[d.y] = d);
  const yrLabel = y => y === LAST ? y + ' (até ' + LASTLBL + ')' : y;
  const LAST = 2026, LASTLBL = 'set/2026', FZ_LAST = 12201;
  const SERIES = [
    { k: 'w', n: 'Salário mínimo', ax: 'L', s: 1, v: ['bars', 'table', 'acum'], an: 'Salário mínimo (valor vigente)', tip: 'R$ de março/2023, média anual, São Paulo' },
    { k: 'm', n: 'Salário médio', ax: 'L', s: 2, v: ['bars', 'table'], tip: 'Rendimento médio real do trabalho principal, PNAD Contínua, R$ de março/2023 (desde 2012)' },
    { k: 'f', n: 'Inflação IPC-Fipe (SP)', ax: 'R', s: 3, short: 'IPC-Fipe', v: ['bars', 'table'], tip: 'Dez/dez, município de São Paulo' },
    { k: 'p', n: 'Inflação IPCA (IBGE)', ax: 'R', s: 4, short: 'IPCA', v: ['bars', 'table', 'acum'], an: 'Preços (IPCA)', tip: 'Dez/dez, Brasil (desde 1980)' },
    { k: 'c', n: 'Cesta básica (Dieese, SP)', ax: 'R', s: 5, short: 'cesta básica', v: ['bars', 'table', 'acum'], an: 'Cesta básica', tip: 'Variação do custo da cesta, dez/dez (desde 1960)' },
    { k: 'e', n: 'Energia elétrica (tarifa)', ax: 'R', s: 6, short: 'energia', v: ['bars', 'table', 'acum'], an: 'Tarifa de energia', tip: 'Variação da tarifa média por MWh, dez/dez (desde 1995)' },
    { k: 's', n: 'Taxa Selic (no ano)', ax: 'R', s: 7, short: 'Selic', v: ['bars', 'table', 'acum'], an: 'Dívida corrigida pela Selic', tip: 'Selic acumulada no ano (desde 1974)' },
    { k: 'q', n: 'Poder de compra do real', ax: 'R', s: 8, short: 'poder de compra', level: true, v: ['bars', 'table', 'acum'], an: 'Poder de compra de R$ 100', tip: 'Quanto R$ 100 valem hoje, corrigidos pelo IPCA' },
  ];
  const SRC_TITLE = 'Salário mínimo × inflação, juros, energia e poder de compra';
  const SRC_FOOT = 'Fontes: Dieese/Ilmar Ferreira Silva via CNN Brasil; IBGE; Fipe; Dieese; EPE; Banco Central; via Ipeadata.';
  const FONT = "Inter, 'Segoe UI', system-ui, sans-serif";
  const ML = 62, MR = 74, MT = 30, PH = 380, GAP = 1.2, PAD = 1.2, BWMIN = 2.6, BWMAX = 11;
  const mkNF = o => { const f = new Intl.NumberFormat('pt-BR', o); const fn = v => f.format(v); fn.format = fn; return fn; };
  const nf0 = mkNF({ maximumFractionDigits: 0 });
  const nf1 = mkNF({ minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = mkNF({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const root = document.getElementById('painel');
  const $ = id => document.getElementById(id);
  const hash = location.hash;
  const state = { view: 'acum', base: 1994, range: [1940, LAST], scale: 'log',
                  carReal: !/carnom/.test(location.hash), showWage: !/nowage/.test(location.hash), wageRef: 's', on: Object.fromEntries(SERIES.map(s => [s.k, true])) };
  { const v = hash.match(/v=(acum|acess|bars)/); if (v) state.view = v[1];
    if (/linear/.test(hash)) state.scale = 'linear';
    const o = hash.match(/only=([a-z,]+)/); if (o) SERIES.forEach(s => state.on[s.k] = o[1].split(',').includes(s.k)); }

  const pct = x => (x > 0 ? '+' : '') + nf1.format(x) + '%';
  const NICE = [1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
  const niceStep = x => NICE.find(n => n >= x) || x;
  const tlog = x => Math.sign(x) * Math.log10(1 + Math.abs(x));
  const fmtVal = (s, v, long) => v == null ? null : s.ax === 'L' ? 'R$ ' + nf2.format(v) : s.level ? 'R$ ' + nf1.format(v) + (long ? ' de R$ 100' : '') : nf1.format(v) + '%';
  const T = (x, y, a, size, fill, txt, extra = '') => `<text x="${x}" y="${y}" text-anchor="${a}" font-size="${size}" fill="${fill}" font-family="${FONT}" ${extra}>${txt}</text>`;

  function colors() {
    const cs = getComputedStyle(root), g = n => cs.getPropertyValue(n).trim();
    const c = { surface: g('--surface-1'), ink: g('--text-primary'), ink2: g('--text-secondary'), muted: g('--text-muted'), grid: g('--grid'), axis: g('--axis'), hover: g('--hover') };
    SERIES.forEach(s => c['s' + s.s] = g('--s' + s.s)); return c;
  }

  /* ============ gráfico de linhas genérico (um só eixo) ============ */
  function lineChart(c, o) {
    const { W, H, ml, mt, mb, xs, lines } = o; let mr = o.mr;
    // celular: sem espaço para os rótulos na ponta das linhas; as cores já estão nas séries e nos cartões acima
    const rotulos = o.endLabels && W >= 640;
    if (!rotulos && o.endLabels) mr = 24;
    if (rotulos) {
      const cx = document.createElement('canvas').getContext('2d'); cx.font = `600 12.5px ${FONT}`;
      const wmax = Math.max(0, ...lines.map(l => { let li = -1; l.vals.forEach((v, i) => { if (v != null) li = i; }); return li < 0 ? 0 : cx.measureText(l.label(l.vals[li])).width; }));
      mr = Math.max(mr, Math.ceil(wmax) + 27 + 14);
    }
    const n = xs.length, pw = W - ml - mr, ph = H - mt - mb, logS = o.scale === 'log';
    const X = i => ml + (n < 2 ? pw / 2 : i * pw / (n - 1));
    const lo = Math.log10(o.ymin), hi = Math.log10(o.ymax);
    const Y = logS ? (v => mt + ph - (Math.log10(Math.max(v, o.ymin)) - lo) / (hi - lo) * ph) : (v => mt + ph - (v - o.ymin) / (o.ymax - o.ymin) * ph);
    let p = '';
    o.ticks.forEach(v => { const y = Y(v).toFixed(1);
      p += `<line x1="${ml}" x2="${W - mr}" y1="${y}" y2="${y}" stroke="${c.grid}"/>` + T(ml - 8, +y + 4, 'end', 12, c.muted, o.fmtT(v)); });
    (o.refs || []).forEach(r => { const y = Y(r.v).toFixed(1);
      p += `<line x1="${ml}" x2="${W - mr}" y1="${y}" y2="${y}" stroke="${c.axis}" stroke-width="1.6" stroke-dasharray="5 4"/>` + r.end ? T(W - mr - 6, +y - 6, 'end', 11.5, c.ink2, r.label) : T(ml + 6, +y - 6, 'start', 11.5, c.ink2, r.label); });
    const lab = yr => (o.starLast && yr === xs[n - 1]) ? yr + '*' : yr;
    const stepPx = n > 1 ? pw / (n - 1) : pw, step = [1, 2, 5, 10].find(s => s * stepPx >= 42) || 10;
    let lastX = -99;
    xs.forEach((yr, i) => { if (yr % step === 0 || i === 0 && false) { const x = X(i); lastX = x;
      p += `<line x1="${x}" x2="${x}" y1="${mt + ph}" y2="${mt + ph + 5}" stroke="${c.axis}"/>` + T(x, mt + ph + 20, 'middle', 12, c.muted, lab(yr)); } });
    if (xs[n - 1] % step !== 0 && X(n - 1) - lastX >= 46) p += T(X(n - 1), mt + ph + 20, 'middle', 12, c.muted, lab(xs[n - 1]));
    p += `<line x1="${ml}" x2="${W - mr}" y1="${mt + ph}" y2="${mt + ph}" stroke="${c.axis}" stroke-width="1.5"/>`;
    lines.forEach(l => { let d = '', pen = false;
      l.vals.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1); pen = true; });
      p += `<path d="${d}" fill="none" stroke="${l.color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"${l.dash ? ' stroke-dasharray="6 5"' : ''}/>`;
      let li = -1; l.vals.forEach((v, i) => { if (v != null) li = i; });
      if (li >= 0) p += `<circle cx="${X(li).toFixed(1)}" cy="${Y(l.vals[li]).toFixed(1)}" r="4.5" fill="${l.color}" stroke="${c.surface}" stroke-width="2"/>`; });
    // rótulos diretos no fim das linhas, sem sobreposição
    if (rotulos) {
      const it = lines.map(l => { let li = -1; l.vals.forEach((v, i) => { if (v != null) li = i; }); return li < 0 ? null : { y: Y(l.vals[li]), l, txt: l.label(l.vals[li]) }; }).filter(Boolean).sort((a, b) => a.y - b.y);
      for (let i = 1; i < it.length; i++) if (it[i].y - it[i - 1].y < 17) it[i].y = it[i - 1].y + 17;
      const over = it.length ? it[it.length - 1].y - (mt + ph) : 0; if (over > 0) it.forEach(e => e.y -= over);
      it.forEach(e => { p += `<rect x="${W - mr + 12}" y="${e.y - 5}" width="10" height="10" rx="2.5" fill="${e.l.color}"/>` + T(W - mr + 27, e.y + 4, 'start', 12.5, c.ink, e.txt, 'font-weight="600"'); });
    }
    p += `<line class="rule" x1="0" x2="0" y1="${mt}" y2="${mt + ph}" stroke="${c.ink2}" stroke-width="1" visibility="hidden"/>`;
    p += `<rect class="hit" x="${ml}" y="${mt}" width="${pw}" height="${ph + 24}" fill="transparent"/>`;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria || ''}">${p}</svg>`, X, Y, n, W, ml, mr };
  }
  function attachHover(host, g, tipFn) {
    const svg = host.querySelector('svg'), hit = svg.querySelector('.hit'), rule = svg.querySelector('.rule'), tip = host.querySelector('.tip');
    hit.addEventListener('mousemove', ev => {
      const r = svg.getBoundingClientRect(), sx = (ev.clientX - r.left) * (g.W / r.width), pw = g.W - g.ml - g.mr;
      const i = Math.max(0, Math.min(g.n - 1, Math.round((sx - g.ml) / (g.n > 1 ? pw / (g.n - 1) : 1))));
      rule.setAttribute('x1', g.X(i)); rule.setAttribute('x2', g.X(i)); rule.setAttribute('visibility', 'visible');
      tip.innerHTML = tipFn(i); tip.style.display = 'block';
      const br = host.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
      let left = ev.clientX - br.left + 16, top = ev.clientY - br.top - th - 10;
      if (left + tw > br.width) left = ev.clientX - br.left - tw - 16;
      if (top < 0) top = ev.clientY - br.top + 16;
      left = Math.max(0, Math.min(left, br.width - tw)); // celular: o balão não pode sair da tela
      tip.style.left = left + 'px'; tip.style.top = top + 'px';
    });
    hit.addEventListener('mouseleave', () => { tip.style.display = 'none'; rule.setAttribute('visibility', 'hidden'); });
  }
  const logTicks = (min, max) => [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000].filter(v => v >= min && v <= max);

  /* ============ VISÃO: EFEITO ACUMULADO ============ */
  function cumul(B) {
    const ys = []; for (let y = B; y <= LAST; y++) ys.push(y);
    const out = {};
    ['p', 'c', 'e', 's'].forEach(k => { let v = 100, ok = true;
      out[k] = ys.map(y => { if (y === B) return 100; const r = D[y][k]; if (!ok || r == null) { ok = false; return null; } v *= 1 + r / 100; return v; }); });
    out.q = out.p.map(v => v == null ? null : 10000 / v);
    out.w = ys.map((y, i) => out.p[i] == null ? null : (D[y].wn / D[B].wn) / (out.p[i] / 100) * 100);
    return { ys, out };
  }
  const lastOf = a => { let v = null; a.forEach(x => { if (x != null) v = x; }); return v; };

  function renderWage(c, B, ys, out) {
    const wb = D[B].wn, W = Math.max(260, Math.floor($('wageWrap').clientWidth || $('acumWrap').clientWidth || 1000)), H = 400;
    const defs = [['p', 'o IPCA'], ['c', 'a cesta básica'], ['e', 'a energia'], ['s', 'a Selic']].filter(([k]) => state.on[k]);
    const lw = [{ color: c.s1, name: 'Salário mínimo vigente (o que foi)', vals: ys.map(y => D[y].wn), label: v => 'Vigente · R$ ' + nf0(v) }].concat(defs.map(([k, n]) => {
      const sd = SERIES.find(x => x.k === k);
      return { color: c['s' + sd.s], dash: true, name: 'Esperado se só acompanhasse ' + n, vals: out[k].map(v => v == null ? null : wb * v / 100), label: v => 'Esperado ' + (k === 'p' ? '(IPCA)' : k === 'c' ? '(cesta)' : k === 'e' ? '(energia)' : '(Selic)') + ' · R$ ' + nf0(v) }; }));
    $('wageSub').innerHTML = `A linha sólida é o salário mínimo realmente vigente em dezembro de cada ano. As tracejadas são o <b>salário mínimo esperado</b>: quanto ele valeria se, partindo de <b>R$ ${nf2(wb)}</b> no fim de ${B}, tivesse apenas acompanhado cada série marcada acima.`;
    const all = lw.flatMap(l => l.vals).filter(v => v != null), mn = Math.min(...all), mx = Math.max(...all);
    let ymin, ymax, ticks;
    if (state.scale === 'log') { const lt = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
      ymin = [...lt].reverse().find(v => v <= mn) || 10; ymax = lt.find(v => v >= mx) || mx; ticks = lt.filter(v => v >= ymin && v <= ymax); }
    else { const st = niceStep(mx / 6); ymin = 0; ymax = Math.ceil(mx / st) * st; ticks = Array.from({ length: Math.round(ymax / st) + 1 }, (_, i) => i * st); }
    const g = lineChart(c, { W, H, ml: 62, mr: 100, mt: 18, mb: 34, xs: ys, lines: lw, scale: state.scale, ymin, ymax, ticks, fmtT: v => 'R$ ' + nf0(v), endLabels: true, starLast: true, aria: 'Salário mínimo vigente e salário mínimo esperado' });
    $('wageSvg').innerHTML = g.svg;
    attachHover($('wageWrap'), g, i => `<div class="yr">${yrLabel(ys[i])}</div>` + lw.map(l => { const v = l.vals[i];
      return `<div class="row"><i class="sw" style="background:${l.color}"></i><span class="lbl">${l.name}</span><span class="val${v == null ? ' na' : ''}">${v == null ? 'sem dado' : 'R$ ' + nf0(v)}</span></div>`; }).join(''));
  }

  function renderAcum() {
    const c = colors(), B = state.base, { ys, out } = cumul(B);
    renderWage(c, B, ys, out);
    const A = SERIES.filter(s => s.an && state.on[s.k]);
    const val = k => lastOf(out[k]);
    // frase principal
    const q = val('q'), p = val('p');
    $('headline').innerHTML = `Desde o fim de <b>${B}</b>, o que custava <b>R$ 100</b> passou a custar <b>R$ ${nf0(p)}</b> (IPCA). Em outras palavras: <b>R$ 100 de ${B} compram hoje o que só R$ ${nf1(q)} compravam</b> — o real perdeu <b>${nf0(100 - q)}%</b> do poder de compra.`;
    // cartões
    const tile = s => { const v = val(s.k);
      if (v == null) return `<div class="tile"><div class="t"><i class="sw" style="background:var(--s${s.s})"></i>${s.an}</div><div class="big">—</div><div class="small">sem dado nesse período</div></div>`;
      let big, small;
      if (s.k === 'q') { big = `R$ ${nf1(v)}`; small = `é o que R$ 100 de ${B} valem hoje (−${nf0(100 - v)}%)`; }
      else if (s.k === 'w') { big = `R$ ${nf0(D[LAST].wn)}`; small = `salário mínimo atual (era R$ ${nf2(D[B].wn)} no fim de ${B}); poder de compra: ${pct(v - 100)} descontada a inflação`; }
      else if (s.k === 's') { big = `R$ ${nf0(v)}`; small = `R$ 100 corrigidos pela Selic (${pct(v - 100)})`; }
      else { big = `R$ ${nf0(v)}`; small = `o que custava R$ 100 em ${B} (${pct(v - 100)})` + (s.k !== 'p' ? (v > p ? ' — <b>subiu mais que o IPCA</b>' : ' — subiu menos que o IPCA') : ''); }
      return `<div class="tile"><div class="t"><i class="sw" style="background:var(--s${s.s})"></i>${s.an}</div><div class="big">${big}</div><div class="small">${small}</div></div>`; };
    $('tiles').innerHTML = A.map(tile).join('');
    // gráfico
    const host = $('acumSvg'), W = Math.max(260, Math.floor($('acumWrap').clientWidth || 1000)), H = 470;
    // salário mínimo em R$ de verdade (vigente em dezembro; em 2026, o atual), na mesma unidade do "esperado" tracejado
    const ls = A.map(s => ({ color: c['s' + s.s], name: s.an, vals: s.k === 'w' ? ys.map(y => D[y].wn) : out[s.k], key: s.k,
      label: v => s.an + ' · ' + (s.k === 'q' ? 'R$ ' + nf1(v) : s.k === 'w' ? 'R$ ' + nf0(v) : 'R$ ' + nf0(v)) }));
    if (!ls.length) { host.innerHTML = '<div class="empty">Marque pelo menos uma série.</div>'; return; }
    const all = ls.flatMap(l => l.vals).filter(v => v != null), mn = Math.min(...all, 100), mx = Math.max(...all, 100);
    let ymin, ymax, ticks;
    if (state.scale === 'log') { const lt = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
      ymin = [...lt].reverse().find(v => v <= mn) || 1; ymax = lt.find(v => v >= mx) || mx; ticks = logTicks(ymin, ymax); }
    else { const st = niceStep(mx / 6); ymin = 0; ymax = Math.ceil(mx / st) * st; ticks = Array.from({ length: Math.round(ymax / st) + 1 }, (_, i) => i * st); }
    const wb0 = D[B].wn, REF = { p: ['IPCA', 'o IPCA'], c: ['cesta', 'a cesta básica'], e: ['energia', 'a energia'], s: ['Selic', 'a Selic'] }[state.wageRef];
    if (state.showWage) ls.push({ color: c.s1, dash: true, key: 'wc', name: 'Salário mínimo esperado (se só acompanhasse ' + REF[1] + ')', vals: out[state.wageRef].map(v => v == null ? null : wb0 * v / 100),
      label: v => 'Salário mínimo esperado (' + REF[0] + ') · R$ ' + nf0(v) });
    const g = lineChart(c, { W, H, ml: 58, mr: 100, mt: 22, mb: 34, xs: ys, lines: ls, scale: state.scale, ymin, ymax, ticks, fmtT: v => nf0(v), endLabels: true, starLast: true,
      refs: [{ v: 100, end: true, label: `base: R$ 100 no fim de ${B}` }], aria: 'Evolução acumulada desde o ano-base' });
    host.innerHTML = g.svg; host.style.position = 'relative';
    attachHover($('acumWrap'), g, i => `<div class="yr">${yrLabel(ys[i])}</div>` + ls.map(l => { const v = l.vals[i];
      return `<div class="row"><i class="sw" style="background:${l.color}"></i><span class="lbl">${l.name}</span><span class="val${v == null ? ' na' : ''}">${v == null ? 'sem dado' : (l.key === 'wc' || l.key === 'w' ? 'R$ ' + nf0(v) + ' <span style="font-weight:400;color:var(--text-muted)">de salário</span>' : 'R$ ' + (l.key === 'q' ? nf1(v) : nf0(v)))}</span></div>`; }).join('') +
      `<div class="note">Valores = quanto R$ 100 de ${B} viraram até ${ys[i]}` + `. ${A.some(s => s.k === 'w') ? `O <b>salário mínimo</b> está em R$: o valor vigente${state.showWage ? ', e a tracejada é o <b>esperado</b>' : ''}, ambos partindo de R$ ${nf2(wb0)} (por isso começam abaixo da base 100).` : state.showWage ? `A linha tracejada é o <b>salário mínimo esperado, em R$</b>: parte de R$ ${nf2(wb0)} (por isso começa abaixo da base 100) e termina no valor do rótulo.` : ''}</div>`);
    const wb = D[B].wn, wa = D[LAST].wn;
    const scen = [['p', 'Os preços (IPCA)'], ['c', 'A cesta básica'], ['e', 'A tarifa de energia'], ['s', 'A Selic (juros)']].map(([k, n]) => {
      const m = val(k), sw = `<i class="sw" style="background:var(--s${SERIES.find(x => x.k === k).s})"></i>`;
      if (m == null) return `<tr><td>${sw}${n}</td><td colspan="3" style="text-align:left;color:var(--text-muted)">sem dado nesse período</td></tr>`;
      const f = m / 100, tgt = wb * f, ratio = wa / tgt;
      return `<tr><td>${sw}${n}</td><td>×${nf2(f)}</td><td><b>R$ ${nf0(tgt)}</b></td><td>R$ ${nf0(wa)} — <b>${ratio >= 1 ? nf1(ratio) + '× acima' : nf0((1 - ratio) * 100) + '% abaixo'}</b></td></tr>`; }).join('');
    $('scen').innerHTML = `<h3>Salário mínimo esperado, se tivesse apenas acompanhado…</h3><p>Partindo de R$ ${nf2(wb)} (salário mínimo vigente no fim de ${B}) e aplicando só o fator de cada série até ${LASTLBL}.</p>` +
      `<table><thead><tr><th>…acompanhado</th><th>Fator desde ${B}</th><th>Salário mínimo esperado em ${LASTLBL}</th><th>Valor real em ${LASTLBL}</th></tr></thead><tbody>${scen}</tbody></table>`;
    $('acumNote').innerHTML = `<b>Como ler:</b> todas as linhas começam em R$ 100 no fim de ${B} e estão na mesma unidade, então a que sobe mais rápido é a que mais pesou. ` +
      (state.scale === 'log' ? 'O eixo é logarítmico (cada linha de grade é ~2× ou 2,5× a anterior), senão a Selic esmagaria o resto; os valores nos rótulos são os reais. ' : '') +
      'A linha do poder de compra cai porque é o inverso dos preços. As duas linhas azuis do salário mínimo estão em R$: a sólida é o valor vigente em dezembro de cada ano (em 2026, o atual) e a tracejada é o valor esperado.';
  }

  /* ============ VISÃO: CASA, CARRO E CESTA ============ */
  const U_ACRIT = 'https://acritica.net/esportes/automobilismo/carro-popular-deveria-custar-r-60-mil-para-caber-na-renda-do-brasileiro-aponta-estudo/';
  const U_CNN = 'https://www.cnnbrasil.com.br/auto/carro-mais-barato-do-brasil-triplicou-de-preco-em-10-anos-compare-valores/';
  const U_MOTOR = 'https://www.motoragora.com.br/quantos-salarios-minimos-custa-o-carro-zero-km-mais-barato-do-brasil/';
  const U_EXAME = 'https://exame.com/economia/quantos-salarios-minimos-vale-um-carro-popular-valor-quase-dobra-em-4-anos/';
  // preços de lista do carro mais barato (versão de entrada) lidos nas próprias reportagens; sm = salário mínimo vigente na época
  const CARS = [
    { y: 2013, m: 'Fiat Uno Mille', p: 23900, sm: 678, src: 'Bright Consulting, via A Crítica (19/08/2026)', url: U_ACRIT },
    { y: 2015, m: 'Fiat Palio Fire (versão mais básica)', p: 27590, sm: 788, src: 'CNN Brasil (10/10/2025)', url: U_CNN },
    { y: 2017, m: 'Renault Kwid (entrada)', p: 29990, sm: 937, src: 'Motor Agora (23/05/2023)', url: U_MOTOR },
    { y: 2019, m: 'Renault Kwid Life (jan/2019)', p: 32290, sm: 998, src: 'FGV/Ibre, via Exame (26/05/2023)', url: U_EXAME },
    { y: 2023, m: 'Renault Kwid Zen (jan/2023)', p: 66496, sm: 1302, src: 'FGV/Ibre, via Exame (26/05/2023)', url: U_EXAME },
    { y: 2025, m: 'Citroën C3 Live 1.0', p: 73490, sm: 1518, src: 'CNN Brasil (10/10/2025)', url: U_CNN },
    { y: 2026, m: 'Fiat Mobi', p: 77290, sm: 1621, src: 'Bright Consulting, via A Crítica (19/08/2026)', url: U_ACRIT },
  ];
  // fator do IPCA (dez a dez) desde o fim do ano-base do carro até o fim do ano de cada preço (2026 = até set)
  const defl = y => { let f = 1; for (let t = CARS[0].y + 1; t <= y; t++) f *= 1 + D[t].p / 100; return f; };
  function carRows(real) {
    const b0 = CARS[0];
    return CARS.map(d => { const f = real ? defl(d.y) : 1; return { d, car: ((d.p / b0.p) / f - 1) * 100, sal: ((d.sm / b0.sm) / f - 1) * 100 }; });
  }
  function drawCar(c) {
    const host = $('carSvg'); if (!host) return;
    const W = Math.max(240, Math.floor(host.clientWidth || 420)), H = 262, ml = 46, mr = 8, mt = 24, mb = 30, ys = []; for (let y = CARS[0].y; y <= LAST; y++) ys.push(y);
    const R = carRows(state.carReal), N = carRows(false), b0 = CARS[0];
    const all = R.flatMap(r => [r.car, r.sal]), lo = Math.min(0, ...all), hi = Math.max(...all), st = niceStep((hi - lo) / 5);
    const ymin = Math.floor(lo / st) * st, ymax = Math.ceil(hi / st) * st;
    const pw = W - ml - mr, ph = H - mt - mb, slot = pw / ys.length, Y = v => mt + ph - (v - ymin) / (ymax - ymin) * ph;
    let g = '';
    for (let v = ymin; v <= ymax + 0.01; v += st) g += `<line x1="${ml}" x2="${W - mr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${Math.abs(v) < 1e-6 ? c.axis : c.grid}" stroke-width="${Math.abs(v) < 1e-6 ? 1.5 : 1}"/>` + T(ml - 7, Y(v) + 4, 'end', 11.5, c.muted, nf0(v) + '%');
    ys.forEach((y, i) => { const k = CARS.findIndex(d => d.y === y), cx = ml + i * slot + slot / 2;
      g += T(cx, H - 10, 'middle', 11, c.muted, (y === ys[0] || y === LAST) ? y : "'" + String(y).slice(2));
      if (k < 0) { g += T(cx, Y(0) - 6, 'middle', 11, c.muted, '·'); return; }
      const d = CARS[k], vc = R[k].car, vs = R[k].sal, bw = Math.min(12, (slot - 6) / 2), top2 = Math.max(vc, vs), bot2 = Math.min(vc, vs);
      g += `<g><title>${d.y}: ${d.m}, R$ ${nf0(d.p)}. Carro: ${pct(N[k].car)} nominal, ${pct(((d.p / b0.p) / defl(d.y) - 1) * 100)} descontada a inflação. Salário mínimo (R$ ${nf0(d.sm)}): ${pct(N[k].sal)} nominal, ${pct(((d.sm / b0.sm) / defl(d.y) - 1) * 100)} descontada a inflação. Fonte: ${d.src}</title>` +
        `<path d="${barPath(cx - bw - 1, bw, Y(0), Y(vc))}" fill="${c.ink2}"/><path d="${barPath(cx + 1, bw, Y(0), Y(vs))}" fill="${c.s1}"/>` +
        (d.y === b0.y ? T(cx, Y(0) - 6, 'middle', 10.5, c.ink2, 'base') : T(cx, top2 >= 0 ? Y(top2) - 6 : Y(bot2) + 13, 'middle', 10.5, c.ink, nf0(vc) + '%', 'font-weight="600"')) + '</g>'; });
    host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Aumento acumulado do preço do carro de entrada e do salário mínimo desde ${b0.y}">${g}</svg>`;
  }

  function priceSM(k, ref, y0) {
    const P = { [LAST]: ref }; for (let y = LAST - 1; y >= y0; y--) P[y] = P[y + 1] / (1 + D[y + 1][k] / 100);
    const ys = [], vs = []; for (let y = y0; y <= LAST; y++) { ys.push(y); vs.push(P[y] / D[y].wn); } return { ys, vs, P };
  }
  function renderAcess() {
    const c = colors();
    const area = Math.max(10, +$('inArea').value || 60);
    const casa = priceSM('h', area * FZ_LAST, 2008);
    const sm13 = D[2013].wn, sm26 = 1621, uno = 23900, mobi = 77290, s13 = uno / sm13, s26 = mobi / sm26;
    const cys = [], cvs = []; for (let y = 1994; y <= LAST; y++) { cys.push(y); cvs.push(D[y].cp); }
    const panels = [
      { id: 'pc', title: 'Cesta básica (São Paulo)', ys: cys, vs: cvs, fmt: v => nf0(v) + '%', fmtT: v => nf0(v) + '%', color: c.s5, unit: '% do salário mínimo', ref: { v: 100, end: true, label: '100% = a cesta custa o salário inteiro' },
        txt: (a, b, w, bst) => `Hoje a cesta consome <b>${nf0(b.v)}%</b> do salário mínimo. O pior momento foi <b>${nf0(w.v)}%</b> (${w.y}); o melhor, <b>${nf0(bst.v)}%</b> (${bst.y}).`,
        note: 'Cesta ÷ salário mínimo de dezembro. É o indicador clássico do Dieese.' },
      { id: 'ph', title: 'Casa (apartamento em São Paulo)', ys: casa.ys, vs: casa.vs, fmt: v => nf0(v) + ' salários', fmtT: v => nf0(v), color: c.ink, unit: 'salários mínimos',
        txt: (a, b, w, bst) => `Um apartamento de ${area} m² custava ~R$ ${nf0(casa.P[a.y] / 1000)} mil em ${a.y} e ~R$ ${nf0(casa.P[b.y] / 1000)} mil em ${b.y}: de ${nf0(a.v)} para <b>${nf0(b.v)} salários mínimos</b> (<b>${b.v > a.v ? 'mais difícil' : 'mais fácil'}: ${pct((b.v / a.v - 1) * 100)}</b>). Pior ano: ${w.y} (${nf0(w.v)}).`,
        note: 'Preço real do m² (R$ 10.703 em jan/2024, informe Fipe) levado para trás pelo Índice FipeZap de venda (anúncios, SP). Conferi 5 meses de 2024–2026: diferença menor que 0,1%.' },
      { id: 'pa', custom: true },
    ];
    const cb = CARS[0], cl = CARS[CARS.length - 1], F = defl(cl.y), infl = (F - 1) * 100;
    const carN = (cl.p / cb.p - 1) * 100, salN = (cl.sm / cb.sm - 1) * 100, carR = (cl.p / cb.p / F - 1) * 100, salR = (cl.sm / cb.sm / F - 1) * 100, rel = ((1 + carN / 100) / (1 + salN / 100) - 1) * 100;
    const carHtml = `<div class="panel"><h3>Carro de entrada (zero km)</h3>
      <p class="verdict">Em ${cb.y} o carro mais barato custava <b>R$ ${nf0(cb.p)}</b>; em ${cl.y}, <b>R$ ${nf0(cl.p)}</b> (<b>+${nf0(carN)}%</b>). O salário mínimo foi de R$ ${nf0(cb.sm)} para R$ ${nf0(cl.sm)} (+${nf0(salN)}%), mas a inflação (IPCA) no período foi de <b>${nf0(infl)}%</b>: <b>descontada a inflação, o salário subiu só ${nf0(salR)}% e o carro, ${nf0(carR)}%</b>.</p>
      <div class="seg" style="margin:2px 0 6px"><span>Mostrar o aumento</span><span class="btns" role="group" aria-label="Base do aumento"><button type="button" data-carmode="real" aria-pressed="${state.carReal}">Descontada a inflação</button><button type="button" data-carmode="nom" aria-pressed="${!state.carReal}">Nominal</button></span></div>
      <div class="chwrap" id="carSvg"></div>
      <div class="keyrow"><span><i class="sw" style="background:var(--text-secondary)"></i>Preço do carro</span><span><i class="sw" style="background:var(--s1)"></i>Salário mínimo</span><span style="color:var(--text-muted)">aumento acumulado desde ${cb.y}, ${state.carReal ? 'descontada a inflação (IPCA)' : 'nominal (sem descontar a inflação)'}; “·” = sem preço verificado</span></div>
      <div class="note">Nominal ou descontada a inflação, a conclusão é a mesma: o carro subiu cerca de <b>${nf0(rel)}%</b> mais que o salário mínimo, porque a inflação pesa nos dois.</div>
      <details class="src"><summary>Ver preços e fontes</summary><div class="scrollx"><table><thead><tr><th>Ano</th><th>Carro (versão de entrada)</th><th>Preço</th><th>Aumento nominal</th><th>Fonte</th></tr></thead><tbody>` +
      CARS.map(d => `<tr><td>${d.y}</td><td>${d.m}</td><td>R$ ${nf0(d.p)}</td><td>${d.y === cb.y ? '—' : pct((d.p / cb.p - 1) * 100)}</td><td><a href="${d.url}" target="_blank" rel="noopener">${d.src}</a></td></tr>`).join('') +
      `</tbody></table></div></details>
      <div class="warn">Preços de lista da versão de entrada, lidos em reportagens e estudos: o modelo mais barato muda (Uno, Palio, Kwid, C3, Mobi) e as fontes diferem, então vale como ordem de grandeza. Faltam 2014, 2016, 2018, 2020–2022 e 2024; se você tiver a tabela completa, eu troco.</div></div>`;
    $('panels').innerHTML = panels.map(p => p.custom ? carHtml : `<div class="panel"><h3>${p.title}</h3><p class="verdict" id="${p.id}v"></p><div class="chwrap" id="${p.id}w"><div id="${p.id}s"></div><div class="tip"></div></div>${p.note ? `<div class="note">${p.note}</div>` : ''}${p.warn ? `<div class="warn">${p.warn}</div>` : ''}</div>`).join('');
    document.querySelectorAll('[data-carmode]').forEach(b => b.addEventListener('click', () => { state.carReal = b.dataset.carmode === 'real'; renderAcess(); }));
    drawCar(c);
    panels.filter(p => !p.custom).forEach(p => {
      const pts = p.ys.map((y, i) => ({ y, v: p.vs[i] })).filter(o => o.v != null);
      const a = pts[0], b = pts[pts.length - 1], w = pts.reduce((m, o) => o.v > m.v ? o : m), bst = pts.reduce((m, o) => o.v < m.v ? o : m);
      $(p.id + 'v').innerHTML = p.txt(a, b, w, bst);
      const mx = Math.max(...pts.map(o => o.v), p.ref ? p.ref.v : 0), st = niceStep(mx / 5), ymax = Math.ceil(mx / st) * st;
      const W = Math.max(240, Math.floor($(p.id + 'w').clientWidth || 420));
      const g = lineChart(c, { W, H: 250, ml: 50, mr: 18, mt: 14, mb: 32, xs: p.ys, lines: [{ color: p.color, vals: p.vs, name: p.title, dash: !!p.proxy }], scale: 'linear', ymin: 0, ymax,
        ticks: Array.from({ length: Math.round(ymax / st) + 1 }, (_, i) => i * st), fmtT: p.fmtT, refs: p.ref ? [p.ref] : [], aria: p.title });
      $(p.id + 's').innerHTML = g.svg;
      attachHover($(p.id + 'w'), g, i => `<div class="yr">${yrLabel(p.ys[i])}</div><div class="row"><span class="lbl">${p.unit}</span><span class="val${p.vs[i] == null ? ' na' : ''}">${p.vs[i] == null ? 'sem dado' : p.fmt(p.vs[i])}</span></div>`);
    });
  }

  /* ============ VISÃO: BARRAS (ano a ano) ============ */
  function geom(availW) {
    const rows = DATA.filter(d => d.y >= state.range[0] && d.y <= state.range[1]);
    const vis = SERIES.filter(s => state.on[s.k]);
    const nv = Math.max(1, vis.length), N = rows.length;
    const L = vis.filter(s => s.ax === 'L'), R = vis.filter(s => s.ax === 'R');
    const lvals = rows.flatMap(d => L.map(s => d[s.k])).filter(v => v != null);
    const rvals = rows.flatMap(d => R.map(s => d[s.k])).filter(v => v != null);
    const LM = Math.max(500, Math.ceil(Math.max(0, ...lvals) / 500) * 500), nL = LM / 500;
    const rmax = Math.max(1, ...rvals), rmin = Math.min(0, ...rvals);
    let TMAX = 2, RM = 1, depth = 0;
    if (state.scale === 'log') { TMAX = Math.max(2, Math.ceil(Math.log10(1 + rmax))); depth = -tlog(rmin) / TMAX * PH; }
    else { RM = niceStep(rmax / nL) * nL; depth = Math.abs(rmin) / RM * PH; }
    depth = Math.ceil(depth);
    const minSlot = nv * BWMIN + (nv - 1) * GAP + 2 * PAD;
    const slot = Math.max(availW / Math.max(N, 1), minSlot);
    const BW = Math.min(BWMAX, (slot - 2 * PAD - (nv - 1) * GAP) / nv);
    const group = nv * BW + (nv - 1) * GAP;
    const YB = MT + PH, H = MT + PH + depth + 42, Wp = Math.round(slot * N);
    const yL = v => YB - v / LM * PH;
    const yR = x => state.scale === 'log' ? YB - tlog(x) / TMAX * PH : YB - x / RM * PH;
    return { rows, vis, nv, N, L, R, LM, nL, RM, TMAX, depth, slot, BW, group, YB, H, Wp, yL, yR };
  }
  function barPath(x, w, y0, yv) {
    const up = yv <= y0; let h = Math.abs(yv - y0); if (h < 0.6) h = 0.6;
    const y1 = up ? y0 - h : y0 + h, r = Math.min(2, w / 2, h), s = up ? 1 : -1, f = n => n.toFixed(2);
    return `M${f(x)},${y0}V${f(y1 + s * r)}Q${f(x)},${f(y1)} ${f(x + r)},${f(y1)}H${f(x + w - r)}Q${f(x + w)},${f(y1)} ${f(x + w)},${f(y1 + s * r)}V${y0}Z`;
  }
  function axisLeftInner(c, g) { let p = ''; for (let v = 0; v <= g.LM; v += 500) p += T(ML - 9, g.yL(v) + 4, 'end', 12, c.muted, nf0.format(v)); return p; }
  function axisRightInner(c, g) {
    let p = '';
    const ticks = state.scale === 'log' ? Array.from({ length: g.TMAX + 1 }, (_, i) => i === 0 ? 0 : Math.pow(10, i)) : Array.from({ length: g.nL + 1 }, (_, i) => i * g.RM / g.nL);
    ticks.forEach(v => { const y = g.yR(v); p += `<line x1="0" x2="5" y1="${y}" y2="${y}" stroke="${c.axis}"/>` + T(10, y + 4, 'start', 12, c.muted, nf0.format(v) + '%'); });
    return p;
  }
  function plotInner(c, g, forExport) {
    const p = [];
    for (let v = 0; v <= g.LM; v += 500) { const y = g.yL(v);
      p.push(`<line x1="0" x2="${g.Wp}" y1="${y}" y2="${y}" stroke="${v === 0 ? c.axis : c.grid}" stroke-width="${v === 0 ? 1.5 : 1}"/>`); }
    if (!forExport) p.push(`<rect id="wash" x="0" y="${MT - 6}" width="${g.slot}" height="${g.H - MT}" fill="${c.hover}" visibility="hidden"/>`);
    g.rows.forEach((d, i) => { const x0 = i * g.slot + (g.slot - g.group) / 2;
      g.vis.forEach((s, j) => { const v = d[s.k]; if (v == null) return;
        p.push(`<path d="${barPath(x0 + j * (g.BW + GAP), g.BW, g.YB, s.ax === 'L' ? g.yL(v) : g.yR(v))}" fill="${c['s' + s.s]}"/>`); }); });
    const yx = g.YB + g.depth, step = [1, 2, 5, 10].find(n => n * g.slot >= 34) || 10;
    g.rows.forEach((d, i) => {
      const show = d.y % step === 0 || (i === g.N - 1 && (d.y - Math.floor(d.y / step) * step) * g.slot >= 34);
      if (!show) return; const x = i * g.slot + g.slot / 2;
      p.push(`<line x1="${x}" x2="${x}" y1="${yx + 4}" y2="${yx + 9}" stroke="${c.axis}"/>` + T(x, yx + 25, 'middle', 12, c.muted, d.y === LAST ? d.y + '*' : d.y)); });
    const label = (i, v, yv, txt) => { const x = i * g.slot + g.slot / 2, a = x < 120 ? 'start' : x > g.Wp - 120 ? 'end' : 'middle';
      p.push(T(x, yv - 8, a, 12, c.ink, txt, `font-weight="600" stroke="${c.surface}" stroke-width="4" paint-order="stroke" stroke-linejoin="round"`)); };
    if (state.on.w) { let bi = -1, bv = -1; g.rows.forEach((d, i) => { if (d.w != null && d.w > bv) { bv = d.w; bi = i; } });
      if (bi >= 0) label(bi, bv, g.yL(bv), 'pico: R$ ' + nf0.format(bv) + ' em ' + g.rows[bi].y); }
    let top = null; g.R.filter(s => !s.level).forEach(s => g.rows.forEach((d, i) => { const v = d[s.k]; if (v != null && (!top || v > top.v)) top = { v, i, s }; }));
    if (top) label(top.i, top.v, g.yR(top.v), 'pico: ' + top.s.short + ' ' + nf0.format(top.v) + '% em ' + g.rows[top.i].y);
    if (!forExport) p.push(`<rect id="hit" x="0" y="0" width="${g.Wp}" height="${g.H}" fill="transparent"/>`);
    return p.join('');
  }
  function barTip(g, i) {
    const d = g.rows[i], prev = D[d.y - 1];
    let h = `<div class="yr">${yrLabel(d.y)}</div>`;
    g.vis.forEach(s => { const t = fmtVal(s, d[s.k], true);
      h += `<div class="row"><i class="sw" style="background:var(--s${s.s})"></i><span class="lbl">${s.n}</span><span class="val${t ? '' : ' na'}">${t || 'sem dado'}</span></div>`; });
    if (state.on.w && prev && prev.w) h += `<div class="note">Variação real do salário mínimo vs. ${prev.y}: <b>${pct((d.w / prev.w - 1) * 100)}</b></div>`;
    return h;
  }
  function renderBars() {
    const c = colors(), avail = Math.max(300, ($('chartbox').clientWidth || 1000) - ML - MR), g = geom(avail);
    $('axL').textContent = g.L.length ? 'Eixo esquerdo · R$ de março de 2023' : '';
    $('axR').textContent = g.R.length ? 'Eixo direito · % (escala ' + (state.scale === 'log' ? 'logarítmica' : 'linear') + ')' : '';
    if (!g.vis.length) { $('axisL').innerHTML = ''; $('axisR').innerHTML = ''; $('plot').innerHTML = '<div class="empty">Marque pelo menos uma série.</div>'; return; }
    const mk = (w, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${g.H}" viewBox="0 0 ${w} ${g.H}" aria-hidden="true">${inner}</svg>`;
    $('axisL').innerHTML = mk(ML, axisLeftInner(c, g)); $('axisR').innerHTML = mk(MR, axisRightInner(c, g));
    $('plot').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${g.Wp}" height="${g.H}" viewBox="0 0 ${g.Wp} ${g.H}" role="img" aria-label="Gráfico de barras agrupadas por ano. Passe o mouse sobre um ano para ver os valores.">${plotInner(c, g, false)}</svg>`;
    const svg = $('plot').firstElementChild, hit = svg.querySelector('#hit'), wash = svg.querySelector('#wash'), tip = $('tip'), box = $('chartbox');
    hit.addEventListener('mousemove', ev => {
      const r = svg.getBoundingClientRect(), i = Math.max(0, Math.min(g.N - 1, Math.floor((ev.clientX - r.left) / g.slot)));
      wash.setAttribute('x', i * g.slot); wash.setAttribute('visibility', 'visible');
      tip.innerHTML = barTip(g, i); tip.style.display = 'block';
      const br = box.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
      let left = ev.clientX - br.left + 16, top = ev.clientY - br.top - th - 12;
      if (left + tw > br.width) left = ev.clientX - br.left - tw - 16; if (top < 0) top = ev.clientY - br.top + 16;
      left = Math.max(0, Math.min(left, br.width - tw)); // celular: o balão não pode sair da tela
      tip.style.left = left + 'px'; tip.style.top = top + 'px';
    });
    hit.addEventListener('mouseleave', () => { tip.style.display = 'none'; wash.setAttribute('visibility', 'hidden'); });
  }

  /* ============ legenda, controles e orquestração ============ */
  function renderLegend() {
    const view = state.view, show = view === 'acess' ? [] : SERIES.filter(s => s.v.includes(view));
    const chip = s => `<label class="chip ${state.on[s.k] ? 'on' : 'off'}" title="${s.tip}"><input type="checkbox" data-k="${s.k}" ${state.on[s.k] ? 'checked' : ''} style="accent-color:var(--s${s.s})"><i class="sw" style="background:var(--s${s.s})"></i>${view === 'acum' ? s.an : s.n}</label>`;
    const L = show.filter(s => s.ax === 'L'), R = show.filter(s => s.ax === 'R');
    let h = '';
    if (show.length) {
      h = '<span class="lg-label">Séries</span>';
      if (view === 'acum') h += show.map(chip).join('') +
        `<label class="chip ${state.showWage ? 'on' : 'off'}" title="Acrescenta ao gráfico de cima uma linha tracejada: o salário mínimo esperado, isto é, quanto ele valeria se, desde o ano-base, tivesse apenas acompanhado a Selic."><input type="checkbox" data-extra="wage" ${state.showWage ? 'checked' : ''}><i class="dashsw"></i>Salário mínimo esperado</label>`;
      else h += (L.length ? '<span class="lg-tag">R$ · eixo esquerdo</span>' + L.map(chip).join('') : '') + (L.length && R.length ? '<span class="lg-sep"></span>' : '') +
                (R.length ? '<span class="lg-tag">% · eixo direito</span>' + R.map(chip).join('') : '');
    }
    $('legend').innerHTML = h;
    $('legend').querySelectorAll('input[data-extra="wage"]').forEach(i => i.addEventListener('change', () => { state.showWage = i.checked; apply(); }));
    $('legend').querySelectorAll('input[data-k]').forEach(i => i.addEventListener('change', () => { state.on[i.dataset.k] = i.checked; apply(); }));
  }
  const HINTS = {
    acum: 'Todas as linhas começam em R$ 100 no fim do ano-base e mostram o efeito composto dos anos. Quanto mais alta a linha, mais aquilo encareceu; a linha vermelha mostra o que R$ 100 passaram a valer. A linha azul sólida é o salário mínimo em R$, do valor de 1994 até o atual; a tracejada (opção “Salário mínimo esperado”) é quanto ele seria se tivesse apenas acompanhado a Selic. As duas partem do salário do fim de 1994 e terminam no valor do rótulo. Mais abaixo, outro gráfico mostra os valores em R$.',
    acess: 'Cesta e casa: quanto do salário mínimo é preciso (quanto maior o número, mais difícil comprar). Carro: quanto o preço subiu desde 2013, ao lado do aumento do salário mínimo, descontada a inflação ou nominal.',
    bars: 'Período total, de 1940 (ano em que o salário mínimo foi criado) até hoje; uma barra por série em cada ano (2026* vai até set/2026). Atenção: com dois eixos e escala logarítmica a inflação parece pequena; para ver o efeito real use “Efeito acumulado”.',
  };
  function apply() {
    document.querySelectorAll('[data-scale]').forEach(b => b.setAttribute('aria-pressed', b.dataset.scale === state.scale));
    document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === state.view));
    document.querySelectorAll('[data-range]').forEach(b => b.setAttribute('aria-pressed', b.dataset.range === state.range.join('-')));
    document.querySelectorAll('[data-base]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.base === state.base));
    const v = state.view, show = (id, on) => $(id).style.display = on ? '' : 'none';
    show('vAcum', v === 'acum'); show('vAcess', v === 'acess'); show('chartArea', v === 'bars');
    show('baseSeg', v === 'acum' || v === 'bars'); show('scaleSeg', v === 'acum' || v === 'bars'); show('dl', v === 'bars');
    show('ctrls', v !== 'acess');
    $('scaleLbl').textContent = v === 'bars' ? 'Escala do eixo direito' : 'Escala do eixo';
    $('hint').textContent = HINTS[v];
    $('pillTxt').textContent = v === 'bars' ? 'Período: total, 1940 até set/2026' : 'Período: Plano Real, 1994 até set/2026';
    $('pillTxt').title = v === 'bars' ? 'Ano a ano: todo o período disponível, de 1940 (criação do salário mínimo) até set/2026; 2026 é parcial.' : 'Do fim de 1994 (Plano Real) até o mês mais recente disponível (set/2026; 2026 é parcial).';
    renderLegend();
    if (v === 'acum') renderAcum(); else if (v === 'acess') renderAcess(); else renderBars();
  }
  document.querySelectorAll('[data-scale]').forEach(b => b.addEventListener('click', () => { state.scale = b.dataset.scale; apply(); }));
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { state.view = b.dataset.view; apply(); }));
  ['inArea'].forEach(id => $(id).addEventListener('input', () => { if (state.view === 'acess') renderAcess(); }));
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply);
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (state.view !== 'table') apply(); }, 150); });

  $('dl').addEventListener('click', () => {
    const c = colors(), g = geom(Math.max(300, $('chartbox').clientWidth - ML - MR));
    if (!g.vis.length) return;
    const TW = ML + g.Wp + MR;
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${g.H}" viewBox="0 0 ${TW} ${g.H}"><rect width="${TW}" height="${g.H}" fill="${c.surface}"/>` +
      `<g>${axisLeftInner(c, g)}</g><g transform="translate(${ML},0)">${plotInner(c, g, true)}</g><g transform="translate(${ML + g.Wp},0)">${axisRightInner(c, g)}</g></svg>`;
    const k = TW > 2200 ? 1 : 1.5, pad = 24, W = Math.max(TW, 900);
    const m = document.createElement('canvas').getContext('2d'); m.font = `13px ${FONT}`;
    const items = g.vis.map(s => ({ s, w: m.measureText(s.n).width + 34 }));
    const lines = []; let cur = [], cw = 0; items.forEach(it => { if (cw + it.w > W - 2 * pad) { lines.push(cur); cur = []; cw = 0; } cur.push(it); cw += it.w; }); if (cur.length) lines.push(cur);
    const top = 86 + lines.length * 24, bottom = 40, img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = W * k; cv.height = (g.H + top + bottom) * k;
      const x = cv.getContext('2d'); x.scale(k, k); x.fillStyle = c.surface; x.fillRect(0, 0, W, g.H + top + bottom);
      x.fillStyle = c.ink; x.font = `650 24px ${FONT}`; x.fillText(SRC_TITLE + ' (' + state.range[0] + '–' + state.range[1] + ')', pad, 38);
      x.fillStyle = c.ink2; x.font = `14px ${FONT}`;
      x.fillText('Eixo esquerdo: R$ de março/2023. Eixo direito: % (escala ' + (state.scale === 'log' ? 'logarítmica' : 'linear') + '). Uma barra por série em cada ano.', pad, 62);
      lines.forEach((ln, li) => { let px = pad; ln.forEach(it => { x.fillStyle = c['s' + it.s.s]; x.beginPath(); x.roundRect(px, 80 + li * 24 + 2, 11, 11, 3); x.fill();
        x.fillStyle = c.ink2; x.font = `13px ${FONT}`; x.fillText(it.s.n, px + 17, 80 + li * 24 + 12); px += it.w; }); });
      x.drawImage(img, 0, top); x.fillStyle = c.ink2; x.font = `12px ${FONT}`; x.fillText(SRC_FOOT, pad, g.H + top + 26);
      cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'salario-minimo-vs-indicadores-' + state.range.join('-') + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  });

  // fechado, o bloco não tem largura: redesenha ao abrir para o gráfico caber nele
  $('wageBlock').addEventListener('toggle', () => { if ($('wageBlock').open && state.view === 'acum') apply(); });
  if (/openwage/.test(hash)) $('wageBlock').open = true;
  apply();
}
