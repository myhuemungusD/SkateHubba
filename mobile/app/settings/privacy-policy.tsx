/**
 * Privacy Policy Screen
 * Required for App Store submission
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SKATE } from '@/theme';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.lastUpdated}>Last Updated: January 26, 2026</Text>

      <Section title="1. Introduction">
        SkateHubba ("we", "our", or "us") is committed to protecting your privacy.
        This Privacy Policy explains how we collect, use, disclose, and safeguard
        your information when you use our mobile application.
      </Section>

      <Section title="2. Information We Collect">
        <BulletPoint>
          Account Information: Email address, username, profile photo, and
          authentication credentials when you create an account.
        </BulletPoint>
        <BulletPoint>
          Profile Data: Skating experience level, favorite tricks, bio, and
          other information you choose to provide.
        </BulletPoint>
        <BulletPoint>
          Location Data: GPS coordinates when you check in at skate spots
          (only with your permission).
        </BulletPoint>
        <BulletPoint>
          Challenge Content: Videos you record and upload for S.K.A.T.E. challenges.
        </BulletPoint>
        <BulletPoint>
          Usage Data: How you interact with the app, including features used,
          screens visited, and actions taken.
        </BulletPoint>
        <BulletPoint>
          Device Information: Device type, operating system, unique device
          identifiers, and push notification tokens.
        </BulletPoint>
      </Section>

      <Section title="3. How We Use Your Information">
        <BulletPoint>
          To provide and maintain the SkateHubba service
        </BulletPoint>
        <BulletPoint>
          To facilitate S.K.A.T.E. challenges between users
        </BulletPoint>
        <BulletPoint>
          To display skate spots on the map and enable check-ins
        </BulletPoint>
        <BulletPoint>
          To calculate leaderboard rankings and stats
        </BulletPoint>
        <BulletPoint>
          To send push notifications about challenges and activity
        </BulletPoint>
        <BulletPoint>
          To improve and personalize your experience
        </BulletPoint>
        <BulletPoint>
          To detect and prevent fraud or abuse
        </BulletPoint>
      </Section>

      <Section title="4. Video Content">
        Challenge videos you upload are stored securely on Firebase Storage.
        Videos are only visible to challenge participants and voters. We validate
        videos server-side to ensure they meet our guidelines (15 seconds maximum).
        Invalid videos are automatically deleted. You may request deletion of your
        videos by contacting support.
      </Section>

      <Section title="5. Data Sharing">
        We do not sell your personal information. We may share data with:
        <BulletPoint>
          Other Users: Your username, profile photo, and challenge content are
          visible to other SkateHubba users as part of the service.
        </BulletPoint>
        <BulletPoint>
          Service Providers: We use Firebase (Google) for authentication,
          database, storage, and analytics.
        </BulletPoint>
        <BulletPoint>
          Legal Requirements: We may disclose information if required by law
          or to protect our rights.
        </BulletPoint>
      </Section>

      <Section title="6. Data Retention">
        We retain your data for as long as your account is active. Check-in
        history is kept for leaderboard calculations. Challenge videos are
        retained for 90 days after completion. You can request account deletion
        at any time by contacting support@skatehubba.com.
      </Section>

      <Section title="7. Your Rights">
        Depending on your location, you may have the right to:
        <BulletPoint>Access the personal data we hold about you</BulletPoint>
        <BulletPoint>Request correction of inaccurate data</BulletPoint>
        <BulletPoint>Request deletion of your data</BulletPoint>
        <BulletPoint>Object to processing of your data</BulletPoint>
        <BulletPoint>Export your data in a portable format</BulletPoint>
      </Section>

      <Section title="8. Children's Privacy">
        SkateHubba is not intended for users under 13 years of age. We do not
        knowingly collect personal information from children under 13. If you
        believe we have collected such information, please contact us immediately.
      </Section>

      <Section title="9. Security">
        We implement industry-standard security measures including encryption
        in transit (TLS), secure authentication, and access controls. However,
        no method of transmission over the internet is 100% secure.
      </Section>

      <Section title="10. Push Notifications">
        We use push notifications to inform you about challenges, voting, and
        results. You can disable notifications in your device settings or within
        the app's Settings screen.
      </Section>

      <Section title="11. Changes to This Policy">
        We may update this Privacy Policy from time to time. We will notify
        you of any changes by posting the new Privacy Policy on this page and
        updating the "Last Updated" date.
      </Section>

      <Section title="12. Contact Us">
        If you have any questions about this Privacy Policy, please contact us at:
        {'\n\n'}
        Email: privacy@skatehubba.com{'\n'}
        Address: SkateHubba Inc., San Francisco, CA
      </Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By using SkateHubba, you agree to this Privacy Policy.
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

function BulletPoint({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.bulletPoint}>
      {'\n'}{'\u2022'} {children}
    </Text>
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
  bulletPoint: {
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
