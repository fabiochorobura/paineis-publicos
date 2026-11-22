import { useEffect, useState } from 'react';
import { Alert, AlertTitle, Box, Button, useMediaQuery } from '@mui/material';
import { useEleicao } from '../context/EleicaoContext';

/** 17h de Brasília do dia da eleição = 20h UTC */
const FECHAMENTO: Record<1 | 2, number> = {
  1: Date.UTC(2026, 9, 4, 20, 0, 0),
  2: Date.UTC(2026, 9, 25, 20, 0, 0),
};

function useFaltam(alvo: number) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const ms = alvo - agora;
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3.6e6);
  const m = Math.floor((ms % 3.6e6) / 6e4);
  const s = Math.floor((ms % 6e4) / 1000);
  return `${h}h ${String(m).padStart(2, '0')}min ${String(s).padStart(2, '0')}s`;
}

export default function StatusBanner() {
  const { modo, setModo, status, erro, atualizar, turno } = useEleicao();
  const faltam = useFaltam(FECHAMENTO[turno]);
  // celular: aviso de uma linha só, sem o texto explicativo
  const celular = useMediaQuery('(max-width:599px)');
  const sxAviso = celular
    ? {
        mb: 1.5,
        py: 0,
        px: 1.25,
        alignItems: 'center',
        '& .MuiAlert-icon': { mr: 1, py: 0.75 },
        '& .MuiAlert-message': { py: 0.75, fontSize: 13 },
        '& .MuiAlert-action': { pt: 0, mr: -0.5 },
      }
    : { mb: 3 };

  return (
    <Box pt={{ xs: 1.5, sm: 2.5 }}>
      {modo === 'simulacao' && (
        <Alert
          severity="warning"
          sx={sxAviso}
          action={
            celular ? undefined : (
              <Button color="inherit" size="small" onClick={() => setModo('oficial')}>
                Ver dados oficiais
              </Button>
            )
          }
        >
          {celular ? (
            <b>Simulação · números fictícios</b>
          ) : (
            <>
              <AlertTitle sx={{ fontWeight: 700 }}>Modo simulação</AlertTitle>
              Candidatos, partidos e números são <b>fictícios</b> — servem só para testar o painel.
            </>
          )}
        </Alert>
      )}
      {modo === 'oficial' && status === 'aguardando' && (
        <Alert
          severity="info"
          sx={sxAviso}
        >
          {celular ? (
            <b>
              {faltam
                ? `Urnas fecham às 17h (Brasília) · faltam ${faltam}`
                : 'Aguardando os primeiros números do TSE'}
            </b>
          ) : (
            <>
              <AlertTitle sx={{ fontWeight: 700 }}>
                Conectado ao TSE · aguardando o início da apuração
              </AlertTitle>
              {faltam
                ? `As urnas fecham às 17h (horário de Brasília) — faltam ${faltam}. `
                : 'As urnas já fecharam; os primeiros números aparecem assim que o TSE publicar. '}
              Pode deixar esta página aberta: ela se atualiza sozinha.
            </>
          )}
        </Alert>
      )}
      {modo === 'oficial' && status === 'erro' && (
        <Alert
          severity="error"
          sx={sxAviso}
          action={
            celular ? undefined : (
              <Button color="inherit" size="small" onClick={atualizar}>
                Tentar de novo
              </Button>
            )
          }
        >
          {celular ? (
            <b>Sem conexão com o TSE · tentando de novo</b>
          ) : (
            <>
              <AlertTitle sx={{ fontWeight: 700 }}>Não foi possível falar com o TSE</AlertTitle>
              Verifique sua internet. Tentaremos novamente automaticamente.{' '}
              {erro && <small>({erro})</small>}
            </>
          )}
        </Alert>
      )}
    </Box>
  );
}
