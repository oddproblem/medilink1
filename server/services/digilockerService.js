const axios = require('axios');
const { parseStringPromise } = require('xml2js');

// --- Configuration from your code ---
const SANDBOX_BASE_URL = "https://api.sandbox.co.in";
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;
const REDIRECT_URL = "https://swiftmedilink.vercel.app/auth"; // Updated for the React frontend

/**
 * Initiates the DigiLocker session via Sandbox API.
 * Contains the logic from your /api/initiate-digilocker route.
 */
const initiateSession = async () => {
  const authResponse = await axios.post(`${SANDBOX_BASE_URL}/authenticate`, {}, {
    headers: { "accept": "application/json", "x-api-key": API_KEY, "x-api-secret": API_SECRET }
  });
  const accessToken = authResponse.data.access_token;
  if (!accessToken) throw new Error("Sandbox authentication failed.");

  const initiatePayload = {
    "@entity": "in.co.sandbox.kyc.digilocker.session.request", "flow": "signin",
    "doc_types": ["aadhaar"], "redirect_url": REDIRECT_URL
  };
  const initiateResponse = await axios.post(`${SANDBOX_BASE_URL}/kyc/digilocker/sessions/init`, initiatePayload, {
    headers: { "accept": "application/json", "authorization": accessToken, "x-api-key": API_KEY }
  });

  return {
    sessionId: initiateResponse.data.data.session_id,
    authorizationUrl: initiateResponse.data.data.authorization_url,
    accessToken: accessToken,
  };
};

/**
 * Fetches and parses user data from Sandbox.
 * Contains the logic from your /api/get-digilocker-data route.
 */
const fetchUserData = async (sessionId, accessToken) => {
  const dataLinkUrl = `${SANDBOX_BASE_URL}/kyc/digilocker/sessions/${sessionId}/documents/aadhaar`;
  const dataLinkResponse = await axios.get(dataLinkUrl, { headers: { authorization: accessToken, "x-api-key": API_KEY } });
  const xmlFileUrl = dataLinkResponse.data?.data?.files?.[0]?.url;
  if (!xmlFileUrl) throw new Error("Could not retrieve the XML file URL.");

  const xmlResponse = await axios.get(xmlFileUrl);
  const parsedData = await parseStringPromise(xmlResponse.data);
  const kycRes = parsedData?.Certificate?.CertificateData?.[0]?.KycRes?.[0];
  if (!kycRes || !kycRes.UidData?.[0]) throw new Error("Could not find required data in XML.");

  const uidData = kycRes.UidData[0];
  const poi = uidData.Poi[0].$;
  const poa = uidData.Poa[0].$;

  const [day, month, year] = poi.dob.split("-").map(Number);
  const age = new Date(Date.now() - new Date(year, month - 1, day).getTime()).getUTCFullYear() - 1970;
  const address = [poa.co, poa.loc, poa.vtc, poa.subdist, poa.dist, `${poa.state} - ${poa.pc}`, poa.country].filter(Boolean).join(", ");

  return {
    uid: uidData.$.uid,
    name: poi.name,
    age,
    gender: poi.gender,
    address,
  };
};

module.exports = {
  initiateSession,
  fetchUserData,
};
