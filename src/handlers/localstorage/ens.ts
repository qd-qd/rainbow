import { getGlobal, saveGlobal } from './common';

export type ENSDataType =
  | 'avatar'
  | 'header'
  | 'registrant'
  | 'owner'
  | 'address'
  | 'records'
  | 'resolver'
  | 'firstTxTimestamp';

const ensProfileVersion = '0.2.0';

const ensLabelhashesKey = (key: string) => `ensLabelhashes.${key}`;
const ensDataKey = (dataType: ENSDataType, key: string) =>
  `ens.${dataType}.${key}`;
const ensProfileKey = (key: string) => `ens.profile.${key}`;
const ensDomains = (key: string) => `ensDomains.${key}`;
const ensSeenOnchainDataDisclaimerKey = 'ensProfile.seenOnchainDisclaimer';

export const getNameFromLabelhash = async (key: string) => {
  const labelhash = await getGlobal(
    ensLabelhashesKey(key),
    null,
    ensProfileVersion
  );
  return labelhash;
};

export const saveNameFromLabelhash = (key: string, value: Object) =>
  saveGlobal(ensLabelhashesKey(key), value, ensProfileVersion);

export const getENSData = async (dataType: ENSDataType, key: string) => {
  const profile = await getGlobal(
    ensDataKey(dataType, key),
    null,
    ensProfileVersion
  );
  return profile ? JSON.parse(profile) : null;
};

export const saveENSData = (
  dataType: ENSDataType,
  key: string,
  value: Object
) =>
  saveGlobal(
    ensDataKey(dataType, key),
    JSON.stringify(value),
    ensProfileVersion
  );

export const getENSProfile = async (key: string) => {
  const profile = await getGlobal(ensProfileKey(key), null, ensProfileVersion);
  return profile ? JSON.parse(profile) : null;
};

export const saveENSProfile = (key: string, value: Object) =>
  saveGlobal(ensProfileKey(key), JSON.stringify(value), ensProfileVersion);

export const getSeenOnchainDataDisclaimer = () =>
  getGlobal(ensSeenOnchainDataDisclaimerKey, false);

export const saveSeenOnchainDataDisclaimer = (value: boolean) =>
  saveGlobal(ensSeenOnchainDataDisclaimerKey, value);

export const getENSDomains = (key: string) =>
  getGlobal(ensDomains(key), null, ensProfileVersion);

export const setENSDomains = (
  key: string,
  value: {
    name: string;
    owner: { id: string };
    labelhash: string;
  }[]
) => saveGlobal(ensDomains(key), value);
