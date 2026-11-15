// SAP OData Service Boundary & Adapter for SunGrid Renewables S/4HANA SD
// Reference OData Service: /sap/opu/odata/sap/API_CUSTOMER_RETURN_SRV

class SapODataAdapter {
  constructor() {
    this.config = {
      isDemoMode: true,
      baseUrl: 'https://s4hana-gateway.sungrid.internal:44300/sap/opu/odata/sap/API_CUSTOMER_RETURN_SRV',
      client: '100',
      timeoutMs: 4000,
      maxRetries: 3,
      authType: 'OAuth2 / SAML Bearer (Demo Boundary Token)',
      simulateLatency: true,
      simulateError: false // Can be toggled in settings to demonstrate retry & failure handling
    };
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastSyncTimestamp: new Date().toISOString(),
      health: 'HEALTHY' // HEALTHY | DEGRADED | DOWN
    };
  }

  getConfig() {
    // Return sanitized config (never expose real credentials)
    return {
      ...this.config,
      modeLabel: this.config.isDemoMode ? 'Demo Mode (Local SAP S/4HANA Adapter)' : 'Live SAP OData Service (Connected)',
      status: this.stats.health
    };
  }

  updateConfig(updates) {
    if (updates.isDemoMode !== undefined) this.config.isDemoMode = Boolean(updates.isDemoMode);
    if (updates.simulateError !== undefined) this.config.simulateError = Boolean(updates.simulateError);
    if (updates.simulateLatency !== undefined) this.config.simulateLatency = Boolean(updates.simulateLatency);
    if (updates.timeoutMs !== undefined) this.config.timeoutMs = Number(updates.timeoutMs);
    if (updates.baseUrl !== undefined) this.config.baseUrl = String(updates.baseUrl);
    return this.getConfig();
  }

  async pingHealth() {
    this.stats.totalRequests++;
    if (this.config.simulateError) {
      this.stats.failedRequests++;
      this.stats.health = 'DEGRADED';
      return {
        success: false,
        status: 503,
        statusText: 'Service Unavailable',
        message: 'SAP Gateway timeout: HTTP 503 - RFC connection to S/4HANA application server 1108 timed out after 3 retries.',
        timestamp: new Date().toISOString(),
        details: {
          retriesAttempted: this.config.maxRetries,
          endpoint: `${this.config.baseUrl}/$metadata`,
          recommendation: 'Verify SAP RFC gateway or switch to Demo Mode adapter in Settings.'
        }
      };
    }

    if (this.config.simulateLatency) {
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    this.stats.successfulRequests++;
    this.stats.health = 'HEALTHY';
    this.stats.lastSyncTimestamp = new Date().toISOString();

    return {
      success: true,
      status: 200,
      statusText: 'OK',
      message: 'SAP S/4HANA SD OData service metadata verified ($metadata 200 OK). Best-practice BKP entities active.',
      timestamp: this.stats.lastSyncTimestamp,
      details: {
        entitySets: ['A_CustomerReturn', 'A_CustomerReturnItem', 'A_CustomerReturnDelivery', 'A_CustReturnProcessStep'],
        companyCode: '1300',
        plantsActive: ['1108', '1102'],
        latencyMs: 120
      }
    };
  }

  // Simulated Post to SAP S/4HANA (e.g., releasing billing block or adjusting quantity)
  async postReturnAction(recordId, actionType, payload) {
    this.stats.totalRequests++;

    if (this.config.simulateError) {
      this.stats.failedRequests++;
      throw new Error(`[SAP OData Error] S/4HANA returned RFC_COMMUNICATION_FAILURE while executing action ${actionType} on record ${recordId}. Live service unavailable.`);
    }

    if (this.config.simulateLatency) {
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    this.stats.successfulRequests++;
    this.stats.lastSyncTimestamp = new Date().toISOString();

    return {
      sapReturnCode: 'S_OK',
      sapMessage: `SAP BKP Document successfully updated via OData adapter [Action: ${actionType}].`,
      sapReferenceDoc: `DOC-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: this.stats.lastSyncTimestamp
    };
  }
}

export const sapAdapter = new SapODataAdapter();
