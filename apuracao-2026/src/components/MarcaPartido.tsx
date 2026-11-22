import { Box } from '@mui/material';

/** partidos com logo em public/partidos/<SIGLA>.png (sigla sem acento e sem espaço) */
const COM_LOGO = new Set([
  'AVANTE',
  'CIDADANIA',
  'DC',
  'DEMOCRATA',
  'MDB',
  'MISSAO',
  'NOVO',
  'PCB',
  'PCDOB',
  'PCO',
  'PDT',
  'PL',
  'PMB',
  'PODE',
  'PP',
  'PSB',
  'PSD',
  'PSDB',
  'PSOL',
  'PSTU',
  'PT',
  'PV',
  'REDE',
  'REPUBLICANOS',
  'SOLIDARIEDADE',
  'UNIAO',
  'UP',
]);

const chaveLogo = (sigla: string) =>
  sigla.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');

/** Logo do partido; sem logo disponível, o quadradinho na cor do partido. */
export function MarcaPartido({
  sigla,
  cor,
  tamanho = 16,
}: {
  sigla: string;
  cor: string;
  tamanho?: number;
}) {
  const chave = chaveLogo(sigla);
  if (COM_LOGO.has(chave)) {
    return (
      <Box
        component="img"
        src={`${import.meta.env.BASE_URL}partidos/${chave}.png`}
        alt={sigla}
        loading="lazy"
        sx={{
          height: tamanho + 4,
          width: (tamanho + 4) * 1.6,
          objectFit: 'contain',
          flexShrink: 0,
          // fundo branco: os logos foram feitos para fundo claro (tema escuro)
          bgcolor: '#fff',
          borderRadius: '4px',
          p: '1px',
          boxShadow: `inset 0 -3px 0 ${cor}`,
        }}
      />
    );
  }
  return (
    <Box
      sx={{ width: tamanho, height: tamanho, borderRadius: '4px', bgcolor: cor, flexShrink: 0 }}
    />
  );
}
