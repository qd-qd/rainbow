import { useQuery } from 'react-query';
import { fetchImage } from '@rainbow-me/handlers/ens';
import { getENSData, saveENSData } from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

export const ensAvatarQueryKey = (name: string) => ['ens-avatar', name];

const STALE_TIME = 10000;

export async function fetchENSAvatar(
  name: string,
  {
    cacheFirst,
    swallowError,
  }: { cacheFirst?: boolean; swallowError?: boolean } = {}
) {
  try {
    const cachedAvatar = await getENSData('avatar', name);
    if (cachedAvatar) {
      queryClient.setQueryData(ensAvatarQueryKey(name), cachedAvatar);
      if (cacheFirst) return cachedAvatar as { imageUrl: string };
    }
    const avatar = await fetchImage('avatar', name);
    saveENSData('avatar', name, avatar);
    return avatar;
  } catch (err) {
    if (swallowError) return undefined;
    throw err;
  }
}

export async function prefetchENSAvatar(
  name: string,
  { cacheFirst }: { cacheFirst?: boolean } = {}
) {
  queryClient.prefetchQuery(
    ensAvatarQueryKey(name),
    async () => fetchENSAvatar(name, { cacheFirst }),
    { staleTime: STALE_TIME }
  );
}

export default function useENSAvatar(
  name: string,
  config?: QueryConfig<typeof fetchENSAvatar>
) {
  return useQuery<UseQueryData<typeof fetchENSAvatar>>(
    ensAvatarQueryKey(name),
    async () => fetchENSAvatar(name),
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      staleTime: STALE_TIME,
    }
  );
}
