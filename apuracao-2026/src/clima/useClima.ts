/**
 * Clima de Sorriso-MT e Corumbiara-RO para o Modo TV (o topo alterna entre as duas).
 *  - Tempo atual e previsão: Open-Meteo (gratuito, sem chave)
 * A API libera CORS, então o navegador consulta direto.
 */
import { useEffect, useState } from 'react';

export interface Cidade {
  nome: string;
  uf: string;
  ibge: string;
  lat: number;
  lon: number;
  fuso: string;
}

export const CIDADES: Cidade[] = [
  {
    nome: 'Sorriso',
    uf: 'MT',
    ibge: '5107925',
    lat: -12.5453,
    lon: -55.7114,
    fuso: 'America/Cuiaba',
  },
  {
    nome: 'Corumbiara',
    uf: 'RO',
    ibge: '1100072',
    lat: -12.9619,
    lon: -60.8867,
    fuso: 'America/Porto_Velho',
  },
];

const ATUALIZA_TEMPO_MS = 10 * 60 * 1000;

export interface Tempo {
  temperatura: number;
  sensacao: number;
  umidade: number;
  vento: number;
  rajada: number;
  codigo: number;
  dia: boolean;
  min: number;
  max: number;
  chanceChuva: number;
  amanha: { codigo: number; min: number; max: number; chanceChuva: number } | null;
}

interface OpenMeteo {
  current: Record<string, number>;
  daily: Record<string, number[]>;
}

async function buscarTempo(cidade: Cidade, signal: AbortSignal): Promise<Tempo> {
  const q = new URLSearchParams({
    latitude: String(cidade.lat),
    longitude: String(cidade.lon),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: cidade.fuso,
    forecast_days: '2',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`, { signal });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const { current: c, daily: d } = (await res.json()) as OpenMeteo;
  return {
    temperatura: c.temperature_2m,
    sensacao: c.apparent_temperature,
    umidade: c.relative_humidity_2m,
    vento: c.wind_speed_10m,
    rajada: c.wind_gusts_10m,
    codigo: c.weather_code,
    dia: c.is_day === 1,
    min: d.temperature_2m_min[0],
    max: d.temperature_2m_max[0],
    chanceChuva: d.precipitation_probability_max[0] ?? 0,
    amanha:
      d.time && (d.weather_code?.length ?? 0) > 1
        ? {
            codigo: d.weather_code[1],
            min: d.temperature_2m_min[1],
            max: d.temperature_2m_max[1],
            chanceChuva: d.precipitation_probability_max[1] ?? 0,
          }
        : null,
  };
}

export interface ClimaCidade {
  cidade: Cidade;
  tempo: Tempo;
}

export function useClima(): ClimaCidade[] {
  const [tempos, setTempos] = useState<Record<string, Tempo>>({});

  useEffect(() => {
    let ac = new AbortController();
    const carregar = () => {
      ac.abort();
      ac = new AbortController();
      const { signal } = ac;
      // cada cidade independente: se uma falhar, mantém o último tempo conhecido dela
      CIDADES.forEach((c) =>
        buscarTempo(c, signal)
          .then((t) => setTempos((atual) => ({ ...atual, [c.ibge]: t })))
          .catch(() => undefined),
      );
    };
    carregar();
    const id = window.setInterval(carregar, ATUALIZA_TEMPO_MS);
    return () => {
      window.clearInterval(id);
      ac.abort();
    };
  }, []);


  return CIDADES.flatMap((cidade) => {
    const tempo = tempos[cidade.ibge];
    if (!tempo) return [];
    return [{ cidade, tempo }];
  });
}

/** Código WMO -> descrição em português */
export function descricaoTempo(codigo: number) {
  if (codigo === 0) return 'Céu limpo';
  if (codigo <= 2) return 'Poucas nuvens';
  if (codigo === 3) return 'Nublado';
  if (codigo <= 48) return 'Neblina';
  if (codigo <= 57) return 'Garoa';
  if (codigo <= 67) return 'Chuva';
  if (codigo <= 77) return 'Neve';
  if (codigo <= 82) return 'Pancadas de chuva';
  if (codigo <= 86) return 'Neve';
  return 'Tempestade';
}
