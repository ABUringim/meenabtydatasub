const BASE_URL = process.env.BIGISUB_BASE_URL || "https://bigisub.ng/api/v1/";
const TOKEN = process.env.BIGISUB_TOKEN || "298ef51c9e7c646836e80b2a3ccd106d8f701241";

function headers() {
  return {
    Authorization: `Token ${TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function apiPost(path, body) {
  if (!TOKEN) {
    throw new Error("BIGISUB_TOKEN not configured");
  }

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`}${cleanPath}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  const text = await resp.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`BigiSub returned non-JSON: ${text.slice(0, 200)}`);
  }

  if (!resp.ok) {
    throw new Error(
      `BigiSub HTTP ${resp.status}: ${json.message || json.detail || json.response || text.slice(0, 200)}`
    );
  }

  return json;
}

// ─── AIRTIME ──────────────────────────────────────
exports.buyAirtime = async ({ network, amount, phone }) => {
  const NETWORK_IDS = { MTN: 1, GLO: 2, "9MOBILE": 3, AIRTEL: 4 };
  const networkId = NETWORK_IDS[network?.toUpperCase()];
  if (!networkId) throw new Error(`Unknown network: ${network}`);

  const json = await apiPost("airtime_topup/", {
    network: networkId,
    amount: String(amount),
    phone_number: phone,
    airtime_type: "vtu",
  });

  return normalizeAirtime(json);
};

function normalizeAirtime(json) {
  return {
    status: json.Status === "successful" || json.status === "successful" ? "success" : "failed",
    provider_tran_id: json.tran_id || json.tranx_id || null,
    provider_request_id: json.request_id || null,
    provider_api_id: json.api_id || null,
    raw_response: json,
    message: json.response || json.message || "",
  };
}

// ─── DATA ────────────────────────────────────────
exports.buyData = async ({ network, planCode, phone }) => {
  const NETWORK_IDS = { MTN: 1, GLO: 2, "9MOBILE": 3, AIRTEL: 4 };
  const networkId = NETWORK_IDS[network?.toUpperCase()];
  if (!networkId) throw new Error(`Unknown network: ${network}`);

  const json = await apiPost("data_topup/", {
    network: networkId,
    plan: planCode,
    phone_number: phone,
  });

  return {
    status: json.Status === "successful" || json.status === "successful" ? "success" : "failed",
    provider_tran_id: json.tran_id || json.tranx_id || null,
    provider_request_id: json.request_id || null,
    provider_api_id: json.api_id || null,
    raw_response: json,
    message: json.response || json.message || "",
  };
};

// ─── TV ──────────────────────────────────────────
exports.verifyCable = async ({ provider, smartcard }) => {
  const json = await apiPost("verify_cable/", {
    company: provider,
    smartcard_number: smartcard,
  });
  return {
    valid: json.Status === "successful" || json.customer_name != null || json.Customer_Name != null,
    customer_name: json.customer_name || json.Customer_Name || null,
    raw_response: json,
  };
};

exports.buyCable = async ({ provider, smartcard, planCode, phone }) => {
  const json = await apiPost("cable_purchase/", {
    company: provider,
    smartcard_number: smartcard,
    plan: planCode,
    phone_number: phone,
  });
  return {
    status: json.Status === "successful" || json.status === "successful" ? "success" : "failed",
    provider_tran_id: json.tran_id || json.tranx_id || null,
    raw_response: json,
    message: json.response || json.message || "",
  };
};

// ─── ELECTRICITY ─────────────────────────────────
exports.verifyMeter = async ({ disco, meterNumber, meterType }) => {
  const json = await apiPost("meter_validate/", {
    company: disco,
    meter_no: meterNumber,
    meter_type: meterType,
  });
  return {
    valid: json.Customer_Name != null || json.customer_name != null,
    customer_name: json.Customer_Name || json.customer_name || null,
    customer_address: json.Customer_Address || json.customer_address || null,
    raw_response: json,
  };
};

exports.buyElectricity = async ({
  disco,
  meterNumber,
  meterType,
  amount,
  phone,
  customerName,
  customerAddress,
}) => {
  const json = await apiPost("meter_pay/", {
    company: disco,
    meter_no: meterNumber,
    meter_type: meterType,
    amount: String(amount),
    phone_number: phone,
    Customer_name: customerName || "",
    Customer_address: customerAddress || "",
  });
  return {
    status: json.Status === "successful" || json.status === "successful" ? "success" : "failed",
    provider_tran_id: json.tranx_id || json.tran_id || null,
    token: json.token || null, // electricity token — MUST be shown to customer
    raw_response: json,
    message: json.response || json.message || "",
  };
};

// ─── EXAM PINS ───────────────────────────────────
exports.buyExamPin = async ({ examType, quantity, phone }) => {
  const json = await apiPost("exam_pin_purchase/", {
    exam_name: examType,
    quantity: String(quantity),
    phone_number: phone,
  });
  return {
    status: json.Status === "successful" || json.status === "successful" ? "success" : "failed",
    pins: json.pins || json.pin || null, // array or string of PINs
    serial: json.serial || null,
    raw_response: json,
    message: json.response || json.message || "",
  };
};

// ─── HEALTH CHECK ────────────────────────────────
exports.healthCheck = async () => {
  try {
    const url = `${BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`}balance/`;
    const resp = await fetch(url, { headers: headers() });
    if (!resp.ok) return { ok: false, status: resp.status };
    const json = await resp.json();
    return { ok: true, balance: json.balance || null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};
