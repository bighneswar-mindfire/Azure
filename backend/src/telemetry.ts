import * as appInsights from "applicationinsights";

// Azure sets APPLICATIONINSIGHTS_CONNECTION_STRING automatically once
// Application Insights is linked to the Web App; locally this stays
// disabled. Auto-collects requests, dependencies (Postgres, outbound HTTP
// to the Function), and exceptions - covers availability/health and API
// failure monitoring without any custom tracking code needed here.
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights.setup().start();
}
