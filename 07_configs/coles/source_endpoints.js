//File: 07_configs/constants/sourceEndpoints.js
export const coles_url = 'https://www.coles.com.au';
export const wools_url = 'https://www.woolworths.com.au';

export const wools_tree = '/apis/ui/PiesCategoriesWithSpecials'

export const baseSelector = {
  drawerButton: '[data-testid="delivery-selector-button"]',
  clickCollectTab: 'button[data-testid="tab-collection"]',
  deliveryTypeSwitch: '[data-testid="change-delivery-type"]',

  streetAddressInput: '#street-address-autocomplete input',
  suburbPostcodeInput: '#suburb-postcode-autocomplete input',

  suggestionDropdown: 'div.MuiAutocomplete-popper',
  suggestionOption: 'li[role="option"]',

  subLocationRadioGroup: 'div[role="radiogroup"]',
  subLocationOption: 'div.coles-targeting-CardRadioContainer',

  setLocationButton: 'button[data-testid="cta-secondary"]',
};
