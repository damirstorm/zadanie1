import axios from "axios";

const BASE = "http://localhost:8000";

export const getInvoices = () => axios.get(`${BASE}/api/invoices`);

export const reconcile = (file) => {
  const form = new FormData();
  form.append("file", file);
  return axios.post(`${BASE}/api/reconcile`, form);
};

export const confirmPlan = (planId, operator, matches) =>
  axios.post(`${BASE}/api/reconcile/confirm`, {
    plan_id: planId,
    operator,
    matches,
  });

export const getAudit = () => axios.get(`${BASE}/api/audit`);