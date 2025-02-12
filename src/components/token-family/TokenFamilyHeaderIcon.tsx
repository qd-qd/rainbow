import lang from 'i18n-js';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Source } from 'react-native-fast-image';
import eyeSlash from '../../assets/sf-eye.slash.png';
import { Text } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';
import { borders } from '@rainbow-me/styles';
import { ThemeContextProps } from '@rainbow-me/theme';
import { FallbackIcon, initials } from '@rainbow-me/utils';
import ShadowStack from 'react-native-shadow-stack';

type Props = {
  familyName: string;
  theme: ThemeContextProps;
  familyImage?: string;
  style?: any;
};

const shadowsFactory = (colors: ThemeContextProps['colors']) => [
  [0, 3, android ? 5 : 9, colors.shadow, 0.1],
];

const sx = StyleSheet.create({
  trophy: {
    width: 30,
  },
});

const circleStyle = borders.buildCircleAsObject(30);

export default React.memo(function TokenFamilyHeaderIcon({
  familyImage,
  familyName,
  style,
  theme,
}: Props) {
  const { colors } = theme;

  const shadows = useMemo(() => shadowsFactory(colors), [colors]);

  if (familyName === 'Showcase') {
    return (
      <View style={sx.trophy}>
        <Text align="center" containsEmoji size="16px">
          🏆
        </Text>
      </View>
    );
  }

  if (familyName === lang.t('button.hidden')) {
    return (
      <View
        style={[
          sx.trophy,
          {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 3,
          },
        ]}
      >
        <ImgixImage
          source={eyeSlash as Source}
          style={{ height: 17, width: 25 }}
          tintColor={colors.blueGreyDark60}
        />
      </View>
    );
  }

  const source = {
    uri: familyImage,
  };

  const symbol = initials(familyName);

  return (
    // @ts-expect-error ShadowStack is not migrated to TS.
    <ShadowStack
      {...circleStyle}
      backgroundColor={colors.white}
      shadows={shadows}
      style={style}
    >
      {familyImage ? (
        <ImgixImage size={30} source={source} style={circleStyle} />
      ) : (
        // @ts-expect-error FallbackIcon is not migrated to TS.
        <FallbackIcon {...circleStyle} symbol={symbol} />
      )}
    </ShadowStack>
  );
});
