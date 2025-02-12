import React, { useCallback } from 'react';
import { resources, supportedLanguages } from '../../languages';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { analytics } from '@rainbow-me/analytics';
import { pickBy } from '@rainbow-me/helpers/utilities';
import { useAccountSettings } from '@rainbow-me/hooks';

const languagesWithWalletTranslations = Object.keys(
  pickBy(resources, language => language?.translation?.wallet) // Only show languages that have 'wallet' translations available.
);

const languageListItems = languagesWithWalletTranslations.map(code => ({
  code,
  name: (supportedLanguages as any)[code],
}));

const LanguageSection = () => {
  const { language, settingsChangeLanguage } = useAccountSettings();

  const onSelectLanguage = useCallback(
    language => {
      settingsChangeLanguage(language);
      analytics.track('Changed language', { language });
    },
    [settingsChangeLanguage]
  );

  return (
    <MenuContainer>
      <Menu>
        {languageListItems.map(({ name, code }: any) => (
          <MenuItem
            key={code}
            onPress={() => onSelectLanguage(code)}
            rightComponent={
              code === language && <MenuItem.StatusIcon status="selected" />
            }
            size={52}
            titleComponent={<MenuItem.Title text={name} />}
          />
        ))}
      </Menu>
    </MenuContainer>
  );
};

export default LanguageSection;
