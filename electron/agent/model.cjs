// Thin adapter over Amazon Bedrock. The rest of the agent never knows which model
// this is — it only knows "the brain". One model serves all internal roles
// (planner / actor / critic) via different system prompts. The `model` argument
// is kept for API compatibility; bedrock.cjs owns the model id.
const bedrock = require('../bedrock.cjs');

// Errors that mean Bedrock itself is unusable (credentials, permissions, network),
// as opposed to a one-off bad answer. Callers stop instead of guessing.
const UNREACHABLE_RE = /CredentialsProviderError|Could not load credentials|UnrecognizedClient|InvalidSignature|SignatureDoesNotMatch|ExpiredToken|security token|AccessDenied|not authori[sz]ed|ResourceNotFound|model identifier is invalid|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|NetworkingError|TimeoutError|getaddrinfo/i;

function isUnreachable(error) {
  return UNREACHABLE_RE.test(String(error || ''));
}

// Human explanation of why Bedrock can't be used. Shown to the user.
function describeBedrockError(error) {
  const e = String(error || 'unknown error');
  let why;
  if (/CredentialsProviderError|Could not load credentials/i.test(e)) {
    why = 'no AWS credentials were found on this Mac. Configure them with `aws configure` or `aws sso login` (or set AWS_PROFILE), then try again.';
  } else if (/UnrecognizedClient|InvalidSignature|SignatureDoesNotMatch|ExpiredToken|security token/i.test(e)) {
    why = 'the AWS credentials on this Mac are invalid or expired. Refresh them (for SSO: `aws sso login`) and try again.';
  } else if (/AccessDenied|not authori[sz]ed/i.test(e)) {
    why = `this AWS account is not allowed to call ${bedrock.MODEL_ID}. Enable model access in the Amazon Bedrock console and check the IAM policy.`;
  } else if (/ResourceNotFound|model identifier is invalid/i.test(e)) {
    why = `the model ${bedrock.MODEL_ID} is not available in region ${bedrock.REGION || 'the configured region'}.`;
  } else if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|NetworkingError|TimeoutError|getaddrinfo/i.test(e)) {
    why = 'the network request to AWS failed. Check the internet connection.';
  } else {
    why = e;
  }
  return `Amazon Bedrock is not reachable: ${why}`;
}

// One-shot completion. `images` = array of base64 PNGs for vision.
// Returns {ok:true,text} or {ok:false,error,unreachable}.
async function complete(model, system, prompt, { images, json = false, maxTokens } = {}) {
  let res;
  try {
    res = await bedrock.converse({
      system,
      prompt,
      images: images && images.length ? images : undefined,
      json,
      maxTokens: maxTokens || (json ? 1500 : 400),
      temperature: json ? 0.1 : 0.4,
    });
  } catch (err) {
    res = { ok: false, error: String((err && err.message) || err) };
  }
  if (res && res.ok) return { ok: true, text: String(res.text || '') };
  const error = String((res && res.error) || 'model error');
  return { ok: false, error, unreachable: isUnreachable(error) };
}

// Tolerant JSON extraction (models sometimes wrap JSON in prose/fences).
const parseJSON = bedrock.parseJSON;

module.exports = { complete, parseJSON, isUnreachable, describeBedrockError };
