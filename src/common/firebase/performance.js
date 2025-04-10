import { getApp } from "@react-native-firebase/app";
import { getPerformance, initializePerformance, startTrace } from "@react-native-firebase/perf/lib";

const app = getApp();
const performance = getPerformance(app);

export const initializePerformanceMonitoring = async () => {
  await initializePerformance(performance);
};

// start trace
export const startPerformanceTrace = async (routeName) => {
  const trace = await startTrace(performance, `${routeName}_LoadTime`);
  trace.putAttribute("screenName", routeName);
  trace.putMetric("initTime", Date.now());
  return trace;
};

// Stopping an existing trace
export const stopTrace = async (trace) => {
  if (trace) {
    trace.putMetric("endTime", Date.now());
    await trace.stop();
  }
};
// Resets the current trace to null
export const resetTrace = () => null;
