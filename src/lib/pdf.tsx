import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { Agreement } from '@/types';
import { TC_SECTIONS } from './tc';

Font.register({
  family: 'Helvetica',
  fonts: [],
});

const orange = '#F47B20';
const navy = '#2C3275';
const dark = '#1A1D36';
const lightGrey = '#f5f5f5';
const midGrey = '#666666';
const NEXIT_ABN = '92 401 198 599';
const LOGO_URL = process.env.NEXT_PUBLIC_BASE_URL
  ? `${process.env.NEXT_PUBLIC_BASE_URL}/nexit-logo.svg`
  : null;

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#333333',
    paddingTop: 0,
    paddingBottom: 48,
  },
  header: {
    backgroundColor: navy,
    paddingHorizontal: 40,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: orange,
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  headerSub: {
    color: '#a0a8d0',
    fontSize: 9,
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: orange,
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: navy,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: orange,
  },
  card: {
    backgroundColor: lightGrey,
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: 120,
    fontSize: 8,
    color: midGrey,
    fontFamily: 'Helvetica-Bold',
  },
  value: {
    flex: 1,
    fontSize: 9,
    color: dark,
  },
  agreementId: {
    fontSize: 8,
    color: midGrey,
    marginBottom: 16,
  },
  pill: {
    backgroundColor: '#e8eaf6',
    color: navy,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 4,
    marginBottom: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: dark,
  },
  billingBadge: {
    fontSize: 8,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  breakdownBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 8,
    color: midGrey,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  breakdownLine: {
    fontSize: 8.5,
    color: dark,
    lineHeight: 1.6,
  },
  tcSection: {
    marginBottom: 10,
  },
  tcSectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: navy,
    marginBottom: 3,
  },
  tcText: {
    fontSize: 7.5,
    color: '#444444',
    lineHeight: 1.5,
  },
  sigBlock: {
    backgroundColor: lightGrey,
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
  },
  sigImage: {
    width: 200,
    height: 70,
    objectFit: 'contain',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 4,
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: midGrey,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    marginBottom: 16,
  },
});

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(price);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' });
}

function billingLabel(agreement: Agreement): string {
  if (agreement.products.includes('Software Development')) return 'Project-Based — Invoiced via QuickBooks';
  if (agreement.billing_type === 'once-off') return 'Once-off Payment';
  const freq = agreement.billing_frequency ?? 'monthly';
  return `Recurring — ${freq.charAt(0).toUpperCase() + freq.slice(1)}`;
}

interface AgreementPDFProps {
  agreement: Agreement;
}

export function AgreementPDF({ agreement }: AgreementPDFProps) {
  const preparedDate = new Date(agreement.prepared_date).toLocaleDateString('en-AU');
  const breakdownLines = agreement.breakdown_notes
    ? agreement.breakdown_notes.split('\n').filter(Boolean)
    : [];

  return (
    <Document
      title={`NexIT Solutions — Service Agreement — ${agreement.business_name}`}
      author="NexIT Solutions"
      subject="Service Agreement"
    >
      {/* Page 1: Details */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {LOGO_URL ? (
              <Image src={LOGO_URL} style={{ width: 120, height: 39, marginBottom: 4 }} />
            ) : (
              <Text style={styles.headerTitle}>NexIT Solutions</Text>
            )}
            <Text style={styles.headerSub}>ABN {NEXIT_ABN} · Melbourne's Digital Growth Partner</Text>
          </View>
          <Text style={styles.headerBadge}>SERVICE AGREEMENT</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.agreementId}>Agreement ID: {agreement.id}</Text>

          {/* Prepared By */}
          <Text style={styles.sectionTitle}>Prepared By</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Staff Member:</Text>
              <Text style={styles.value}>{agreement.staff_name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Staff Email:</Text>
              <Text style={styles.value}>{agreement.staff_email}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Prepared Date:</Text>
              <Text style={styles.value}>{preparedDate}</Text>
            </View>
          </View>

          {/* Client Details */}
          <Text style={styles.sectionTitle}>Client Details</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Business Name:</Text>
              <Text style={styles.value}>{agreement.business_name}</Text>
            </View>
            {agreement.customer_abn ? (
              <View style={styles.row}>
                <Text style={styles.label}>Client ABN:</Text>
                <Text style={styles.value}>{agreement.customer_abn}</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.label}>Contact Name:</Text>
              <Text style={styles.value}>{agreement.customer_name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{agreement.customer_email}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{agreement.customer_phone}</Text>
            </View>
          </View>

          {/* Services & Pricing */}
          <Text style={styles.sectionTitle}>Services &amp; Pricing</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Services:</Text>
              <View style={[styles.pillsRow, { flex: 1 }]}>
                {agreement.products.map((p) => (
                  <Text key={p} style={styles.pill}>{p}</Text>
                ))}
              </View>
            </View>

            {breakdownLines.length > 0 && (
              <View style={styles.breakdownBox}>
                <Text style={styles.breakdownLabel}>PRICING BREAKDOWN</Text>
                {breakdownLines.map((line, i) => (
                  <Text key={i} style={styles.breakdownLine}>{line}</Text>
                ))}
              </View>
            )}

            <View style={[styles.row, { marginTop: 10 }]}>
              <Text style={styles.label}>Total Investment:</Text>
              <Text style={[styles.value, { fontFamily: 'Helvetica-Bold', fontSize: 13, color: dark }]}>
                {formatPrice(agreement.price)} AUD (incl. GST)
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Billing:</Text>
              <Text
                style={[
                  styles.billingBadge,
                  { backgroundColor: agreement.billing_type === 'recurring' ? navy : orange },
                ]}
              >
                {billingLabel(agreement)}
              </Text>
            </View>
          </View>

          {/* Software Development Details */}
          {agreement.products.includes('Software Development') && (agreement.sd_phase || agreement.sd_scope) && (
            <>
              <Text style={styles.sectionTitle}>Software Development Details</Text>
              <View style={styles.card}>
                {agreement.sd_phase ? (
                  <View style={styles.row}>
                    <Text style={styles.label}>Project Phase:</Text>
                    <Text style={styles.value}>{agreement.sd_phase}</Text>
                  </View>
                ) : null}
                {agreement.sd_total_cost ? (
                  <View style={styles.row}>
                    <Text style={styles.label}>Total Project Cost:</Text>
                    <Text style={styles.value}>{formatPrice(agreement.sd_total_cost)} AUD (incl. GST) — estimated</Text>
                  </View>
                ) : null}
                {agreement.sd_scope ? (
                  <View style={{ marginTop: 6 }}>
                    <Text style={[styles.label, { marginBottom: 4 }]}>Scope of Work — Current Phase:</Text>
                    <View style={styles.breakdownBox}>
                      <Text style={[styles.breakdownLine, { lineHeight: 1.7 }]}>{agreement.sd_scope}</Text>
                    </View>
                  </View>
                ) : null}
                <View style={[styles.row, { marginTop: 8, backgroundColor: '#eef2ff', borderRadius: 4, padding: 8 }]}>
                  <Text style={[styles.value, { fontSize: 8, color: '#4338ca', fontFamily: 'Helvetica-Bold' }]}>
                    Payment for this phase will be invoiced separately via QuickBooks. No payment is collected through this platform.
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Signature */}
          {agreement.signature_data && (
            <>
              <Text style={styles.sectionTitle}>Client Signature</Text>
              <View style={styles.sigBlock}>
                <Image src={agreement.signature_data} style={styles.sigImage} />
                <View style={styles.row}>
                  <Text style={styles.label}>Signed By:</Text>
                  <Text style={styles.value}>{agreement.customer_name}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>On Behalf Of:</Text>
                  <Text style={styles.value}>{agreement.business_name}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Signed At:</Text>
                  <Text style={styles.value}>{formatDate(agreement.signed_at)}</Text>
                </View>
                {agreement.paid_at && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Payment Confirmed:</Text>
                    <Text style={styles.value}>{formatDate(agreement.paid_at)}</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>NexIT Solutions (ABN {NEXIT_ABN}) · Melbourne, VIC</Text>
          <Text style={styles.footerText}>hello@nexit.com.au · nexit.com.au</Text>
        </View>
      </Page>

      {/* Page 2+: Terms & Conditions */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            {LOGO_URL ? (
              <Image src={LOGO_URL} style={{ width: 120, height: 39, marginBottom: 4 }} />
            ) : (
              <Text style={styles.headerTitle}>NexIT Solutions</Text>
            )}
            <Text style={styles.headerSub}>ABN {NEXIT_ABN} · Melbourne's Digital Growth Partner</Text>
          </View>
          <Text style={styles.headerBadge}>TERMS &amp; CONDITIONS</Text>
        </View>

        <View style={styles.body}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
            Terms and Conditions of Service
          </Text>
          <Text style={[styles.tcText, { marginBottom: 16, color: midGrey }]}>
            These Terms and Conditions govern the provision of digital marketing services by NexIT
            Solutions (ABN {NEXIT_ABN}) to the Client identified in the Service Agreement. By signing the
            Service Agreement, the Client agrees to be bound by these Terms and Conditions. Governing
            law: Victoria, Australia.
          </Text>

          {TC_SECTIONS.map((section) => (
            <View key={section.number} style={styles.tcSection} wrap={false}>
              <Text style={styles.tcSectionTitle}>
                {section.number}. {section.title}
              </Text>
              <Text style={styles.tcText}>{section.content}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>NexIT Solutions (ABN {NEXIT_ABN}) · Melbourne, VIC</Text>
          <Text style={styles.footerText}>hello@nexit.com.au · nexit.com.au</Text>
        </View>
      </Page>
    </Document>
  );
}
