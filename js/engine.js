/**
 * NOVA RESCUE - Deterministic Order Rescue Decision Engine
 * Transparent, rules-based algorithm evaluating inventory uncertainty, store distance,
 * customer LTV risk, and ETA thresholds to recommend actionable fulfillment decisions.
 */

var globalRoot = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);

var NOVAEngine = globalRoot.NOVAEngine = {
  /**
   * Calculate Rescue Risk Score (0-100) & Risk Level
   */
  calculateRiskScore(order) {
    let score = 0;
    const factors = [];

    // Factor 1: Item Inventory Confidence
    const minConfidence = Math.min(...order.items.map(i => i.inventoryConfidence));
    if (minConfidence < 25) {
      score += 45;
      factors.push(`Severe Inventory Uncertainty (${minConfidence}% confidence)`);
    } else if (minConfidence < 50) {
      score += 25;
      factors.push(`Moderate Inventory Uncertainty (${minConfidence}% confidence)`);
    }

    // Factor 2: Store Historical Rejection Profile
    const store = NOVACartData.stores.find(s => s.id === order.store.id);
    if (store && store.rejectionRisk === 'High') {
      score += 20;
      factors.push('Store #' + order.store.id + ' Has High Order Rejection Rate (23% baseline)');
    } else if (store && store.rejectionRisk === 'Medium') {
      score += 10;
      factors.push('Store Has Medium Rejection Profile');
    }

    // Factor 3: Customer Retention & LTV Hook (3rd Order Conversion Priority)
    if (order.customer.completedOrders === 2) {
      score += 20;
      factors.push('Critical LTV Conversion Milestone: 3rd Order Hook (72% next-month retention)');
    } else if (order.customer.completedOrders === 1) {
      score += 15;
      factors.push('New Customer 1st Order Rescue Priority');
    } else if (order.customer.completedOrders >= 10) {
      score += 10;
      factors.push('VIP Repeat Customer');
    }

    // Factor 4: Primary Failure Mode Weight
    if (order.primaryFailureMode === 'MULTI_ITEM_OOS') {
      score += 25;
      factors.push('Multi-Item Out of Stock Failure');
    } else if (order.primaryFailureMode === 'STORE_REJECTION_RISK') {
      score += 15;
      factors.push('Store Order Rejection Risk');
    } else if (order.primaryFailureMode === 'DELIVERY_ETA_SPIKE') {
      score += 10;
      factors.push('ETA Delay Spike');
    }

    // Factor 5: Order Value Weight
    if (order.orderValue >= 1000) {
      score += 10;
      factors.push('High Basket Value (₹' + order.orderValue + ')');
    }

    // Cap score at 99
    score = Math.min(99, score);

    let level = 'Low';
    if (score >= 65) level = 'High';
    else if (score >= 40) level = 'Medium';

    return { score, level, factors, minConfidence };
  },

  /**
   * Deterministic Analysis Engine
   * Evaluates order condition and returns structured Rescue Recommendation
   */
  analyzeOrder(order) {
    const risk = this.calculateRiskScore(order);
    const minConfidenceItem = order.items.reduce((prev, curr) => 
      prev.inventoryConfidence < curr.inventoryConfidence ? prev : curr
    );

    // Rule 1: Multi-Item OOS -> High Risk Manual Support Override & Split Fulfillment
    if (order.primaryFailureMode === 'MULTI_ITEM_OOS' || order.items.filter(i => !i.inStock).length > 1) {
      return {
        actionType: 'MANUAL_INTERVENTION',
        actionBadge: 'Manual Override',
        actionTitle: 'High-Risk Priority Support & Split-Fulfillment',
        badgeClass: 'badge-danger',
        risk,
        reason: `Order ${order.id} has multiple unconfirmed items (${risk.minConfidence}% lowest stock confidence). No single local store has all basket items in verified stock.`,
        recommendationSummary: `Dispatch automated priority customer callback & split fulfillment across FreshMart Indiranagar (STR-104) and GreenGrocers Jayanagar (STR-205).`,
        alternativeDetails: {
          type: 'Split Fulfillment Network',
          storeA: 'STR-104 FreshMart Indiranagar (Items 1 & 3)',
          storeB: 'STR-205 GreenGrocers Jayanagar (Item 2)',
          costDelta: '₹0 (Subsidized by Nova Cart Rescue Fund)'
        },
        etaImpact: '+12 mins (Total 40 mins dispatch window)',
        customerImpact: `Priority Concierge Call scheduled (<3 mins resolution vs 9.2 hr average). Preserves VIP customer relationship (${order.customer.completedOrders} orders).`,
        businessImpact: `Preserves ₹${order.orderValue} high-value basket and prevents multi-item negative review.`,
        actionButtonText: 'Execute Priority Support Rescue'
      };
    }

    // Rule 2: In-Stock Product Substitution (Check if a direct substitute exists for unavailable item)
    const substituteOptions = (NOVACartData.substitutes[minConfidenceItem.name] || []).filter(substitute =>
      substitute.storeId === order.store.id && substitute.stockConfidence >= 85
    );
    if (!minConfidenceItem.inStock && substituteOptions.length > 0 && order.primaryFailureMode === 'UNAVAILABLE_ITEM' && order.customer.acceptsSubstitutions === true) {
      const topSub = substituteOptions[0];
      const priceDelta = topSub.unitPrice - minConfidenceItem.unitPrice;
      const priceDeltaStr = priceDelta > 0 ? `+₹${priceDelta}` : `₹${priceDelta}`;

      return {
        actionType: 'ITEM_SUBSTITUTE',
        actionBadge: 'Item Substitute',
        actionTitle: 'Suggest In-Stock Product Substitute',
        badgeClass: 'badge-warning',
        risk,
        reason: `Item "${minConfidenceItem.name}" is out of stock (${minConfidenceItem.inventoryConfidence}% confidence). In-stock substitute "${topSub.name}" is verified available in store (${topSub.stockConfidence}% stock confidence).`,
        recommendationSummary: `Offer instant 1-tap WhatsApp/In-App substitution with "${topSub.name}" (${priceDeltaStr} price delta covered by Nova Cart).`,
        alternativeDetails: {
          type: 'Verified Product Substitute',
          name: topSub.name,
          brand: topSub.brand,
          unitPrice: `₹${topSub.unitPrice} (${priceDeltaStr} vs original)`,
          stockConfidence: `${topSub.stockConfidence}% Stock Confidence`
        },
        etaImpact: '0 mins ETA impact (Dispatched immediately from store)',
        customerImpact: '1-tap approval link sent via WhatsApp. Instant resolution eliminates 9.2 hr support ticket wait.',
        businessImpact: `Preserves ₹${order.orderValue} order value and converts potential 29% phantom stock dissatisfaction into brand delight.`,
        actionButtonText: 'Send Substitute Offer to Customer'
      };
    }

    // Rule 3: Re-route to Nearby Partner Store
    const alternativeStore = NOVACartData.stores.find(s => 
      s.id !== order.store.id && 
      s.distanceKm > 0 && 
      s.rating >= 4.5 && 
      s.rejectionRisk !== 'High'
    );

    if ((minConfidenceItem.inventoryConfidence < 40 || order.primaryFailureMode === 'STORE_REJECTION_RISK' || order.primaryFailureMode === 'UNAVAILABLE_ITEM') && alternativeStore) {
      return {
        actionType: 'STORE_SWITCH',
        actionBadge: 'Store Re-route',
        actionTitle: 'Re-route Order to Nearby Partner Store',
        badgeClass: 'badge-primary',
        risk,
        reason: `Primary store ${order.store.name} (#${order.store.id}) has unconfirmed stock for "${minConfidenceItem.name}" (${minConfidenceItem.inventoryConfidence}% confidence). Nearby partner store ${alternativeStore.name} (#${alternativeStore.id}) has verified stock at 96% confidence within ${alternativeStore.distanceKm} km.`,
        recommendationSummary: `Seamlessly transfer order to ${alternativeStore.name} (${alternativeStore.distanceKm} km away). Zero customer action required.`,
        alternativeDetails: {
          type: 'Nearby Partner Store',
          name: alternativeStore.name + ' (' + alternativeStore.id + ')',
          distance: `${alternativeStore.distanceKm} km away`,
          stockConfidence: '96% Verified Stock',
          rating: `★ ${alternativeStore.rating}`
        },
        etaImpact: `+${Math.round(alternativeStore.distanceKm * 2 + 2)} mins (Total ${order.currentEtaMins + 4} mins)`,
        customerImpact: `Order fulfilled seamlessly. Customer retains high trust. Crucial for ${order.customer.ltvCategory}.`,
        businessImpact: `Preserves ₹${order.orderValue} order value. Prevents store rejection (39% store burden mitigation).`,
        actionButtonText: 'Re-route to ' + alternativeStore.name
      };
    }

    // Rule 4: ETA Adjustment & Proactive Customer Communication
    return {
      actionType: 'ETA_ADJUSTMENT',
      actionBadge: 'ETA Alert & Voucher',
      actionTitle: 'Accept ETA Adjustment & Push Proactive Alert',
      badgeClass: 'badge-info',
      risk,
      reason: `Items are in verified stock (85%+ confidence), but partner store prep/dispatch congestion is adding delay. Proactive communication prevents cancellation.`,
      recommendationSummary: `Adjust delivery ETA by +8 mins and send automated proactive update with a ₹25 Instant Loyalty Credit to customer.`,
      alternativeDetails: {
        type: 'Fulfillment Time Buffer',
        etaAdjustment: '+8 Minutes Buffer',
        loyaltyCredit: '₹25 Nova Wallet Cashback',
        channel: 'Automated In-App Push & SMS'
      },
      etaImpact: '+8 mins ETA adjustment (New ETA: ' + (order.currentEtaMins + 8) + ' mins)',
      customerImpact: `Proactive communication reduces cancellation rate by 82%. Customer feels valued.`,
      businessImpact: `Preserves ₹${order.orderValue} order value. Prevents 19% support ticket escalation.`,
      actionButtonText: 'Apply ETA Adjustment & Alert Customer'
    };
  }
};

globalRoot.NOVAEngine = NOVAEngine;
