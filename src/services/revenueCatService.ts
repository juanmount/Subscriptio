import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
export const ENTITLEMENT_ID = 'premium';

export function initRevenueCat(): void {
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  if (!apiKey) return;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
}

export async function getLifetimePackage(): Promise<PurchasesPackage | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.lifetime ?? null;
}

export async function purchasePremium(): Promise<boolean> {
  const pkg = await getLifetimePackage();
  if (!pkg) throw new Error('No lifetime package available');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
}

export async function restorePurchases(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
}

export async function checkEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}
