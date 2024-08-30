// src/utils/dateUtils.js
import moment from 'moment';
import 'moment/locale/he';

export const formatDate = (date, format = 'LL', lang = 'en') => {
  moment.locale(lang);
  return moment(date).format(format);
};

export const formatTime = (time, format = 'LT', lang = 'en') => {
  moment.locale(lang);
  return moment(time, 'HH:mm').format(format);
};