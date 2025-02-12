import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ParsedAddressAsset } from '@rainbow-me/entities';
import { getUniswapV2Tokens } from '@rainbow-me/handlers/dispersion';
import { sortAssetsByNativeAmountSelector } from '@rainbow-me/helpers/assetSelectors';
import NetworkTypes from '@rainbow-me/networkTypes';
import { AppState } from '@rainbow-me/redux/store';
import { ETH_ADDRESS } from '@rainbow-me/references';

const networkSelector = (state: AppState) => state.settings.network;

const useUniswapAssetsInWallet = () => {
  const [uniswapAssets, setUniswapAssets] = useState([]);
  const network = useSelector(networkSelector);
  const isMainnet = network === NetworkTypes.mainnet;
  const { sortedAssets } = useSelector(sortAssetsByNativeAmountSelector);
  const getUniswapAssets = useCallback(async () => {
    let uniswapAssets;
    if (isMainnet) {
      const uniswapData = await getUniswapV2Tokens(
        sortedAssets.map(({ address }: ParsedAddressAsset) => address)
      );
      uniswapAssets = uniswapData ? Object.values(uniswapData) : [];
    } else {
      uniswapAssets = sortedAssets;
    }
    setUniswapAssets(uniswapAssets);
  }, [sortedAssets, isMainnet]);

  const getIsUniswapAsset = useCallback(
    asset => {
      return (
        uniswapAssets.find(
          ({ address }) => address === asset.address.toLowerCase()
        ) || asset.address === ETH_ADDRESS
      );
    },
    [uniswapAssets]
  );

  useEffect(() => {
    getUniswapAssets();
  }, [getUniswapAssets]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const uniswapAssetsInWallet = useMemo(
    () => sortedAssets.filter(getIsUniswapAsset),
    [sortedAssets, getIsUniswapAsset]
  );

  return uniswapAssetsInWallet;
};

export default useUniswapAssetsInWallet;
