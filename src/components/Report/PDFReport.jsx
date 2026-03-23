/* src/components/Report/PDFReport.jsx */
import React from 'react';
import { 
  Document, Page, Text, View, StyleSheet, 
  Image, Link, Svg, Path, Circle, G, 
  LinearGradient, Stop, Font, Defs
} from '@react-pdf/renderer';

// Register a nice font if needed, but defaults are fine for now.
// Font.register({ family: 'Inter', src: 'https://...' });

const colors = {
  dark: '#1a1a2e',
  white: '#ffffff',
  green: '#43a047',
  red: '#e53935',
  yellow: '#fdd835',
  purple: '#7e57c2',
  muted: '#666666',
  lightGray: '#f8f9fa',
  border: '#eeeeee'
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: colors.white,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoSymbol: {
    fontSize: 22,
    color: colors.purple,
    marginRight: 6,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 8,
    color: colors.muted,
    fontStyle: 'italic',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  reportBadge: {
    backgroundColor: 'rgba(67, 160, 71, 0.1)',
    color: colors.green,
    padding: '2 8',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  metadataLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  metadataValue: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  queryBox: {
    backgroundColor: colors.lightGray,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.dark,
    marginBottom: 20,
  },
  queryLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  queryText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  mainRow: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 25,
  },
  meterCol: {
    width: 200,
    alignItems: 'center',
  },
  analysisCol: {
    flex: 1,
    justifyContent: 'center',
  },
  aiBadge: {
    backgroundColor: 'rgba(126, 87, 194, 0.1)',
    color: colors.purple,
    padding: '3 8',
    borderRadius: 12,
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  analysisText: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'justify',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 25,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  claimCard: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: colors.lightGray,
    padding: '4 8',
    borderRadius: 2,
  },
  claimId: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.muted,
  },
  verdictBadge: {
    fontSize: 8,
    fontWeight: 'bold',
    padding: '2 6',
    borderRadius: 4,
    color: colors.white,
  },
  confidenceText: {
    fontSize: 8,
    color: colors.muted,
  },
  claimText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reasoningBox: {
    marginBottom: 12,
  },
  reasoningLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 9,
    color: colors.muted,
    textAlign: 'justify',
  },
  sourcesBox: {
    marginTop: 8,
  },
  sourcesLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 6,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: 9,
    color: colors.purple,
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  sourceDomain: {
    fontSize: 7,
    color: colors.muted,
    marginTop: 1,
  },
  stanceBadge: {
    fontSize: 7,
    fontWeight: 'bold',
    padding: '2 6',
    borderRadius: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    color: colors.muted,
    fontSize: 7,
  }
});

const PDFTruthMeter = ({ score }) => {
  const displayScore = score !== null ? Math.round(score) : 50;
  const needleAngle = -90 + (displayScore / 100) * 180;
  
  const getColor = (val) => {
    if (score === null) return '#4b5563';
    if (val < 40) return '#e53935'; // Hardcoded red
    if (val < 70) return '#fdd835'; // Hardcoded yellow
    return '#43a047'; // Hardcoded green
  };
  
  const currentColor = getColor(displayScore);

  return (
    <View style={{ width: 180, alignItems: 'center' }}>
      <Svg viewBox="0 0 200 130">
        <Defs>
          <LinearGradient id="pdfGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#e53935" />
            <Stop offset="50%" stopColor="#fdd835" />
            <Stop offset="100%" stopColor="#43a047" />
          </LinearGradient>
        </Defs>
        
        {/* Background Track */}
        <Path
          d="M 20 110 A 80 80 0 0 1 180 110"
          stroke="#f0f0f0"
          strokeWidth="12"
          fill="none"
        />
        
        {/* Color Track */}
        <Path
          d="M 20 110 A 80 80 0 0 1 180 110"
          stroke="url(#pdfGradient)"
          strokeWidth="12"
          fill="none"
          opacity={score !== null ? 1 : 0.2}
        />
        
        {/* Needle */}
        <G transform={`rotate(${needleAngle}, 100, 110)`}>
          <Path
            d="M 100 110 L 100 40"
            stroke={currentColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </G>
        
        <Circle cx="100" cy="110" r="5" fill={currentColor} />
        
        {/* FALSE / TRUE Labels at bottom of arc */}
        <Text x="15" y="125" style={{ fontSize: 7, fill: '#999999', fontWeight: 'bold' }}>FALSE</Text>
        <Text x="185" y="125" style={{ fontSize: 7, fill: '#999999', fontWeight: 'bold' }} textAnchor="end">TRUE</Text>
      </Svg>
      
      {/* Stats Below Arc */}
      <View style={{ marginTop: 5, alignItems: 'center' }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: currentColor }}>
          {score !== null ? `${displayScore}%` : '—'}
        </Text>
        <Text style={{ fontSize: 8, color: '#888888', fontWeight: 'bold', letterSpacing: 1 }}>TRUTH SCORE</Text>
      </View>
    </View>
  );
};

const PDFReport = ({ reportData, query }) => {
  const claims = reportData.claims || [];
  const score = claims.length === 0 ? null : (reportData.overall_score || 0) * 100;
  const aiProb = Math.round((reportData.ai_text_probability || 0) * 100);
  
  const stats = {
    total: claims.length,
    true: claims.filter(c => c.verdict === 'True').length,
    false: claims.filter(c => c.verdict === 'False').length,
    partial: claims.filter(c => c.verdict === 'Partial').length,
    unverifiable: claims.filter(c => c.verdict === 'Unverifiable').length,
  };

  const formattedDate = new Date(reportData.created_at || new Date()).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const reportId = (reportData.id || reportData.report_id || 'N/A').substring(0, 8);

  const getVerdictStyle = (v) => {
    if (v === 'True') return { backgroundColor: colors.green };
    if (v === 'False') return { backgroundColor: colors.red };
    if (v === 'Partial') return { backgroundColor: colors.yellow, color: '#000' };
    return { backgroundColor: colors.purple };
  };

  return (
    <Document title={`Factly Report - ${reportId}`}>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              {/* <Text style={styles.logoSymbol}>◈</Text> */}
              <Text style={styles.logoText}>Factly AI</Text>
            </View>
            <Text style={styles.tagline}>Truth is One Query Away. Verify any Fact, Text or URL.</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportBadge}>VERIFIED REPORT</Text>
            <Text style={styles.metadataLabel}>REPORT ID</Text>
            <Text style={styles.metadataValue}>{reportId}</Text>
            <Text style={styles.metadataLabel}>DATE & TIME</Text>
            <Text style={styles.metadataValue}>{formattedDate}</Text>
          </View>
        </View>

        {/* INPUT QUERY BOX */}
        <View style={styles.queryBox}>
          <Text style={styles.queryLabel}>Input Query</Text>
          <Text style={styles.queryText}>{query || reportData.input_text || 'No query provided'}</Text>
        </View>

        {/* TWO COLUMN ROW */}
        <View style={styles.mainRow}>
          <View style={styles.meterCol}>
            <PDFTruthMeter score={score} />
          </View>
          <View style={styles.analysisCol}>
            <Text style={styles.aiBadge}>AI ANALYSIS • DETECTION: {aiProb}%</Text>
            <Text style={styles.analysisText}>
              Verification of the provided statement across global news repositories, academic databases, and verified social media channels. The truth score represents the aggregate accuracy based on discovered factual claims.
            </Text>
          </View>
        </View>

        {/* STATS ROW */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.green }]}>{stats.true}</Text>
            <Text style={styles.statLabel}>TRUE</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.red }]}>{stats.false}</Text>
            <Text style={styles.statLabel}>FALSE</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.yellow }]}>{stats.partial}</Text>
            <Text style={styles.statLabel}>PARTIAL</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.purple }]}>{stats.unverifiable}</Text>
            <Text style={styles.statLabel}>UNVERIFIABLE</Text>
          </View>
        </View>

        {/* CLAIMS SECTION */}
        <Text style={styles.sectionTitle}>Verified Claims</Text>
        <View style={styles.claimsList}>
          {claims.map((claim, index) => (
            <View key={index} style={[styles.claimCard, { borderLeftColor: getVerdictStyle(claim.verdict).backgroundColor, borderLeftWidth: 4 }]}>
              <View style={styles.claimHeader}>
                <Text style={styles.claimId}>CLAIM {(index + 1).toString().padStart(2, '0')}</Text>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <View style={[styles.verdictBadge, getVerdictStyle(claim.verdict)]}>
                    <Text>{claim.verdict.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.confidenceText}>{Math.round((claim.confidence <= 1 ? claim.confidence * 100 : claim.confidence))}% CONFIDENCE</Text>
                </View>
              </View>
              
              <Text style={styles.claimText}>{claim.claim_text}</Text>
              
              <View style={styles.reasoningBox}>
                <Text style={styles.reasoningLabel}>AI Analysis & Reasoning</Text>
                <Text style={styles.reasoningText}>{claim.reasoning}</Text>
              </View>
              
              {claim.sources && claim.sources.length > 0 && (
                <View style={styles.sourcesBox}>
                  <Text style={styles.sourcesLabel}>Primary Sources</Text>
                  {claim.sources.map((src, i) => (
                    <View key={i} style={styles.sourceRow}>
                      <View style={styles.sourceInfo}>
                        <Link src={src.url} style={styles.sourceTitle}>{src.title || 'Source Reference'}</Link>
                        <Text style={styles.sourceDomain}>{src.url ? new URL(src.url).hostname.replace('www.', '') : 'UnknownSource'}</Text>
                      </View>
                      <View style={[styles.stanceBadge, { backgroundColor: src.stance === 'Contradicts' ? 'rgba(229, 57, 53, 0.1)' : 'rgba(67, 160, 71, 0.1)', color: src.stance === 'Contradicts' ? colors.red : colors.green }]}>
                        <Text>{src.stance === 'Contradicts' ? 'CONTRADICTS' : 'SUPPORTS'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>Verified by Factly AI — Independent Fact Checking Infrastructure</Text>
          <Text>Report: {reportId} • Confidential • Generated by Alethia AI</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PDFReport;
