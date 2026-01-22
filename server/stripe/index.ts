import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import logger from '../logger';

export async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logger.warn('DATABASE_URL not found - Stripe integration will not be initialized');
    return false;
  }

  try {
    logger.info('Initializing Stripe schema...');
    await runMigrations({ 
      databaseUrl,
      schema: 'stripe'
    });
    logger.info('Stripe schema ready');

    const stripeSync = await getStripeSync();

    logger.info('Setting up managed webhook...');
    const replitDomains = process.env.REPLIT_DOMAINS;
    if (replitDomains) {
      const webhookBaseUrl = `https://${replitDomains.split(',')[0]}`;
      const { webhook } = await stripeSync.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`
      );
      logger.info(`Webhook configured: ${webhook.url}`);
    } else {
      logger.warn('REPLIT_DOMAINS not found - webhook not configured');
    }

    logger.info('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => {
        logger.info('Stripe data synced');
      })
      .catch((err: Error) => {
        logger.error('Error syncing Stripe data:', err);
      });

    return true;
  } catch (error) {
    logger.error('Failed to initialize Stripe:', error);
    return false;
  }
}

export { paymentRoutes } from './paymentRoutes';
export { WebhookHandlers } from './webhookHandlers';
export { getUncachableStripeClient, getStripePublishableKey, getStripeSync } from './stripeClient';
