/**
 * FlowCare Central API Entrypoint
 * 
 * Re-exports:
 * - Central client & configuration (apiClient, ENDPOINTS, API_BASE, apiFetch, handleApiError)
 * - All domain service modules (auth, appointments, queue, doctors, patients, consultations, receptionist, payments, admin)
 */

export * from "./config";
export { default } from "./config";

export * from "./auth";
export * from "./appointments";
export * from "./queue";
export * from "./doctors";
export * from "./patients";
export * from "./consultations";
export * from "./receptionist";
export * from "./payments";
export * from "./admin";
