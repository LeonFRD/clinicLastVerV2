// src/utils/numberUtils.js
export const formatNumber = (number, lang = 'en') => {
    return new Intl.NumberFormat(lang === 'he' ? 'he-IL' : 'en-US').format(number);
  };