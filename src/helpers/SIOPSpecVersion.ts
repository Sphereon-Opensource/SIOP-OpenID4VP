import { AuthorizationRequestPayloadVD11Schema, AuthorizationRequestPayloadVID1Schema } from '../schemas';
import { AuthorizationRequestPayload, SupportedVersion } from '../types';
import errors from '../types/Errors';

const validateJWTVCPresentationProfile = AuthorizationRequestPayloadVID1Schema;

function isJWTVC1Payload(authorizationRequest: AuthorizationRequestPayload) {
  return (
    authorizationRequest.scope &&
    authorizationRequest.scope.toLowerCase().includes('openid') &&
    authorizationRequest.response_type &&
    authorizationRequest.response_type.toLowerCase().includes('id_token') &&
    authorizationRequest.response_mode &&
    authorizationRequest.response_mode.toLowerCase() === 'post' &&
    authorizationRequest.client_id &&
    authorizationRequest.client_id.toLowerCase().startsWith('did:') &&
    authorizationRequest.redirect_uri &&
    (authorizationRequest.registration_uri || authorizationRequest.registration) &&
    authorizationRequest.claims['vp_token']
  );
}

function isID1Payload(authorizationRequest: AuthorizationRequestPayload) {
  return (
    !authorizationRequest.client_metadata_uri &&
    !authorizationRequest.client_metadata &&
    !authorizationRequest.presentation_definition &&
    !authorizationRequest.presentation_definition_uri
  );
}

export const authorizationRequestVersionDiscovery = (authorizationRequest: AuthorizationRequestPayload): SupportedVersion[] => {
  const versions = [];
  const authorizationRequestCopy: AuthorizationRequestPayload = JSON.parse(JSON.stringify(authorizationRequest));
  const vd11Validation = AuthorizationRequestPayloadVD11Schema(authorizationRequestCopy);
  if (vd11Validation) {
    if (
      !authorizationRequestCopy.registration_uri &&
      !authorizationRequestCopy.registration &&
      !(authorizationRequest.claims && 'vp_token' in authorizationRequestCopy.claims)
    ) {
      versions.push(SupportedVersion.SIOPv2_D11);
    }
  }
  const jwtVC1Validation = validateJWTVCPresentationProfile(authorizationRequestCopy);
  if (jwtVC1Validation && isJWTVC1Payload(authorizationRequest)) {
    versions.push(SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1);
  }
  const vid1Validation = AuthorizationRequestPayloadVID1Schema(authorizationRequestCopy);
  if (vid1Validation && isID1Payload(authorizationRequest)) {
    versions.push(SupportedVersion.SIOPv2_ID1);
  }
  if (versions.length === 0) {
    throw new Error(errors.SIOP_VERSION_NOT_SUPPORTED);
  }
  return versions;
};

export const checkSIOPSpecVersionSupported = async (
  payload: AuthorizationRequestPayload,
  supportedVersions: SupportedVersion[]
): Promise<SupportedVersion[]> => {
  const versions: SupportedVersion[] = authorizationRequestVersionDiscovery(payload);
  if (!supportedVersions || supportedVersions.length === 0) {
    return versions;
  }
  return supportedVersions.filter((version) => versions.includes(version));
};