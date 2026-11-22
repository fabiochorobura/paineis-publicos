/**
 * Contador de pessoas online: cada aba manda um sinal a cada 30s para /online (atendido
 * pelo serviço eleicao-coletor no servidor), que responde quantas abas distintas
 * sinalizaram no último minuto e meio.
 */
import { useEffect, useState } from 'react';

const INTERVALO_MS = 30_000;

function idDaAba() {
  try {
    let id = sessionStorage.getItem('idOnline');
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem('idOnline', id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2, 12);
  }
}

/** pessoas conectadas agora; null enquanto o servidor não responde (o contador fica escondido) */
export function useOnline(): number | null {
  const [online, setOnline] = useState<number | null>(null);
  useEffect(() => {
    const id = idDaAba();
    let ac = new AbortController();
    const sinal = () => {
      ac.abort();
      ac = new AbortController();
      fetch(`${import.meta.env.BASE_URL}online?id=${id}`, { cache: 'no-store', signal: ac.signal })
        .then((r) => (r.ok ? (r.json() as Promise<{ online: number }>) : Promise.reject(new Error(String(r.status)))))
        .then((j) => setOnline(j.online))
        .catch(() => undefined);
    };
    sinal();
    const t = window.setInterval(sinal, INTERVALO_MS);
    return () => {
      window.clearInterval(t);
      ac.abort();
    };
  }, []);
  return online;
}
