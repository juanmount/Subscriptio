import { getAnalytics } from '@react-native-firebase/analytics';

const analytics = getAnalytics();

export async function logLogin(method: 'google' | 'email') {
  await analytics.logLogin({ method });
}

export async function logSignUp(method: 'google' | 'email') {
  await analytics.logSignUp({ method });
}

export async function logAddSubscription(providerName: string, priceUsd: number) {
  await analytics.logEvent('add_subscription', {
    provider: providerName,
    price_usd: priceUsd,
  });
}

export async function logPaywallShown(monthlyUsd: number) {
  await analytics.logEvent('paywall_shown', {
    monthly_usd: monthlyUsd,
  });
}

export async function logPaywallPurchased() {
  await analytics.logEvent('paywall_purchased', {
    price: 9.99,
    currency: 'USD',
  });
}

export async function logPaywallDismissed() {
  await analytics.logEvent('paywall_dismissed');
}

export async function logScreenView(screenName: string) {
  await analytics.logScreenView({ screen_name: screenName });
}

export async function setUserId(uid: string | null) {
  if (uid) {
    await analytics.setUserId(uid);
  } else {
    await analytics.setUserId(null);
  }
}
