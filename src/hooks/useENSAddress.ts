import { useQuery } from 'react-query';
import { fetchPrimary } from '@rainbow-me/handlers/ens';
import { getENSData, saveENSData } from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

export const ensAddressQueryKey = (name: string) => ['ens-address', name];

const STALE_TIME = 10000;

export async function fetchENSAddress(
  name: string,
  { cacheFirst }: { cacheFirst?: boolean } = {}
) {
  const cachedData = await getENSData('address', name);
  if (cachedData) {
    queryClient.setQueryData(ensAddressQueryKey(name), cachedData?.address);
    if (cacheFirst) return cachedData?.address as string | null;
  }

  const data = await fetchPrimary(name);
  saveENSData('address', name, data);
  return data?.address;
}

export async function prefetchENSAddress(
  name: string,
  { cacheFirst }: { cacheFirst?: boolean } = {}
) {
  queryClient.prefetchQuery(
    ensAddressQueryKey(name),
    async () => fetchENSAddress(name, { cacheFirst }),
    { staleTime: STALE_TIME }
  );
}

export default function useENSAddress(
  name: string,
  config?: QueryConfig<typeof fetchENSAddress>
) {
  return useQuery<UseQueryData<typeof fetchENSAddress>>(
    ensAddressQueryKey(name),
    async () => fetchENSAddress(name),
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      staleTime: STALE_TIME,
    }
  );
}
