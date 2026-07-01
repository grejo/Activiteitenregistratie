import path from 'path'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type { AftekendocumentData } from '@/lib/aftekendocument.types'

// Absoluut pad naar de PXL-logo op de server (public/-map is niet automatisch
// beschikbaar in `@react-pdf/renderer` server-render).
const PXL_LOGO_PATH = path.join(process.cwd(), 'public', 'pxl-logo.png')

const PXL_BLACK = '#030203'
const PXL_GOLD = '#AE9A64'
const PXL_GRAY = '#f5f5f5'
const PXL_BORDER = '#e0e0e0'

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 9,
    color: PXL_BLACK,
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: PXL_BLACK,
    color: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 40,
    height: 40,
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 8,
    fontStyle: 'italic',
    color: PXL_GOLD,
    marginTop: 2,
  },
  goldBar: { height: 3, backgroundColor: PXL_GOLD, width: '100%' },
  body: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 6,
  },
  card: {
    borderWidth: 1,
    borderColor: PXL_BORDER,
    borderTopWidth: 2,
    borderTopColor: PXL_GOLD,
    borderRadius: 3,
    marginBottom: 8,
  },
  cardTitle: {
    backgroundColor: PXL_BLACK,
    color: '#FFFFFF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardBody: { padding: 8 },
  row: { flexDirection: 'row', marginBottom: 2 },
  label: {
    width: 130,
    fontFamily: 'Helvetica-Bold',
    color: '#555555',
    fontSize: 9,
    textAlign: 'right',
    paddingRight: 6,
  },
  value: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    borderBottomStyle: 'dotted',
    fontSize: 9,
    paddingBottom: 1,
    minHeight: 12,
  },
  declaration: {
    backgroundColor: PXL_GRAY,
    borderLeftWidth: 2,
    borderLeftColor: PXL_GOLD,
    padding: 6,
    fontSize: 8.5,
    fontStyle: 'italic',
    color: '#444444',
    marginBottom: 8,
  },
  signGrid: { flexDirection: 'row', marginTop: 4 },
  signCol: { flex: 1, marginRight: 10 },
  signLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#555555',
    marginBottom: 3,
  },
  signLine: {
    borderBottomWidth: 1,
    borderBottomColor: PXL_BLACK,
    minHeight: 16,
  },
  signLineTall: { minHeight: 28 },
  stempelBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: PXL_GOLD,
    borderRadius: 3,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  stempelText: { color: PXL_GOLD, fontSize: 8, fontStyle: 'italic' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: PXL_BORDER,
    marginTop: 6,
    paddingHorizontal: 22,
    paddingVertical: 5,
    fontSize: 7.5,
    color: '#999999',
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
})

function DataRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? ' '}</Text>
    </View>
  )
}

export function AftekendocumentPDF({ data }: { data: AftekendocumentData }) {
  const { student, activiteit } = data
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={PXL_LOGO_PATH} style={styles.logoImage} />
          <View>
            <Text style={styles.headerTitle}>
              Bevestiging van deelname of uitgevoerde activiteit
            </Text>
            <Text style={styles.headerSub}>
              voor vergaderingen geldt het verslag met de aanwezigheidslijst
            </Text>
          </View>
        </View>
        <View style={styles.goldBar} />

        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Studentgegevens</Text>
            <View style={styles.cardBody}>
              <DataRow label="Student:" value={student.naam} />
              <DataRow label="Studentnummer:" value={student.studentnummer} />
              <DataRow label="Academiejaar:" value={student.academiejaar} />
              <DataRow label="Opleiding:" value={student.opleiding} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activiteitgegevens</Text>
            <View style={styles.cardBody}>
              <DataRow label="Project / Activiteit:" value={activiteit.titel} />
              <DataRow label="Doelstelling:" value={activiteit.doelstelling} />
              <DataRow label="Beoordelaar / Opdrachtgever:" value={activiteit.beoordelaar} />
              <DataRow label="Datum:" value={activiteit.datum} />
              <DataRow label="Locatie:" value={activiteit.locatie} />
              <DataRow label="Organisator:" value={activiteit.organisator} />
              <DataRow
                label="Aantal geschatte uren:"
                value={
                  activiteit.geschatteUren !== null && activiteit.geschatteUren !== undefined
                    ? String(activiteit.geschatteUren)
                    : null
                }
              />
              <DataRow label="Verslag maken:" value={activiteit.verslagMaken} />
              <DataRow label="Andere doc:" value={activiteit.andereDoc} />
            </View>
          </View>

          <View style={styles.declaration}>
            <Text>
              Ondergetekende verklaart hierbij dat bovenvermelde student heeft deelgenomen aan
              vernoemde activiteit, of dat hij/zij de vernoemde activiteit heeft uitgevoerd.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Ondergetekende (in te vullen door de organisator)
            </Text>
            <View style={styles.cardBody}>
              <View style={styles.signGrid}>
                <View style={styles.signCol}>
                  <Text style={styles.signLabel}>Naam</Text>
                  <View style={styles.signLine} />
                </View>
                <View style={styles.signCol}>
                  <Text style={styles.signLabel}>Functie</Text>
                  <View style={styles.signLine} />
                </View>
              </View>

              <View style={[styles.signGrid, { marginTop: 12 }]}>
                <View style={styles.signCol}>
                  <Text style={styles.signLabel}>Aantal effectieve uren</Text>
                  <View style={styles.signLine} />
                </View>
                <View style={styles.signCol}>
                  <Text style={styles.signLabel}>E-mail en telefoonnr. contactpersoon</Text>
                  <View style={styles.signLine} />
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.signLabel}>Extra opmerking / advies voor student</Text>
                <View style={[styles.signLine, styles.signLineTall]} />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 12,
                  alignItems: 'flex-end',
                }}
              >
                <View style={styles.signCol}>
                  <Text style={styles.signLabel}>Datum</Text>
                  <View style={styles.signLine} />
                </View>
                <View style={styles.signCol}>
                  <Text style={styles.signLabel}>Handtekening</Text>
                  <View style={[styles.signLine, styles.signLineTall]} />
                </View>
                <View style={{ width: 130 }}>
                  <Text style={styles.signLabel}>Stempel (eventueel)</Text>
                  <View style={styles.stempelBox}>
                    <Text style={styles.stempelText}>Stempel hier</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            Hogeschool PXL • Elfde-Liniestraat 24 • 3500 Hasselt • www.pxl.be
          </Text>
          <Text>Xfactorapp</Text>
        </View>
      </Page>
    </Document>
  )
}
