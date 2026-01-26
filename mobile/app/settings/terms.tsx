/**
 * Terms of Service Screen
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SKATE } from '@/theme';

export default function TermsOfServiceScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.lastUpdated}>Last Updated: January 26, 2026</Text>

      <Section title="1. Acceptance of Terms">
        By accessing or using SkateHubba, you agree to be bound by these Terms
        of Service. If you disagree with any part of these terms, you may not
        access the service.
      </Section>

      <Section title="2. Description of Service">
        SkateHubba is a mobile application that enables skateboarders to discover
        skate spots, check in at locations, participate in S.K.A.T.E. video
        challenges, and compete on leaderboards.
      </Section>

      <Section title="3. User Accounts">
        You are responsible for maintaining the confidentiality of your account
        credentials. You must provide accurate information when creating an account.
        You are responsible for all activities that occur under your account.
      </Section>

      <Section title="4. User Content">
        You retain ownership of content you upload to SkateHubba. By uploading
        content, you grant us a non-exclusive, worldwide, royalty-free license to
        use, display, and distribute your content within the service.
        {'\n\n'}
        You agree not to upload content that:
        {'\n'}{'\u2022'} Violates any law or regulation
        {'\n'}{'\u2022'} Infringes on others' intellectual property rights
        {'\n'}{'\u2022'} Contains harmful, abusive, or offensive material
        {'\n'}{'\u2022'} Promotes dangerous activities without proper safety measures
        {'\n'}{'\u2022'} Contains spam or misleading information
      </Section>

      <Section title="5. Challenge Rules">
        S.K.A.T.E. challenges have the following rules:
        {'\n'}{'\u2022'} Videos must be 15 seconds or less
        {'\n'}{'\u2022'} One-take rule: No editing or splicing
        {'\n'}{'\u2022'} Content must be original and recorded by you
        {'\n'}{'\u2022'} No dangerous stunts on private property without permission
        {'\n'}{'\u2022'} Respect your opponents and the community
      </Section>

      <Section title="6. Prohibited Conduct">
        You agree not to:
        {'\n'}{'\u2022'} Use the service for any illegal purpose
        {'\n'}{'\u2022'} Harass, abuse, or harm other users
        {'\n'}{'\u2022'} Attempt to gain unauthorized access to the service
        {'\n'}{'\u2022'} Interfere with the proper functioning of the service
        {'\n'}{'\u2022'} Create multiple accounts to manipulate leaderboards
        {'\n'}{'\u2022'} Use bots or automated tools
      </Section>

      <Section title="7. Intellectual Property">
        The SkateHubba name, logo, and all related trademarks are our property.
        You may not use our branding without explicit permission.
      </Section>

      <Section title="8. Termination">
        We may terminate or suspend your account at any time for violations of
        these terms. Upon termination, your right to use the service will
        immediately cease.
      </Section>

      <Section title="9. Disclaimers">
        THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.
        SKATEBOARDING IS A DANGEROUS ACTIVITY. ALWAYS WEAR PROTECTIVE GEAR
        AND SKATE RESPONSIBLY. WE ARE NOT LIABLE FOR ANY INJURIES THAT MAY
        OCCUR WHILE USING THE SERVICE.
      </Section>

      <Section title="10. Limitation of Liability">
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, SKATEHUBBA SHALL NOT BE LIABLE
        FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.
      </Section>

      <Section title="11. Changes to Terms">
        We reserve the right to modify these terms at any time. We will notify
        users of material changes. Continued use of the service after changes
        constitutes acceptance of the new terms.
      </Section>

      <Section title="12. Governing Law">
        These terms shall be governed by the laws of the State of California,
        without regard to its conflict of law provisions.
      </Section>

      <Section title="13. Contact">
        For questions about these Terms, contact us at:
        {'\n\n'}
        Email: legal@skatehubba.com{'\n'}
        Address: SkateHubba Inc., San Francisco, CA
      </Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By using SkateHubba, you agree to these Terms of Service.
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SKATE.colors.ink,
  },
  content: {
    padding: SKATE.spacing.lg,
    paddingBottom: 40,
  },
  title: {
    color: SKATE.colors.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SKATE.spacing.sm,
  },
  lastUpdated: {
    color: SKATE.colors.gray,
    fontSize: 14,
    marginBottom: SKATE.spacing.xl,
  },
  section: {
    marginBottom: SKATE.spacing.xl,
  },
  sectionTitle: {
    color: SKATE.colors.orange,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SKATE.spacing.sm,
  },
  sectionContent: {
    color: SKATE.colors.paper,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    marginTop: SKATE.spacing.xl,
    paddingTop: SKATE.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: SKATE.colors.grime,
  },
  footerText: {
    color: SKATE.colors.gray,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
