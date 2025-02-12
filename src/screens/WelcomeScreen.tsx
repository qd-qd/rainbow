import MaskedView from '@react-native-masked-view/masked-view';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, StyleProp, StyleSheet, ViewStyle } from 'react-native';
// @ts-expect-error
import { IS_TESTING } from 'react-native-dotenv';
import Reanimated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import { ButtonPressAnimation } from '../components/animations';
import { BaseButtonAnimationProps } from '../components/animations/ButtonPressAnimation/types';
import RainbowText from '../components/icons/svg/RainbowText';
import { RowWithMargins } from '../components/layout';
import { RainbowsBackground } from '../components/rainbows-background/RainbowsBackground';
import { Emoji, Text } from '../components/text';
import {
  fetchUserDataFromCloud,
  isCloudBackupAvailable,
  syncCloud,
} from '../handlers/cloudBackup';
import { cloudPlatform } from '../utils/platform';
import { analytics } from '@rainbow-me/analytics';

import { useHideSplashScreen } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { position, shadow } from '@rainbow-me/styles';
import { ThemeContextProps, useTheme } from '@rainbow-me/theme';
import logger from 'logger';

const ButtonContainer = styled(Reanimated.View)({
  borderRadius: ({ height }: { height: number }) => height / 2,
});

const ButtonContent = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 4,
})({
  alignSelf: 'center',
  height: '100%',
  paddingBottom: 2,
});

const ButtonLabel = styled(Text).attrs(
  ({
    textColor: color,
    theme: { colors },
  }: {
    textColor: string;
    theme: ThemeContextProps;
  }) => ({
    align: 'center',
    color: color || colors.dark,
    size: 'larger',
    weight: 'bold',
  })
)({});

const ButtonEmoji = styled(Emoji).attrs({
  align: 'center',
  size: 16.25,
})({
  paddingBottom: 1.5,
});

const DarkShadow = styled(Reanimated.View)(
  ({ theme: { colors, isDarkMode } }: { theme: ThemeContextProps }) => ({
    ...shadow.buildAsObject(0, 10, 30, colors.dark, isDarkMode ? 0 : 1),
    backgroundColor: colors.white,
    borderRadius: 30,
    height: 60,
    left: -3,
    opacity: 0.2,
    position: 'absolute',
    top: -3,
    width: 236,
  })
);

const Shadow = styled(Reanimated.View)(
  ({ theme: { colors, isDarkMode } }: { theme: ThemeContextProps }) => ({
    ...shadow.buildAsObject(0, 5, 15, colors.shadow, isDarkMode ? 0 : 0.4),
    borderRadius: 30,
    height: 60,
    position: 'absolute',
    width: 236,
    ...(ios
      ? {
          left: -3,
          top: -3,
        }
      : {
          elevation: 30,
        }),
  })
);

interface RainbowButtonProps extends BaseButtonAnimationProps {
  height: number;
  textColor: string;
  text: string;
  emoji: string;
  shadowStyle?: StyleProp<ViewStyle>;
  darkShadowStyle?: StyleProp<ViewStyle>;
}

const RainbowButton = ({
  darkShadowStyle,
  emoji,
  height,
  onPress,
  shadowStyle,
  style,
  textColor,
  text,
  ...props
}: RainbowButtonProps) => {
  return (
    <ButtonPressAnimation
      onPress={onPress}
      overflowMargin={40}
      radiusAndroid={height / 2}
      scaleTo={0.9}
      {...props}
    >
      {ios && <DarkShadow style={darkShadowStyle} />}
      <Shadow style={shadowStyle} />
      <ButtonContainer height={height} style={style}>
        <ButtonContent>
          <ButtonEmoji name={emoji} />
          <ButtonLabel textColor={textColor}>{text}</ButtonLabel>
        </ButtonContent>
      </ButtonContainer>
    </ButtonPressAnimation>
  );
};

// @ts-expect-error Our implementation of SC complains
const Container = styled.View({
  ...position.coverAsObject,
  alignItems: 'center',
  backgroundColor: ({ theme: { colors } }: { theme: ThemeContextProps }) =>
    colors.white,
  justifyContent: 'center',
});

const ContentWrapper = styled(Reanimated.View)({
  alignItems: 'center',
  height: 192,
  justifyContent: 'space-between',
  marginBottom: 20,
  zIndex: 10,
});

const ButtonWrapper = styled(Reanimated.View)({
  width: '100%',
});

// @ts-expect-error
const TermsOfUse = styled.View(({ bottomInset }) => ({
  bottom: bottomInset / 2 + 32,
  position: 'absolute',
  width: 200,
}));

const RAINBOW_TEXT_HEIGHT = 32;
const RAINBOW_TEXT_WIDTH = 125;

const RainbowTextMask = styled(Reanimated.View)({
  height: RAINBOW_TEXT_HEIGHT,
  width: RAINBOW_TEXT_WIDTH,
});

const animationColors = [
  'rgb(255,73,74)',
  'rgb(255,170,0)',
  'rgb(0,163,217)',
  'rgb(0,163,217)',
  'rgb(115,92,255)',
  'rgb(255,73,74)',
];

export default function WelcomeScreen() {
  const insets = useSafeArea();
  const { colors, isDarkMode } = useTheme();
  // @ts-expect-error Navigation types
  const { replace, navigate, dangerouslyGetState } = useNavigation();
  const [userData, setUserData] = useState(null);
  const hideSplashScreen = useHideSplashScreen();

  const contentAnimation = useSharedValue(1);
  const colorAnimation = useSharedValue(0);
  const shouldAnimateRainbows = useSharedValue(false);
  const calculatedColor = useDerivedValue(
    () =>
      interpolateColor(
        colorAnimation.value,
        [0, 1, 2, 3, 4, 5],
        animationColors
      ),
    [colorAnimation]
  );
  const createWalletButtonAnimation = useSharedValue(1);

  useEffect(() => {
    const initialize = async () => {
      try {
        logger.log(`downloading ${cloudPlatform} backup info...`);
        const isAvailable = await isCloudBackupAvailable();
        if (isAvailable && ios) {
          logger.log('syncing...');
          await syncCloud();
          logger.log('fetching backup info...');
          const data = await fetchUserDataFromCloud();
          setUserData(data);
          logger.log(`Downloaded ${cloudPlatform} backup info`);
        }
      } catch (e) {
        logger.log('error getting userData', e);
      } finally {
        hideSplashScreen();
        shouldAnimateRainbows.value = true;

        const initialDuration = 120;

        contentAnimation.value = withSequence(
          withTiming(1.2, {
            duration: initialDuration,
            easing: Easing.bezier(0.165, 0.84, 0.44, 1),
          }),
          withSpring(1, {
            damping: 7,
            overshootClamping: false,
            stiffness: 250,
          })
        );

        // We need to disable looping animations
        // There's no way to disable sync yet
        // See https://stackoverflow.com/questions/47391019/animated-button-block-the-detox
        if (IS_TESTING !== 'true') {
          createWalletButtonAnimation.value = withDelay(
            initialDuration,
            withTiming(1.02, { duration: 1000 }, () => {
              createWalletButtonAnimation.value = withRepeat(
                withTiming(0.98, {
                  duration: 1000,
                }),
                -1,
                true
              );
            })
          );
          colorAnimation.value = withRepeat(
            withTiming(5, {
              duration: 2500,
              easing: Easing.linear,
            }),
            -1
          );
        }

        if (IS_TESTING === 'true') {
          logger.log(
            'Disabled loop animations in WelcomeScreen due to .env var IS_TESTING === "true"'
          );
        }
      }
    };

    initialize();

    return () => {
      createWalletButtonAnimation.value = 1;
      contentAnimation.value = 1;
    };
  }, [
    colorAnimation,
    contentAnimation,
    createWalletButtonAnimation,
    hideSplashScreen,
    shouldAnimateRainbows,
  ]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: createWalletButtonAnimation.value }],
    zIndex: 10,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: contentAnimation.value,
      },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    backgroundColor: calculatedColor.value,
  }));

  const createWalletButtonAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isDarkMode ? colors.blueGreyDarkLight : colors.dark,
    borderColor: calculatedColor.value,
    borderWidth: ios ? 0 : 3,
    width: 230 + (ios ? 0 : 6),
  }));

  const createWalletButtonAnimatedShadowStyle = useAnimatedStyle(() => ({
    backgroundColor: calculatedColor.value,
    shadowColor: calculatedColor.value,
  }));

  const onCreateWallet = useCallback(async () => {
    analytics.track('Tapped "Get a new wallet"');
    const operation = dangerouslyGetState().index === 1 ? navigate : replace;
    operation(Routes.SWIPE_LAYOUT, {
      params: { emptyWallet: true },
      screen: Routes.WALLET_SCREEN,
    });
  }, [dangerouslyGetState, navigate, replace]);

  const handlePressTerms = useCallback(() => {
    Linking.openURL('https://rainbow.me/terms-of-use');
  }, []);

  const showRestoreSheet = useCallback(() => {
    analytics.track('Tapped "I already have one"');
    navigate(Routes.RESTORE_SHEET, {
      userData,
    });
  }, [navigate, userData]);

  useAndroidBackHandler(() => {
    return true;
  });

  return (
    <Container testID="welcome-screen">
      <RainbowsBackground shouldAnimate={shouldAnimateRainbows} />
      <ContentWrapper style={contentStyle}>
        {android && IS_TESTING === 'true' ? (
          // @ts-expect-error JS component
          <RainbowText colors={colors} />
        ) : (
          // @ts-expect-error JS component
          <MaskedView maskElement={<RainbowText colors={colors} />}>
            <RainbowTextMask style={textStyle} />
          </MaskedView>
        )}

        <ButtonWrapper style={buttonStyle}>
          <RainbowButton
            emoji="castle"
            height={54 + (ios ? 0 : 6)}
            onPress={onCreateWallet}
            shadowStyle={createWalletButtonAnimatedShadowStyle}
            style={createWalletButtonAnimatedStyle}
            testID="new-wallet-button"
            text={lang.t('wallet.new.get_new_wallet')}
            textColor={isDarkMode ? colors.dark : colors.white}
          />
        </ButtonWrapper>
        <ButtonWrapper>
          <RainbowButton
            darkShadowStyle={sx.existingWalletShadow}
            emoji="old_key"
            height={56}
            onPress={showRestoreSheet}
            shadowStyle={sx.existingWalletShadow}
            style={[
              sx.existingWallet,
              { backgroundColor: colors.blueGreyDarkLight },
            ]}
            testID="already-have-wallet-button"
            text={lang.t('wallet.new.already_have_wallet')}
            textColor={colors.alpha(colors.blueGreyDark, 0.8)}
          />
        </ButtonWrapper>
      </ContentWrapper>
      <TermsOfUse bottomInset={insets.bottom}>
        <Text
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.5)}
          lineHeight="loose"
          size="smedium"
          weight="semibold"
        >
          {lang.t('wallet.new.terms')}
          <Text
            color={colors.paleBlue}
            lineHeight="loose"
            onPress={handlePressTerms}
            size="smedium"
            suppressHighlighting
            weight="semibold"
          >
            {lang.t('wallet.new.terms_link')}
          </Text>
        </Text>
      </TermsOfUse>
    </Container>
  );
}

const sx = StyleSheet.create({
  existingWallet: {
    width: 248,
  },
  existingWalletShadow: {
    opacity: 0,
  },
});
