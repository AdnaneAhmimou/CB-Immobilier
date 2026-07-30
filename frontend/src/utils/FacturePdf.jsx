import { Document, Page, View, Text, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import logo from '../assets/cb_no_bg.png';

// Double-check against the real paperwork — transcribed from a photo, phone number in particular.
const COMPANY = {
  adresse: ['Lot Asmae 2 Appt N°: 45', 'Hay MELK CHEIKH', 'El Jadida 24000 Maroc'],
  telephone: '212 6 23 39 53 93',
  gerant: 'M. BENEZZIDIA',
};

const ACCENT = '#1d4ed8';

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: 'Times-Roman', color: '#1a1a1a' },
  logo: { width: 100, height: 42, objectFit: 'contain', marginBottom: 10 },
  companyBlock: { fontSize: 9, color: '#555', lineHeight: 1.5, marginBottom: 28 },
  title: { fontSize: 32, fontFamily: 'Times-Bold', textAlign: 'center', marginBottom: 32, letterSpacing: 1 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  topLabel: { fontSize: 12, fontFamily: 'Times-Bold' },

  infoLine: { fontSize: 11, marginBottom: 3 },
  infoLabel: { fontFamily: 'Times-Bold' },

  table: { marginTop: 28 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: ACCENT, paddingBottom: 6, marginBottom: 10 },
  th: { fontSize: 10, fontFamily: 'Times-Bold', color: ACCENT, letterSpacing: 0.5 },
  thDesc: { flex: 3 },
  thMontant: { flex: 1, textAlign: 'right' },
  row: { flexDirection: 'row', marginBottom: 14 },
  cellDesc: { flex: 3, fontSize: 11, fontFamily: 'Times-Bold' },
  cellMontant: { flex: 1, fontSize: 11, fontFamily: 'Times-Bold', textAlign: 'right' },

  totals: { marginTop: 24, alignSelf: 'flex-end', width: 220 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 10, color: '#666' },
  totalValue: { fontSize: 10, color: '#666' },
  ttcDivider: { borderTopWidth: 1.5, borderTopColor: ACCENT, marginBottom: 8 },
  ttcRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ttcLabel: { fontSize: 14, fontFamily: 'Times-Bold', color: ACCENT },
  ttcValue: { fontSize: 14, fontFamily: 'Times-Bold', color: ACCENT },

  amountWords: { fontSize: 10, marginTop: 24 },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 32 },
  paymentTitle: { fontSize: 10, fontFamily: 'Times-Bold', color: ACCENT, marginBottom: 6, letterSpacing: 0.5 },
  paymentMode: { fontSize: 10 },
  signature: { alignItems: 'center' },
  signatureTitle: { fontSize: 10, fontFamily: 'Times-BoldItalic', textDecoration: 'underline', marginBottom: 26 },
  signatureName: { fontSize: 10, fontFamily: 'Times-BoldItalic', textDecoration: 'underline' },
});

function money(n) {
  // toLocaleString('fr-FR') uses a narrow no-break space as its thousands separator, which the
  // PDF's built-in font has no glyph for (renders as a stray "/"). Use a plain space instead.
  const [intPart, decPart] = (n || 0).toFixed(2).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped},${decPart} MAD`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

const UNITS_FR = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

// Standard (pre-1990) French spelling: "vingt et un" but "quatre-vingt-un" (no "et" in the 80s/90s).
function twoDigitsFr(n) {
  if (n < 20) return UNITS_FR[n];
  if (n < 70) {
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'][Math.floor(n / 10)];
    const unit = n % 10;
    if (unit === 0) return tens;
    if (unit === 1) return `${tens} et un`;
    return `${tens}-${UNITS_FR[unit]}`;
  }
  if (n < 80) {
    const rem = n - 60; // 11-19
    return rem === 11 ? 'soixante et onze' : `soixante-${UNITS_FR[rem]}`;
  }
  const rem = n - 80; // 0-19
  return rem === 0 ? 'quatre-vingts' : `quatre-vingt-${UNITS_FR[rem]}`;
}

function threeDigitsFr(n) {
  const h = Math.floor(n / 100);
  const rem = n % 100;
  const parts = [];
  if (h > 0) parts.push(h === 1 ? 'cent' : `${UNITS_FR[h]} cent${rem === 0 ? 's' : ''}`);
  if (rem > 0) parts.push(twoDigitsFr(rem));
  return parts.join(' ');
}

function numberToWordsFr(n) {
  if (n === 0) return 'zéro';
  const milliards = Math.floor(n / 1e9);
  const millions = Math.floor((n % 1e9) / 1e6);
  const milliers = Math.floor((n % 1e6) / 1e3);
  const reste = n % 1000;

  const parts = [];
  if (milliards > 0) parts.push(milliards === 1 ? 'un milliard' : `${threeDigitsFr(milliards)} milliards`);
  if (millions > 0) parts.push(millions === 1 ? 'un million' : `${threeDigitsFr(millions)} millions`);
  if (milliers > 0) parts.push(milliers === 1 ? 'mille' : `${threeDigitsFr(milliers)} mille`);
  if (reste > 0) parts.push(threeDigitsFr(reste));
  return parts.join(' ');
}

function amountInWordsFr(amount) {
  const totalCentimes = Math.round((amount || 0) * 100);
  const dirhams = Math.floor(totalCentimes / 100);
  const centimes = totalCentimes % 100;

  const dirhamsWords = numberToWordsFr(dirhams);
  let result = `${dirhamsWords.charAt(0).toUpperCase()}${dirhamsWords.slice(1)} dirham${dirhams > 1 ? 's' : ''}`;
  if (centimes > 0) {
    result += ` et ${numberToWordsFr(centimes)} centime${centimes > 1 ? 's' : ''}`;
  }
  return result;
}

export function FactureDocument({ facture }) {
  const lignes = facture.lignes || [];
  const tvaRates = [...new Set(lignes.map(l => parseFloat(l.tva)))];
  const tvaLabel = tvaRates.length === 1 ? `TVA (${tvaRates[0]}%)` : 'TVA';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Image src={logo} style={styles.logo} />
        <View style={styles.companyBlock}>
          {COMPANY.adresse.map(l => <Text key={l}>{l}</Text>)}
          <Text>téléphone : {COMPANY.telephone}</Text>
        </View>
        <Text style={styles.title}>FACTURE</Text>

        <View style={styles.topRow}>
          <Text style={styles.topLabel}>Le {fmtDate(facture.dateEmission)}</Text>
          <Text style={styles.topLabel}>N° : {facture.numero}</Text>
        </View>

        <Text style={styles.infoLine}><Text style={styles.infoLabel}>CLIENT : </Text>{facture.clientNom}</Text>
        {facture.clientTelephone && <Text style={styles.infoLine}><Text style={styles.infoLabel}>TÉLÉPHONE : </Text>{facture.clientTelephone}</Text>}
        {facture.clientEmail && <Text style={styles.infoLine}><Text style={styles.infoLabel}>EMAIL : </Text>{facture.clientEmail}</Text>}
        {facture.objet && <Text style={styles.infoLine}><Text style={styles.infoLabel}>OBJET : </Text>{facture.objet}</Text>}

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.thDesc]}>DESCRIPTION</Text>
            <Text style={[styles.th, styles.thMontant]}>MONTANT</Text>
          </View>
          {lignes.map((l, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.cellDesc}>{l.description}{parseFloat(l.qte) !== 1 ? ` (x${l.qte})` : ''}</Text>
              <Text style={styles.cellMontant}>{money(parseFloat(l.qte) * parseFloat(l.prixUnitaire))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>{money(facture.totalHT)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{tvaLabel}</Text>
            <Text style={styles.totalValue}>{money(facture.totalTVA)}</Text>
          </View>
          <View style={styles.ttcDivider} />
          <View style={styles.ttcRow}>
            <Text style={styles.ttcLabel}>Coût Total TTC</Text>
            <Text style={styles.ttcValue}>{money(facture.totalTTC)}</Text>
          </View>
        </View>

        <Text style={styles.amountWords}>
          <Text style={styles.infoLabel}>Arrêtée la présente facture à la somme de : </Text>
          {amountInWordsFr(facture.totalTTC)}.
        </Text>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.paymentTitle}>MODALITÉ DE PAIEMENT</Text>
            <Text style={styles.paymentMode}>Mode : Virement bancaire / Chèque</Text>
          </View>
          <View style={styles.signature}>
            <Text style={styles.signatureTitle}>Le Gérant de la Société</Text>
            <Text style={styles.signatureName}>S/ {COMPANY.gerant}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadFacturePdf(facture) {
  const blob = await pdf(<FactureDocument facture={facture} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${facture.numero}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
