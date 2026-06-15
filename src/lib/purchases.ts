/**
 * In-app purchase — a single non-consumable one-time unlock. No subscriptions,
 * ever. This module is the integration seam for `react-native-iap` or
 * RevenueCat: the rest of the app talks only to these functions and the store's
 * `unlock()`, so wiring a real store later is isolated to this one file.
 *
 * STUBBED for now (simulates the store round-trip) with clear TODOs. The stub
 * "purchase" succeeds; "restore" reports nothing to restore — enough to exercise
 * both the happy path and the error path in the paywall UI.
 */

/** Non-consumable product id — must match App Store Connect / Play Console. */
export const UNLOCK_PRODUCT_ID = 'com.godark.unlock';
export const UNLOCK_PRICE = '$10.99';

export type PurchaseResult = { ok: true } | { ok: false; cancelled?: boolean; error?: string };

// TODO(iap): initialize the billing client once at app start.
//   react-native-iap:
//     await initConnection();
//     await getProducts({ skus: [UNLOCK_PRODUCT_ID] });
//     purchaseUpdatedListener(...) / purchaseErrorListener(...);
//   RevenueCat:
//     Purchases.configure({ apiKey });
//     const offerings = await Purchases.getOfferings();
export async function initPurchases(): Promise<void> {
  // No-op in the stub. Real impl connects to the store and refreshes
  // entitlements (so a reinstall that owns the unlock is restored silently).
}

/**
 * Returns true if the non-consumable unlock is currently owned per the store.
 * Lets the app re-grant the entitlement on a fresh install without a tap.
 */
export async function checkEntitlement(): Promise<boolean> {
  // TODO(iap): RNIap.getAvailablePurchases() includes UNLOCK_PRODUCT_ID, or
  //   RevenueCat customerInfo.entitlements.active['unlock'] != null.
  return false;
}

export async function purchaseUnlock(): Promise<PurchaseResult> {
  // TODO(iap): requestPurchase({ sku: UNLOCK_PRODUCT_ID }) (RNIap) or
  //   Purchases.purchaseStoreProduct(product) (RevenueCat); verify the receipt
  //   and finishTransaction before resolving ok.
  await delay(1200);
  return { ok: true };
}

export async function restorePurchases(): Promise<PurchaseResult> {
  // TODO(iap): RNIap.getAvailablePurchases() / Purchases.restorePurchases();
  //   resolve ok only if UNLOCK_PRODUCT_ID is owned.
  await delay(900);
  return { ok: false, error: 'No previous purchase found to restore.' };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
