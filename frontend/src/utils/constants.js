// Konstanta tingkat kegawatdaruratan Triage
export const TRIAGE_PRIORITY = {
  P1_EMERGENCY: {
    code: 'P1',
    label: 'Gawat Darurat (Resusitasi)',
    color: 'red',
  },
  P2_URGENT: {
    code: 'P2',
    label: 'Gawat Tidak Darurat (Emergency)',
    color: 'yellow',
  },
  P3_NON_URGENT: {
    code: 'P3',
    label: 'Tidak Gawat Tidak Darurat (Urgent)',
    color: 'green',
  },
  P0_DECEASED: {
    code: 'P0',
    label: 'Meninggal (Black)',
    color: 'black',
  },
};
